import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { ShoppingCart, CreditCard, Banknote, Smartphone, CheckCircle, X, Minus, Plus, Trash2, AlertTriangle, Search, ChevronRight, Check } from 'lucide-react'

const METODOS = [
  { id: 'efectivo',      label: 'Efectivo',      icon: Banknote },
  { id: 'tarjeta',       label: 'Tarjeta',        icon: CreditCard },
  { id: 'transferencia', label: 'Transferencia',  icon: Smartphone },
]

const MENSAJES = [
  '¡Gracias por tu preferencia! 🍺',
  '¡Que la disfrutes mucho! 🎉',
  '¡Vuelve pronto, te esperamos! ✨',
  '¡La mejor elección del día! 🌟',
]

// ── Configurador inline (embebido en el panel izquierdo) ─────────────────────
const PASOS = ['Sabor', 'Bebida', 'Adicion', 'Borde']

function ConfiguradorInline({ combos, onConfirmar, onCancelar }) {
  const [paso,    setPaso]    = useState(0)
  const [sabor,   setSabor]   = useState(null)
  const [bebida,  setBebida]  = useState(null)
  const [adicion, setAdicion] = useState(null)
  const [borde,   setBorde]   = useState(null)

  const cat1 = combos.filter(c => String(c.categoria) === '1')
  const cat2 = combos.filter(c => String(c.categoria) === '2')
  const cat3 = combos.filter(c => String(c.categoria) === '3')
  const cat4 = combos.filter(c => String(c.categoria) === '4')

  const opciones  = [cat1, cat2, cat3, cat4][paso]
  const seleccion = [sabor, bebida, adicion, borde][paso]
  const setters   = [setSabor, setBebida, setAdicion, setBorde]
  const esOpcional = paso === 2 || paso === 3

  const confirmar = () => {
    if (!sabor || !bebida) return
    const precio = (bebida.precio || 0) + (adicion ? (adicion.precio || 0) : 0)
    const nombre = sabor.nombre + ' - ' + bebida.nombre +
      (adicion ? ' + ' + adicion.nombre : '') +
      (borde   ? ' | Borde: ' + borde.nombre : '')
    onConfirmar({ nombre, precio, icono: sabor.icono || '🍓', sabor, bebida, adicion, borde })
  }

  const siguiente = () => {
    if (!esOpcional && !seleccion) return
    if (paso < 3) setPaso(paso + 1)
    else confirmar()
  }

  const saltarOpcional = () => {
    setters[paso](null)
    if (paso < 3) setPaso(paso + 1)
    else confirmar()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Indicador de pasos */}
      <div className="flex gap-2 mb-4">
        {PASOS.map((p, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full h-1.5 rounded-full"
              style={{ background: i <= paso ? 'var(--primary)' : 'var(--border)' }} />
            <span className="text-xs font-semibold"
              style={{ color: i === paso ? 'var(--primary)' : 'var(--text-dim)' }}>{p}</span>
          </div>
        ))}
      </div>

      {/* Opciones */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {opciones.length === 0 ? (
          <p className="text-center text-sm py-8" style={{ color: 'var(--text-dim)' }}>
            No hay opciones. Puedes saltarla.
          </p>
        ) : opciones.map(c => {
          const isSelected = seleccion?.id === c.id || seleccion?._id === c._id
          return (
            <button key={c.id || c._id} onClick={() => setters[paso](c)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all"
              style={{
                background: isSelected ? 'rgba(244,98,42,0.08)' : 'var(--bg-raised)',
                border: '2px solid ' + (isSelected ? 'var(--primary)' : 'var(--border)'),
              }}>
              <span className="text-2xl shrink-0">{c.icono || '🍹'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{c.nombre}</p>
                {c.precio > 0 && (
                  <p className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                    ${Number(c.precio).toLocaleString('es-CO')}
                  </p>
                )}
              </div>
              {isSelected && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'var(--primary)' }}>
                  <Check size={13} color="#fff" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Resumen parcial */}
      {(sabor || bebida) && (
        <div className="py-2 text-xs" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
          {[sabor?.nombre, bebida?.nombre, adicion?.nombre, borde?.nombre].filter(Boolean).join(' · ')}
          {(bebida || adicion) && (
            <span className="ml-2 font-bold" style={{ color: 'var(--primary)' }}>
              ${((bebida?.precio||0) + (adicion?.precio||0)).toLocaleString('es-CO')}
            </span>
          )}
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <button onClick={onCancelar}
          className="px-3 py-2.5 rounded-xl text-xs font-semibold"
          style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          Cancelar
        </button>
        {paso > 0 && (
          <button onClick={() => setPaso(paso - 1)}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Atras
          </button>
        )}
        {esOpcional && (
          <button onClick={saltarOpcional}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Saltar
          </button>
        )}
        <button onClick={siguiente}
          disabled={!esOpcional && !seleccion}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
          {paso === 3 ? 'Agregar al pedido' : 'Siguiente'}
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

export default function Ventas() {
  const [carrito, setCarrito]             = useState([])
  const [metodo, setMetodo]               = useState('efectivo')
  const [montoRecibido, setMontoRecibido] = useState('')
  const [descuento, setDescuento]         = useState(0)
  const [notas, setNotas]                 = useState('')
  const [nombreCliente, setNombreCliente] = useState('')
  const [docCliente, setDocCliente]       = useState('')
  const [procesando, setProcesando]       = useState(false)
  const [ticketData, setTicketData]       = useState(null)
  const [config, setConfig]               = useState({})
  const [cajaActual, setCajaActual]       = useState(null)
  const [error, setError]                 = useState('')
  const [inventario, setInventario]       = useState([])
  const [combos, setCombos]               = useState([])
  const [tab, setTab]                     = useState('combos')
  const [busqueda, setBusqueda]           = useState('')
  const [configurando, setConfigurando]   = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    api.getConfig().then(setConfig).catch(() => {})
    api.getCajaEstado().then(setCajaActual).catch(() => {})
    api.getProductos().then(setInventario).catch(() => {})
    api.getCombos().then(setCombos).catch(() => {})
  }, [])

  const recargar = () => {
    api.getProductos().then(setInventario).catch(() => {})
    api.getCombos().then(setCombos).catch(() => {})
    api.getCajaEstado().then(setCajaActual).catch(() => {})
  }

  const agregarProducto = (prod) => {
    setCarrito(prev => {
      const existe = prev.find(i => !i.es_combo && i.producto_id === prod.id)
      if (existe) return prev.map(i => i.producto_id === prod.id && !i.es_combo ? { ...i, cantidad: i.cantidad + 1 } : i)
      return [...prev, { _key: Date.now(), producto_id: prod.id, nombre: prod.nombre,
        precio_unitario: prod.precio || 0, costo_unitario: prod.costo || 0,
        cantidad: 1, es_combo: false, es_chelada: false, imagen: prod.imagen || null }]
    })
  }

  const agregarCombo = () => setConfigurando(true)

  const confirmarChelada = ({ nombre, precio, icono, sabor, bebida, adicion, borde }) => {
    setCarrito(prev => [...prev, {
      _key:            Date.now(),
      combo_id:        null,
      nombre,
      precio_unitario: precio,
      cantidad:        1,
      es_combo:        false,
      es_chelada:      true,
      icono,
      // Enviamos los IDs reales de los combos para que el servidor descuente sus items
      combos_ids: [
        sabor  ? (sabor.id  || sabor._id)  : null,
        bebida ? (bebida.id || bebida._id) : null,
        adicion ? (adicion.id || adicion._id) : null,
        borde  ? (borde.id  || borde._id)  : null,
      ].filter(Boolean),
      detalle: {
        sabor:     sabor    ? { id: sabor.id    || sabor._id,    nombre: sabor.nombre    } : null,
        bebida:    bebida   ? { id: bebida.id   || bebida._id,   nombre: bebida.nombre,  precio: bebida.precio  } : null,
        adiciones: adicion  ? [{ id: adicion.id || adicion._id,  nombre: adicion.nombre, precio: adicion.precio }] : [],
        borde:     borde    ? { id: borde.id    || borde._id,    nombre: borde.nombre    } : null,
      }
    }])
    setConfigurando(false)
  }

  const cambiarCantidad = (key, delta) => {
    setCarrito(prev => prev.map(i => {
      if (i._key !== key) return i
      const nueva = i.cantidad + delta
      if (nueva <= 0) return null
      return { ...i, cantidad: nueva }
    }).filter(Boolean))
  }

  const quitarItem = (key) => setCarrito(prev => prev.filter(i => i._key !== key))
  const limpiar = () => { setCarrito([]); setDescuento(0); setNotas(''); setMontoRecibido(''); setError(''); setNombreCliente(''); setDocCliente('') }

  const subtotal = carrito.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0)
  const total    = subtotal - descuento
  const cambio   = metodo === 'efectivo' && montoRecibido ? parseFloat(montoRecibido) - total : 0

  const procesarVenta = async () => {
    if (!carrito.length) return
    if (metodo === 'efectivo' && parseFloat(montoRecibido||0) < total) { setError('Monto insuficiente'); return }
    if (metodo === 'efectivo' && cambio > 0 && cambio > (cajaActual?.efectivo_disponible || 0)) {
      setError(`Saldo en caja insuficiente para dar cambio de $${cambio.toLocaleString('es-CO')}. Saldo disponible: $${(cajaActual?.efectivo_disponible||0).toLocaleString('es-CO')}`); return
    }
    const tieneCombo = carrito.some(i => i.es_combo || i.es_chelada)
    if (tieneCombo && !nombreCliente.trim()) { setError('El nombre del cliente es obligatorio para pedidos con combo'); return }
    setError(''); setProcesando(true)
    try {
      const result = await api.createVenta({
        items: carrito.map(({ _key, ...rest }) => rest),
        metodo_pago: metodo, monto_recibido: parseFloat(montoRecibido||total),
        descuento, notas,
        nombre_cliente: nombreCliente.trim() || null,
        doc_cliente: docCliente.trim() || null,
      })
      setTicketData({ ...result, items: carrito, metodo, descuento, subtotal, total, cambio,
        nombre_cliente: nombreCliente.trim() || null, doc_cliente: docCliente.trim() || null,
        iva_pct: config.iva || 0, iva_monto: config.iva ? Math.round(total * config.iva / 100) : 0,
        mensaje: MENSAJES[Math.floor(Math.random() * MENSAJES.length)] })
      limpiar(); recargar()
    } catch(err) { setError(err.message) }
    finally { setProcesando(false) }
  }

  const prodsFiltrados  = inventario.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
  const combosFiltrados = combos.filter(c => c.nombre?.toLowerCase().includes(busqueda.toLowerCase()))

  return (
    <div className="flex h-full flex-col md:flex-row" style={{ background:'var(--bg-base)' }}>

      {!cajaActual && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
          <div className="text-6xl">🔒</div>
          <div>
            <p className="font-bold text-xl" style={{ color:'var(--text-primary)' }}>Caja cerrada</p>
            <p className="text-sm mt-1" style={{ color:'var(--text-muted)' }}>Debes abrir la caja antes de realizar ventas</p>
          </div>
          <button onClick={() => navigate('/caja')}
            className="px-6 py-3 rounded-xl font-bold text-white text-sm"
            style={{ background:'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
            Ir a Caja →
          </button>
        </div>
      )}

      {cajaActual && (<>

      {/* ── Panel izquierdo: catálogo ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Búsqueda + tabs */}
        <div className="p-3 space-y-2 shrink-0" style={{ borderBottom:'1px solid var(--border)' }}>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:'var(--text-dim)' }}/>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar producto o combo..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background:'var(--bg-raised)', border:'1px solid var(--border)', color:'var(--text-primary)' }}/>
          </div>
          <div className="flex gap-2">
            {[
              { id:'combos',    label:'Arma tu Chelada', emoji:'🍹' },
              { id:'productos', label:'Productos',        emoji:'🛒' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5"
                style={{
                  background: tab === t.id ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'var(--bg-raised)',
                  color: tab === t.id ? '#fff' : 'var(--text-muted)',
                  border: `2px solid ${tab === t.id ? 'transparent' : 'var(--border)'}`,
                  boxShadow: tab === t.id ? '0 4px 12px rgba(244,98,42,0.25)' : 'none',
                }}>
                <span className="text-base">{t.emoji}</span> {t.label}
                {t.id === 'combos' && combos.length > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: tab === t.id ? 'rgba(255,255,255,0.25)' : 'rgba(244,98,42,0.12)', color: tab === t.id ? '#fff' : 'var(--primary)' }}>
                    {combos.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {tab === 'combos' && !configurando && (
            <div className="flex flex-col items-center justify-center h-full py-8 gap-4">
              <p className="text-6xl">🍹</p>
              <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Arma tu Chelada</p>
              <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                Elige sabor, bebida, adicion y borde paso a paso
              </p>
              <button onClick={agregarCombo}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-base product-card"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', boxShadow: '0 4px 20px rgba(244,98,42,0.3)' }}>
                <Plus size={20} /> Configurar Chelada
              </button>
            </div>
          )}

          {tab === 'combos' && configurando && (
            <ConfiguradorInline
              combos={combos}
              onConfirmar={confirmarChelada}
              onCancelar={() => setConfigurando(false)}
            />
          )}

          {tab === 'productos' && (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
              {prodsFiltrados.map(p => {
                const sinStock = p.stock <= 0
                return (
                  <button key={p.id} onClick={() => !sinStock && agregarProducto(p)} disabled={sinStock}
                    className="product-card ripple-container relative rounded-2xl overflow-hidden disabled:opacity-40"
                    style={{ aspectRatio:'1/1', background:'var(--bg-card)', border:'1px solid var(--border)', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                    {p.imagen
                      ? <img src={p.imagen} alt={p.nombre} className="absolute inset-0 w-full h-full object-cover"/>
                      : <div className="absolute inset-0 flex items-center justify-center text-4xl"
                          style={{ background:'rgba(244,98,42,0.07)' }}>
                          {p.emoji || '🛒'}
                        </div>
                    }
                    <div className="absolute bottom-0 left-0 right-0 p-2"
                      style={{ background:'linear-gradient(to top, var(--bg-card) 70%, transparent)' }}>
                      <p className="text-xs font-bold truncate" style={{ color:'var(--text-primary)' }}>{p.nombre}</p>
                      <p className="text-xs font-bold" style={{ color: sinStock ? 'var(--danger)' : 'var(--primary)' }}>
                        {sinStock ? 'Sin stock' : `$${Number(p.precio||0).toLocaleString('es-CO')}`}
                      </p>
                    </div>
                  </button>
                )
              })}
              {prodsFiltrados.length === 0 && (
                <div className="col-span-3 text-center py-16" style={{ color:'var(--text-dim)' }}>
                  <p className="text-4xl mb-2">📦</p><p className="text-sm">Sin productos</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Panel derecho: carrito + cobro ── */}
      <div className="w-full md:w-96 flex flex-col shrink-0"
        style={{ background:'var(--bg-card)', borderLeft:'1px solid var(--border)', borderTop:'1px solid var(--border)' }}>

        <div className="px-4 py-3 flex items-center justify-between shrink-0"
          style={{ borderBottom:'1px solid var(--border)' }}>
          <h2 className="font-bold text-base flex items-center gap-2" style={{ color:'var(--text-primary)' }}>
            <ShoppingCart size={17} style={{ color:'var(--primary)' }}/>
            Pedido {carrito.length > 0 && <span className="text-xs font-normal" style={{ color:'var(--text-muted)' }}>({carrito.reduce((s,i)=>s+i.cantidad,0)} items)</span>}
          </h2>
          {carrito.length > 0 && (
            <button onClick={limpiar} className="text-xs flex items-center gap-1" style={{ color:'var(--danger)' }}>
              <Trash2 size={12}/> Limpiar
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {carrito.length === 0 ? (
            <div className="text-center py-10" style={{ color:'var(--text-dim)' }}>
              <p className="text-4xl mb-2">🛒</p>
              <p className="text-sm">Selecciona productos del catálogo</p>
            </div>
          ) : carrito.map(item => (
            <div key={item._key} className="rounded-xl p-2.5 flex items-center gap-2"
              style={{ background:'var(--bg-raised)', border:'1px solid var(--border)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xl shrink-0"
                style={{ background:'rgba(244,98,42,0.1)' }}>
                {item.es_combo ? (combos.find(c=>c.id===item.combo_id)?.icono||'🎁') : (inventario.find(p=>p.id===item.producto_id)?.emoji||'🛒')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color:'var(--text-primary)' }}>{item.nombre}</p>
                <p className="text-xs font-bold" style={{ color:'var(--primary)' }}>
                  ${(item.precio_unitario * item.cantidad).toLocaleString('es-CO')}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => cambiarCantidad(item._key, -1)}
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
                  <Minus size={10}/>
                </button>
                <span className="w-5 text-center text-xs font-bold" style={{ color:'var(--text-primary)' }}>{item.cantidad}</span>
                <button onClick={() => cambiarCantidad(item._key, 1)}
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
                  <Plus size={10}/>
                </button>
                <button onClick={() => quitarItem(item._key)} className="ml-1" style={{ color:'var(--text-dim)' }}>
                  <X size={13}/>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Cobro */}
        <div className="p-3 space-y-3 shrink-0" style={{ borderTop:'1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <label className="text-xs w-24 shrink-0" style={{ color:'var(--text-muted)' }}>Descuento $</label>
            <input type="number" min="0" max={subtotal} value={descuento}
              onChange={e => setDescuento(Math.min(subtotal, parseFloat(e.target.value)||0))}
              className="flex-1 px-3 py-1.5 rounded-lg text-sm focus:outline-none"
              style={{ background:'var(--bg-raised)', border:'1px solid var(--border)', color:'var(--text-primary)' }}/>
          </div>

          <div className="rounded-xl p-3 space-y-1" style={{ background:'var(--bg-raised)' }}>
            <div className="flex justify-between text-sm" style={{ color:'var(--text-muted)' }}>
              <span>Subtotal</span><span>${subtotal.toLocaleString('es-CO')}</span>
            </div>
            {descuento > 0 && (
              <div className="flex justify-between text-sm" style={{ color:'var(--success)' }}>
                <span>Descuento</span><span>-${descuento.toLocaleString('es-CO')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-1"
              style={{ borderTop:'1px solid var(--border)', color:'var(--text-primary)' }}>
              <span>Total</span>
              <span style={{ color:'var(--primary)' }}>${total.toLocaleString('es-CO')}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {METODOS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setMetodo(id)}
                className="flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium border-2 transition-all"
                style={{
                  borderColor: metodo===id ? 'var(--primary)' : 'var(--border)',
                  background: metodo===id ? 'rgba(244,98,42,0.08)' : 'transparent',
                  color: metodo===id ? 'var(--primary)' : 'var(--text-muted)'
                }}>
                <Icon size={16}/>{label}
              </button>
            ))}
          </div>

          {metodo === 'efectivo' && (
            <div>
              <input type="number" placeholder="Monto recibido" value={montoRecibido}
                onChange={e => setMontoRecibido(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background:'var(--bg-raised)', border:'1px solid var(--border)', color:'var(--text-primary)' }}/>
              {cambio > 0 && cambio > (cajaActual?.efectivo_disponible || 0) && (
                <p className="text-xs font-bold mt-1.5 text-center rounded-lg py-1.5"
                  style={{ background:'var(--danger-bg)', color:'var(--danger)' }}>
                  ⚠️ Saldo en caja insuficiente para dar ${cambio.toLocaleString('es-CO')} de cambio
                </p>
              )}
              {cambio > 0 && cambio <= (cajaActual?.efectivo_disponible || 0) && (
                <p className="text-sm font-bold mt-1.5 text-center rounded-lg py-1.5"
                  style={{ background:'var(--success-bg)', color:'var(--success)' }}>
                  💵 Cambio: ${cambio.toLocaleString('es-CO')}
                </p>
              )}
            </div>
          )}

          <div className="rounded-xl p-3 space-y-2" style={{ background:'rgba(244,98,42,0.05)', border:'1px solid var(--border)' }}>
            <p className="text-xs font-bold" style={{ color:'var(--primary)' }}>
              👤 Cliente {carrito.some(i => i.es_combo || i.es_chelada) && <span style={{ color:'var(--danger)' }}>*</span>}
            </p>
            <input type="text" placeholder={carrito.some(i => i.es_combo || i.es_chelada) ? 'Nombre del cliente (requerido)' : 'Nombre del cliente'}
              value={nombreCliente}
              onChange={e => setNombreCliente(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none"
              style={{
                background:'var(--bg-raised)',
                border: `1px solid ${carrito.some(i => i.es_combo || i.es_chelada) && !nombreCliente.trim() ? 'var(--danger)' : 'var(--border)'}`,
                color:'var(--text-primary)'
              }}/>
            <input type="text" placeholder="Documento (opcional)" value={docCliente}
              onChange={e => setDocCliente(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none"
              style={{ background:'var(--bg-raised)', border:'1px solid var(--border)', color:'var(--text-primary)' }}/>
          </div>

          <input type="text" placeholder="Notas (opcional)" value={notas}
            onChange={e => setNotas(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none"
            style={{ background:'var(--bg-raised)', border:'1px solid var(--border)', color:'var(--text-primary)' }}/>

          {error && (
            <div className="text-xs px-3 py-2 rounded-xl flex items-center gap-2"
              style={{ background:'var(--danger-bg)', color:'var(--danger)', border:'1px solid var(--danger-border)' }}>
              <AlertTriangle size={13}/> {error}
            </div>
          )}

          <button onClick={procesarVenta} disabled={!carrito.length || procesando}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-40 active:scale-95"
            style={{
              background: carrito.length ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'var(--bg-raised)',
              boxShadow: carrito.length && !procesando ? '0 4px 20px rgba(244,98,42,0.3)' : 'none'
            }}>
            {procesando ? '⏳ Procesando...' : carrito.length ? `✓ Cobrar $${total.toLocaleString('es-CO')}` : 'Selecciona productos'}
          </button>
        </div>
      </div>

      {/* ── Ticket ── */}
      {ticketData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl w-full max-w-sm shadow-2xl flex flex-col max-h-[92vh]"
            style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-5 py-3 shrink-0"
              style={{ borderBottom:'1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <CheckCircle size={18} style={{ color:'var(--success)' }}/>
                <span className="font-bold text-sm" style={{ color:'var(--text-primary)' }}>Venta completada</span>
              </div>
              <button onClick={() => setTicketData(null)} style={{ color:'var(--text-muted)' }}><X size={18}/></button>
            </div>

            <div className="overflow-y-auto">
              <div id="factura-print" className="px-5 py-4 font-mono text-xs space-y-0" style={{ color:'#1a1a1a', background:'#fff' }}>
                <div className="text-center mb-3">
                  {config?.logo && <img src={config.logo} alt="logo" className="h-10 mx-auto mb-1 object-contain"/>}
                  <p className="font-bold text-sm uppercase tracking-wide">{config?.nombre||'ENJOY CHELADAS'}</p>
                  {config?.nit && <p>NIT: {config.nit}</p>}
                  {config?.direccion && <p>{config.direccion}</p>}
                  <div className="border-t border-dashed border-gray-300 mt-2 pt-2">
                    <p className="font-bold text-xs">DOCUMENTO EQUIVALENTE POS</p>
                  </div>
                </div>
                <div className="border-t border-dashed border-gray-300 pt-2 pb-2 space-y-0.5">
                  {[['No.', ticketData.folio],
                    ['Fecha', new Date().toLocaleString('es-CO',{dateStyle:'short',timeStyle:'short'})],
                    ['Pago', ticketData.metodo]].map(([k,v]) => (
                    <div key={k} className="flex justify-between"><span className="text-gray-500">{k}</span><span className="capitalize">{v}</span></div>
                  ))}
                  {ticketData.nombre_cliente && (
                    <div className="flex justify-between font-bold text-sm border-t border-dashed border-gray-200 pt-1 mt-1">
                      <span>Cliente</span><span>{ticketData.nombre_cliente}</span>
                    </div>
                  )}
                  {ticketData.doc_cliente && (
                    <div className="flex justify-between"><span className="text-gray-500">Doc.</span><span>{ticketData.doc_cliente}</span></div>
                  )}
                </div>
                <div className="border-t border-dashed border-gray-300 pt-2 pb-2">
                  {ticketData.items.map((item, idx) => (
                    <div key={idx} className="mb-1.5 flex justify-between">
                      <span className="font-semibold">
                        {item.icono && <span className="mr-1">{item.icono}</span>}
                        {item.cantidad > 1 ? `${item.cantidad}× ` : ''}{item.nombre}
                      </span>
                      <span>${(item.precio_unitario * item.cantidad).toLocaleString('es-CO')}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-dashed border-gray-300 pt-2 pb-2 space-y-0.5">
                  {ticketData.iva_pct > 0 ? (
                    <>
                      <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>${(ticketData.total - ticketData.iva_monto).toLocaleString('es-CO')}</span></div>
                      {ticketData.descuento > 0 && <div className="flex justify-between text-green-700"><span>Descuento</span><span>-${ticketData.descuento.toLocaleString('es-CO')}</span></div>}
                      <div className="flex justify-between text-gray-500"><span>IVA {ticketData.iva_pct}%</span><span>${ticketData.iva_monto.toLocaleString('es-CO')}</span></div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>${ticketData.subtotal.toLocaleString('es-CO')}</span></div>
                      {ticketData.descuento > 0 && <div className="flex justify-between text-green-700"><span>Descuento</span><span>-${ticketData.descuento.toLocaleString('es-CO')}</span></div>}
                    </>
                  )}
                  <div className="flex justify-between font-bold text-sm border-t border-gray-400 pt-1 mt-1">
                    <span>TOTAL</span><span>${ticketData.total.toLocaleString('es-CO')}</span>
                  </div>
                </div>
                <div className="border-t border-dashed border-gray-300 pt-2 pb-2 space-y-0.5">
                  <p className="text-center text-xs font-semibold text-gray-600 mb-1">Forma de Pago</p>
                  <div className="flex justify-between capitalize"><span>{ticketData.metodo}</span><span>${ticketData.total.toLocaleString('es-CO')}</span></div>
                  {ticketData.metodo === 'efectivo' && (
                    <div className="flex justify-between font-bold">
                      <span>Cambio</span><span>${(ticketData.cambio||0).toLocaleString('es-CO')}</span>
                    </div>
                  )}
                </div>
                <div className="border-t border-dashed border-gray-300 pt-2 text-center text-gray-400 space-y-0.5">
                  {ticketData.nombre_cliente && (
                    <div className="bg-orange-50 rounded-xl py-3 mb-2">
                      <p className="text-xs text-gray-500 mb-0.5">Llamar a:</p>
                      <p className="font-bold text-xl text-orange-600 uppercase tracking-wide">{ticketData.nombre_cliente}</p>
                      {ticketData.doc_cliente && <p className="text-xs text-gray-400">Doc: {ticketData.doc_cliente}</p>}
                    </div>
                  )}
                  <p className="font-semibold text-gray-600">{ticketData.mensaje}</p>
                  <p>— Enjoy Cheladas POS —</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 p-4 shrink-0" style={{ borderTop:'1px solid var(--border)' }}>
              <button onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                style={{ background:'var(--bg-raised)', color:'var(--text-muted)', border:'1px solid var(--border)' }}>
                🖨️ Imprimir
              </button>
              <button onClick={() => setTicketData(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background:'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
                Nueva venta
              </button>
            </div>
          </div>
        </div>
      )}
      </>)}
    </div>
  )
}
