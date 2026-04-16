import { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'
import { Plus, Minus, Trash2, ShoppingCart, Search, CreditCard, Banknote, Smartphone, CheckCircle, X, Flame, Star, AlertTriangle } from 'lucide-react'

const METODOS = [
  { id: 'efectivo', label: 'Efectivo', icon: Banknote },
  { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { id: 'transferencia', label: 'Transferencia', icon: Smartphone },
]

// Mensajes finales del ticket — Peak-End Rule: el cierre debe ser memorable
const MENSAJES_TICKET = [
  '¡Gracias por tu preferencia! 🍺',
  '¡Que la disfrutes mucho! 🎉',
  '¡Vuelve pronto, te esperamos! ✨',
  '¡La chelada perfecta para ti! 🍋',
]

export default function Ventas() {
  const [productos, setProductos] = useState([])
  const [topVendidos, setTopVendidos] = useState([]) // Social Proof
  const [carrito, setCarrito] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState('Todos')
  const [metodo, setMetodo] = useState('efectivo')
  const [montoRecibido, setMontoRecibido] = useState('')
  const [descuento, setDescuento] = useState(0)
  const [notas, setNotas] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [ticketData, setTicketData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getProductos().then(setProductos).catch(console.error)
    // Carga top vendidos del día para Social Proof
    const hoy = new Date().toISOString().slice(0, 10)
    api.getResumen({ desde: hoy, hasta: hoy })
      .then(d => setTopVendidos(d.topProductos?.slice(0, 3).map(p => p.nombre_producto) || []))
      .catch(() => {})
  }, [])

  const categorias = ['Todos', ...new Set(productos.map(p => p.categoria))]

  const productosFiltrados = productos.filter(p => {
    const matchCat = categoriaActiva === 'Todos' || p.categoria === categoriaActiva
    const matchBus = p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    return matchCat && matchBus
  })

  const agregarAlCarrito = (prod) => {
    setCarrito(prev => {
      const existe = prev.find(i => i.producto_id === prod.id)
      if (existe) {
        if (existe.cantidad >= prod.stock) return prev
        return prev.map(i => i.producto_id === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i)
      }
      if (prod.stock === 0) return prev
      return [...prev, { producto_id: prod.id, nombre_producto: prod.nombre, precio_unitario: prod.precio, cantidad: 1, stock: prod.stock }]
    })
  }

  const cambiarCantidad = (id, delta) => {
    setCarrito(prev => prev.map(i => {
      if (i.producto_id !== id) return i
      const nueva = i.cantidad + delta
      if (nueva <= 0) return null
      if (nueva > i.stock) return i
      return { ...i, cantidad: nueva }
    }).filter(Boolean))
  }

  const quitarItem = (id) => setCarrito(prev => prev.filter(i => i.producto_id !== id))
  const limpiarCarrito = () => { setCarrito([]); setDescuento(0); setNotas(''); setMontoRecibido('') }

  const subtotal = carrito.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0)
  const total = subtotal - descuento
  const cambio = metodo === 'efectivo' && montoRecibido ? parseFloat(montoRecibido) - total : 0

  // Goal-Gradient: progreso del carrito
  const pasos = ['Productos', 'Pago', 'Listo']
  const pasoActual = carrito.length === 0 ? 0 : montoRecibido || metodo !== 'efectivo' ? 2 : 1

  const procesarVenta = async () => {
    if (!carrito.length) return
    if (metodo === 'efectivo' && parseFloat(montoRecibido || 0) < total) {
      setError('Monto insuficiente'); return
    }
    setError('')
    setProcesando(true)
    try {
      const result = await api.createVenta({
        items: carrito,
        metodo_pago: metodo,
        monto_recibido: parseFloat(montoRecibido || total),
        descuento,
        notas
      })
      const msg = MENSAJES_TICKET[Math.floor(Math.random() * MENSAJES_TICKET.length)]
      setTicketData({ ...result, items: carrito, metodo, descuento, subtotal, mensaje: msg })
      limpiarCarrito()
      api.getProductos().then(setProductos)
    } catch (err) {
      setError(err.message)
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* Panel productos */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Búsqueda y categorías */}
        <div className="p-3 md:p-4 bg-white border-b border-gray-100 space-y-2.5">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categorias.map(cat => (
              <button key={cat} onClick={() => setCategoriaActiva(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  categoriaActiva === cat ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid productos */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
            {productosFiltrados.map(prod => {
              const enCarrito = carrito.find(i => i.producto_id === prod.id)
              const sinStock = prod.stock === 0
              // Social Proof — top 3 vendidos del día
              const esMasPedida = topVendidos.includes(prod.nombre)
              // Scarcity — stock crítico (≤3)
              const stockCritico = prod.stock > 0 && prod.stock <= 3
              // Scarcity visual — stock bajo (≤ mínimo)
              const stockBajo = prod.stock > 0 && prod.stock <= prod.stock_minimo && prod.stock > 3

              return (
                <button key={prod.id} onClick={() => agregarAlCarrito(prod)} disabled={sinStock}
                  className={`relative bg-white rounded-2xl p-3 md:p-4 text-left border-2 transition-all shadow-sm active:scale-95 ${
                    sinStock ? 'opacity-50 cursor-not-allowed border-gray-100' :
                    enCarrito ? 'border-primary shadow-md shadow-primary/20' :
                    stockCritico ? 'border-orange-400' :
                    'border-gray-100 hover:border-primary/40'
                  }`}>

                  {/* Badge Social Proof — "La más pedida" */}
                  {esMasPedida && !sinStock && (
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm z-10">
                      <Flame size={10} /> Popular
                    </div>
                  )}

                  {/* Badge Scarcity — stock crítico */}
                  {stockCritico && (
                    <div className="absolute -top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm z-10 animate-pulse">
                      ¡Solo {prod.stock}!
                    </div>
                  )}

                  <div className="text-3xl md:text-4xl mb-2">🍺</div>
                  <p className="text-sm font-semibold text-dark leading-tight">{prod.nombre}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{prod.categoria}</p>

                  {/* Precio con charm pricing visual */}
                  <p className="text-primary font-bold text-base mt-2">${prod.precio.toFixed(2)}</p>

                  {/* Stock bajo — Loss Aversion framing */}
                  {stockBajo && (
                    <p className="text-xs mt-1 text-orange-500 font-medium">⚠ Quedan {prod.stock}</p>
                  )}
                  {!stockBajo && !stockCritico && (
                    <p className="text-xs mt-1 text-gray-400">Stock: {prod.stock}</p>
                  )}

                  {enCarrito && (
                    <span className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full text-white text-xs flex items-center justify-center font-bold shadow">
                      {enCarrito.cantidad}
                    </span>
                  )}
                  {sinStock && (
                    <span className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl text-xs font-bold text-red-500">
                      AGOTADO
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Panel carrito */}
      <div className="w-full md:w-96 bg-white border-t md:border-t-0 md:border-l border-gray-100 flex flex-col shadow-xl shrink-0">

        {/* Goal-Gradient: barra de progreso */}
        <div className="px-4 pt-3 pb-0">
          <div className="flex items-center gap-1 mb-1">
            {pasos.map((paso, i) => (
              <div key={paso} className="flex items-center gap-1 flex-1">
                <div className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold shrink-0 transition-all ${
                  i < pasoActual ? 'bg-green-500 text-white' :
                  i === pasoActual ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {i < pasoActual ? '✓' : i + 1}
                </div>
                <span className={`text-xs ${i === pasoActual ? 'text-primary font-medium' : 'text-gray-400'}`}>{paso}</span>
                {i < pasos.length - 1 && <div className={`flex-1 h-0.5 rounded-full ${i < pasoActual ? 'bg-green-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Header carrito */}
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-display font-bold text-dark flex items-center gap-2">
            <ShoppingCart size={17} className="text-primary" />
            Carrito {carrito.length > 0 && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{carrito.reduce((s,i)=>s+i.cantidad,0)} items</span>}
          </h2>
          {carrito.length > 0 && (
            <button onClick={limpiarCarrito} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
              <Trash2 size={12} /> Limpiar
            </button>
          )}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {carrito.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300 py-12">
              <ShoppingCart size={44} />
              <p className="mt-3 text-sm">Toca un producto para agregar</p>
            </div>
          ) : (
            carrito.map(item => (
              <div key={item.producto_id} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark truncate">{item.nombre_producto}</p>
                  <p className="text-xs text-primary font-semibold">${item.precio_unitario.toFixed(2)} c/u</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => cambiarCantidad(item.producto_id, -1)}
                    className="w-7 h-7 rounded-full bg-gray-200 hover:bg-primary hover:text-white flex items-center justify-center transition-colors active:scale-95">
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{item.cantidad}</span>
                  <button onClick={() => cambiarCantidad(item.producto_id, 1)}
                    className="w-7 h-7 rounded-full bg-gray-200 hover:bg-primary hover:text-white flex items-center justify-center transition-colors active:scale-95">
                    <Plus size={12} />
                  </button>
                </div>
                <p className="text-sm font-bold text-dark w-16 text-right">${(item.precio_unitario * item.cantidad).toFixed(2)}</p>
                <button onClick={() => quitarItem(item.producto_id)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                  <X size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Totales y pago */}
        <div className="p-3 border-t border-gray-100 space-y-2.5">
          {/* Descuento */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-24 shrink-0">Descuento $</label>
            <input type="number" min="0" max={subtotal} value={descuento}
              onChange={e => setDescuento(Math.min(subtotal, parseFloat(e.target.value) || 0))}
              className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>

          {/* Totales — Anchoring: mostrar subtotal antes del total */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            {descuento > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Descuento 🎉</span><span>-${descuento.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-dark text-lg border-t border-gray-200 pt-1.5">
              <span>Total</span>
              <span className="text-primary">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Método de pago */}
          <div className="grid grid-cols-3 gap-1.5">
            {METODOS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setMetodo(id)}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium border-2 transition-all ${
                  metodo === id ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-gray-100 text-gray-500 hover:border-gray-200'
                }`}>
                <Icon size={17} />{label}
              </button>
            ))}
          </div>

          {/* Monto recibido */}
          {metodo === 'efectivo' && (
            <div>
              <input type="number" placeholder="Monto recibido del cliente" value={montoRecibido}
                onChange={e => setMontoRecibido(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              {cambio > 0 && (
                <p className="text-green-600 text-sm font-bold mt-1.5 text-center bg-green-50 rounded-lg py-1.5">
                  💵 Cambio: ${cambio.toFixed(2)}
                </p>
              )}
            </div>
          )}

          <input type="text" placeholder="Notas (opcional)" value={notas}
            onChange={e => setNotas(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary" />

          {error && (
            <div className="bg-red-50 text-red-500 text-xs px-3 py-2 rounded-xl flex items-center gap-2">
              <AlertTriangle size={13} /> {error}
            </div>
          )}

          {/* CTA — BJ Fogg: prompt claro en el momento correcto */}
          <button onClick={procesarVenta}
            disabled={!carrito.length || procesando}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            style={{ background: carrito.length ? 'linear-gradient(135deg, #FF6B35, #F7931E)' : '#e5e7eb' }}>
            {procesando ? '⏳ Procesando...' : carrito.length ? `Cobrar $${total.toFixed(2)} →` : 'Agrega productos'}
          </button>
        </div>
      </div>

      {/* Modal ticket — Peak-End Rule: cierre memorable */}
      {ticketData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl fade-in">
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={34} className="text-green-500" />
              </div>
              <h3 className="font-display font-bold text-xl text-dark">¡Venta completada!</h3>
              <p className="text-gray-400 text-xs mt-1">Folio: <span className="font-mono font-bold">{ticketData.folio}</span></p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 mb-4 text-sm">
              {ticketData.items.map(i => (
                <div key={i.producto_id} className="flex justify-between">
                  <span className="text-gray-600">{i.nombre_producto} <span className="text-gray-400">×{i.cantidad}</span></span>
                  <span className="font-medium">${(i.precio_unitario * i.cantidad).toFixed(2)}</span>
                </div>
              ))}
              {ticketData.descuento > 0 && (
                <div className="flex justify-between text-green-600 border-t border-gray-200 pt-2">
                  <span>Descuento</span><span>-${ticketData.descuento.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-dark text-base border-t border-gray-200 pt-2">
                <span>Total cobrado</span><span className="text-primary">${ticketData.total.toFixed(2)}</span>
              </div>
              {ticketData.metodo === 'efectivo' && ticketData.cambio > 0 && (
                <div className="flex justify-between text-green-600 font-bold">
                  <span>Cambio entregado</span><span>${ticketData.cambio.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Peak-End: mensaje memorable al cerrar */}
            <p className="text-center text-sm font-medium text-primary mb-4">{ticketData.mensaje}</p>

            <button onClick={() => setTicketData(null)}
              className="w-full py-3 rounded-2xl font-bold text-white text-sm active:scale-95"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}>
              Nueva venta
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
