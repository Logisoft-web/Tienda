import { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'
import { Plus, Edit2, Trash2, Package, AlertTriangle, Search, X, ShoppingBag, Layers, ChevronDown, Upload } from 'lucide-react'

const UNIDADES = [
  { value: 'unidad',     label: 'Unidad (und)' },
  { value: 'pieza',      label: 'Pieza (pza)' },
  { value: 'docena',     label: 'Docena (12 und)' },
  { value: 'media_docena', label: 'Media docena (6 und)' },
  { value: 'par',        label: 'Par (2 und)' },
  { value: 'caja',       label: 'Caja' },
  { value: 'paquete',    label: 'Paquete' },
  { value: 'bolsa',      label: 'Bolsa' },
  { value: 'vaso',       label: 'Vaso' },
  { value: 'botella',    label: 'Botella' },
  { value: 'lata',       label: 'Lata' },
  { value: 'porcion',    label: 'Porción' },
  { value: 'gramo',      label: 'Gramo (g)' },
  { value: 'kilogramo',  label: 'Kilogramo (kg)' },
  { value: 'libra',      label: 'Libra (500 g)' },
  { value: 'arroba',     label: 'Arroba (12.5 kg)' },
  { value: 'ml',         label: 'Mililitro (ml)' },
  { value: 'litro',      label: 'Litro (L)' },
  { value: 'oz',         label: 'Onza (oz)' },
]

const genCodigo = () => {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `PRD-${ts}-${rand}`
}

const COMBO_ICONOS = ['🏷️','🍺','🥤','🍕','🧴','📦','🛒','⚡','🎯','🔥','❄️','🌿','🍫','🥩','🧀','🎁','🥗','🍔','☕','🧃']
const emptyProducto = { nombre:'', codigo:'', codigo_barras:'', categoria:'', proveedor:'', costo:'0', precio:'0', iva_pct:'19', unidad:'unidad', stock:'0', stock_minimo:'5', descripcion:'', imagen:null }
const emptyCombo = { nombre:'', precio:'0', icono:'🎁', descripcion:'', items:[] }

function Modal({ title, onClose, children, wide=false }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className={`bg-[#1a1a2e] rounded-2xl w-full shadow-2xl flex flex-col max-h-[90vh] ${wide?'max-w-lg':'max-w-md'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <h3 className="font-bold text-white text-base">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20}/></button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const ic = 'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40'
const icSelect = 'w-full px-3 py-2 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 appearance-none'

function SeccionProductos() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyProducto)
  const [editId, setEditId] = useState(null)
  const [stockForm, setStockForm] = useState({ cantidad:'', tipo:'entrada' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [nuevoProveedor, setNuevoProveedor] = useState('')
  const [showNuevaCat, setShowNuevaCat] = useState(false)
  const fileRef = useRef()

  const cargar = async () => {
    const [prods, cats, provs] = await Promise.all([
      api.getProductos(),
      api.getCategorias().catch(() => []),
      api.getProveedores().catch(() => [])
    ])
    setProductos(prods); setCategorias(cats); setProveedores(provs)
  }
  useEffect(() => { cargar() }, [])

  const filtrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.codigo||'').toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.categoria||'').toLowerCase().includes(busqueda.toLowerCase())
  )
  const bajos = productos.filter(p => p.stock <= p.stock_minimo)

  const abrirCrear = () => { setForm({...emptyProducto, codigo: genCodigo()}); setEditId(null); setMsg(''); setShowNuevaCat(false); setModal('form') }
  const abrirEditar = (p) => {
    setForm({ nombre:p.nombre, codigo:p.codigo||'', codigo_barras:p.codigo_barras||'',
      categoria:p.categoria||'', proveedor:p.proveedor||'', costo:p.costo??'0',
      precio:p.precio??'0', iva_pct:p.iva_pct??'0', unidad:p.unidad||'unidad',
      stock:p.stock??'0', stock_minimo:p.stock_minimo??'5', descripcion:p.descripcion||'', imagen:p.imagen||null })
    setEditId(p.id); setMsg(''); setShowNuevaCat(false); setModal('form')
  }
  const abrirStock = (p) => { setEditId(p.id); setStockForm({ cantidad:'', tipo:'entrada' }); setModal('stock') }

  const handleImagen = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 3*1024*1024) { setMsg('Imagen max 3MB'); return }
    const reader = new FileReader()
    reader.onload = (ev) => setForm(f => ({ ...f, imagen: ev.target.result }))
    reader.readAsDataURL(file)
  }

  const agregarCategoria = () => {
    if (!nuevaCategoria.trim()) return
    setCategorias(c => [...new Set([...c, nuevaCategoria.trim()])])
    setForm(f => ({ ...f, categoria: nuevaCategoria.trim() }))
    setNuevaCategoria(''); setShowNuevaCat(false)
  }

  const guardar = async () => {
    if (!form.nombre.trim()) { setMsg('Nombre requerido'); return }
    if (!+form.precio || +form.precio <= 0) { setMsg('Precio de venta requerido'); return }
    setLoading(true)
    try {
      const data = { ...form, costo:+(form.costo||0), precio:+(form.precio||0),
        iva_pct:+(form.iva_pct||0), stock:+(form.stock||0), stock_minimo:+(form.stock_minimo||5) }
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
    if (!confirm('Eliminar producto?')) return
    await api.deleteProducto(id); cargar()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-400 text-sm">{productos.length} productos registrados</p>
        <button onClick={abrirCrear}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
          style={{ background:'linear-gradient(135deg,#FF6B35,#F7931E)' }}>
          <Plus size={15}/> Nuevo producto
        </button>
      </div>

      {bajos.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 mb-4 flex items-start gap-2">
          <AlertTriangle size={15} className="text-orange-400 mt-0.5 shrink-0"/>
          <p className="text-xs text-orange-300"><strong>Stock bajo:</strong> {bajos.map(p=>p.nombre).join(', ')}</p>
        </div>
      )}

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
        <input value={busqueda} onChange={e=>setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, codigo o categoria..."
          className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"/>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtrados.map(p => (
          <div key={p.id} className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                {p.imagen
                  ? <img src={p.imagen} alt={p.nombre} className="w-10 h-10 rounded-xl object-cover shrink-0"/>
                  : <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                      <ShoppingBag size={16} className="text-purple-400"/>
                    </div>
                }
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{p.nombre}</p>
                  {p.categoria && <p className="text-xs text-gray-500">{p.categoria}</p>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0 ml-2">
                <button onClick={()=>abrirStock(p)} title="Ajustar stock"
                  className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">
                  <Package size={13}/>
                </button>
                <button onClick={()=>abrirEditar(p)}
                  className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10">
                  <Edit2 size={13}/>
                </button>
                <button onClick={()=>eliminar(p.id)}
                  className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">
                  <Trash2 size={13}/>
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xl font-bold ${p.stock===0?'text-red-400':p.stock<=p.stock_minimo?'text-orange-400':'text-green-400'}`}>
                {p.stock}<span className="text-xs font-normal text-gray-500 ml-1">{UNIDADES.find(u=>u.value===p.unidad)?.label || p.unidad}</span>
              </span>
              <div className="text-right">
                <p className="text-sm font-bold text-white">${Number(p.precio).toLocaleString('es-CO')}</p>
                {p.costo>0 && <p className="text-xs text-gray-500">costo: ${Number(p.costo).toLocaleString('es-CO')}</p>}
              </div>
            </div>
            {p.codigo && <p className="text-xs text-gray-600 mt-1">Cod: {p.codigo}</p>}
            {p.stock<=p.stock_minimo && (
              <div className="mt-2 text-xs text-orange-400 bg-orange-500/10 rounded-lg px-2 py-1 flex items-center gap-1">
                <AlertTriangle size={11}/> Stock bajo - min: {p.stock_minimo}
              </div>
            )}
          </div>
        ))}
        {filtrados.length===0 && (
          <div className="col-span-3 text-center py-12">
            <ShoppingBag size={40} className="mx-auto mb-3 text-gray-700"/>
            <p className="text-sm text-gray-500">Sin productos</p>
          </div>
        )}
      </div>

      {modal==='form' && (
        <Modal title={editId?'Editar producto':'Nuevo Producto'} onClose={()=>setModal(null)} wide>
          <div className="space-y-3">
            <Field label="Nombre" required>
              <input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})}
                placeholder="Nombre del producto" className={ic}/>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Codigo (auto)">
                <div className="flex gap-1">
                  <input value={form.codigo} readOnly
                    className={ic+' bg-white/3 text-gray-400 cursor-default flex-1'}/>
                  <button type="button" onClick={()=>setForm(f=>({...f,codigo:genCodigo()}))}
                    title="Regenerar codigo"
                    className="px-2.5 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 text-xs shrink-0">
                    ↻
                  </button>
                </div>
              </Field>
              <Field label="Codigo de Barras (opcional)">
                <input value={form.codigo_barras} onChange={e=>setForm({...form,codigo_barras:e.target.value})}
                  placeholder="Escanear o escribir..."
                  className={ic}/>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Precio Compra">
                <input type="number" min="0" value={form.costo}
                  onChange={e=>setForm({...form,costo:e.target.value})} className={ic}/>
              </Field>
              <Field label="Precio Venta" required>
                <input type="number" min="0" value={form.precio}
                  onChange={e=>setForm({...form,precio:e.target.value})} className={ic}/>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="IVA %">
                <input type="number" min="0" max="100" value={form.iva_pct}
                  onChange={e=>setForm({...form,iva_pct:e.target.value})} className={ic}/>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Stock Inicial">
                <input type="number" min="0" value={form.stock}
                  onChange={e=>setForm({...form,stock:e.target.value})} className={ic}/>
              </Field>
              <Field label="Stock Minimo">
                <input type="number" min="0" value={form.stock_minimo}
                  onChange={e=>setForm({...form,stock_minimo:e.target.value})} className={ic}/>
              </Field>
            </div>
            <Field label="Descripcion">
              <textarea value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})}
                rows={2} placeholder="Descripcion opcional..." className={ic+' resize-none'}/>
            </Field>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Imagen del producto</label>
              <div onClick={()=>fileRef.current?.click()}
                className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center cursor-pointer hover:border-purple-500/40 transition-colors">
                {form.imagen
                  ? <img src={form.imagen} alt="preview" className="h-20 mx-auto rounded-lg object-cover"/>
                  : <>
                      <Upload size={22} className="mx-auto mb-1 text-gray-600"/>
                      <p className="text-xs text-gray-500">Clic para subir imagen</p>
                      <p className="text-xs text-gray-600">JPG, PNG, WebP - max 3MB</p>
                    </>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagen}/>
              {form.imagen && (
                <button onClick={()=>setForm(f=>({...f,imagen:null}))}
                  className="text-xs text-red-400 mt-1 hover:underline">Quitar imagen</button>
              )}
            </div>
            {msg && <p className="text-xs text-red-400">{msg}</p>}
            <button onClick={guardar} disabled={loading}
              className="w-full py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
              style={{ background:'linear-gradient(135deg,#FF6B35,#F7931E)' }}>
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
                  className={`py-2 rounded-xl text-xs font-medium border-2 transition-all ${
                    stockForm.tipo===v?'border-purple-500 bg-purple-500/10 text-purple-300':'border-white/10 text-gray-500 hover:border-white/20'
                  }`}>{l}</button>
              ))}
            </div>
            <input type="number" min="0" value={stockForm.cantidad}
              onChange={e=>setStockForm({...stockForm,cantidad:e.target.value})}
              placeholder={stockForm.tipo==='ajuste'?'Nuevo stock total':'Cantidad'}
              className={ic}/>
            <button onClick={ajustar} disabled={!stockForm.cantidad||loading}
              className="w-full py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
              style={{ background:'linear-gradient(135deg,#FF6B35,#F7931E)' }}>
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
  const [busqProd, setBusqProd] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const cargar = async () => {
    const [cs, ps] = await Promise.all([api.getCombos(), api.getProductos()])
    setCombos(cs); setProductos(ps)
  }
  useEffect(() => { cargar() }, [])

  const prodsFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqProd.toLowerCase()) &&
    !form.items.find(i => i.producto_id === p.id)
  )

  const abrirCrear = () => { setForm(emptyCombo); setEditId(null); setMsg(''); setBusqProd(''); setModal('form') }
  const abrirEditar = (c) => {
    setForm({ nombre:c.nombre, precio:c.precio, icono:c.icono||'🎁', descripcion:c.descripcion||'', items:c.items||[] })
    setEditId(c.id); setMsg(''); setBusqProd(''); setModal('form')
  }

  const agregarProducto = (p) => {
    setForm(f => ({ ...f, items:[...f.items, { producto_id:p.id, nombre_producto:p.nombre, cantidad:1 }] }))
    setBusqProd('')
  }
  const quitarProducto = (idx) => setForm(f => ({ ...f, items:f.items.filter((_,i)=>i!==idx) }))
  const cambiarCantidad = (idx, val) => setForm(f => ({ ...f, items:f.items.map((it,i)=>i===idx?{...it,cantidad:+val}:it) }))

  const guardar = async () => {
    if (!form.nombre.trim()) { setMsg('Nombre requerido'); return }
    if (!+form.precio || +form.precio <= 0) { setMsg('Precio requerido'); return }
    const precioMinimo = form.items.reduce((s, it) => {
      const prod = productos.find(p => p.id === it.producto_id)
      return s + (prod?.precio || 0) * it.cantidad
    }, 0)
    if (+form.precio < precioMinimo) {
      setMsg(`El precio mínimo es $${precioMinimo.toLocaleString('es-CO')} (suma de productos)`); return
    }
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
    if (!confirm('Eliminar combo?')) return
    await api.deleteCombo(id); cargar()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-400 text-sm">{combos.length} combos registrados</p>
        <button onClick={abrirCrear}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
          style={{ background:'linear-gradient(135deg,#7C3AED,#A855F7)' }}>
          <Plus size={15}/> Nuevo combo
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {combos.map(c => (
          <div key={c.id} className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{c.icono||'🎁'}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{c.nombre}</p>
                  {c.descripcion && <p className="text-xs text-gray-500 truncate max-w-[140px]">{c.descripcion}</p>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={()=>abrirEditar(c)}
                  className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10">
                  <Edit2 size={13}/>
                </button>
                <button onClick={()=>eliminar(c.id)}
                  className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">
                  <Trash2 size={13}/>
                </button>
              </div>
            </div>
            <p className="text-lg font-bold text-purple-400">${Number(c.precio).toLocaleString('es-CO')}</p>
            <div className="mt-2 space-y-0.5">
              {(c.items||[]).map((it,i) => (
                <p key={i} className="text-xs text-gray-500">- {it.nombre_producto} x{it.cantidad}</p>
              ))}
            </div>
          </div>
        ))}
        {combos.length===0 && (
          <div className="col-span-3 text-center py-12">
            <Layers size={40} className="mx-auto mb-3 text-gray-700"/>
            <p className="text-sm text-gray-500">Sin combos</p>
            <p className="text-xs text-gray-600 mt-1">Crea paquetes de productos con precio especial</p>
          </div>
        )}
      </div>

      {modal==='form' && (
        <Modal title={editId?'Editar Combo / Receta':'Nuevo Combo / Receta'} onClose={()=>setModal(null)} wide>
          <div className="space-y-4">
            <Field label="Nombre del combo" required>
              <input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})}
                placeholder="Ej: Jugo de fresa, Combo almuerzo..." className={ic}/>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Precio de venta" required>
                <input type="number" min="0" value={form.precio}
                  onChange={e=>setForm({...form,precio:e.target.value})}
                  className={ic + (form.items.length > 0 && +form.precio < form.items.reduce((s,it)=>s+(productos.find(p=>p.id===it.producto_id)?.precio||0)*it.cantidad,0) ? ' border-red-500/60' : '')}/>
                {form.items.length > 0 && (() => {
                  const min = form.items.reduce((s,it)=>s+(productos.find(p=>p.id===it.producto_id)?.precio||0)*it.cantidad,0)
                  return <p className={`text-xs mt-1 ${+form.precio < min ? 'text-red-400' : 'text-gray-500'}`}>Mínimo: ${min.toLocaleString('es-CO')}</p>
                })()}
              </Field>
              <Field label="Icono">
                <div className="grid grid-cols-5 gap-1 max-h-28 overflow-y-auto p-1">
                  {COMBO_ICONOS.map(ico => (
                    <button key={ico} onClick={()=>setForm(f=>({...f,icono:ico}))}
                      className={`text-xl p-1.5 rounded-lg transition-all ${
                        form.icono===ico?'bg-purple-500/30 ring-2 ring-purple-500':'bg-white/5 hover:bg-white/10'
                      }`}>
                      {ico}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            <Field label="Descripcion">
              <input value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})}
                placeholder="Opcional..." className={ic}/>
            </Field>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">
                Productos del combo
              </label>

              {/* Grid de todos los productos disponibles */}
              <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto mb-3 pr-1">
                {productos.filter(p => !form.items.find(i => i.producto_id === p.id)).map(p => (
                  <button key={p.id} onClick={()=>agregarProducto(p)} type="button"
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-white/5 hover:bg-purple-500/20 hover:border-purple-500/40 border border-white/10 text-left transition-all">
                    <span className="text-lg">🍺</span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white truncate">{p.nombre}</p>
                      <p className="text-xs text-gray-500">${Number(p.precio).toLocaleString('es-CO')}</p>
                    </div>
                  </button>
                ))}
                {productos.length === 0 && (
                  <p className="col-span-2 text-xs text-gray-600 text-center py-3">Sin productos registrados</p>
                )}
              </div>

              {/* Items ya agregados */}
              {form.items.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-gray-500 mb-1">Agregados ({form.items.length}):</p>
                  {form.items.map((it,i) => (
                    <div key={i} className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-xl px-3 py-2">
                      <p className="text-sm text-white flex-1 truncate">{it.nombre_producto}</p>
                      <input type="number" min="1" value={it.cantidad}
                        onChange={e=>cambiarCantidad(i,e.target.value)}
                        className="w-14 px-2 py-1 bg-white/10 border border-white/10 rounded-lg text-sm text-white text-center focus:outline-none"/>
                      <button onClick={()=>quitarProducto(i)} className="text-red-400 hover:text-red-300 shrink-0">
                        <X size={14}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {msg && <p className="text-xs text-red-400">{msg}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={()=>setModal(null)}
                className="flex-1 py-2.5 rounded-xl text-gray-400 font-semibold text-sm bg-white/5 hover:bg-white/10">
                Cancelar
              </button>
              <button onClick={guardar} disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
                style={{ background:'linear-gradient(135deg,#7C3AED,#A855F7)' }}>
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
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Inventario</h1>
          <p className="text-gray-500 text-sm">Gestiona productos y combos</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 w-fit">
        <button onClick={()=>setTab('productos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab==='productos'?'bg-white/10 text-white':'text-gray-500 hover:text-gray-300'
          }`}>
          <ShoppingBag size={15}/> Productos
        </button>
        <button onClick={()=>setTab('combos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab==='combos'?'bg-white/10 text-white':'text-gray-500 hover:text-gray-300'
          }`}>
          <Layers size={15}/> Combos
        </button>
      </div>

      {tab==='productos' ? <SeccionProductos/> : <SeccionCombos/>}
    </div>
  )
}
