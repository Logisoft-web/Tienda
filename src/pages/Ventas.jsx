import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, Smartphone, CheckCircle, X, Flame, AlertTriangle, Search } from 'lucide-react'

const METODOS = [
  { id: 'efectivo',       label: 'Efectivo',       icon: Banknote },
  { id: 'tarjeta',        label: 'Tarjeta',         icon: CreditCard },
  { id: 'transferencia',  label: 'Transferencia',   icon: Smartphone },
]

const MENSAJES_TICKET = [
  '¡Gracias por tu preferencia! 🍺',
  '¡Que la disfrutes mucho! 🎉',
  '¡Vuelve pronto, te esperamos! ✨',
  '¡La chelada perfecta para ti! 🍋',
]

// Orden de categorías según la carta
const ORDEN_CATEGORIAS = [
  'Canada Dry 22oz',
  'Canada Dry 16oz',
  'Hatsu 22oz',
  'Hatsu 16oz',
  'Smirnoff 16oz',
  'Adiciones',
]

// Colores por categoría — inspirados en la carta
const CAT_COLORS = {
  'Canada Dry 22oz':  { bg: '#f0fdf4', border: '#86efac', badge: '#16a34a', text: '#14532d' },
  'Canada Dry 16oz':  { bg: '#f0fdf4', border: '#86efac', badge: '#16a34a', text: '#14532d' },
  'Hatsu 22oz':       { bg: '#fdf4ff', border: '#d8b4fe', badge: '#7c3aed', text: '#4c1d95' },
  'Hatsu 16oz':       { bg: '#fdf4ff', border: '#d8b4fe', badge: '#7c3aed', text: '#4c1d95' },
  'Smirnoff 16oz':    { bg: '#fff7ed', border: '#fdba74', badge: '#ea580c', text: '#7c2d12' },
  'Adiciones':        { bg: '#fefce8', border: '#fde047', badge: '#ca8a04', text: '#713f12' },
}
const DEFAULT_COLOR = { bg: '#fff8f5', border: '#fdba74', badge: '#f4622a', text: '#7c2d12' }

const getCatColor = (cat) => CAT_COLORS[cat] || DEFAULT_COLOR

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

  // Categorías ordenadas según la carta
  const todasCategorias = ['Todos', ...ORDEN_CATEGORIAS.filter(c =>
    productos.some(p => p.categoria === c)
  ), ...productos
    .map(p => p.categoria)
    .filter(c => c && !ORDEN_CATEGORIAS.includes(c))
    .filter((c, i, a) => a.indexOf(c) === i)
  ]

  const productosFiltrados = productos.filter(p => {
    const matchCat = categoriaActiva === 'Todos' || p.categoria === categoriaActiva
    const matchBus = p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    return matchCat && matchBus && p.activo !== false
  })

  // Agrupar por categoría en el orden de la carta
  const productosPorCategoria = () => {
    if (categoriaActiva !== 'Todos') return { [categoriaActiva]: productosFiltrados }
    const grupos = {}
    const orden = [...ORDEN_CATEGORIAS]
    productosFiltrados.forEach(p => {
      if (!grupos[p.categoria]) grupos[p.categoria] = []
      grupos[p.categoria].push(p)
    })
    // Ordenar según carta
    const result = {}
    orden.forEach(c => { if (grupos[c]) result[c] = grupos[c] })
    Object.keys(grupos).forEach(c => { if (!result[c]) result[c] = grupos[c] })
    return result
  }

  const agregarAlCarrito = (prod) => {
    setCarrito(prev => {
      const existe = prev.find(i => i.producto_id === prod.id && !i.es_combo)
      if (existe) {
        if (existe.cantidad >= prod.stock) return prev
        return prev.map(i => i.producto_id === prod.id && !i.es_combo ? { ...i, cantidad: i.cantidad + 1 } : i)
      }
      if (prod.stock === 0) return prev
      return [...prev, { producto_id: prod.id, nombre_producto: prod.nombre, precio_unitario: prod.precio, cantidad: 1, stock: prod.stock, es_combo: false, emoji: prod.emoji }]
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
      if (!i.es_combo && nueva > i.stock) return i
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
    if (metodo === 'efectivo' && parseFloat(montoRecibido || 0) < total) { setError('Monto insuficiente'); return }
    if (metodo === 'efectivo' && cambio > 0 && cajaActual) {
      const disponible = cajaActual.efectivo_disponible ?? cajaActual.monto_inicial ?? 0
      if (cambio > disponible) { setError(`Sin fondos para dar $${cambio.toLocaleString('es-CO')} de cambio`); return }
    }
    setError(''); setProcesando(true)
    try {
      const result = await api.createVenta({ items: carrito, metodo_pago: metodo, monto_recibido: parseFloat(montoRecibido || total), descuento, notas })
      const msg = MENSAJES_TICKET[Math.floor(Math.random() * MENSAJES_TICKET.length)]
      setTicketData({ ...result, items: carrito, metodo, descuento, subtotal, mensaje: msg })
      limpiarCarrito()
      api.getProductos().then(setProductos)
      api.getCajaEstado().then(setCajaActual).catch(() => {})
    } catch (err) { setError(err.message) }
    finally { setProcesando(false) }
  }

  const grupos = productosPorCategoria()

  return (
    <div className="flex h-full flex-col md:flex-row" style={{ background: 'var(--bg-base)' }}>

      {/* ── Panel izquierdo: carta de productos ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Barra superior: búsqueda + filtros de categoría */}
        <div className="px-3 md:px-4 py-3 space-y-2.5 shrink-0"
          style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>

          {/* Header estilo carta */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-dim)' }} />
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar chelada..."
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none"
                style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                onFocus={e => e.target.style.borderColor = 'rgba(244,98,42,0.5)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
          </div>

          {/* Tabs de categoría */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
            {todasCategorias.map(cat => {
              const col = getCatColor(cat)
              const activo = categoriaActiva === cat
              return (
                <button key={cat} onClick={() => setCategoriaActiva(cat)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0"
                  style={activo
                    ? { background: cat === 'Todos' ? 'var(--primary)' : col.badge, color: '#fff' }
                    : { background: 'var(--bg-raised)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                  }>
                  {cat === 'Todos' ? '🍺 Todos' : cat}
                </button>
              )
            })}
          </div>
        </div>

        {/* Carta de productos agrupada */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-6">
          {Object.entries(grupos).map(([categoria, prods]) => {
            const col = getCatColor(categoria)
            return (
              <div key={categoria}>
                {/* Header de sección estilo carta */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="px-4 py-1.5 rounded-full text-xs font-bold tracking-wide"
                    style={{ background: col.badge, color: '#fff' }}>
                    {categoria}
                  </div>
                  <div className="flex-1 h-px" style={{ background: col.border }} />
                  <span className="text-xs font-medium" style={{ color: col.badge }}>
                    {prods.length} opciones
                  </span>
                </div>

                {/* Grid de productos — estilo carta */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
                  {prods.map(prod => {
                    const enCarrito = carrito.find(i => i.producto_id === prod.id)
                    const sinStock = prod.stock === 0
                    const esMasPedida = topVendidos.includes(prod.nombre)
                    const stockCritico = prod.stock > 0 && prod.stock <= 3

                    return (
                      <button key={prod.id} onClick={() => agregarAlCarrito(prod)} disabled={sinStock}
                        className="relative rounded-2xl text-left transition-all active:scale-95 overflow-hidden"
                        style={{
                          background: enCarrito ? col.bg : 'var(--bg-card)',
                          border: `2px solid ${enCarrito ? col.badge : sinStock ? 'var(--border)' : col.border}`,
                          opacity: sinStock ? 0.5 : 1,
                          cursor: sinStock ? 'not-allowed' : 'pointer',
                          boxShadow: enCarrito ? `0 4px 12px ${col.badge}30` : '0 1px 3px rgba(0,0,0,0.06)',
                        }}>

                        {/* Badge popular */}
                        {esMasPedida && !sinStock && (
                          <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold"
                            style={{ background: '#fbbf24', color: '#78350f' }}>
                            <Flame size={9} /> Popular
                          </div>
                        )}

                        {/* Badge stock crítico */}
                        {stockCritico && (
                          <div className="absolute top-1.5 right-1.5 z-10 px-1.5 py-0.5 rounded-full text-xs font-bold animate-pulse"
                            style={{ background: '#ef4444', color: '#fff' }}>
                            ¡{prod.stock}!
                          </div>
                        )}

                        {/* Cantidad en carrito */}
                        {enCarrito && (
                          <div className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: col.badge }}>
                            {enCarrito.cantidad}
                          </div>
                        )}

                        {/* Emoji grande */}
                        <div className="flex items-center justify-center pt-4 pb-1 text-4xl">
                          {prod.emoji || '🍺'}
                        </div>

                        {/* Info */}
                        <div className="px-2.5 pb-3">
                          <p className="text-xs font-bold leading-tight mb-0.5" style={{ color: col.text }}>
                            {prod.nombre}
                          </p>
                          {prod.descripcion && (
                            <p className="text-xs leading-tight mb-1.5 line-clamp-2" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                              {prod.descripcion}
                            </p>
                          )}
                          <p className="font-bold text-sm" style={{ color: col.badge }}>
                            ${Number(prod.precio).toLocaleString('es-CO')}
                          </p>
                        </div>

                        {/* Overlay agotado */}
                        {sinStock && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-2xl text-xs font-bold"
                            style={{ background: 'rgba(255,255,255,0.85)', color: '#ef4444' }}>
                            AGOTADO
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Combos si existen */}
          {combos.length > 0 && (categoriaActiva === 'Todos') && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="px-4 py-1.5 rounded-full text-xs font-bold tracking-wide text-white"
                  style={{ background: '#7c3aed' }}>
                  🎁 Combos Especiales
                </div>
                <div className="flex-1 h-px" style={{ background: '#d8b4fe' }} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {combos.map(combo => {
                  const enCarrito = carrito.find(i => i.es_combo && i.combo_id === combo.id)
                  return (
                    <button key={combo.id} onClick={() => agregarCombo(combo)}
                      className="relative rounded-2xl p-3 text-left transition-all active:scale-95"
                      style={{
                        background: enCarrito ? '#fdf4ff' : 'var(--bg-card)',
                        border: `2px solid ${enCarrito ? '#7c3aed' : '#d8b4fe'}`,
                        boxShadow: enCarrito ? '0 4px 12px #7c3aed30' : 'none',
                      }}>
                      <div className="text-3xl mb-1.5 text-center">{combo.icono || '🎁'}</div>
                      <p className="text-xs font-bold" style={{ color: '#4c1d95' }}>{combo.nombre}</p>
                      {combo.descripcion && <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{combo.descripcion}</p>}
                      <p className="font-bold text-sm mt-1" style={{ color: '#7c3aed' }}>${Number(combo.precio).toLocaleString('es-CO')}</p>
                      {enCarrito && (
                        <span className="absolute top-2 right-2 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold"
                          style={{ background: '#7c3aed' }}>{enCarrito.cantidad}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {Object.keys(grupos).length === 0 && (
            <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--text-dim)' }}>
              <span className="text-5xl mb-3">🍺</span>
              <p className="text-sm">No se encontraron productos</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Panel derecho: carrito ── */}
      <div className="w-full md:w-96 flex flex-col shrink-0"
        style={{ background: 'var(--bg-card)', borderLeft: '1px solid var(--border)', borderTop: '1px solid var(--border)' }}>

        {/* Barra de progreso */}
        <div className="px-4 pt-3">
          <div className="flex items-center gap-1">
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
          <h2 className="font-display text-base flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <ShoppingCart size={17} style={{ color: 'var(--primary)' }} />
            Pedido
            {carrito.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(244,98,42,0.12)', color: 'var(--primary)' }}>
                {carrito.reduce((s, i) => s + i.cantidad, 0)}
              </span>
            )}
          </h2>
          {carrito.length > 0 && (
            <button onClick={limpiarCarrito} className="text-xs flex items-center gap-1"
              style={{ color: 'var(--danger)' }}>
              <Trash2 size={12} /> Limpiar
            </button>
          )}
        </div>

        {/* Items del carrito */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {carrito.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12" style={{ color: 'var(--text-dim)' }}>
              <span className="text-5xl mb-3">🍺</span>
              <p className="text-sm">Toca una chelada para agregar</p>
            </div>
          ) : (
            carrito.map(item => (
              <div key={item.producto_id} className="flex items-center gap-2 rounded-xl p-2.5"
                style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
                <span className="text-xl shrink-0">{item.emoji || '🍺'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{item.nombre_producto}</p>
                  <p className="text-xs font-bold" style={{ color: 'var(--primary)' }}>${item.precio_unitario.toLocaleString('es-CO')}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => cambiarCantidad(item.producto_id, -1)}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all"
                    style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                    <Minus size={11} />
                  </button>
                  <span className="w-5 text-center text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{item.cantidad}</span>
                  <button onClick={() => cambiarCantidad(item.producto_id, 1)}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all"
                    style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                    <Plus size={11} />
                  </button>
                </div>
                <p className="text-xs font-bold w-14 text-right shrink-0" style={{ color: 'var(--text-primary)' }}>
                  ${(item.precio_unitario * item.cantidad).toLocaleString('es-CO')}
                </p>
                <button onClick={() => quitarItem(item.producto_id)} style={{ color: 'var(--text-dim)' }}>
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

          {/* Totales */}
          <div className="rounded-xl p-3 space-y-1.5" style={{ background: 'var(--bg-raised)' }}>
            <div className="flex justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
              <span>Subtotal</span><span>${subtotal.toLocaleString('es-CO')}</span>
            </div>
            {descuento > 0 && (
              <div className="flex justify-between text-sm" style={{ color: 'var(--success)' }}>
                <span>Descuento 🎉</span><span>-${descuento.toLocaleString('es-CO')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-1.5"
              style={{ borderTop: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              <span>Total</span>
              <span style={{ color: 'var(--primary)' }}>${total.toLocaleString('es-CO')}</span>
            </div>
          </div>

          {/* Método de pago */}
          <div className="grid grid-cols-3 gap-1.5">
            {METODOS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setMetodo(id)}
                className="flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium border-2 transition-all"
                style={{
                  borderColor: metodo === id ? 'var(--primary)' : 'var(--border)',
                  background: metodo === id ? 'rgba(244,98,42,0.08)' : 'transparent',
                  color: metodo === id ? 'var(--primary)' : 'var(--text-muted)'
                }}>
                <Icon size={16} />{label}
              </button>
            ))}
          </div>

          {/* Monto recibido */}
          {metodo === 'efectivo' && (
            <div>
              <input type="number" placeholder="Monto recibido" value={montoRecibido}
                onChange={e => setMontoRecibido(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              {cambio > 0 && (() => {
                const disponible = cajaActual?.efectivo_disponible ?? cajaActual?.monto_inicial ?? Infinity
                const sinFondos = cambio > disponible
                return (
                  <p className="text-sm font-bold mt-1.5 text-center rounded-lg py-1.5"
                    style={{ background: sinFondos ? 'var(--danger-bg)' : 'var(--success-bg)', color: sinFondos ? 'var(--danger)' : 'var(--success)' }}>
                    {sinFondos ? `⚠️ Sin fondos para $${cambio.toLocaleString('es-CO')}` : `💵 Cambio: $${cambio.toLocaleString('es-CO')}`}
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

          {/* Botón cobrar */}
          <button onClick={procesarVenta} disabled={!carrito.length || procesando}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-40 active:scale-95"
            style={{
              background: carrito.length ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'var(--bg-raised)',
              boxShadow: carrito.length && !procesando ? '0 4px 20px rgba(244,98,42,0.3)' : 'none'
            }}>
            {procesando ? '⏳ Procesando...' : carrito.length ? `✓ Cobrar $${total.toLocaleString('es-CO')}` : 'Selecciona una chelada'}
          </button>
        </div>
      </div>

      {/* ── Modal ticket ── */}
      {ticketData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:p-0">
          <div className="rounded-2xl w-full max-w-sm shadow-2xl fade-in flex flex-col max-h-[92vh]"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-5 py-3 shrink-0 print:hidden"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <CheckCircle size={18} style={{ color: 'var(--success)' }} />
                <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Venta completada</span>
              </div>
              <button onClick={() => setTicketData(null)} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>

            <div id="factura-print" className="overflow-y-auto">
              <div className="px-5 py-4 font-mono text-xs space-y-0" style={{ color: '#1a1a1a', background: '#fff' }}>
                <div className="text-center mb-3">
                  {config?.logo && <img src={config.logo} alt="logo" className="h-10 mx-auto mb-1 object-contain" />}
                  <p className="font-bold text-sm uppercase tracking-wide">{config?.nombre || 'ENJOY CHELADAS'}</p>
                  {config?.nit && <p>NIT: {config.nit}</p>}
                  {config?.direccion && <p>{config.direccion}</p>}
                  {config?.telefono && <p>Tel: {config.telefono}</p>}
                  <div className="border-t border-dashed border-gray-300 mt-2 pt-2">
                    <p className="font-bold text-xs">DOCUMENTO EQUIVALENTE POS</p>
                  </div>
                </div>
                <div className="border-t border-dashed border-gray-300 pt-2 pb-2 space-y-0.5">
                  {[['No.', ticketData.folio], ['Fecha', new Date().toLocaleString('es-CO', { dateStyle:'short', timeStyle:'short' })],
                    ['Cajero', ticketData.cajero || 'Administrador'], ['Cliente', ticketData.cliente_nombre || 'CONSUMIDOR FINAL'],
                    ['Pago', ticketData.metodo]].map(([k, v]) => (
                    <div key={k} className="flex justify-between"><span className="text-gray-500">{k}</span><span className="capitalize">{v}</span></div>
                  ))}
                </div>
                <div className="border-t border-dashed border-gray-300 pt-2 pb-2">
                  {ticketData.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between mb-1">
                      <span className="flex-1 truncate">{item.emoji || ''} {item.nombre_producto} x{item.cantidad}</span>
                      <span className="font-medium ml-2">${(item.precio_unitario * item.cantidad).toLocaleString('es-CO')}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-dashed border-gray-300 pt-2 pb-2 space-y-0.5">
                  <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>${ticketData.subtotal.toLocaleString('es-CO')}</span></div>
                  {ticketData.descuento > 0 && <div className="flex justify-between text-green-700"><span>Descuento</span><span>-${ticketData.descuento.toLocaleString('es-CO')}</span></div>}
                  <div className="flex justify-between font-bold text-sm border-t border-gray-300 pt-1 mt-1">
                    <span>TOTAL</span><span>${ticketData.total.toLocaleString('es-CO')}</span>
                  </div>
                  {ticketData.metodo === 'efectivo' && ticketData.cambio > 0 && (
                    <div className="flex justify-between font-semibold text-green-700">
                      <span>Cambio</span><span>${ticketData.cambio.toLocaleString('es-CO')}</span>
                    </div>
                  )}
                </div>
                <div className="border-t border-dashed border-gray-300 pt-2 text-center text-gray-400 space-y-0.5">
                  <p className="font-semibold text-gray-600">{ticketData.mensaje}</p>
                  <p className="text-gray-300 text-xs">— Enjoy Cheladas POS —</p>
                </div>
              </div>
            </div>

            <div className="p-4 flex gap-2 shrink-0 print:hidden" style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
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
