import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Plus, Edit2, Trash2, X, Package, ChevronDown, Check } from 'lucide-react'

// ── Datos fijos de la carta ───────────────────────────────────────────────────
const SABORES = [
  'Frutos Amarillos','Sandía Hierbabuena','Pepino Limón Hierbabuena',
  'Frutos Verdes','Fresa Mandarina','Cereza Limón',
  'Maracuyá','Mango Biche','Coco','Lulo',
  'Tamarindo','Limón Hierbabuena','Frutos Rojos',
]

const BEBIDAS = [
  { nombre: 'Soda / Canada Dry 22oz · Frutas',          precio: 9000 },
  22oz · Limón Hierbabuena', precio: 8000 },
  { nombre: 'Soda / Canada Dry 16oz · Frutas',          precio: 8000 },
  { nombre: 'Hatsú 22oz · Frutas',                      precio: 10000 },
  { nombre: 'Hatsú 16oz · Frutas',                      precio: 9000 },
  { nombre: 'Smirnoff 16oz · Frutas',                   precio: 14000 },
]

const ADICIONES = [
  { nombre: 'Adición Fruta',          precio: 1500 },
  { nombre: 'Adición Gomitas',        precio: 1200 },
  { nombre: 'Frutos Rojos',           precio: 1800 },
  { nombre: 'Frutos Verdes',          precio: 1800 },
  { nombre: 'Adición Perlas Explosivas', precio: 2000 },
]

const BORDES = [
  'Sal Limón','Sal Pimienta','Sal Tajín','Azúcar','Azúcar Tajín',
]

const ICONOS = [
  '🍓','🍉','🥭','🍍','🍋','🍊','🍇','🍒','🍑','🥝','🫐','🍏',
  '🥥','🌿','🧊','🍹','🥤','🍺','🧃','🍸','🎁','✨','🌟','🔥','🎉',
]

const ic = {
  background: 'var(--bg-raised)', border: '1px solid var(--border)',
  color: 'var(--text-primary)', borderRadius: '10px',
 '14px', width: '100%',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => `$${Number(n).toLocaleString('es-CO')}`

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[94vh]"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
   "flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{title}</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>
        <div className="p-5 overflow-y-auto space-y-5">{children}</div>
      </div>
    </div>
  )
}


function ChipSelector({ label, required, items, selected, onToggle, multi = false, badge }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
          {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
        </label>
        {badge && (
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
         r: 'var(--primary)' }}>
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => {
          const key   = typeof item === 'string' ? item : item.nombre
          const price = typeof item === 'object' ? item.precio : null
          const isOn  = multi
            ? selected.some(s => (typeof s === 'string' ? s : s.nombre) === key)
            : selected === key
          return (
            <button key={i} type="button" onClick={() => onToggle(item)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: isOn ? 'var(--primary)' : 'var(--bg-raised)',
                color:      isOn ? '#fff'           : 'var(--text-secondary)',
                border:     `1.5px solid ${isOn ? 'var(--primary)' : 'var(--border)'}`,
              }}>
              {isOn && <Check size={11} />}
              {key}
            & (
                <span style={{ opacity: 0.85 }}>{fmt(price)}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Formulario ────────────────────────────────────────────────────────────────
function FormCombo({ initial, onSave, onClose }) {
  // Categoría 1 — Sabor (sin precio, selección única)
  const [sabor, setSabor] = useState(initial?.sabor || '')
  // Categoría 2 — Bebida (con precio, mínimo 2, multi)
  const [bebidas, setBebidas] = useState(initial?.bebidas || [])
  // Categoría 3 — Adición (con precio, opcional, multi)
  const [adiciones, setAdiciones] = useState(initial?.adiciones || [])
  // Categoría 4 — Borde (sin precio, selección única)
  const [borde, setBorde] = useState(initial?.borde || '')

  const [nombre, setNombre]   = useState(initial?.nombre || '')
  const [icono, setIcono]     = useState(initial?.icono  || '🍹')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]         = useState('')

  // Precio total = suma bebidas + suma adiciones
  const precioTotal = [
    ...bebidas.map(b => b.precio),
    ...adiciones.map(a => a.precio),
  ].reduce((s, p) => s + p, 0)

  const toggleBebida = (item) => {
    setBebidas(prev => {
      const existe = prev.find(b => b.nombre === item.nombre)
      return existe ? prev.filter(b => b.nombre !== item.nombre) : [...prev, item]
    })
  }

  const toggleAdicion = (item) => {
    setAdiciones(prev => {
      const existe = prev.find(a => a.nombre === item.nombre)
      return existe ? prev.filter(a => a.nombre !== item.nombre) : [...prev, item]
    })
  }

  const guardar = async () => {
    if (!sabor)              { setMsg('Selecciona un sabor (Categoría 1)'); return }
    if (bebidas.length < 2)  { setMsg('Selecciona mínimo 2 bebidas (Categoría 2)'); return }
    if (!nombre.trim())      { setMsg('Escribe el nombre del combo'); return }

    const items = [
      { nombre: sabor,       cantidad: 1, precio_unitario: 0,    categoria: 'sabor'   },
      ...bebidas.map(b  => ({ nombre:mbre,  cantidad: 1, precio_unitario: b.precio,  categoria: 'bebida'  })),
      ...adiciones.map(a => ({ nombre: a.nombre,  cantidad: 1, precio_unitario: a.precio,  categoria: 'adicion' })),
      ...(borde ? [{ nombre: borde, cantidad: 1, precio_unitario: 0, categoria: 'borde' }] : []),
    ]

    setLoading(true)
    try {
      await onSave({
        nombre: nombre.trim(),
        icono,
        precio: precioTotal,
        sabor, bebidas, adiciones, borde,
        items,
      })
    } catch (e) { setMsg(e.message) }
    finally { setLoading(false) }
  }

  return (
    <>
      {/* ── Icono ── */}
      <div>
        <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Icono</label>
        <div className="flex flex-wrap gap-2">
          {ICONOS.map(em => (
            <button key={em} type="button" onClick={() => setIcono(em)}
              className="w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all"
              style={{
                background: icono === em ? 'var(--primary)' : 'var(--bg-raised)',
                border: `2px solid ${icono === em ? 'var(--primary)' : 'var(--border)'}`,
                transform: icono === em ? 'scale(1.15)' : 'scale(1)',
              }}>{em}</button>
          ))}
        </div>
      </div>

      {/* ── Cat 1: Sabor (sin precio) ── */}
      <div className="rounded-2xl p-4 space-y-3"
        style={{ background: 'rgba(244,98,42,0.04)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'var(--primary)' }}>1</span>
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Sabor</span>
          <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Sin costo adicional</span>
        </div>
        <ChipSelector
          label="Elige el sabor"
          required
          items={SABORES}
ted={sabor}
          onToggle={(item) => setSabor(prev => prev === item ? '' : item)}
        />
      </div>

      {/* ── Cat 2: Bebida (con precio, mín 2) ── */}
      <div className="rounded-2xl p-4 space-y-3"
        style={{ background: 'rgba(37,99,235,0.04)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
 
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Bebida</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb' }}>
            Mínimo 2 · Con precio
          </span>
        </div>
        <ChipSelector
          label="Elige las bebidas"
          required
          items={BEBIDAS}
          selected={bebidas}
          onToggle={toggleBebida}
          multi
bidas.length > 0 ? `${bebidas.length} seleccionadas` : null}
        />
        {bebidas.length > 0 && bebidas.length < 2 && (
          <p className="text-xs" style={{ color: 'var(--danger)' }}>⚠️ Selecciona al menos 2 bebidas</p>
        )}
      </div>

      {/* ── Cat 3: Adición (con precio, opcional) ── */}
      <div className="rounded-2xl p-4 space-y-3"
        style={{ background: 'rgba(22,163,74,0.04)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: '#16a34a' }}>3</span>
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Adición</span>
          <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Opcional · Con precio</span>
        </div>
        <ChipSelector
          label="Elige adiciones"
          items={ADICIONES}
          selected={adiciones}
          onToggleAdicion}
          multi
          badge={adiciones.length > 0 ? `${adiciones.length} seleccionadas` : null}
        />
      </div>

      {/* ── Cat 4: Borde (sin precio) ── */}
      <div className="rounded-2xl p-4 space-y-3"
        style={{ background: 'rgba(124,58,237,0.04)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: '#7c3aed' }}>4</span>
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Borde</span>
          <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Opcional · Sin costo</span>
        </div>
        <ChipSelector
          label="Elige el borde"
          items={BORDES}
          selected={borde}
          onToggle={(item) => setBorde(prev => prev === item ? '' : item)}
        />
      </div>

      {/* ── Nombre del combo ── */}
      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
          Nombre del combo <span style={{ color: 'var(--danger)' }}>*</span>
        </label>
        <input value={nombre} onChange={e => setNombre(e.target.value)}
          placeholder="Ej: Chelada Fresa Mandarina 22oz"
          className="focus:outline-none" style={ic}
          onFocus={e => e.target.style.borderColor = 'rgba(244,98,42,0.5)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'} />
      </div>

      {/* ── Precio calculado ── */}
      {precioTotal > 0 && (
        <div className="rounded-xl px-4 py-3 flex items-center justify-between"
          style={{ background: 'rgba(244,98,42,0.06)', border: '1px solid rgba(244,98,42,0.2)' }}>
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Precio total del combo</p>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Bebidas {fmo,0))}
              {adiciones.length > 0 && ` + Adiciones ${fmt(adiciones.reduce((s,a)=>s+a.precio,0))}`}
            </p>
          </div>
          <p className="text-xl font-bold" style={{ color: 'var(--primary)' }}>{fmt(precioTotal)}</p>
        </div>
      )}

      {msg && (
        <p className="text-xs px-3 py-2 rounded-xl"
          style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>{msg}</p>
      )}

      <button onClick={guardar} disabled={loading}
        className=3 rounded-xl font-bold text-white text-sm disabled:opacity-40"
        style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
        {loading ? 'Guardando...' : 'Guardar combo'}
      </button>
    </>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function Combos() {
  const [combos, setCombos]       = useState([])
  const [busqueda, setBusqueda]   = useState('')
  const [modal, setModal]         = useState(null)
  const [seleccionado, setSeleccionado] = useState(null)

  const cargar = async () => {
    const c = await api.getCombos()
    setCombos(c)
  }

  useEffect(() => { cargar() }, [])

  const filtrados = combos.filter(c =>
    c.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const handleCrear  = async (data) => { await api.createCombo(data); await cargar(); setModal(null) }
  const ) }
  const eliminar     = async (id)   => {
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
   ick={() => { setSeleccionado(null); setModal('crear') }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
r} onClose={() => setModal(null)} />
        </Modal>
      )}

      {modal === 'editar' && seleccionado && (
        <Modal title={`Editar — ${seleccionado.nombre}`} onClose={() => setModal(null)}>
          <FormCombo initial={seleccionado} onSave={handleEditar} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
mbo.precio || 0)}
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
          <FormCombo onSave={handleCrea        </span>
              )}
            </div>

            <div className="flex items-center justify-between pt-2"
              style={{ borderTop: '1px dashed var(--border)' }}>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                <Package size={11} className="inline mr-1" />
                {(combo.items || []).length} items
              </span>
              <span className="text-base font-bold" style={{ color: 'var(--primary)' }}>
                {fmt(coey={i} className="px-2 py-0.5 rounded-full font-medium"
                      style={{ background: 'rgba(22,163,74,0.08)', color: '#16a34a' }}>
                      + {a.nombre}
                    </span>
                  ))}
                </div>
              )}
              {combo.borde && (
                <span className="inline-block px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'rgba(124,58,237,0.08)', color: '#7c3aed' }}>
                  Borde: {combo.borde}
        as.map((b,i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full font-medium"
                      style={{ background: 'rgba(37,99,235,0.08)', color: '#2563eb' }}>
                      🥤 {b.nombre.split('·')[0].trim()}
                    </span>
                  ))}
                </div>
              )}
              {combo.adiciones?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {combo.adiciones.map((a,i) => (
                    <span k          <button onClick={() => eliminar(combo.id || combo._id)}
                  className="p-1.5 rounded-lg" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Detalle por categoría */}
            <div className="space-y-1.5 mb-3 text-xs">
              {combo.bebidas?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {combo.bebidr && (
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>🍓 {combo.sabor}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0 ml-2">
                <button onClick={() => { setSeleccionado(combo); setModal('editar') }}
                  className="p-1.5 rounded-lg" style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }}>
                  <Edit2 size={13} />
                </button>
      -start justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl shrink-0"
                  style={{ background: 'rgba(244,98,42,0.1)' }}>
                  {combo.icono || '🍹'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{combo.nombre}</p>
                  {combo.sabo"w-full pl-4 pr-4 py-2 rounded-xl text-sm focus:outline-none"
          style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtrados.map(combo => (
          <div key={combo.id || combo._id} className="rounded-2xl p-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items          style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
          <Plus size={15} /> Nuevo combo
        </button>
      </div>

      {/* Buscador */}
      <div className="relative mb-4">
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar combo..."
          className=