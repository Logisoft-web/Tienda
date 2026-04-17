import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Plus, Minus, Trash2, ShoppingCart, Search, CreditCard, Banknote, Smartphone, CheckCircle, X, Flame, AlertTriangle } from 'lucide-react'

const METODOS = [
  { id: 'efectivo', label: 'Efectivo', icon: Banknote },
  { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { id: 'transferencia', label: 'Transferencia', icon: Smartphone },
]

const MENSAJES_TICKET = [
  '¡Gracias por tu preferencia! 🍺',
  '¡Que la disfrutes mucho! 🎉',
  '¡Vuelve pronto, te esperamos! ✨',
  '¡La chelada perfecta para ti! 🍋',
]

// Estilos de input reutilizables para el panel oscuro
const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors'
const inputStyle = {
  background: 'var(--bg-raised)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
}
const inputFocusStyle = { '--tw-ring-color': 'rgba(244,98,42,0.3)' }

export default function Ventas() {
  const [productos, setProductos] = useState([])
  const [combos, setCombos] = useState([])
  const [topVendidos, setTopVendidos] = useState([])
  const [cajaActual, setCajaActual] = useState(null)
  const [carrito, setCarrito] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState('Todos')
  const [metodo, setMetodo] = useState('efectivo')
  const [montoRecibido, setMontoRecibido] = useState('')
  const [descuento, setDescuento] = useState(0)
  const [notas, setNotas] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [ticketData, setTicketData] = useState(null)
  const [config, setConfig] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    api.getProductos().then(setProductos).catch(console.error)
    api.getCombos().then(setCombos).catch(() => {})
    api.getConfig().then(setConfig).catch(() => {})
    api.getCajaEstado().then(setCajaActual).catch(() => {})
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
      const existe = prev.find(i => i.producto_id === prod.id && !i.es_combo)
      if (existe) {
        if (existe.cantidad >= prod.stock) return prev
        return prev.map(i => i.producto_id === prod.id && !i.es_combo ? { ...i, cantidad: i.cantidad + 1 } : i)
      }
      if (prod.stock === 0) return prev
      return [...prev, { producto_id: prod.id, nombre_producto: prod.nombre, precio_unitario: prod.precio, cantidad: 1, stock: prod.stock, es_combo: false }]
    })
  }

  const agregarCombo = (combo) => {
    setCarrito(prev => {
      const existe = prev.find(i => i.es_combo && i.combo_id === combo.id)
      if (existe) return prev.map(i => i.es_combo && i.combo_id === combo.id ? { ...i, cantidad: i.cantidad + 1 } : i)
      return [...prev, { combo_id: combo.id, producto_id: combo.id, nombre_producto: `${combo.icono || '🎁'} ${combo.nombre}`, precio_unitario: combo.precio, cantidad: 1, es_combo: true }]
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

  const pasos = ['Productos', 'Pago', 'Listo']
  const pasoActual = carrito.length === 0 ? 0 : montoRecibido || metodo !== 'efectivo' ? 2 : 1

  const procesarVenta = async () => {
    if (!carrito.length) return
    if (metodo === 'efectivo' && parseFloat(montoRecibido || 0) < total) {
      setError('Monto insuficiente'); return
    }
    if (metodo === 'efectivo' && cambio > 0 && cajaActual) {
      const disponible = cajaActual.efectivo_disponible ?? cajaActual.monto_inicial ?? 0
      if (cambio > disponible) {
        setError(`Sin fondos en caja para dar ${cambio.toLocaleString('es-CO')} de cambio (disponible: ${disponible.toLocaleString('es-CO')}). Comuníquese con el administrador.`)
        return
      }
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
      api.getCajaEstado().then(setCajaActual).catch(() => {})
    } catch (err) {
      setError(err.message)
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="flex h-full flex-col md:flex-row">

      {/* ── Panel productos ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Búsqueda y categorías */}
        <div className="p-3 md:p-4 space-y-2.5"
          style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-dim)' }} />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-colors"
              style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              onFocus={e => e.target.style.borderColor = 'rgba(244,98,42,0.5)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categorias.map(cat => (
              <button key={cat} onClick={() => setCategoriaActiva(cat)}
                className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all"
                style={categoriaActiva === cat
                  ? { background: 'var(--primary)', color: '#fff' }
                  : { background: 'var(--bg-raised)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                }>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid productos */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4" style={{ background: 'var(--bg-base)' }}>

          {/* Combos */}
          {combos.length > 0 && (
            <div className="mb-5">
              <h2 className="text-sm font-bold mb-2 flex items-center gap-1.5"
                style={{ color: 'var(--text-secondary)' }}>
                🎁 <span>Combos</span>
                <span className="text-xs font-normal px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }}>
                  {combos.length}
                </span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {combos.map(combo => {
                  const enCarrito = carrito.find(i => i.es_combo && i.combo_id === combo.id)
                  return (
                    <button key={combo.id} onClick={() => agregarCombo(combo)}
                      className="relative rounded-2xl p-3 text-left border-2 transition-all active:scale-95"
                      style={{
                        background: enCarrito ? 'rgba(124,58,237,0.12)' : 'var(--bg-card)',
                        borderColor: enCarrito ? '#7c3aed' : 'rgba(124,58,237,0.2)',
                      }}>
                      <div className="text-3xl mb-1.5">{combo.icono || '🎁'}</div>
                      <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{combo.nombre}</p>
                      {combo.descripcion && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{combo.descripcion}</p>}
                      <p className="font-bold text-base mt-1.5" style={{ color: '#a78bfa' }}>${Number(combo.precio).toLocaleString('es-CO')}</p>
                      {enCarrito && (
                        <span className="absolute top-2 right-2 w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold"
                          style={{ background: '#7c3aed' }}>
                          {enCarrito.cantidad}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Productos */}
          <div>
            {combos.length > 0 && (
              <h2 className="text-sm font-bold mb-2 flex items-center gap-1.5"
                style={{ color: 'var(--text-secondary)' }}>
                🍺 <span>Productos</span>
                <span className="text-xs font-normal px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }}>
                  {productosFiltrados.length}
                </span>
              </h2>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
              {productosFiltrados.map(prod => {
                const enCarrito = carrito.find(i => i.producto_id === prod.id)
                const sinStock = prod.stock === 0
                const esMasPedida = topVendidos.includes(prod.nombre)
                const stockCritico = prod.stock > 0 && prod.stock <= 3
                const stockBajo = prod.stock > 0 && prod.stock <= prod.stock_minimo && prod.stock > 3

                return (
                  <button key={prod.id} onClick={() => agregarAlCarrito(prod)} disabled={sinStock}
                    className="relative rounded-2xl p-3 md:p-4 text-left border-2 transition-all active:scale-95"
                    style={{
                      background: sinStock ? 'var(--bg-raised)' : enCarrito ? 'rgba(244,98,42,0.08)' : 'var(--bg-card)',
                      borderColor: sinStock ? 'var(--border)' : enCarrito ? 'var(--primary)' : stockCritico ? 'var(--warning)' : 'var(--border)',
                      opacity: sinStock ? 0.5 : 1,
                      cursor: sinStock ? 'not-allowed' : 'pointer',
                    }}>

                    {esMasPedida && !sinStock && (
                      <div className="absolute -top-2 -right-2 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 z-10"
                        style={{ background: 'var(--accent)', color: '#78350f' }}>
                        <Flame size={10} /> Popular
                      </div>
                    )}

                    {stockCritico && (
                      <div className="absolute -top-2 left-2 text-white text-xs font-bold px-2 py-0.5 rounded-full z-10 animate-pulse"
                        style={{ background: 'var(--danger)' }}>
                        ¡Solo {prod.stock}!
                      </div>
                    )}

                    <div className="text-3xl md:text-4xl mb-2">🍺</div>
                    <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{prod.nombre}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{prod.categoria}</p>

                    <div className="flex items-baseline gap-1.5 mt-2">
                      <p className="font-bold text-base" style={{ color: 'var(--primary)' }}>${prod.precio.toFixed(2)}</p>
                      {prod.precio_sugerido && prod.precio_sugerido > prod.precio && (
                        <p className="text-xs line-through" style={{ color: 'var(--text-dim)' }}>${prod.precio_sugerido.toFixed(2)}</p>
                      )}
                    </div>

                    {stockBajo && (
                      <p className="text-xs mt-1 font-medium" style={{ color: 'var(--warning)' }}>⚠ Quedan {prod.stock}</p>
                    )}
                    {!stockBajo && !stockCritico && (
                      <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>Stock: {prod.stock}</p>
                    )}

                    {enCarrito && (
                      <span className="absolute top-2 right-2 w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold"
                        style={{ background: 'var(--primary)' }}>
                        {enCarrito.cantidad}
                      </span>
                    )}
                    {sinStock && (
                      <span className="absolute inset-0 flex items-center justify-center rounded-2xl text-xs font-bold"
                        style={{ background: 'rgba(15,11,8,0.7)', color: 'var(--danger)' }}>
                        AGOTADO
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Panel carrito ── */}
      <div className="w-full md:w-96 flex flex-col shrink-0"
        style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderLeft: '1px solid var(--border)' }}>

        {/* Barra de progreso — Goal-Gradient */}
        <div className="px-4 pt-3 pb-0">
          <div className="flex items-center gap-1 mb-1">
            {pasos.map((paso, i) => (
              <div key={paso} className="flex items-center gap-1 flex-1">
                <div className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold shrink-0 transition-all"
                  style={{
                    background: i < pasoActual ? 'var(--success)' : i === pasoActual ? 'var(--primary)' : 'var(--bg-raised)',
                    color: i <= pasoActual ? '#fff' : 'var(--text-dim)'
                  }}>
                  {i < pasoActual ? '✓' : i + 1}
                </div>
                <span className="text-xs" style={{ color: i === pasoActual ? 'var(--primary)' : 'var(--text-dim)' }}>{paso}</span>
                {i < pasos.length - 1 && (
                  <div className="flex-1 h-0.5 rounded-full"
                    style={{ background: i < pasoActual ? 'var(--success)' : 'var(--bg-raised)' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Header carrito */}
        <div className="px-4 py-2.5 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-display text-base flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}>
            <ShoppingCart size={17} style={{ color: 'var(--primary)' }} />
            Carrito
            {carrito.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(244,98,42,0.15)', color: 'var(--primary)' }}>
                {carrito.reduce((s, i) => s + i.cantidad, 0)} items
              </span>
            )}
          </h2>
          {carrito.length > 0 && (
            <button onClick={limpiarCarrito}
              className="text-xs flex items-center gap-1 transition-colors"
              style={{ color: 'var(--danger)' }}>
              <Trash2 size={12} /> Limpiar
            </button>
          )}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {carrito.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12"
              style={{ color: 'var(--text-dim)' }}>
              <ShoppingCart size={44} />
              <p className="mt-3 text-sm">Toca un producto para agregar</p>
            </div>
          ) : (
            carrito.map(item => (
              <div key={item.producto_id} className="flex items-center gap-2 rounded-xl p-2.5"
                style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.nombre_producto}</p>
                  <p className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>${item.precio_unitario.toFixed(2)} c/u</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => cambiarCantidad(item.producto_id, -1)}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-colors active:scale-95"
                    style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{item.cantidad}</span>
                  <button onClick={() => cambiarCantidad(item.producto_id, 1)}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-colors active:scale-95"
                    style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                    <Plus size={12} />
                  </button>
                </div>
                <p className="text-sm font-bold w-16 text-right" style={{ color: 'var(--text-primary)' }}>
                  ${(item.precio_unitario * item.cantidad).toFixed(2)}
                </p>
                <button onClick={() => quitarItem(item.producto_id)}
                  className="p-1 transition-colors" style={{ color: 'var(--text-dim)' }}>
                  <X size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Totales y pago */}
        <div className="p-3 space-y-2.5" style={{ borderTop: '1px solid var(--border)' }}>

          {/* Descuento */}
          <div className="flex items-center gap-2">
            <label className="text-xs w-24 shrink-0" style={{ color: 'var(--text-muted)' }}>Descuento $</label>
            <input type="number" min="0" max={subtotal} value={descuento}
              onChange={e => setDescuento(Math.min(subtotal, parseFloat(e.target.value) || 0))}
              className="flex-1 px-3 py-1.5 rounded-lg text-sm focus:outline-none"
              style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
          </div>

          {/* Totales — Anchoring */}
          <div className="rounded-xl p-3 space-y-1.5" style={{ background: 'var(--bg-raised)' }}>
            <div className="flex justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            {descuento > 0 && (
              <div className="flex justify-between text-sm" style={{ color: 'var(--success)' }}>
                <span>Descuento 🎉</span><span>-${descuento.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-1.5"
              style={{ borderTop: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              <span>Total</span>
              <span style={{ color: 'var(--primary)' }}>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Método de pago */}
          <div className="grid grid-cols-3 gap-1.5">
            {METODOS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setMetodo(id)}
                className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium border-2 transition-all"
                style={{
                  borderColor: metodo === id ? 'var(--primary)' : 'var(--border)',
                  background: metodo === id ? 'rgba(244,98,42,0.1)' : 'transparent',
                  color: metodo === id ? 'var(--primary)' : 'var(--text-muted)'
                }}>
                <Icon size={17} />{label}
              </button>
            ))}
          </div>

          {/* Monto recibido */}
          {metodo === 'efectivo' && (
            <div>
              <input type="number" placeholder="Monto recibido del cliente" value={montoRecibido}
                onChange={e => setMontoRecibido(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              {cambio > 0 && (() => {
                const disponible = cajaActual?.efectivo_disponible ?? cajaActual?.monto_inicial ?? Infinity
                const sinFondos = cambio > disponible
                return (
                  <p className="text-sm font-bold mt-1.5 text-center rounded-lg py-1.5"
                    style={{
                      background: sinFondos ? 'var(--danger-bg)' : 'var(--success-bg)',
                      color: sinFondos ? 'var(--danger)' : 'var(--success)'
                    }}>
                    {sinFondos
                      ? `⚠️ Sin fondos para dar ${cambio.toLocaleString('es-CO')} de cambio`
                      : `💵 Cambio: ${cambio.toLocaleString('es-CO')}`
                    }
                  </p>
                )
              })()}
            </div>
          )}

          <input type="text" placeholder="Notas (opcional)" value={notas}
            onChange={e => setNotas(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />

          {error && (
            <div className="text-xs px-3 py-2 rounded-xl flex items-center gap-2"
              style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger-border)' }}>
              <AlertTriangle size={13} /> {error}
            </div>
          )}

          {/* CTA — BJ Fogg */}
          <button onClick={procesarVenta}
            disabled={!carrito.length || procesando}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            style={{
              background: carrito.length
                ? 'linear-gradient(135deg, var(--primary), var(--secondary))'
                : 'var(--bg-raised)',
              boxShadow: carrito.length && !procesando ? '0 0 20px rgba(244,98,42,0.3)' : 'none'
            }}>
            {procesando ? '⏳ Procesando...' : carrito.length ? `✓ Cobrar $${total.toFixed(2)}` : 'Selecciona productos'}
          </button>
          {carrito.length > 0 && metodo === 'efectivo' && !montoRecibido && (
            <p className="text-center text-xs -mt-1" style={{ color: 'var(--text-dim)' }}>
              Ingresa el monto recibido para continuar
            </p>
          )}
        </div>
      </div>

      {/* ── Modal ticket ── */}
      {ticketData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 print:p-0 print:bg-white print:inset-auto">
          <div className="rounded-2xl w-full max-w-sm shadow-2xl fade-in flex flex-col max-h-[92vh] print:shadow-none print:rounded-none print:max-h-none"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 shrink-0 print:hidden"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <CheckCircle size={18} style={{ color: 'var(--success)' }} />
                <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Venta completada</span>
              </div>
              <button onClick={() => setTicketData(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Factura */}
            <div id="factura-print" className="overflow-y-auto print:overflow-visible">
              <div className="px-5 py-4 font-mono text-xs space-y-0" style={{ color: '#1a1a1a', background: '#fff' }}>

                {/* Encabezado empresa */}
                <div className="text-center mb-3">
                  {config?.logo && (
                    <img src={config.logo} alt="logo" className="h-10 mx-auto mb-1 object-contain" />
                  )}
                  <p className="font-bold text-sm uppercase tracking-wide">{config?.nombre || 'ENJOY CHELADAS'}</p>
                  {config?.nit && <p>NIT: {config.nit}</p>}
                  {config?.direccion && <p>{config.direccion}</p>}
                  {config?.telefono && <p>Tel: {config.telefono}</p>}
                  {config?.email && <p>{config.email}</p>}
                  <div className="border-t border-dashed border-gray-300 mt-2 pt-2">
                    <p className="font-bold text-xs">DOCUMENTO EQUIVALENTE POS</p>
                    {config?.resolucion && (
                      <p className="text-gray-500 text-xs">Res. DIAN {config.resolucion}</p>
                    )}
                  </div>
                </div>

                {/* Datos venta */}
                <div className="border-t border-dashed border-gray-300 pt-2 pb-2 space-y-0.5">
                  {[
                    ['No.', ticketData.folio],
                    ['Fecha', new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })],
                    ['Cajero', ticketData.cajero || 'Administrador'],
                    ['Cliente', ticketData.cliente_nombre || 'CONSUMIDOR FINAL'],
                    ['C.C. / NIT', ticketData.cliente_nit || '222222222222'],
                    ['Forma de pago', ticketData.metodo],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-gray-500">{k}</span>
                      <span className="capitalize">{v}</span>
                    </div>
                  ))}
                </div>

                {/* Items */}
                <div className="border-t border-dashed border-gray-300 pt-2 pb-2">
                  <div className="flex justify-between text-gray-400 mb-1">
                    <span className="w-5/12">Descripción</span>
                    <span className="w-1/12 text-center">Cant</span>
                    <span className="w-2/12 text-right">V.Unit</span>
                    <span className="w-2/12 text-right">IVA%</span>
                    <span className="w-2/12 text-right">Total</span>
                  </div>
                  {ticketData.items.map((item, idx) => {
                    const ivaPct = item.iva_pct ?? 0
                    const baseUnit = ivaPct > 0 ? Math.round(item.precio_unitario / (1 + ivaPct / 100)) : item.precio_unitario
                    return (
                      <div key={idx} className="mb-1">
                        <p className="font-semibold truncate">{item.nombre_producto}</p>
                        <div className="flex justify-between text-gray-600">
                          <span className="w-5/12"></span>
                          <span className="w-1/12 text-center">{item.cantidad}</span>
                          <span className="w-2/12 text-right">${Number(baseUnit).toLocaleString('es-CO')}</span>
                          <span className="w-2/12 text-right">{ivaPct}%</span>
                          <span className="w-2/12 text-right font-medium">${Number(item.precio_unitario * item.cantidad).toLocaleString('es-CO')}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Totales */}
                <div className="border-t border-dashed border-gray-300 pt-2 pb-2 space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span>${Number(ticketData.subtotal).toLocaleString('es-CO')}</span>
                  </div>
                  {ticketData.descuento > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>Descuento</span>
                      <span>-${Number(ticketData.descuento).toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  {(() => {
                    const ivaPct = config?.iva || 19
                    const totalConIva = ticketData.total
                    const baseGravable = Math.round(totalConIva / (1 + ivaPct / 100))
                    const ivaValor = totalConIva - baseGravable
                    return ivaValor > 0 ? (
                      <>
                        <div className="flex justify-between text-gray-500">
                          <span>Base gravable</span><span>${baseGravable.toLocaleString('es-CO')}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>IVA {ivaPct}%</span><span>${ivaValor.toLocaleString('es-CO')}</span>
                        </div>
                      </>
                    ) : null
                  })()}
                  <div className="flex justify-between font-bold text-sm border-t border-gray-300 pt-1 mt-1">
                    <span>TOTAL A PAGAR</span>
                    <span>${Number(ticketData.total).toLocaleString('es-CO')}</span>
                  </div>
                  {ticketData.metodo === 'efectivo' && ticketData.cambio > 0 && (
                    <>
                      <div className="flex justify-between text-gray-500">
                        <span>Efectivo recibido</span>
                        <span>${Number(ticketData.total + ticketData.cambio).toLocaleString('es-CO')}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-green-700">
                        <span>Cambio</span>
                        <span>${Number(ticketData.cambio).toLocaleString('es-CO')}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Pie */}
                <div className="border-t border-dashed border-gray-300 pt-2 text-center text-gray-400 space-y-0.5">
                  <p>Régimen Simplificado</p>
                  <p className="font-semibold text-gray-600">{ticketData.mensaje}</p>
                  <p className="text-gray-300 text-xs mt-1">— Enjoy Cheladas POS —</p>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="p-4 flex gap-2 shrink-0 print:hidden"
              style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                🖨 Imprimir
              </button>
              <button onClick={() => setTicketData(null)}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
                Nueva venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
