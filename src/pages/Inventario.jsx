import { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'
import { Plus, Edit2, Trash2, Package, AlertTriangle, Search, X, ShoppingBag, Layers, Upload } from 'lucide-react'

// Tipos de producto con sus unidades específicas
const TIPOS_PRODUCTO = [
  { value: 'bebida',   label: 'Bebida',    emoji: '🍺', desc: 'Soda, Canada Dry, Hatsu, Smirnoff' },
  { value: 'comida',   label: 'Comida',    emoji: '🍓', desc: 'Frutas, ingredientes, alimentos' },
  { value: 'objeto',   label: 'Objeto',    emoji: '📦', desc: 'Vasos, pitillos, empaques' },
  { value: 'servicio', label: 'Servicio',  emoji: '⚡', desc: 'Adiciones, extras, servicios' },
]

const UNIDADES_POR_TIPO = {
  bebida: [
    { value: 'unidad', label: 'Unidad (und)' },
  ],
  comida: [
    { value: 'libra',     label: 'Libra (500 g)' },
    { value: 'kilogramo', label: 'Kilogramo (kg)' },
    { value: 'gramo',     label: 'Gramo (g)' },
    { value: 'oz',        label: 'Onza (oz)' },
  ],
  objeto: [
    { value: 'unidad',       label: 'Unidad (und)' },
    { value: 'docena',       label: 'Docena (12 und)' },
    { value: 'media_docena', label: 'Media docena (6 und)' },
  ],
  servicio: [
    { value: 'unidad',   label: 'Unidad (und)' },
    { value: 'porcion',  label: 'Porción' },
    { value: 'servicio', label: 'Servicio' },
  ],
}

// Todas las unidades (para edición de productos existentes sin tipo)
const TODAS_UNIDADES = Object.values(UNIDADES_POR_TIPO).flat()
  .filter((u, i, a) => a.findIndex(x => x.value === u.value) === i)

const genCodigo = () => `PRD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2,5).toUpperCase()}`
const COMBO_ICONOS = ['🏷️','🍺','🥤','🍕','🧴','📦','🛒','⚡','🎯','🔥','❄️','🌿','🍫','🥩','🧀','🎁','🥗','🍔','☕','🧃']
const emptyProducto = { nombre:'', codigo:'', codigo_barras:'', categoria:'', proveedor:'', costo:'0', precio:'0', iva_pct:'19', tipo:'bebida', unidad:'unidad', porcion_venta:100, stock:'0', stock_minimo:'5', descripcion:'', imagen:null }
const emptyCombo = { nombre:'', precio:'0', icono:'🎁', descripcion:'', items:[] }

// Clases de input para tema claro
const ic = { background:'var(--bg-raised)', border:'1px solid var(--border)', color:'var(--text-primary)', borderRadius:'10px', padding:'8px 12px', fontSize:'14px', width:'100%', fontFamily:'Nunito, sans-serif' }

function Modal({ title, onClose, children, wide=false }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl w-full shadow-xl flex flex-col max-h-[90vh] ${wide?'max-w-lg':'max-w-md'}`}
        style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom:'1px solid var(--border)' }}>
          <h3 className="font-bold text-base" style={{ color:'var(--text-primary)' }}>{title}</h3>
          <button onClick={onClose} style={{ color:'var(--text-muted)' }}><X size={20}/></button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color:'var(--text-muted)' }}>
        {label}{required && <span style={{ color:'var(--danger)' }} className="ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function InputField({ value, onChange, placeholder, type='text', readOnly=false, className='' }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly}
      className={`focus:outline-none focus:ring-2 ${className}`}
      style={{ ...ic, opacity: readOnly ? 0.6 : 1, '--tw-ring-color':'rgba(244,98,42,0.2)' }}
      onFocus={e => e.target.style.borderColor = 'rgba(244,98,42,0.5)'}
      onBlur={e => e.target.style.borderColor = 'var(--border)'} />
  )
}

function SeccionProductos() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyProducto)
  const [editId, setEditId] = useState(null)
  const [stockForm, setStockForm] = useState({ cantidad:'', tipo:'entrada' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [showNuevaCat, setShowNuevaCat] = useState(false)
  const fileRef = useRef()

  const cargar = async () => {
    const [prods, cats] = await Promise.all([api.getProductos(), api.getCategorias().catch(() => [])])
    setProductos(prods); setCategorias(cats)
  }
  useEffect(() => { cargar() }, [])

  const filtrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.codigo||'').toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.categoria||'').toLowerCase().includes(busqueda.toLowerCase())
  )
  const bajos = productos.filter(p => p.stock <= p.stock_minimo)

  const abrirCrear = () => { setForm({...emptyProducto, codigo:genCodigo()}); setEditId(null); setMsg(''); setShowNuevaCat(false); setModal('form') }
  const abrirEditar = (p) => {
    setForm({ nombre:p.nombre, codigo:p.codigo||'', codigo_barras:p.codigo_barras||'', categoria:p.categoria||'',
      proveedor:p.proveedor||'', costo:p.costo??'0', precio:p.precio??'0', iva_pct:p.iva_pct??'0',
      tipo:p.tipo||'bebida', unidad:p.unidad||'unidad', porcion_venta:p.porcion_venta||100, stock:p.stock??'0', stock_minimo:p.stock_minimo??'5', descripcion:p.descripcion||'', imagen:p.imagen||null })
    setEditId(p.id); setMsg(''); setShowNuevaCat(false); setModal('form')
  }
  const abrirStock = (p) => { setEditId(p.id); setStockForm({ cantidad:'', tipo:'entrada' }); setModal('stock') }

  const handleImagen = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 3*1024*1024) { setMsg('Imagen max 3MB'); return }
    const reader = new FileReader()
    reader.onload = (ev) => setForm(f => ({ ...f, imagen:ev.target.result }))
    reader.readAsDataURL(file)
  }

  const guardar = async () => {
    if (!form.nombre.trim()) { setMsg('Nombre requerido'); return }
    if (!+form.precio || +form.precio <= 0) { setMsg('Precio de venta requerido'); return }
    setLoading(true)
    try {
      const data = { ...form, costo:+(form.costo||0), precio:+(form.precio||0), iva_pct:+(form.iva_pct||0), stock:+(form.stock||0), stock_minimo:+(form.stock_minimo||5), porcion_venta:+(form.porcion_venta||100) }
      if (editId) await api.updateProducto(editId, { ...data, activo:true })
      else await api.createProducto(data)
      await cargar(); setModal(null)
    } catch (err) { setMsg(err.message) }
    finally { setLoading(false) }
  }

  const ajustar = async () => {
    if (!stockForm.cantidad) return
    setLoading(true)
    try { await api.ajustarStock(editId, { cantidad:+stockForm.cantidad, tipo:stockForm.tipo }); await cargar(); setModal(null) }
    finally { setLoading(false) }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar producto?')) return
    await api.deleteProducto(id); cargar()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color:'var(--text-muted)' }}>{productos.length} productos registrados</p>
        <button onClick={abrirCrear}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
          style={{ background:'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
          <Plus size={15}/> Nuevo producto
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

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:'var(--text-dim)' }}/>
        <input value={busqueda} onChange={e=>setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, código o categoría..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
          style={{ background:'var(--bg-raised)', border:'1px solid var(--border)', color:'var(--text-primary)' }}
          onFocus={e=>e.target.style.borderColor='rgba(244,98,42,0.5)'}
          onBlur={e=>e.target.style.borderColor='var(--border)'}/>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtrados.map(p => (
          <div key={p.id} className="rounded-2xl p-4 transition-all"
            style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                {p.imagen
                  ? <img src={p.imagen} alt={p.nombre} className="w-10 h-10 rounded-xl object-cover shrink-0"/>
                  : <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background:'rgba(244,98,42,0.1)' }}>
                      <ShoppingBag size={16} style={{ color:'var(--primary)' }}/>
                    </div>
                }
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color:'var(--text-primary)' }}>{p.nombre}</p>
                  {p.categoria && <p className="text-xs" style={{ color:'var(--text-muted)' }}>{p.categoria}</p>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0 ml-2">
                <button onClick={()=>abrirStock(p)} title="Ajustar stock"
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ background:'var(--info-bg)', color:'var(--info)' }}>
                  <Package size={13}/>
                </button>
                <button onClick={()=>abrirEditar(p)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ background:'var(--bg-raised)', color:'var(--text-muted)' }}>
                  <Edit2 size={13}/>
                </button>
                <button onClick={()=>eliminar(p.id)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ background:'var(--danger-bg)', color:'var(--danger)' }}>
                  <Trash2 size={13}/>
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold"
                style={{ color: p.stock===0 ? 'var(--danger)' : p.stock<=p.stock_minimo ? 'var(--warning)' : 'var(--success)' }}>
                {p.tipo === 'comida' ? `${p.stock}g` : p.stock}
                <span className="text-xs font-normal ml-1" style={{ color:'var(--text-muted)' }}>
                  {p.tipo === 'comida'
                    ? `(${p.porcion_venta || 100}g por porción)`
                    : TODAS_UNIDADES.find(u=>u.value===p.unidad)?.label || p.unidad}
                </span>
              </span>
              <div className="text-right">
                <p className="text-sm font-bold" style={{ color:'var(--text-primary)' }}>${Number(p.precio).toLocaleString('es-CO')}</p>
                {p.costo>0 && <p className="text-xs" style={{ color:'var(--text-muted)' }}>costo: ${Number(p.costo).toLocaleString('es-CO')}</p>}
              </div>
            </div>
            {p.codigo && <p className="text-xs mt-1" style={{ color:'var(--text-dim)' }}>Cod: {p.codigo}</p>}
            {p.stock<=p.stock_minimo && (
              <div className="mt-2 text-xs rounded-lg px-2 py-1 flex items-center gap-1"
                style={{ background:'var(--warning-bg)', color:'var(--warning)' }}>
                <AlertTriangle size={11}/> Stock bajo — mín: {p.stock_minimo}
              </div>
            )}
          </div>
        ))}
        {filtrados.length===0 && (
          <div className="col-span-3 text-center py-12" style={{ color:'var(--text-dim)' }}>
            <ShoppingBag size={40} className="mx-auto mb-3 opacity-30"/>
            <p className="text-sm">Sin productos</p>
          </div>
        )}
      </div>

      {modal==='form' && (
        <Modal title={editId?'Editar producto':'Nuevo producto'} onClose={()=>setModal(null)} wide>
          <div className="space-y-3">
            {/* Selector de tipo */}
            <Field label="Tipo de producto" required>
              <div className="grid grid-cols-2 gap-2">
                {TIPOS_PRODUCTO.map(t => (
                  <button key={t.value} type="button"
                    onClick={() => setForm(f => ({ ...f, tipo: t.value, unidad: UNIDADES_POR_TIPO[t.value][0].value }))}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all"
                    style={{
                      borderColor: form.tipo === t.value ? 'var(--primary)' : 'var(--border)',
                      background: form.tipo === t.value ? 'rgba(244,98,42,0.08)' : 'var(--bg-raised)',
                    }}>
                    <span className="text-xl">{t.emoji}</span>
                    <div>
                      <p className="text-xs font-bold" style={{ color: form.tipo === t.value ? 'var(--primary)' : 'var(--text-primary)' }}>{t.label}</p>
                      <p className="text-xs" style={{ color: 'var(--text-dim)', fontSize: '10px' }}>{t.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Nombre" required>
              <InputField value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Nombre del producto"/>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Código (auto)">
                <div className="flex gap-1">
                  <InputField value={form.codigo} readOnly className="flex-1"/>
                  <button type="button" onClick={()=>setForm(f=>({...f,codigo:genCodigo()}))}
                    className="px-2.5 rounded-xl text-xs shrink-0"
                    style={{ background:'var(--bg-raised)', border:'1px solid var(--border)', color:'var(--text-muted)' }}>↻</button>
                </div>
              </Field>
              <Field label="Código de barras">
                <InputField value={form.codigo_barras} onChange={e=>setForm({...form,codigo_barras:e.target.value})} placeholder="Escanear o escribir..."/>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={form.tipo === 'comida' ? `Precio compra (total ${form.unidad || 'unidad'})` : 'Precio compra (por unidad)'}>
                <InputField type="number" value={form.costo} onChange={e => {
                  const costo = e.target.value
                  setForm(f => {
                    if (f.tipo === 'comida' && +costo > 0) {
                      const gramos = f.unidad === 'libra' ? 500 : f.unidad === 'kilogramo' ? 1000 : f.unidad === 'oz' ? 28.35 : 1
                      const porcion = +(f.porcion_venta || 100)
                      const precioVenta = Math.ceil((+costo / gramos) * porcion * 1.3)
                      return { ...f, costo, precio: String(precioVenta) }
                    }
                    return { ...f, costo }
                  })
                }}/>
                {form.tipo === 'comida' && +form.costo > 0 && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    ≈ ${(+form.costo / (form.unidad === 'libra' ? 500 : form.unidad === 'kilogramo' ? 1000 : form.unidad === 'oz' ? 28.35 : 1)).toFixed(1)} por gramo
                  </p>
                )}
              </Field>
              <Field label={form.tipo === 'comida' ? 'Precio venta (calculado)' : 'Precio venta (por unidad)'} required>
                <InputField type="number" value={form.precio} onChange={e=>setForm({...form,precio:e.target.value})}/>
              </Field>
            </div>

            {/* Porción de venta — solo para comida */}
            {form.tipo === 'comida' && (
              <div className="rounded-xl p-3 space-y-2" style={{ background:'rgba(244,98,42,0.05)', border:'1px solid var(--border)' }}>
                <p className="text-xs font-bold" style={{ color:'var(--primary)' }}>⚖️ Porción de venta</p>
                <p className="text-xs" style={{ color:'var(--text-muted)' }}>¿Cuántos gramos vas a vender por unidad?</p>
                <div className="flex items-center gap-2">
                  <input type="range" min="10" max="2000" step="10"
                    value={form.porcion_venta || 100}
                    onChange={e => {
                      const porcion = +e.target.value
                      setForm(f => {
                        const gramos = f.unidad === 'libra' ? 500 : f.unidad === 'kilogramo' ? 1000 : f.unidad === 'oz' ? 28.35 : 1
                        const precioVenta = +f.costo > 0 ? Math.ceil((+f.costo / gramos) * porcion * 1.3) : +f.precio
                        return { ...f, porcion_venta: porcion, precio: String(precioVenta) }
                      })
                    }}
                    className="flex-1 accent-orange-500" />
                  <div className="text-center shrink-0 w-20 px-2 py-1.5 rounded-lg font-bold text-sm"
                    style={{ background:'var(--bg-raised)', border:'1px solid var(--border)', color:'var(--primary)' }}>
                    {form.porcion_venta || 100}g
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[50, 100, 250, 500, 1000].map(g => (
                    <button key={g} type="button"
                      onClick={() => setForm(f => {
                        const gramos = f.unidad === 'libra' ? 500 : f.unidad === 'kilogramo' ? 1000 : f.unidad === 'oz' ? 28.35 : 1
                        const precioVenta = +f.costo > 0 ? Math.ceil((+f.costo / gramos) * g * 1.3) : +f.precio
                        return { ...f, porcion_venta: g, precio: String(precioVenta) }
                      })}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: (form.porcion_venta || 100) === g ? 'var(--primary)' : 'var(--bg-raised)',
                        color: (form.porcion_venta || 100) === g ? '#fff' : 'var(--text-muted)',
                        border: '1px solid var(--border)'
                      }}>
                      {g}g
                    </button>
                  ))}
                </div>
                {+form.costo > 0 && (
                  <p className="text-xs font-semibold" style={{ color:'var(--success)' }}>
                    Precio sugerido: ${(Math.ceil((+form.costo / (form.unidad === 'libra' ? 500 : form.unidad === 'kilogramo' ? 1000 : form.unidad === 'oz' ? 28.35 : 1)) * (form.porcion_venta || 100) * 1.3)).toLocaleString('es-CO')} por {form.porcion_venta || 100}g
                  </p>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="IVA %">
                <InputField type="number" value={form.iva_pct} onChange={e=>setForm({...form,iva_pct:e.target.value})}/>
              </Field>
              <Field label="Unidad">
                <select value={form.unidad} onChange={e => {
                  const unidad = e.target.value
                  setForm(f => {
                    // Para comida: convertir stock a gramos según la unidad seleccionada
                    if (f.tipo === 'comida' && +f.stock > 0) {
                      const gramos = unidad === 'libra' ? 500 : unidad === 'kilogramo' ? 1000 : unidad === 'oz' ? 28.35 : 1
                      return { ...f, unidad, stock: String(Math.round(+f.stock * gramos)) }
                    }
                    return { ...f, unidad }
                  })
                }}
                  className="focus:outline-none w-full rounded-xl text-sm appearance-none"
                  style={{ ...ic }}>
                  {(UNIDADES_POR_TIPO[form.tipo] || TODAS_UNIDADES).map(u=>(
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={form.tipo === 'comida' ? 'Stock inicial (gramos)' : 'Stock inicial'}>
                {/* Convertidor rápido solo para comida */}
                {form.tipo === 'comida' && (
                  <div className="mb-2 rounded-xl p-2.5 flex items-center gap-2"
                    style={{ background:'rgba(244,98,42,0.06)', border:'1px solid var(--border)' }}>
                    <span className="text-xs font-semibold shrink-0" style={{ color:'var(--text-muted)' }}>
                      {form.unidad === 'libra' ? 'Libras' : form.unidad === 'kilogramo' ? 'Kilos' : form.unidad === 'oz' ? 'Onzas' : 'Cantidad'}
                    </span>
                    <input type="number" min="0" step="0.5" placeholder="0"
                      className="flex-1 px-2 py-1 rounded-lg text-sm font-bold text-center focus:outline-none w-16"
                      style={{ background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--primary)' }}
                      onChange={e => {
                        const cant = +e.target.value
                        const gramos = form.unidad === 'libra' ? 500
                          : form.unidad === 'kilogramo' ? 1000
                          : form.unidad === 'oz' ? 28.35
                          : 1
                        setForm(f => ({ ...f, stock: String(Math.round(cant * gramos)) }))
                      }} />
                    <span className="text-xs shrink-0" style={{ color:'var(--text-dim)' }}>→</span>
                    <span className="text-xs font-bold shrink-0" style={{ color:'var(--success)' }}>
                      {form.stock || 0}g
                    </span>
                  </div>
                )}
                <InputField type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})}
                  placeholder={form.tipo === 'comida' ? 'ej: 500 (1 libra)' : '0'}/>
                {form.tipo === 'comida' && +form.stock > 0 && (
                  <p className="text-xs mt-1" style={{ color:'var(--text-muted)' }}>
                    = {+form.stock >= 1000 ? `${(+form.stock/1000).toFixed(2)} kg` : `${form.stock}g`}
                    {' · '}{Math.floor(+form.stock / (form.porcion_venta || 100))} porciones de {form.porcion_venta || 100}g
                  </p>
                )}
              </Field>
              <Field label={form.tipo === 'comida' ? 'Stock mínimo (gramos)' : 'Stock mínimo'}>
                <InputField type="number" value={form.stock_minimo} onChange={e=>setForm({...form,stock_minimo:e.target.value})}/>
              </Field>
            </div>
            <Field label="Descripción">
              <textarea value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})}
                rows={2} placeholder="Descripción opcional..."
                className="focus:outline-none resize-none w-full rounded-xl text-sm"
                style={{ ...ic }}/>
            </Field>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color:'var(--text-muted)' }}>Imagen del producto</label>
              <div onClick={()=>fileRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors"
                style={{ borderColor:'var(--border)' }}>
                {form.imagen
                  ? <img src={form.imagen} alt="preview" className="h-20 mx-auto rounded-lg object-cover"/>
                  : <>
                      <Upload size={22} className="mx-auto mb-1" style={{ color:'var(--text-dim)' }}/>
                      <p className="text-xs" style={{ color:'var(--text-muted)' }}>Clic para subir imagen</p>
                      <p className="text-xs" style={{ color:'var(--text-dim)' }}>JPG, PNG, WebP — máx 3MB</p>
                    </>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagen}/>
              {form.imagen && (
                <button onClick={()=>setForm(f=>({...f,imagen:null}))}
                  className="text-xs mt-1 hover:underline" style={{ color:'var(--danger)' }}>Quitar imagen</button>
              )}
            </div>
            {msg && <p className="text-xs" style={{ color:'var(--danger)' }}>{msg}</p>}
            <button onClick={guardar} disabled={loading}
              className="w-full py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
              style={{ background:'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
              {loading?'Guardando...':'Guardar producto'}
            </button>
          </div>
        </Modal>
      )}

      {modal==='stock' && (
        <Modal title="Ajustar stock" onClose={()=>setModal(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[['entrada','Entrada'],['salida','Salida'],['ajuste','Ajuste']].map(([v,l])=>(
                <button key={v} onClick={()=>setStockForm({...stockForm,tipo:v})}
                  className="py-2 rounded-xl text-xs font-medium border-2 transition-all"
                  style={{
                    borderColor: stockForm.tipo===v ? 'var(--primary)' : 'var(--border)',
                    background: stockForm.tipo===v ? 'rgba(244,98,42,0.08)' : 'transparent',
                    color: stockForm.tipo===v ? 'var(--primary)' : 'var(--text-muted)'
                  }}>{l}</button>
              ))}
            </div>
            <InputField type="number" value={stockForm.cantidad}
              onChange={e=>setStockForm({...stockForm,cantidad:e.target.value})}
              placeholder={stockForm.tipo==='ajuste'?'Nuevo stock total':'Cantidad'}/>
            <button onClick={ajustar} disabled={!stockForm.cantidad||loading}
              className="w-full py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
              style={{ background:'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
              Aplicar
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function SeccionCombos() {
  const [combos, setCombos] = useState([])
  const [productos, setProductos] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyCombo)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const cargar = async () => {
    const [cs, ps] = await Promise.all([api.getCombos(), api.getProductos()])
    setCombos(cs); setProductos(ps)
  }
  useEffect(() => { cargar() }, [])

  const abrirCrear = () => { setForm(emptyCombo); setEditId(null); setMsg(''); setModal('form') }
  const abrirEditar = (c) => {
    setForm({ nombre:c.nombre, precio:c.precio, icono:c.icono||'🎁', descripcion:c.descripcion||'', items:c.items||[] })
    setEditId(c.id); setMsg(''); setModal('form')
  }
  const agregarProducto = (p) => setForm(f => ({ ...f, items:[...f.items, { producto_id:p.id, nombre_producto:p.nombre, cantidad:1 }] }))
  const quitarProducto = (idx) => setForm(f => ({ ...f, items:f.items.filter((_,i)=>i!==idx) }))
  const cambiarCantidad = (idx, val) => setForm(f => ({ ...f, items:f.items.map((it,i)=>i===idx?{...it,cantidad:+val}:it) }))

  const guardar = async () => {
    if (!form.nombre.trim()) { setMsg('Nombre requerido'); return }
    if (!+form.precio || +form.precio <= 0) { setMsg('Precio requerido'); return }
    if (!form.items.length) { setMsg('Agrega al menos un producto'); return }
    setLoading(true)
    try {
      const data = { ...form, precio:+(form.precio||0) }
      if (editId) await api.updateCombo(editId, { ...data, activo:true })
      else await api.createCombo(data)
      await cargar(); setModal(null)
    } catch (err) { setMsg(err.message) }
    finally { setLoading(false) }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar combo?')) return
    await api.deleteCombo(id); cargar()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color:'var(--text-muted)' }}>{combos.length} combos registrados</p>
        <button onClick={abrirCrear}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
          style={{ background:'linear-gradient(135deg, #7C3AED, #A855F7)' }}>
          <Plus size={15}/> Nuevo combo
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {combos.map(c => (
          <div key={c.id} className="rounded-2xl p-4 transition-all"
            style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{c.icono||'🎁'}</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color:'var(--text-primary)' }}>{c.nombre}</p>
                  {c.descripcion && <p className="text-xs truncate max-w-[140px]" style={{ color:'var(--text-muted)' }}>{c.descripcion}</p>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={()=>abrirEditar(c)}
                  className="p-1.5 rounded-lg" style={{ background:'var(--bg-raised)', color:'var(--text-muted)' }}>
                  <Edit2 size={13}/>
                </button>
                <button onClick={()=>eliminar(c.id)}
                  className="p-1.5 rounded-lg" style={{ background:'var(--danger-bg)', color:'var(--danger)' }}>
                  <Trash2 size={13}/>
                </button>
              </div>
            </div>
            <p className="text-lg font-bold" style={{ color:'#7C3AED' }}>${Number(c.precio).toLocaleString('es-CO')}</p>
            <div className="mt-2 space-y-0.5">
              {(c.items||[]).map((it,i) => (
                <p key={i} className="text-xs" style={{ color:'var(--text-muted)' }}>— {it.nombre_producto} x{it.cantidad}</p>
              ))}
            </div>
          </div>
        ))}
        {combos.length===0 && (
          <div className="col-span-3 text-center py-12" style={{ color:'var(--text-dim)' }}>
            <Layers size={40} className="mx-auto mb-3 opacity-30"/>
            <p className="text-sm">Sin combos</p>
            <p className="text-xs mt-1" style={{ color:'var(--text-dim)' }}>Crea paquetes de productos con precio especial</p>
          </div>
        )}
      </div>

      {modal==='form' && (
        <Modal title={editId?'Editar combo':'Nuevo combo'} onClose={()=>setModal(null)} wide>
          <div className="space-y-4">
            <Field label="Nombre del combo" required>
              <InputField value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Ej: Combo almuerzo..."/>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Precio de venta" required>
                <InputField type="number" value={form.precio} onChange={e=>setForm({...form,precio:e.target.value})}/>
              </Field>
              <Field label="Icono">
                <div className="grid grid-cols-5 gap-1 max-h-28 overflow-y-auto p-1 rounded-xl"
                  style={{ background:'var(--bg-raised)', border:'1px solid var(--border)' }}>
                  {COMBO_ICONOS.map(ico => (
                    <button key={ico} onClick={()=>setForm(f=>({...f,icono:ico}))}
                      className="text-xl p-1.5 rounded-lg transition-all"
                      style={{ background: form.icono===ico ? 'rgba(124,58,237,0.15)' : 'transparent',
                        outline: form.icono===ico ? '2px solid #7C3AED' : 'none' }}>
                      {ico}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            <Field label="Descripción">
              <InputField value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})} placeholder="Opcional..."/>
            </Field>
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color:'var(--text-muted)' }}>Productos del combo</label>
              <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto mb-3 pr-1">
                {productos.filter(p => !form.items.find(i => i.producto_id === p.id)).map(p => (
                  <button key={p.id} onClick={()=>agregarProducto(p)} type="button"
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all"
                    style={{ background:'var(--bg-raised)', border:'1px solid var(--border)' }}>
                    <span className="text-lg">🍺</span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color:'var(--text-primary)' }}>{p.nombre}</p>
                      <p className="text-xs" style={{ color:'var(--text-muted)' }}>${Number(p.precio).toLocaleString('es-CO')}</p>
                    </div>
                  </button>
                ))}
              </div>
              {form.items.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs mb-1" style={{ color:'var(--text-muted)' }}>Agregados ({form.items.length}):</p>
                  {form.items.map((it,i) => (
                    <div key={i} className="flex items-center gap-2 rounded-xl px-3 py-2"
                      style={{ background:'rgba(124,58,237,0.06)', border:'1px solid rgba(124,58,237,0.2)' }}>
                      <p className="text-sm flex-1 truncate" style={{ color:'var(--text-primary)' }}>{it.nombre_producto}</p>
                      <input type="number" min="1" value={it.cantidad}
                        onChange={e=>cambiarCantidad(i,e.target.value)}
                        className="w-14 px-2 py-1 rounded-lg text-sm text-center focus:outline-none"
                        style={{ background:'var(--bg-raised)', border:'1px solid var(--border)', color:'var(--text-primary)' }}/>
                      <button onClick={()=>quitarProducto(i)} style={{ color:'var(--danger)' }}><X size={14}/></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {msg && <p className="text-xs" style={{ color:'var(--danger)' }}>{msg}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={()=>setModal(null)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm"
                style={{ background:'var(--bg-raised)', border:'1px solid var(--border)', color:'var(--text-muted)' }}>
                Cancelar
              </button>
              <button onClick={guardar} disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
                style={{ background:'linear-gradient(135deg, #7C3AED, #A855F7)' }}>
                {loading?'Guardando...':'Guardar combo'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default function Inventario() {
  const [tab, setTab] = useState('productos')
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-5">
        <h1 className="font-display text-2xl" style={{ color:'var(--text-primary)' }}>Inventario</h1>
        <p className="text-sm" style={{ color:'var(--text-muted)' }}>Gestiona productos y combos</p>
      </div>

      <div className="flex gap-1 mb-6 rounded-xl p-1 w-fit"
        style={{ background:'var(--bg-raised)', border:'1px solid var(--border)' }}>
        {[['productos', ShoppingBag, 'Productos'], ['combos', Layers, 'Combos']].map(([key, Icon, label]) => (
          <button key={key} onClick={()=>setTab(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab===key ? 'var(--bg-card)' : 'transparent',
              color: tab===key ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: tab===key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
            }}>
            <Icon size={15}/> {label}
          </button>
        ))}
      </div>

      {tab==='productos' ? <SeccionProductos/> : <SeccionCombos/>}
    </div>
  )
}
