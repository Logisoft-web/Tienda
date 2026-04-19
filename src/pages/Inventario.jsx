import { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'
import { Plus, Edit2, Trash2, Package, AlertTriangle, Search, X, Upload } from 'lucide-react'
import { SABORES, BEBIDAS, ADICIONES, BORDES } from '../components/CheladaConfigurator'

// ── TIPOS ─────────────────────────────────────────────────────────────────────
const TIPOS = [
  { value: 'sabor',   label: 'Sabor / Fruta',  emoji: '🍓', desc: 'Frutas e ingredientes de sabor',  color: '#ea580c' },
  { value: 'bebida',  label: 'Bebida',          emoji: '🥤', desc: 'Soda, Canada Dry, Hatsu, Smirnoff', color: '#16a34a' },
  { value: 'objeto',  label: 'Objeto',          emoji: '📦', desc: 'Vasos, pitillos, bolsas, empaques', color: '#7c3aed' },
  { value: 'adicion', label: 'Adición',         emoji: '🍬', desc: 'Dulces, gomitas, frutos extras',   color: '#ca8a04' },
  { value: 'borde',   label: 'Borde',           emoji: '🧂', desc: 'Sal, azúcar, tajín, condimentos',  color: '#0891b2' },
]

const UNIDADES = {
  sabor:   [{ value:'gramo', label:'Gramo (g)' }, { value:'libra', label:'Libra (500g)' }, { value:'kilogramo', label:'Kilogramo (kg)' }],
  bebida:  [{ value:'unidad', label:'Unidad (und)' }],
  objeto:  [{ value:'unidad', label:'Unidad (und)' }, { value:'docena', label:'Docena (12)' }, { value:'media_docena', label:'Media docena (6)' }],
  adicion: [{ value:'gramo', label:'Gramo (g)' }, { value:'unidad', label:'Unidad (und)' }],
  borde:   [{ value:'gramo', label:'Gramo (g)' }, { value:'unidad', label:'Unidad (und)' }],
}

const genCodigo = () => `PRD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2,5).toUpperCase()}`

const empty = {
  nombre:'', codigo:'', proveedor:'', costo:'0', stock:'0', stock_minimo:'5',
  tipo:'sabor', unidad:'gramo', porcion_venta:100, descripcion:'', imagen:null,
  fecha_vencimiento:'', sabores_enlazados:[], bebidas_enlazadas:[], adiciones_enlazadas:[], bordes_enlazados:[],
}

const ic = { background:'var(--bg-raised)', border:'1px solid var(--border)', color:'var(--text-primary)', borderRadius:'10px', padding:'8px 12px', fontSize:'14px', width:'100%' }

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color:'var(--text-muted)' }}>
        {label}{required && <span style={{ color:'var(--danger)' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

function InputField({ value, onChange, placeholder, type='text', readOnly=false }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly}
      className="focus:outline-none w-full"
      style={{ ...ic, opacity: readOnly ? 0.6 : 1 }}
      onFocus={e => e.target.style.borderColor = 'rgba(244,98,42,0.5)'}
      onBlur={e => e.target.style.borderColor = 'var(--border)'} />
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]"
        style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom:'1px solid var(--border)' }}>
          <h3 className="font-bold text-base" style={{ color:'var(--text-primary)' }}>{title}</h3>
          <button onClick={onClose} style={{ color:'var(--text-muted)' }}><X size={20}/></button>
        </div>
        <div className="p-5 overflow-y-auto space-y-3">{children}</div>
      </div>
    </div>
  )
}

// ── BADGE DE TIPO ─────────────────────────────────────────────────────────────
function TipoBadge({ tipo }) {
  const t = TIPOS.find(x => x.value === tipo) || TIPOS[0]
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ background: t.color + '20', color: t.color }}>
      {t.emoji} {t.label}
    </span>
  )
}

// ── FORMULARIO DE PRODUCTO ────────────────────────────────────────────────────
function FormProducto({ initial, onSave, onClose }) {
  const [form, setForm] = useState({ ...empty, codigo: genCodigo(), ...initial })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef()
  const tipo = TIPOS.find(t => t.value === form.tipo)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleArr = (k, id) => setForm(f => ({
    ...f, [k]: f[k].includes(id) ? f[k].filter(x => x !== id) : [...f[k], id]
  }))

  const gramsPerUnit = form.unidad === 'libra' ? 500 : form.unidad === 'kilogramo' ? 1000 : 1
  const esGramos = form.tipo === 'sabor' || (form.tipo === 'adicion' && form.unidad === 'gramo') || (form.tipo === 'borde' && form.unidad === 'gramo')

  const handleImagen = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 3*1024*1024) { setMsg('Imagen max 3MB'); return }
    const reader = new FileReader()
    reader.onload = ev => set('imagen', ev.target.result)
    reader.readAsDataURL(file)
  }

  const guardar = async () => {
    if (!form.nombre.trim()) { setMsg('Nombre requerido'); return }
    setLoading(true)
    try {
      await onSave({
        ...form,
        costo: +(form.costo||0),
        stock: +(form.stock||0),
        stock_minimo: +(form.stock_minimo||5),
        porcion_venta: +(form.porcion_venta||100),
        bordes_enlazados: form.bordes_enlazados||[],
      })
    } catch(e) { setMsg(e.message) }
    finally { setLoading(false) }
  }

  return (
    <>
      {/* Tipo */}
      <Field label="Tipo" required>
        <div className="grid grid-cols-2 gap-2">
          {TIPOS.map(t => (
            <button key={t.value} type="button"
              onClick={() => setForm(f => ({ ...f, tipo: t.value, unidad: UNIDADES[t.value][0].value }))}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all"
              style={{
                borderColor: form.tipo === t.value ? t.color : 'var(--border)',
                background: form.tipo === t.value ? t.color + '12' : 'var(--bg-raised)',
              }}>
              <span className="text-xl">{t.emoji}</span>
              <div>
                <p className="text-xs font-bold" style={{ color: form.tipo === t.value ? t.color : 'var(--text-primary)' }}>{t.label}</p>
                <p style={{ color:'var(--text-dim)', fontSize:'10px' }}>{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </Field>

      {/* Nombre + código */}
      <Field label="Nombre" required>
        <InputField value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder={`Ej: ${tipo?.emoji} Fresa`} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Código (auto)">
          <div className="flex gap-1">
            <InputField value={form.codigo} readOnly />
            <button type="button" onClick={() => set('codigo', genCodigo())}
              className="px-2.5 rounded-xl text-xs shrink-0"
              style={{ background:'var(--bg-raised)', border:'1px solid var(--border)', color:'var(--text-muted)' }}>↻</button>
          </div>
        </Field>
        <Field label="Proveedor">
          <InputField value={form.proveedor} onChange={e => set('proveedor', e.target.value)} placeholder="Opcional" />
        </Field>
      </div>

      {/* Costo + unidad */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Costo unitario">
          <InputField type="number" value={form.costo} onChange={e => set('costo', e.target.value)} />
        </Field>
        <Field label="Unidad">
          <select value={form.unidad} onChange={e => set('unidad', e.target.value)}
            className="focus:outline-none w-full rounded-xl text-sm appearance-none" style={{ ...ic }}>
            {(UNIDADES[form.tipo]||[]).map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
        </Field>
      </div>

      {/* Porción de venta — sabor y adicion en gramos */}
      {esGramos && (() => {
        const esAdicionOBorde = form.tipo === 'adicion' || form.tipo === 'borde'
        const sliderMin  = esAdicionOBorde ? 1  : 10
        const sliderMax  = esAdicionOBorde ? 50 : 500
        const sliderStep = esAdicionOBorde ? 1  : 5
        const porcionDefault = esAdicionOBorde ? 10 : 100
        const botonesRapidos = esAdicionOBorde ? [5, 10, 15, 20, 30] : [25, 50, 100, 150, 200]
        const porcion = form.porcion_venta || porcionDefault
        return (
          <div className="rounded-xl p-3 space-y-2" style={{ background:'rgba(244,98,42,0.05)', border:'1px solid var(--border)' }}>
            <p className="text-xs font-bold" style={{ color:'var(--primary)' }}>⚖️ Porción por chelada</p>
            <p className="text-xs" style={{ color:'var(--text-muted)' }}>
              {esAdicionOBorde ? '¿Cuántos gramos se usan por chelada? (adiciones: 5–15g aprox.)' : '¿Cuántos gramos se usan por chelada?'}
            </p>
            <div className="flex items-center gap-2">
              <input type="range" min={sliderMin} max={sliderMax} step={sliderStep} value={porcion}
                onChange={e => set('porcion_venta', +e.target.value)}
                className="flex-1 accent-orange-500" />
              <div className="w-16 text-center px-2 py-1.5 rounded-lg font-bold text-sm"
                style={{ background:'var(--bg-raised)', border:'1px solid var(--border)', color:'var(--primary)' }}>
                {porcion}g
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {botonesRapidos.map(g => (
                <button key={g} type="button" onClick={() => set('porcion_venta', g)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: porcion === g ? 'var(--primary)' : 'var(--bg-raised)',
                    color: porcion === g ? '#fff' : 'var(--text-muted)',
                    border:'1px solid var(--border)'
                  }}>{g}g</button>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Fecha vencimiento — sabor y adicion */}
      {(form.tipo === 'sabor' || form.tipo === 'adicion') && (
        <Field label="📅 Fecha de vencimiento">
          <InputField type="date" value={form.fecha_vencimiento}
            onChange={e => set('fecha_vencimiento', e.target.value)}
            min={new Date().toISOString().slice(0,10)} />
          {form.fecha_vencimiento && (() => {
            const dias = Math.ceil((new Date(form.fecha_vencimiento) - new Date()) / 86400000)
            const color = dias <= 0 ? 'var(--danger)' : dias <= 3 ? 'var(--danger)' : dias <= 7 ? '#f59e0b' : 'var(--success)'
            return <p className="text-xs mt-1 font-semibold" style={{ color }}>{dias <= 0 ? '⚠️ Vencido' : `Vence en ${dias} día${dias!==1?'s':''}`}</p>
          })()}
        </Field>
      )}

      {/* Enlace a sabores — tipo sabor */}
      {form.tipo === 'sabor' && (
        <div className="rounded-xl p-3 space-y-2" style={{ background:'rgba(234,88,12,0.05)', border:'1px solid var(--border)' }}>
          <p className="text-xs font-bold" style={{ color:'#ea580c' }}>🔗 Enlazar a sabores del configurador</p>
          <p className="text-xs" style={{ color:'var(--text-muted)' }}>Al vender este sabor se descuenta el stock de esta fruta.</p>
          <div className="grid grid-cols-2 gap-1.5">
            {SABORES.map(s => {
              const sel = form.sabores_enlazados.includes(s.id)
              return (
                <button key={s.id} type="button" onClick={() => toggleArr('sabores_enlazados', s.id)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-all"
                  style={{
                    background: sel ? 'rgba(234,88,12,0.15)' : 'var(--bg-raised)',
                    border: `1.5px solid ${sel ? '#ea580c' : 'var(--border)'}`,
                    color: sel ? '#ea580c' : 'var(--text-muted)',
                  }}>
                  <span>{s.emoji}</span><span className="truncate">{s.nombre}</span>
                </button>
              )
            })}
          </div>
          {form.sabores_enlazados.length > 0 && (
            <p className="text-xs font-semibold" style={{ color:'var(--success)' }}>✓ {form.sabores_enlazados.length} enlazado{form.sabores_enlazados.length!==1?'s':''}</p>
          )}
        </div>
      )}

      {/* Enlace a adiciones — tipo adicion */}
      {form.tipo === 'adicion' && (
        <div className="rounded-xl p-3 space-y-2" style={{ background:'rgba(202,138,4,0.05)', border:'1px solid var(--border)' }}>
          <p className="text-xs font-bold" style={{ color:'#ca8a04' }}>🔗 Enlazar a adiciones del configurador</p>
          <p className="text-xs" style={{ color:'var(--text-muted)' }}>Al vender esta adición se descuenta el stock de este ingrediente.</p>
          <div className="space-y-1.5">
            {ADICIONES.map(ad => {
              const sel = form.adiciones_enlazadas.includes(ad.id)
              return (
                <button key={ad.id} type="button" onClick={() => toggleArr('adiciones_enlazadas', ad.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-left transition-all"
                  style={{
                    background: sel ? 'rgba(202,138,4,0.12)' : 'var(--bg-raised)',
                    border: `1.5px solid ${sel ? '#ca8a04' : 'var(--border)'}`,
                    color: sel ? '#ca8a04' : 'var(--text-muted)',
                  }}>
                  <span className="text-base">{ad.emoji}</span>
                  <span className="flex-1">{ad.nombre}</span>
                  <span style={{ color:'var(--text-dim)' }}>+${ad.precio.toLocaleString('es-CO')}</span>
                  {sel && <span>✓</span>}
                </button>
              )
            })}
          </div>
          {form.adiciones_enlazadas.length > 0 && (
            <p className="text-xs font-semibold" style={{ color:'var(--success)' }}>✓ {form.adiciones_enlazadas.length} enlazada{form.adiciones_enlazadas.length!==1?'s':''}</p>
          )}
        </div>
      )}

      {/* Enlace a bordes — tipo borde */}
      {form.tipo === 'borde' && (
        <div className="rounded-xl p-3 space-y-2" style={{ background:'rgba(8,145,178,0.05)', border:'1px solid var(--border)' }}>
          <p className="text-xs font-bold" style={{ color:'#0891b2' }}>🔗 Enlazar a bordes del configurador</p>
          <p className="text-xs" style={{ color:'var(--text-muted)' }}>Al vender este borde se descuenta el stock de este ingrediente.</p>
          <div className="grid grid-cols-2 gap-1.5">
            {BORDES.map(b => {
              const sel = (form.bordes_enlazados||[]).includes(b.id)
              return (
                <button key={b.id} type="button" onClick={() => toggleArr('bordes_enlazados', b.id)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-all"
                  style={{
                    background: sel ? 'rgba(8,145,178,0.15)' : 'var(--bg-raised)',
                    border: `1.5px solid ${sel ? '#0891b2' : 'var(--border)'}`,
                    color: sel ? '#0891b2' : 'var(--text-muted)',
                  }}>
                  <span>{b.emoji}</span><span className="truncate">{b.nombre}</span>
                  {sel && <span className="ml-auto">✓</span>}
                </button>
              )
            })}
          </div>
          {(form.bordes_enlazados||[]).length > 0 && (
            <p className="text-xs font-semibold" style={{ color:'var(--success)' }}>✓ {form.bordes_enlazados.length} enlazado{form.bordes_enlazados.length!==1?'s':''}</p>
          )}
        </div>
      )}

      {/* Enlace a bebidas — tipo bebida u objeto */}
      {(form.tipo === 'bebida' || form.tipo === 'objeto') && (
        <div className="rounded-xl p-3 space-y-2" style={{ background:'rgba(124,58,237,0.05)', border:'1px solid var(--border)' }}>
          <p className="text-xs font-bold" style={{ color:'#7c3aed' }}>🔗 Enlazar a bebidas del configurador</p>
          <p className="text-xs" style={{ color:'var(--text-muted)' }}>Al vender esta bebida/tamaño se descuenta 1 unidad de este producto.</p>
          <div className="space-y-1.5">
            {BEBIDAS.map(b => {
              const sel = form.bebidas_enlazadas.includes(b.id)
              return (
                <button key={b.id} type="button" onClick={() => toggleArr('bebidas_enlazadas', b.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-left transition-all"
                  style={{
                    background: sel ? 'rgba(124,58,237,0.12)' : 'var(--bg-raised)',
                    border: `1.5px solid ${sel ? '#7c3aed' : 'var(--border)'}`,
                    color: sel ? '#7c3aed' : 'var(--text-muted)',
                  }}>
                  <span className="text-base">{b.emoji}</span>
                  <span className="flex-1">{b.nombre} {b.oz}</span>
                  {sel && <span>✓</span>}
                </button>
              )
            })}
          </div>
          {form.bebidas_enlazadas.length > 0 && (
            <p className="text-xs font-semibold" style={{ color:'var(--success)' }}>✓ {form.bebidas_enlazadas.length} enlazada{form.bebidas_enlazadas.length!==1?'s':''}</p>
          )}
        </div>
      )}

      {/* Stock */}
      <div className="grid grid-cols-2 gap-3">
        <Field label={esGramos ? 'Stock inicial (gramos)' : 'Stock inicial'}>
          <InputField type="number" value={form.stock} onChange={e => set('stock', e.target.value)} />
          {esGramos && +form.stock > 0 && (
            <p className="text-xs mt-1" style={{ color:'var(--text-muted)' }}>
              {+form.stock >= 1000 ? `${(+form.stock/1000).toFixed(2)}kg` : `${form.stock}g`}
              {' · '}{Math.floor(+form.stock / (form.porcion_venta||100))} porciones
            </p>
          )}
        </Field>
        <Field label={esGramos ? 'Stock mínimo (gramos)' : 'Stock mínimo'}>
          <InputField type="number" value={form.stock_minimo} onChange={e => set('stock_minimo', e.target.value)} />
        </Field>
      </div>

      {/* Convertidor libras/kg → gramos */}
      {esGramos && form.unidad !== 'gramo' && (
        <div className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background:'rgba(244,98,42,0.06)', border:'1px solid var(--border)' }}>
          <span className="text-xs font-semibold shrink-0" style={{ color:'var(--text-muted)' }}>
            Cantidad en {form.unidad === 'libra' ? 'libras' : 'kilos'}:
          </span>
          <input type="number" min="0" step="0.5" placeholder="0"
            className="w-20 px-2 py-1.5 rounded-lg text-sm font-bold text-center focus:outline-none"
            style={{ background:'var(--bg-card)', border:'2px solid var(--primary)', color:'var(--primary)' }}
            onChange={e => set('stock', String(Math.round(+e.target.value * gramsPerUnit)))} />
          <span className="text-xs" style={{ color:'var(--text-dim)' }}>→</span>
          <span className="text-sm font-bold" style={{ color:'var(--success)' }}>{form.stock||0}g</span>
        </div>
      )}

      {/* Imagen */}
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color:'var(--text-muted)' }}>Imagen</label>
        <div onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer"
          style={{ borderColor:'var(--border)' }}>
          {form.imagen
            ? <img src={form.imagen} alt="" className="h-20 mx-auto object-contain rounded-xl" />
            : <div className="flex flex-col items-center gap-1" style={{ color:'var(--text-dim)' }}>
                <Upload size={20} /><p className="text-xs">Subir imagen</p>
              </div>
          }
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagen} />
        {form.imagen && (
          <button type="button" onClick={() => set('imagen', null)}
            className="text-xs mt-1" style={{ color:'var(--danger)' }}>Quitar imagen</button>
        )}
      </div>

      {msg && <p className="text-xs px-3 py-2 rounded-xl" style={{ background:'var(--danger-bg)', color:'var(--danger)' }}>{msg}</p>}

      <button onClick={guardar} disabled={loading}
        className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-40"
        style={{ background:'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
        {loading ? 'Guardando...' : 'Guardar'}
      </button>
    </>
  )
}

// ── PÁGINA PRINCIPAL ──────────────────────────────────────────────────────────
export default function Inventario() {
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [modal, setModal] = useState(null) // 'crear' | 'editar' | 'stock'
  const [seleccionado, setSeleccionado] = useState(null)
  const [stockForm, setStockForm] = useState({ cantidad:'', tipo:'entrada', costo_unitario:'' })
  const [loadingStock, setLoadingStock] = useState(false)

  const cargar = () => api.getProductos().then(setProductos).catch(console.error)
  useEffect(() => { cargar() }, [])

  const filtrados = productos.filter(p => {
    const matchTipo = filtroTipo === 'todos' || p.tipo === filtroTipo
    const matchBus = p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    return matchTipo && matchBus
  })

  const bajos = productos.filter(p => p.stock <= p.stock_minimo)

  const handleCrear = async (data) => {
    await api.createProducto(data)
    await cargar()
    setModal(null)
  }

  const handleEditar = async (data) => {
    await api.updateProducto(seleccionado.id, { ...data, activo: true })
    await cargar()
    setModal(null)
  }

  const handleStock = async () => {
    if (!stockForm.cantidad) return
    setLoadingStock(true)
    try {
      // costo_unitario se calcula dividiendo el total entre la cantidad
      const costoTotal = +stockForm.costo_unitario || 0
      const costoUnitario = costoTotal > 0 && +stockForm.cantidad > 0
        ? costoTotal / +stockForm.cantidad
        : undefined
      await api.ajustarStock(seleccionado.id, {
        cantidad: +stockForm.cantidad,
        tipo: stockForm.tipo,
        costo_unitario: costoUnitario,
        costo_total: costoTotal || undefined,
      })
      await cargar()
      setModal(null)
    } finally { setLoadingStock(false) }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar?')) return
    await api.deleteProducto(id)
    cargar()
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-bold text-lg" style={{ color:'var(--text-primary)' }}>Inventario</h1>
          <p className="text-xs" style={{ color:'var(--text-muted)' }}>{productos.length} productos registrados</p>
        </div>
        <button onClick={() => { setSeleccionado(null); setModal('crear') }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
          style={{ background:'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
          <Plus size={15}/> Nuevo
        </button>
      </div>

      {/* Alerta stock bajo */}
      {bajos.length > 0 && (
        <div className="rounded-xl p-3 mb-4 flex items-start gap-2"
          style={{ background:'var(--warning-bg)', border:'1px solid var(--warning-border)' }}>
          <AlertTriangle size={15} className="mt-0.5 shrink-0" style={{ color:'var(--warning)' }}/>
          <p className="text-xs" style={{ color:'var(--warning)' }}>
            <strong>Stock bajo:</strong> {bajos.map(p=>p.nombre).join(', ')}
          </p>
        </div>
      )}

      {/* Búsqueda + filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:'var(--text-dim)' }}/>
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none"
            style={{ background:'var(--bg-raised)', border:'1px solid var(--border)', color:'var(--text-primary)' }}/>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[{ value:'todos', label:'Todos', emoji:'📋' }, ...TIPOS].map(t => (
            <button key={t.value} onClick={() => setFiltroTipo(t.value)}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: filtroTipo === t.value ? (t.color||'var(--primary)') : 'var(--bg-raised)',
                color: filtroTipo === t.value ? '#fff' : 'var(--text-muted)',
                border: '1px solid var(--border)'
              }}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de productos */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtrados.map(p => {
          const tipo = TIPOS.find(t => t.value === p.tipo)
          const esGramos = p.tipo === 'sabor' || (p.tipo === 'adicion' && p.unidad === 'gramo') || (p.tipo === 'borde' && p.unidad === 'gramo')
          const stockBajo = p.stock <= p.stock_minimo
          return (
            <div key={p.id} className="rounded-2xl p-4 transition-all"
              style={{ background:'var(--bg-card)', border:`1px solid ${stockBajo ? 'var(--warning-border)' : 'var(--border)'}` }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  {p.imagen
                    ? <img src={p.imagen} alt={p.nombre} className="w-10 h-10 rounded-xl object-cover shrink-0"/>
                    : <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ background: (tipo?.color||'#f4622a') + '15' }}>
                        {tipo?.emoji||'📦'}
                      </div>
                  }
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color:'var(--text-primary)' }}>{p.nombre}</p>
                    <TipoBadge tipo={p.tipo} />
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 ml-2">
                  <button onClick={() => { setSeleccionado(p); setStockForm({ cantidad:'', tipo:'entrada' }); setModal('stock') }}
                    className="p-1.5 rounded-lg" style={{ background:'var(--info-bg)', color:'var(--info)' }}>
                    <Package size={13}/>
                  </button>
                  <button onClick={() => { setSeleccionado(p); setModal('editar') }}
                    className="p-1.5 rounded-lg" style={{ background:'var(--bg-raised)', color:'var(--text-muted)' }}>
                    <Edit2 size={13}/>
                  </button>
                  <button onClick={() => eliminar(p.id)}
                    className="p-1.5 rounded-lg" style={{ background:'var(--danger-bg)', color:'var(--danger)' }}>
                    <Trash2 size={13}/>
                  </button>
                </div>
              </div>

              {/* Stock */}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xl font-bold"
                  style={{ color: p.stock===0 ? 'var(--danger)' : stockBajo ? 'var(--warning)' : 'var(--success)' }}>
                  {esGramos ? `${p.stock}g` : p.stock}
                </span>
                {esGramos && p.porcion_venta > 0 && (
                  <span className="text-xs" style={{ color:'var(--text-muted)' }}>
                    {Math.floor(p.stock / p.porcion_venta)} porciones de {p.porcion_venta}g
                  </span>
                )}
                {p.costo > 0 && (
                  <span className="text-xs font-semibold" style={{ color:'var(--text-muted)' }}>
                    costo: ${Number(p.costo).toLocaleString('es-CO')}
                  </span>
                )}
              </div>

              {/* Alertas */}
              {stockBajo && (
                <div className="mt-2 text-xs rounded-lg px-2 py-1 flex items-center gap-1"
                  style={{ background:'var(--warning-bg)', color:'var(--warning)' }}>
                  <AlertTriangle size={11}/> Stock bajo — mín: {p.stock_minimo}
                </div>
              )}
              {p.fecha_vencimiento && (() => {
                const dias = Math.ceil((new Date(p.fecha_vencimiento) - new Date()) / 86400000)
                if (dias > 7) return <p className="text-xs mt-1" style={{ color:'var(--text-dim)' }}>📅 Vence: {new Date(p.fecha_vencimiento).toLocaleDateString('es-CO')}</p>
                return (
                  <div className="mt-2 text-xs rounded-lg px-2 py-1 flex items-center gap-1"
                    style={{ background: dias<=0 ? 'var(--danger-bg)' : 'var(--warning-bg)', color: dias<=0 ? 'var(--danger)' : 'var(--warning)' }}>
                    <AlertTriangle size={11}/>
                    {dias<=0 ? '⚠️ VENCIDO' : `Vence en ${dias} día${dias!==1?'s':''}`}
                  </div>
                )
              })()}

              {/* Tags de enlaces */}
              <div className="flex flex-wrap gap-1 mt-2">
                {p.sabores_enlazados?.length > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background:'rgba(234,88,12,0.1)', color:'#ea580c' }}>
                    🔗 {p.sabores_enlazados.length} sabor{p.sabores_enlazados.length!==1?'es':''}
                  </span>
                )}
                {p.bebidas_enlazadas?.length > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background:'rgba(124,58,237,0.1)', color:'#7c3aed' }}>
                    🔗 {p.bebidas_enlazadas.length} bebida{p.bebidas_enlazadas.length!==1?'s':''}
                  </span>
                )}
                {p.adiciones_enlazadas?.length > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background:'rgba(202,138,4,0.1)', color:'#ca8a04' }}>
                    🔗 {p.adiciones_enlazadas.length} adición{p.adiciones_enlazadas.length!==1?'es':''}
                  </span>
                )}
                {p.bordes_enlazados?.length > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background:'rgba(8,145,178,0.1)', color:'#0891b2' }}>
                    🔗 {p.bordes_enlazados.length} borde{p.bordes_enlazados.length!==1?'s':''}
                  </span>
                )}
              </div>
            </div>
          )
        })}
        {filtrados.length === 0 && (
          <div className="col-span-3 text-center py-16" style={{ color:'var(--text-dim)' }}>
            <p className="text-4xl mb-2">📦</p>
            <p className="text-sm">Sin productos</p>
          </div>
        )}
      </div>

      {/* Modal crear */}
      {modal === 'crear' && (
        <Modal title="Nuevo producto" onClose={() => setModal(null)}>
          <FormProducto onSave={handleCrear} onClose={() => setModal(null)} />
        </Modal>
      )}

      {/* Modal editar */}
      {modal === 'editar' && seleccionado && (
        <Modal title={`Editar — ${seleccionado.nombre}`} onClose={() => setModal(null)}>
          <FormProducto
            initial={{
              ...seleccionado,
              costo: String(seleccionado.costo||0),
              stock: String(seleccionado.stock||0),
              stock_minimo: String(seleccionado.stock_minimo||5),
              porcion_venta: seleccionado.porcion_venta||100,
              sabores_enlazados: seleccionado.sabores_enlazados||[],
              bebidas_enlazadas: seleccionado.bebidas_enlazadas||[],
              adiciones_enlazadas: seleccionado.adiciones_enlazadas||[],
              bordes_enlazados: seleccionado.bordes_enlazados||[],
            }}
            onSave={handleEditar}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {/* Modal ajuste de stock */}
      {modal === 'stock' && seleccionado && (
        <Modal title={`Stock — ${seleccionado.nombre}`} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <p className="text-sm" style={{ color:'var(--text-muted)' }}>
              Stock actual: <strong style={{ color:'var(--text-primary)' }}>{seleccionado.stock}{seleccionado.tipo==='sabor'?'g':''}</strong>
              {seleccionado.costo > 0 && (
                <span className="ml-2 text-xs" style={{ color:'var(--text-dim)' }}>
                  · costo unit. actual: ${Number(seleccionado.costo).toLocaleString('es-CO')}
                </span>
              )}
            </p>
            <Field label="Tipo de movimiento">
              <div className="grid grid-cols-3 gap-2">
                {[{v:'entrada',l:'Entrada 📥',c:'var(--success)'},{v:'salida',l:'Salida 📤',c:'var(--danger)'},{v:'ajuste',l:'Ajuste ✏️',c:'var(--info)'}].map(o => (
                  <button key={o.v} type="button" onClick={() => setStockForm(f => ({...f, tipo:o.v}))}
                    className="py-2 rounded-xl text-xs font-bold border-2 transition-all"
                    style={{
                      borderColor: stockForm.tipo===o.v ? o.c : 'var(--border)',
                      background: stockForm.tipo===o.v ? o.c+'15' : 'transparent',
                      color: stockForm.tipo===o.v ? o.c : 'var(--text-muted)'
                    }}>{o.l}</button>
                ))}
              </div>
            </Field>
            <Field label={seleccionado.tipo==='sabor' ? 'Cantidad (gramos)' : 'Cantidad'}>
              <InputField type="number" value={stockForm.cantidad}
                onChange={e => setStockForm(f => ({...f, cantidad:e.target.value}))}
                placeholder="0" />
              {seleccionado.tipo==='sabor' && +stockForm.cantidad > 0 && (
                <p className="text-xs mt-1" style={{ color:'var(--text-muted)' }}>
                  {+stockForm.cantidad >= 1000 ? `${(+stockForm.cantidad/1000).toFixed(2)} kg` : `${stockForm.cantidad} g`}
                  {seleccionado.porcion_venta > 0 && ` · ${Math.floor(+stockForm.cantidad / seleccionado.porcion_venta)} porciones`}
                </p>
              )}
            </Field>

            {/* Costo total — solo en entradas */}
            {stockForm.tipo === 'entrada' && (
              <div className="rounded-xl p-3 space-y-2" style={{ background:'rgba(22,163,74,0.05)', border:'1px solid var(--border)' }}>
                <p className="text-xs font-bold" style={{ color:'var(--success)' }}>💰 ¿Cuánto pagaste en total?</p>
                <Field label="Precio total de la compra">
                  <InputField type="number" value={stockForm.costo_unitario}
                    onChange={e => setStockForm(f => ({...f, costo_unitario:e.target.value}))}
                    placeholder="Ej: 15000" />
                  <p className="text-xs mt-1" style={{ color:'var(--text-dim)' }}>
                    Dejar vacío para mantener el costo actual
                  </p>
                </Field>
                {+stockForm.cantidad > 0 && +stockForm.costo_unitario > 0 && (
                  <div className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{ background:'var(--bg-raised)', border:'1px solid var(--border)' }}>
                    <span className="text-xs" style={{ color:'var(--text-muted)' }}>Costo unitario calculado:</span>
                    <span className="text-sm font-bold" style={{ color:'var(--success)' }}>
                      ${Number(+stockForm.costo_unitario / +stockForm.cantidad).toLocaleString('es-CO', { maximumFractionDigits: 2 })} / {seleccionado.tipo==='sabor' ? 'g' : 'und'}
                    </span>
                  </div>
                )}
              </div>
            )}

            <button onClick={handleStock} disabled={loadingStock || !stockForm.cantidad}
              className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-40"
              style={{ background:'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
              {loadingStock ? 'Guardando...' : 'Aplicar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
