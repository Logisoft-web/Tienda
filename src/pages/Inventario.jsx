import { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'
import { Plus, Edit2, Trash2, Package, AlertTriangle, Search, X, Upload } from 'lucide-react'

// ── TIPOS ─────────────────────────────────────────────────────────────────────
const TIPOS = [
  { value: 'producto', label: 'Producto', emoji: '📦', color: '#7c3aed' },
]

const UNIDADES = [
  { value: 'unidad',     label: 'Unidad (und)' },
  { value: 'gramo',      label: 'Gramo (g)' },
  { value: 'mililitro',  label: 'Mililitro (ml)' },
  { value: 'kilogramo',  label: 'Kilogramo (kg)' },
  { value: 'litro',      label: 'Litro (L)' },
  { value: 'libra',      label: 'Libra (500g)' },
]

const UNIDADES_PESO = ['gramo', 'kilogramo', 'libra', 'mililitro', 'litro']

const genCodigo = () => `PRD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2,5).toUpperCase()}`

const empty = {
  nombre:'', codigo:'', proveedor:'', costo:'0', precio:'0',
  stock:'0', stock_minimo:'5', tipo:'producto', unidad:'unidad',
  porcion_venta:'1', descripcion:'', imagen:null, fecha_vencimiento:'', emoji:'📦',
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

function TipoBadge({ tipo }) {
  const map = {
    comida:   { emoji: '🍓', label: 'Producto', color: '#7c3aed' },
    objeto:   { emoji: '📦', label: 'Producto', color: '#7c3aed' },
    producto: { emoji: '📦', label: 'Producto', color: '#7c3aed' },
    sabor:    { emoji: '🌈', label: 'Sabor',    color: '#ea580c' },
    bebida:   { emoji: '🥤', label: 'Bebida',   color: '#0284c7' },
    adicion:  { emoji: '✨', label: 'Adición',  color: '#16a34a' },
    borde:    { emoji: '🧂', label: 'Borde',    color: '#b45309' },
  }
  const t = map[tipo] || { emoji: '📦', label: tipo, color: '#7c3aed' }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ background: t.color + '20', color: t.color }}>
      {t.label}
    </span>
  )
}

// ── FORMULARIO ────────────────────────────────────────────────────────────────
function FormProducto({ initial, onSave, onClose }) {
  const [form, setForm] = useState({ ...empty, codigo: genCodigo(), ...initial })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const esPeso = UNIDADES_PESO.includes(form.unidad)

  // Factor de conversión a unidad base (gramos o ml)
  const factorBase = form.unidad === 'kilogramo' ? 1000 : form.unidad === 'libra' ? 500 : form.unidad === 'litro' ? 1000 : 1

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
      // Normalizar unidades compuestas a su base antes de guardar
      let unidadFinal = form.unidad
      let stockFinal = +(form.stock || 0)
      if (form.unidad === 'kilogramo') { unidadFinal = 'gramo' }
      else if (form.unidad === 'libra')    { unidadFinal = 'gramo' }
      else if (form.unidad === 'litro')    { unidadFinal = 'mililitro' }

      await onSave({
        ...form,
        unidad: unidadFinal,
        stock: stockFinal,
        costo: +(form.costo||0),
        precio: +(form.precio||0),
        stock_minimo: +(form.stock_minimo||5),
        porcion_venta: +(form.porcion_venta||1),
      })
    } catch(e) { setMsg(e.message) }
    finally { setLoading(false) }
  }

  return (
    <>
      {/* Nombre */}
      <Field label="Nombre" required>
        <InputField value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Fresa, Canada Dry 22oz, Vaso..." />
      </Field>

      {/* Código + Proveedor */}
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

      {/* Unidad */}
      <Field label="Unidad de medida" required>
        <select value={form.unidad} onChange={e => set('unidad', e.target.value)}
          className="focus:outline-none w-full rounded-xl text-sm appearance-none" style={{ ...ic }}>
          {UNIDADES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
        </select>
      </Field>

      {/* Precio compra + precio venta */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="💰 Precio de compra">
          <InputField type="number" value={form.costo} onChange={e => set('costo', e.target.value)} placeholder="0" />
          <p className="text-xs mt-1" style={{ color:'var(--text-dim)' }}>Lo que pagas al proveedor</p>
        </Field>
        <Field label="🏷️ Precio de venta">
          <InputField type="number" value={form.precio} onChange={e => set('precio', e.target.value)} placeholder="0" />
          <p className="text-xs mt-1" style={{ color:'var(--text-dim)' }}>Lo que cobra al cliente</p>
        </Field>
      </div>

      {/* Porción de venta — solo para unidades de peso/volumen */}
      {esPeso && (
        <div className="rounded-xl p-3 space-y-2" style={{ background:'rgba(244,98,42,0.05)', border:'1px solid var(--border)' }}>
          <p className="text-xs font-bold" style={{ color:'var(--primary)' }}>
            ⚖️ Porción por venta ({form.unidad === 'mililitro' || form.unidad === 'litro' ? 'ml' : 'g'})
          </p>
          <p className="text-xs" style={{ color:'var(--text-muted)' }}>
            ¿Cuánto se usa/vende por unidad vendida? Ej: 100g de fresa por chelada
          </p>
          <div className="flex items-center gap-2">
            <input type="range"
              min={form.unidad === 'mililitro' || form.unidad === 'litro' ? 10 : 5}
              max={form.unidad === 'mililitro' || form.unidad === 'litro' ? 1000 : 500}
              step={5}
              value={form.porcion_venta || 100}
              onChange={e => set('porcion_venta', e.target.value)}
              className="flex-1 accent-orange-500" />
            <input type="number" value={form.porcion_venta}
              onChange={e => set('porcion_venta', e.target.value)}
              className="w-20 text-center px-2 py-1.5 rounded-lg font-bold text-sm focus:outline-none"
              style={{ background:'var(--bg-raised)', border:'2px solid var(--primary)', color:'var(--primary)' }} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[25, 50, 100, 150, 200, 250].map(g => (
              <button key={g} type="button" onClick={() => set('porcion_venta', g)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: +form.porcion_venta === g ? 'var(--primary)' : 'var(--bg-raised)',
                  color: +form.porcion_venta === g ? '#fff' : 'var(--text-muted)',
                  border:'1px solid var(--border)'
                }}>{g}</button>
            ))}
          </div>
        </div>
      )}

      {/* Stock */}
      <div className="grid grid-cols-2 gap-3">
        <Field label={esPeso ? `Stock inicial (${form.unidad === 'mililitro' || form.unidad === 'litro' ? 'ml' : 'g'})` : 'Stock inicial'}>
          <InputField type="number" value={form.stock} onChange={e => set('stock', e.target.value)} />
          {esPeso && +form.stock > 0 && +form.porcion_venta > 0 && (
            <p className="text-xs mt-1" style={{ color:'var(--text-muted)' }}>
              {Math.floor(+form.stock / +form.porcion_venta)} porciones de {form.porcion_venta}
            </p>
          )}
        </Field>
        <Field label="Stock mínimo">
          <InputField type="number" value={form.stock_minimo} onChange={e => set('stock_minimo', e.target.value)} />
        </Field>
      </div>

      {/* Convertidor para kg/libra/litro */}
      {(form.unidad === 'kilogramo' || form.unidad === 'libra' || form.unidad === 'litro') && (
        <div className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background:'rgba(244,98,42,0.06)', border:'1px solid var(--border)' }}>
          <span className="text-xs font-semibold shrink-0" style={{ color:'var(--text-muted)' }}>
            Cantidad en {form.unidad}:
          </span>
          <input type="number" min="0" step="0.5" placeholder="0"
            className="w-20 px-2 py-1.5 rounded-lg text-sm font-bold text-center focus:outline-none"
            style={{ background:'var(--bg-card)', border:'2px solid var(--primary)', color:'var(--primary)' }}
            onChange={e => set('stock', String(Math.round(+e.target.value * factorBase)))} />
          <span className="text-xs" style={{ color:'var(--text-dim)' }}>→ se guarda como:</span>
          <span className="text-sm font-bold" style={{ color:'var(--success)' }}>
            {form.stock || 0}{form.unidad === 'litro' ? 'ml' : 'g'}
          </span>
        </div>
      )}

      {/* Fecha vencimiento */}
      <Field label="📅 Fecha de vencimiento (opcional)">
        <InputField type="date" value={form.fecha_vencimiento}
          onChange={e => set('fecha_vencimiento', e.target.value)}
          min={new Date().toISOString().slice(0,10)} />
        {form.fecha_vencimiento && (() => {
          const dias = Math.ceil((new Date(form.fecha_vencimiento) - new Date()) / 86400000)
          const color = dias <= 0 ? 'var(--danger)' : dias <= 3 ? 'var(--danger)' : dias <= 7 ? '#f59e0b' : 'var(--success)'
          return <p className="text-xs mt-1 font-semibold" style={{ color }}>{dias <= 0 ? '⚠️ Vencido' : `Vence en ${dias} día${dias!==1?'s':''}`}</p>
        })()}
      </Field>

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
  const [modal, setModal] = useState(null)
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

  const handleCrear = async (data) => { await api.createProducto(data); await cargar(); setModal(null) }
  const handleEditar = async (data) => { await api.updateProducto(seleccionado.id, { ...data, activo: true }); await cargar(); setModal(null) }

  const handleStock = async () => {
    if (!stockForm.cantidad) return
    setLoadingStock(true)
    try {
      const costoTotal = +stockForm.costo_unitario || 0
      const costoUnitario = costoTotal > 0 && +stockForm.cantidad > 0 ? costoTotal / +stockForm.cantidad : undefined
      await api.ajustarStock(seleccionado.id, {
        cantidad: +stockForm.cantidad,
        tipo: stockForm.tipo,
        costo_unitario: costoUnitario,
        costo_total: costoTotal || undefined,
      })
      await cargar(); setModal(null)
    } finally { setLoadingStock(false) }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar?')) return
    await api.deleteProducto(id); cargar()
  }

  const unidadLabel = (p) => {
    if (p.unidad === 'gramo') return 'g'
    if (p.unidad === 'mililitro') return 'ml'
    if (p.unidad === 'kilogramo') return 'kg'
    if (p.unidad === 'litro') return 'L'
    if (p.unidad === 'libra') return 'lb'
    return ''
  }

  const esPeso = (p) => UNIDADES_PESO.includes(p.unidad)

  return (
    <div className="p-4 max-w-5xl mx-auto">
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

      {bajos.length > 0 && (
        <div className="rounded-xl p-3 mb-4 flex items-start gap-2"
          style={{ background:'var(--warning-bg)', border:'1px solid var(--warning-border)' }}>
          <AlertTriangle size={15} className="mt-0.5 shrink-0" style={{ color:'var(--warning)' }}/>
          <p className="text-xs" style={{ color:'var(--warning)' }}>
            <strong>Stock bajo:</strong> {bajos.map(p=>p.nombre).join(', ')}
          </p>
        </div>
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:'var(--text-dim)' }}/>
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none"
            style={{ background:'var(--bg-raised)', border:'1px solid var(--border)', color:'var(--text-primary)' }}/>
        </div>
        <div className="flex gap-1.5">
          {[{ value:'todos', label:'Todos', emoji:'📋', color:'var(--primary)' }].map(t => (
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtrados.map(p => {
          const tipo = TIPOS.find(t => t.value === p.tipo) || TIPOS[0]
          const stockBajo = p.stock <= p.stock_minimo
          const peso = esPeso(p)
          const ul = unidadLabel(p)
          return (
            <div key={p.id} className="rounded-2xl p-4 transition-all"
              style={{ background:'var(--bg-card)', border:`1px solid ${stockBajo ? 'var(--warning-border)' : 'var(--border)'}` }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  {p.imagen
                    ? <img src={p.imagen} alt={p.nombre} className="w-10 h-10 rounded-xl object-contain shrink-0"/>
                    : <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl shrink-0"
                        style={{ background: tipo.color + '15' }}>
                        {p.emoji || tipo.emoji}
                      </div>
                  }
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color:'var(--text-primary)' }}>{p.nombre}</p>
                    <TipoBadge tipo={p.tipo} />
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 ml-2">
                  <button onClick={() => { setSeleccionado(p); setStockForm({ cantidad:'', tipo:'entrada', costo_unitario:'' }); setModal('stock') }}
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

              {/* Stock + precios */}
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold"
                    style={{ color: p.stock===0 ? 'var(--danger)' : stockBajo ? 'var(--warning)' : 'var(--success)' }}>
                    {p.stock}{ul}
                  </span>
                  {peso && p.porcion_venta > 0 && (
                    <span className="text-xs" style={{ color:'var(--text-muted)' }}>
                      {Math.floor(p.stock / p.porcion_venta)} × {p.porcion_venta}{ul}
                    </span>
                  )}
                </div>
                <div className="flex gap-3 text-xs">
                  {p.costo > 0 && <span style={{ color:'var(--text-muted)' }}>Compra: <strong>${Number(p.costo).toLocaleString('es-CO')}</strong></span>}
                  {p.precio > 0 && <span style={{ color:'var(--success)' }}>Venta: <strong>${Number(p.precio).toLocaleString('es-CO')}</strong></span>}
                </div>
              </div>

              {stockBajo && (
                <div className="mt-2 text-xs rounded-lg px-2 py-1 flex items-center gap-1"
                  style={{ background:'var(--warning-bg)', color:'var(--warning)' }}>
                  <AlertTriangle size={11}/> Stock bajo — mín: {p.stock_minimo}
                </div>
              )}
              {p.fecha_vencimiento && (() => {
                const dias = Math.ceil((new Date(p.fecha_vencimiento) - new Date()) / 86400000)
                if (dias > 7) return null
                return (
                  <div className="mt-2 text-xs rounded-lg px-2 py-1 flex items-center gap-1"
                    style={{ background: dias<=0 ? 'var(--danger-bg)' : 'var(--warning-bg)', color: dias<=0 ? 'var(--danger)' : 'var(--warning)' }}>
                    <AlertTriangle size={11}/>
                    {dias<=0 ? '⚠️ VENCIDO' : `Vence en ${dias} día${dias!==1?'s':''}`}
                  </div>
                )
              })()}
            </div>
          )
        })}
        {filtrados.length === 0 && (
          <div className="col-span-3 text-center py-16" style={{ color:'var(--text-dim)' }}>
            <p className="text-4xl mb-2">📦</p><p className="text-sm">Sin productos</p>
          </div>
        )}
      </div>

      {modal === 'crear' && (
        <Modal title="Nuevo producto" onClose={() => setModal(null)}>
          <FormProducto onSave={handleCrear} onClose={() => setModal(null)} />
        </Modal>
      )}

      {modal === 'editar' && seleccionado && (
        <Modal title={`Editar — ${seleccionado.nombre}`} onClose={() => setModal(null)}>
          <FormProducto
            initial={{
              ...seleccionado,
              costo: String(seleccionado.costo||0),
              precio: String(seleccionado.precio||0),
              stock: String(seleccionado.stock||0),
              stock_minimo: String(seleccionado.stock_minimo||5),
              porcion_venta: String(seleccionado.porcion_venta||100),
            }}
            onSave={handleEditar}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {modal === 'stock' && seleccionado && (
        <Modal title={`Stock — ${seleccionado.nombre}`} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <p className="text-sm" style={{ color:'var(--text-muted)' }}>
              Stock actual: <strong style={{ color:'var(--text-primary)' }}>{seleccionado.stock}{unidadLabel(seleccionado)}</strong>
              {seleccionado.costo > 0 && (
                <span className="ml-2 text-xs" style={{ color:'var(--text-dim)' }}>
                  · costo unit.: ${Number(seleccionado.costo).toLocaleString('es-CO')}
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
            <Field label={`Cantidad (${unidadLabel(seleccionado) || seleccionado.unidad})`}>
              <InputField type="number" value={stockForm.cantidad}
                onChange={e => setStockForm(f => ({...f, cantidad:e.target.value}))} placeholder="0" />
              {esPeso(seleccionado) && +stockForm.cantidad > 0 && seleccionado.porcion_venta > 0 && (
                <p className="text-xs mt-1" style={{ color:'var(--text-muted)' }}>
                  {Math.floor(+stockForm.cantidad / seleccionado.porcion_venta)} porciones de {seleccionado.porcion_venta}{unidadLabel(seleccionado)}
                </p>
              )}
            </Field>
            {stockForm.tipo === 'entrada' && (
              <div className="rounded-xl p-3 space-y-2" style={{ background:'rgba(22,163,74,0.05)', border:'1px solid var(--border)' }}>
                <p className="text-xs font-bold" style={{ color:'var(--success)' }}>💰 Precio total de la compra</p>
                <Field label="Total pagado (opcional)">
                  <InputField type="number" value={stockForm.costo_unitario}
                    onChange={e => setStockForm(f => ({...f, costo_unitario:e.target.value}))} placeholder="Ej: 15000" />
                </Field>
                {+stockForm.cantidad > 0 && +stockForm.costo_unitario > 0 && (
                  <div className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{ background:'var(--bg-raised)', border:'1px solid var(--border)' }}>
                    <span className="text-xs" style={{ color:'var(--text-muted)' }}>Costo unitario:</span>
                    <span className="text-sm font-bold" style={{ color:'var(--success)' }}>
                      ${Number(+stockForm.costo_unitario / +stockForm.cantidad).toLocaleString('es-CO', { maximumFractionDigits: 2 })} / {unidadLabel(seleccionado) || seleccionado.unidad}
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
