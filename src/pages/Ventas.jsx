import { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'
import { Plus, Minus, Trash2, ShoppingCart, Search, CreditCard, Banknote, Smartphone, CheckCircle, X, Receipt } from 'lucide-react'

const METODOS = [
  { id: 'efectivo', label: 'Efectivo', icon: Banknote },
  { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { id: 'transferencia', label: 'Transferencia', icon: Smartphone },
]

export default function Ventas() {
  const [productos, setProductos] = useState([])
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

  const procesarVenta = async () => {
    if (!carrito.length) return
    if (metodo === 'efectivo' && parseFloat(montoRecibido || 0) < total) {
      setError('El monto recibido es insuficiente'); return
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
      setTicketData({ ...result, items: carrito, metodo, descuento, subtotal })
      limpiarCarrito()
      // Recargar stock
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
        <div className="p-4 bg-white border-b border-gray-100 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
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
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {productosFiltrados.map(prod => {
              const enCarrito = carrito.find(i => i.producto_id === prod.id)
              const sinStock = prod.stock === 0
              return (
                <button key={prod.id} onClick={() => agregarAlCarrito(prod)} disabled={sinStock}
                  className={`relative bg-white rounded-2xl p-4 text-left border-2 transition-all shadow-sm hover:shadow-md ${
                    sinStock ? 'opacity-50 cursor-not-allowed border-gray-100' :
                    enCarrito ? 'border-primary shadow-primary/20' : 'border-gray-100 hover:border-primary/40'
                  }`}>
                  <div className="text-3xl mb-2">🍺</div>
                  <p className="text-sm font-semibold text-dark leading-tight">{prod.nombre}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{prod.categoria}</p>
                  <p className="text-primary font-bold mt-2">${prod.precio.toFixed(2)}</p>
                  <p className={`text-xs mt-1 ${prod.stock <= prod.stock_minimo ? 'text-orange-500' : 'text-gray-400'}`}>
                    Stock: {prod.stock}
                  </p>
                  {enCarrito && (
                    <span className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full text-white text-xs flex items-center justify-center font-bold">
                      {enCarrito.cantidad}
                    </span>
                  )}
                  {sinStock && <span className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-2xl text-xs font-bold text-red-500">AGOTADO</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Panel carrito */}
      <div className="w-full md:w-80 lg:w-96 bg-white border-t md:border-t-0 md:border-l border-gray-100 flex flex-col shadow-xl">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-display font-bold text-dark flex items-center gap-2">
            <ShoppingCart size={18} className="text-primary" /> Carrito
          </h2>
          {carrito.length > 0 && (
            <button onClick={limpiarCarrito} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
              <Trash2 size={13} /> Limpiar
            </button>
          )}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {carrito.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300 py-12">
              <ShoppingCart size={48} />
              <p className="mt-3 text-sm">Selecciona productos</p>
            </div>
          ) : (
            carrito.map(item => (
              <div key={item.producto_id} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark truncate">{item.nombre_producto}</p>
                  <p className="text-xs text-primary font-semibold">${item.precio_unitario.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => cambiarCantidad(item.producto_id, -1)}
                    className="w-6 h-6 rounded-full bg-gray-200 hover:bg-primary hover:text-white flex items-center justify-center transition-colors">
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{item.cantidad}</span>
                  <button onClick={() => cambiarCantidad(item.producto_id, 1)}
                    className="w-6 h-6 rounded-full bg-gray-200 hover:bg-primary hover:text-white flex items-center justify-center transition-colors">
                    <Plus size={12} />
                  </button>
                </div>
                <p className="text-sm font-bold text-dark w-16 text-right">
                  ${(item.precio_unitario * item.cantidad).toFixed(2)}
                </p>
                <button onClick={() => quitarItem(item.producto_id)} className="text-gray-300 hover:text-red-400 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Totales y pago */}
        <div className="p-4 border-t border-gray-100 space-y-3">
          {/* Descuento */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-24">Descuento $</label>
            <input type="number" min="0" max={subtotal} value={descuento}
              onChange={e => setDescuento(Math.min(subtotal, parseFloat(e.target.value) || 0))}
              className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>

          {/* Totales */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            {descuento > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Descuento</span><span>-${descuento.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-dark text-lg border-t border-gray-200 pt-1.5">
              <span>Total</span><span className="text-primary">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Método de pago */}
          <div className="grid grid-cols-3 gap-1.5">
            {METODOS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setMetodo(id)}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium border-2 transition-all ${
                  metodo === id ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-500 hover:border-gray-200'
                }`}>
                <Icon size={16} />{label}
              </button>
            ))}
          </div>

          {/* Monto recibido (efectivo) */}
          {metodo === 'efectivo' && (
            <div>
              <input type="number" placeholder="Monto recibido" value={montoRecibido}
                onChange={e => setMontoRecibido(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              {cambio > 0 && (
                <p className="text-green-600 text-sm font-bold mt-1 text-center">
                  Cambio: ${cambio.toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Notas */}
          <input type="text" placeholder="Notas (opcional)" value={notas}
            onChange={e => setNotas(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary" />

          {error && <p className="text-red-500 text-xs text-center">{error}</p>}

          <button onClick={procesarVenta} disabled={!carrito.length || procesando}
            className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}>
            {procesando ? 'Procesando...' : `Cobrar $${total.toFixed(2)}`}
          </button>
        </div>
      </div>

      {/* Modal ticket */}
      {ticketData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl fade-in">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h3 className="font-display font-bold text-xl text-dark">¡Venta exitosa!</h3>
              <p className="text-gray-500 text-sm">Folio: {ticketData.folio}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-4 text-sm">
              {ticketData.items.map(i => (
                <div key={i.producto_id} className="flex justify-between">
                  <span className="text-gray-600">{i.nombre_producto} x{i.cantidad}</span>
                  <span className="font-medium">${(i.precio_unitario * i.cantidad).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-dark">
                <span>Total</span><span className="text-primary">${ticketData.total.toFixed(2)}</span>
              </div>
              {ticketData.metodo === 'efectivo' && ticketData.cambio > 0 && (
                <div className="flex justify-between text-green-600 font-bold">
                  <span>Cambio</span><span>${ticketData.cambio.toFixed(2)}</span>
                </div>
              )}
            </div>

            <button onClick={() => setTicketData(null)}
              className="w-full py-3 rounded-xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}>
              Nueva venta
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
