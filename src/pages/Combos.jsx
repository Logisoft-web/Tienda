import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Plus, Edit2, Trash2, X, Search, Package } from 'lucide-react'

const ICONOS = [
  '🎁','🍹','🥤','🍺','🧃','🍸',
  '🍓','🍉','🥭','🍍','🍋','🍊','🍇','🍒','🍑','🥝',
  '🫐','🍏','🥥','🌿','🧊','🧂','🍬','✨','🌟','💥','🎯','⭐','🔥','🎉',
]

const ic = {
  background: 'var(--bg-raised)', border: '1px solid var(--border)',
  color: 'var(--text-primary)', borderRadius: '10px',
  padding: '8px 12px', fontSize: '14px', width: '100%'
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[92vh]"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{title}</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>
        <div className="p-5 overflow-y-auto space-y-4">{children}</div>
      </div>
    </div>
  )
}

function FormCombo({ initial, productos, onSave, onClose }) {
  const [nombre, setNombre] = useState(initial?.nombre || '')
  const [descripcion, setDescripcion] = useState(initial?.descripcion || '')
  const [precio, setPrecio] = useState(String(initial?.precio || ''))
  const [icono, setIcono] = useState(initial?.icono || '🎁')
  const [items, setItems] = useState(initial?.items || [])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const prodsFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const agregarProducto = (prod) => {
    setItems(prev => {
      const existe = prev.find(i => i.producto_id === prod.id)
      if (existe) return prev.map(i => i.producto_id === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i)
      return [...prev, { producto_id: prod.id, nombre: prod.nombre, cantidad: 1, precio_unitario: prod.precio || 0 }]
    })
  }

  const cambiarCantidad = (producto_id, delta) => {
    setItems(prev => prev.map(i => {
      if (i.producto_id !== producto_id) return i
      const nueva = i.cantidad + delta
      return nueva <= 0 ? null : { ...i, cantidad: nueva }
    }).filter(Boolean))
  }

  const quitarItem = (producto_id) => setItems(prev => prev.filter(i => i.producto_id !== producto_id))

  // Precio sugerido = suma de precios de los items
  const precioSugerido = items.reduce((s, i) => s + (i.precio_unitario * i.cantidad), 0)

  const guardar = async () => {
    if (!nombre.trim()) { setMsg('Nombre requerido'); return }
    if (!items.length) { setMsg('Agrega al menos un producto'); return }
    if (!precio || +precio <= 0) { setMsg('Precio requerido'); return }
    setLoading(true)
    try {
      await onSave({ nombre: nombre.trim(), descripcion, precio: +precio, items, icono })
    } catch (e) { setMsg(e.message) }
    finally { setLoading(false) }
  }

  return (
    <>
      {/* Icono */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Icono</label>
        <div className="flex flex-wrap gap-2">
          {ICONOS.map(em => (
            <button key={em} type="button" onClick={() => setIcono(em)}
              className="w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all"
              style={{
                background: icono === em ? 'var(--primary)' : 'var(--bg-raised)',
                border: `2px solid ${icono === em ? 'var(--primary)' : 'var(--border)'}`,
                transform: icono === em ? 'scale(1.15)' : 'scale(1)'
              }}>{em}</button>
          ))}
        </div>
      </div>

      {/* Nombre */}
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Nombre <span style={{ color: 'var(--danger)' }}>*</span></label>
        <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Combo Chelada + Snack"
          className="focus:outline-none" style={ic}
          onFocus={e => e.target.style.borderColor = 'rgba(244,98,42,0.5)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'} />
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Descripción</label>
        <input value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Opcional"
          className="focus:outline-none" style={ic}
          onFocus={e => e.target.style.borderColor = 'rgba(244,98,42,0.5)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'} />
      </div>

      {/* Productos del combo */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
          Productos del combo <span style={{ color: 'var(--danger)' }}>*</span>
        </label>

        {/* Items seleccionados */}
        {items.length > 0 && (
          <div className="rounded-xl p-3 mb-3 space-y-2"
            style={{ background: 'rgba(244,98,42,0.05)', border: '1px solid var(--border)' }}>
            {items.map(item => (
              <div key={item.producto_id} className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium truncate flex-1" style={{ color: 'var(--text-primary)' }}>
                  {item.nombre}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => cambiarCantidad(item.producto_id, -1)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>−</button>
                  <span className="w-6 text-center text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{item.cantidad}</span>
                  <button onClick={() => cambiarCantidad(item.producto_id, 1)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>+</button>
                  <button onClick={() => quitarItem(item.producto_id)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center ml-1"
                    style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Buscador de productos */}
        <div className="relative mb-2">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-dim)' }} />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar producto..."
            className="w-full pl-8 pr-3 py-2 rounded-xl text-sm focus:outline-none"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
        </div>
        <div className="max-h-40 overflow-y-auto rounded-xl space-y-1"
          style={{ border: '1px solid var(--border)' }}>
          {prodsFiltrados.length === 0
            ? <p className="text-xs text-center py-4" style={{ color: 'var(--text-dim)' }}>Sin resultados</p>
            : prodsFiltrados.map(p => (
              <button key={p.id} type="button" onClick={() => agregarProducto(p)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:opacity-80 transition-opacity"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{p.nombre}</span>
                <span className="text-xs font-bold" style={{ color: 'var(--success)' }}>
                  ${Number(p.precio || 0).toLocaleString('es-CO')}
                </span>
              </button>
            ))
          }
        </div>
      </div>

      {/* Precio */}
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
          Precio del combo <span style={{ color: 'var(--danger)' }}>*</span>
        </label>
        <input type="number" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="0"
          className="focus:outline-none" style={ic}
          onFocus={e => e.target.style.borderColor = 'rgba(244,98,42,0.5)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        {precioSugerido > 0 && (
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Suma de productos: <strong>${precioSugerido.toLocaleString('es-CO')}</strong>
            </p>
            <button type="button" onClick={() => setPrecio(String(precioSugerido))}
              className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
              Usar este precio
            </button>
          </div>
        )}
      </div>

      {msg && <p className="text-xs px-3 py-2 rounded-xl" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>{msg}</p>}

      <button onClick={guardar} disabled={loading}
        className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-40"
        style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
        {loading ? 'Guardando...' : 'Guardar combo'}
      </button>
    </>
  )
}

export default function Combos() {
  const [combos, setCombos] = useState([])
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(null) // 'crear' | 'editar'
  const [seleccionado, setSeleccionado] = useState(null)

  const cargar = async () => {
    const [c, p] = await Promise.all([api.getCombos(), api.getProductos()])
    setCombos(c)
    setProductos(p)
  }

  useEffect(() => { cargar() }, [])

  const filtrados = combos.filter(c =>
    c.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const handleCrear = async (data) => { await api.createCombo(data); await cargar(); setModal(null) }
  const handleEditar = async (data) => { await api.updateCombo(seleccionado.id || seleccionado._id, data); await cargar(); setModal(null) }
  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este combo?')) return
    await api.deleteCombo(id); cargar()
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Combos</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{combos.length} combos registrados</p>
        </div>
        <button onClick={() => { setSeleccionado(null); setModal('crear') }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
          <Plus size={15} /> Nuevo combo
        </button>
      </div>

      {/* Buscador */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-dim)' }} />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar combo..."
          className="w-full pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none"
          style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
      </div>

      {/* Grid de combos */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtrados.map(combo => (
          <div key={combo.id || combo._id} className="rounded-2xl p-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl shrink-0"
                  style={{ background: 'rgba(244,98,42,0.1)' }}>
                  {combo.icono || '🎁'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{combo.nombre}</p>
                  {combo.descripcion && (
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{combo.descripcion}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0 ml-2">
                <button onClick={() => { setSeleccionado(combo); setModal('editar') }}
                  className="p-1.5 rounded-lg" style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }}>
                  <Edit2 size={13} />
                </button>
                <button onClick={() => eliminar(combo.id || combo._id)}
                  className="p-1.5 rounded-lg" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Items del combo */}
            <div className="space-y-1 mb-3">
              {(combo.items || []).map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{item.cantidad}×</span> {item.nombre}
                  </span>
                  <span style={{ color: 'var(--text-dim)' }}>${Number(item.precio_unitario * item.cantidad).toLocaleString('es-CO')}</span>
                </div>
              ))}
            </div>

            {/* Precio */}
            <div className="flex items-center justify-between pt-2"
              style={{ borderTop: '1px dashed var(--border)' }}>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                <Package size={11} className="inline mr-1" />{(combo.items || []).reduce((s, i) => s + i.cantidad, 0)} productos
              </span>
              <span className="text-base font-bold" style={{ color: 'var(--primary)' }}>
                ${Number(combo.precio).toLocaleString('es-CO')}
              </span>
            </div>
          </div>
        ))}

        {filtrados.length === 0 && (
          <div className="col-span-3 text-center py-16" style={{ color: 'var(--text-dim)' }}>
            <p className="text-5xl mb-2">🍹</p>
            <p className="text-sm">Sin combos — crea el primero</p>
          </div>
        )}
      </div>

      {modal === 'crear' && (
        <Modal title="Nuevo combo" onClose={() => setModal(null)}>
          <FormCombo productos={productos} onSave={handleCrear} onClose={() => setModal(null)} />
        </Modal>
      )}

      {modal === 'editar' && seleccionado && (
        <Modal title={`Editar — ${seleccionado.nombre}`} onClose={() => setModal(null)}>
          <FormCombo
            initial={seleccionado}
            productos={productos}
            onSave={handleEditar}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  )
}
