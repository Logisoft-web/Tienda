import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Plus, Edit2, Trash2, Package, AlertTriangle, Search, X, FlaskConical, BookOpen } from 'lucide-react'

const CATEGORIAS = ['Chelada', 'Bebida', 'Accesorio', 'Ingrediente', 'Otro']
const UNIDADES = ['pieza', 'botella', 'lata', 'gramo', 'ml', 'unidad', 'vaso']

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="font-display font-bold text-dark">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ── TAB PRODUCTOS ─────────────────────────────────────────────────────────────
const emptyProd = { nombre: '', categoria: 'Chelada', precio: '', costo: '', stock: '', stock_minimo: '5', unidad: 'vaso' }

function TabProductos() {
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyProd)
  const [editId, setEditId] = useState(null)
  const [stockForm, setStockForm] = useState({ cantidad: '', tipo: 'entrada' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const cargar = () => api.getProductos().then(setProductos).catch(console.error)
  useEffect(() => { cargar() }, [])

  const filtrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.categoria.toLowerCase().includes(busqueda.toLowerCase())
  )

  const abrirCrear = () => { setForm(emptyProd); setEditId(null); setMsg(''); setModal('form') }
  const abrirEditar = (p) => {
    setForm({ nombre: p.nombre, categoria: p.categoria, precio: p.precio, costo: p.costo, stock: p.stock, stock_minimo: p.stock_minimo, unidad: p.unidad })
    setEditId(p.id); setMsg(''); setModal('form')
  }
  const abrirStock = (p) => { setEditId(p.id); setStockForm({ cantidad: '', tipo: 'entrada' }); setModal('stock') }

  const guardar = async () => {
    setLoading(true)
    try {
      const data = { ...form, precio: +form.precio, costo: +(form.costo||0), stock: +(form.stock||0), stock_minimo: +(form.stock_minimo||5) }
      if (editId) await api.updateProducto(editId, { ...data, activo: 1 })
      else await api.createProducto(data)
      cargar(); setModal(null)
    } catch (err) { setMsg(err.message) }
    finally { setLoading(false) }
  }

  const ajustarStock = async () => {
    setLoading(true)
    try {
      await api.ajustarStock(editId, { cantidad: +stockForm.cantidad, tipo: stockForm.tipo })
      cargar(); setModal(null)
    } catch (err) { setMsg(err.message) }
    finally { setLoading(false) }
  }

  const stockBajo = productos.filter(p => p.stock <= p.stock_minimo)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{productos.length} productos</p>
        <button onClick={abrirCrear}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm"
          style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}>
          <Plus size={15} /> Nuevo producto
        </button>
      </div>

      {stockBajo.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 flex items-start gap-2">
          <AlertTriangle size={16} className="text-orange-500 mt-0.5 shrink-0" />
          <p className="text-xs text-orange-700">Stock bajo: {stockBajo.map(p => p.nombre).join(', ')}</p>
        </div>
      )}

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar producto..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Producto</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Categoría</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Precio</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Stock</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-dark">{p.nombre}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">{p.categoria}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">${p.precio.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold ${p.stock === 0 ? 'text-red-500' : p.stock <= p.stock_minimo ? 'text-orange-500' : 'text-green-600'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => abrirStock(p)} title="Stock"
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100"><Package size={13} /></button>
                      <button onClick={() => abrirEditar(p)} title="Editar"
                        className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200"><Edit2 size={13} /></button>
                      <button onClick={() => { api.deleteProducto(p.id); cargar() }} title="Eliminar"
                        className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtrados.length === 0 && (
            <div className="text-center py-10 text-gray-400"><Package size={36} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Sin productos</p></div>
          )}
        </div>
      </div>

      {modal === 'form' && (
        <Modal title={editId ? 'Editar producto' : 'Nuevo producto'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            {[['nombre','Nombre','text'],['precio','Precio de venta','number'],['costo','Costo','number'],['stock','Stock inicial','number'],['stock_minimo','Stock mínimo','number']].map(([k,l,t]) => (
              <div key={k}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                <input type={t} value={form[k]} onChange={e => setForm({...form,[k]:e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
              <select value={form.categoria} onChange={e => setForm({...form,categoria:e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unidad</label>
              <select value={form.unidad} onChange={e => setForm({...form,unidad:e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                {UNIDADES.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            {msg && <p className="text-xs text-red-500">{msg}</p>}
            <button onClick={guardar} disabled={loading}
              className="w-full py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'stock' && (
        <Modal title="Ajustar stock" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[['entrada','📥 Entrada'],['salida','📤 Salida'],['ajuste','🔧 Ajuste']].map(([v,l]) => (
                <button key={v} onClick={() => setStockForm({...stockForm,tipo:v})}
                  className={`py-2 rounded-xl text-xs font-medium border-2 transition-all ${stockForm.tipo===v?'border-primary bg-primary/5 text-primary':'border-gray-100 text-gray-500'}`}>
                  {l}
                </button>
              ))}
            </div>
            <input type="number" min="0" value={stockForm.cantidad}
              onChange={e => setStockForm({...stockForm,cantidad:e.target.value})}
              placeholder={stockForm.tipo==='ajuste'?'Nuevo stock total':'Cantidad'}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <button onClick={ajustarStock} disabled={!stockForm.cantidad||loading}
              className="w-full py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}>
              Aplicar
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── TAB INSUMOS ───────────────────────────────────────────────────────────────
const emptyIns = { nombre: '', unidad: 'pieza', stock: '', stock_minimo: '10' }

function TabInsumos() {
  const [insumos, setInsumos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyIns)
  const [editId, setEditId] = useState(null)
  const [stockForm, setStockForm] = useState({ cantidad: '', tipo: 'entrada' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const cargar = () => api.getInsumos().then(setInsumos).catch(console.error)
  useEffect(() => { cargar() }, [])

  const filtrados = insumos.filter(i => i.nombre.toLowerCase().includes(busqueda.toLowerCase()))

  const abrirCrear = () => { setForm(emptyIns); setEditId(null); setMsg(''); setModal('form') }
  const abrirEditar = (i) => {
    setForm({ nombre: i.nombre, unidad: i.unidad, stock: i.stock, stock_minimo: i.stock_minimo })
    setEditId(i.id); setMsg(''); setModal('form')
  }
  const abrirStock = (i) => { setEditId(i.id); setStockForm({ cantidad: '', tipo: 'entrada' }); setModal('stock') }

  const guardar = async () => {
    setLoading(true)
    try {
      const data = { ...form, stock: +(form.stock||0), stock_minimo: +(form.stock_minimo||10) }
      if (editId) await api.updateInsumo(editId, { ...data, activo: true })
      else await api.createInsumo(data)
      cargar(); setModal(null)
    } catch (err) { setMsg(err.message) }
    finally { setLoading(false) }
  }

  const ajustar = async () => {
    setLoading(true)
    try {
      await api.ajustarStockInsumo(editId, { cantidad: +stockForm.cantidad, tipo: stockForm.tipo })
      cargar(); setModal(null)
    } finally { setLoading(false) }
  }

  const bajos = insumos.filter(i => i.stock <= i.stock_minimo)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{insumos.length} insumos</p>
        <button onClick={abrirCrear}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm"
          style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}>
          <Plus size={15} /> Nuevo insumo
        </button>
      </div>

      {bajos.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 flex items-start gap-2">
          <AlertTriangle size={16} className="text-orange-500 mt-0.5 shrink-0" />
          <p className="text-xs text-orange-700">Insumos bajos: {bajos.map(i => i.nombre).join(', ')}</p>
        </div>
      )}

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar insumo..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtrados.map(ins => (
          <div key={ins.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <FlaskConical size={16} className="text-primary" />
              </div>
              <div className="flex gap-1">
                <button onClick={() => abrirStock(ins)}
                  className="p-1.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100"><Package size={13} /></button>
                <button onClick={() => abrirEditar(ins)}
                  className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200"><Edit2 size={13} /></button>
                <button onClick={() => { api.deleteInsumo(ins.id); cargar() }}
                  className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100"><Trash2 size={13} /></button>
              </div>
            </div>
            <p className="text-sm font-semibold text-dark">{ins.nombre}</p>
            <p className="text-xs text-gray-400 mt-0.5">{ins.unidad}</p>
            <div className="flex items-center justify-between mt-3">
              <span className={`text-lg font-bold ${ins.stock === 0 ? 'text-red-500' : ins.stock <= ins.stock_minimo ? 'text-orange-500' : 'text-green-600'}`}>
                {ins.stock}
              </span>
              <span className="text-xs text-gray-400">mín: {ins.stock_minimo}</span>
            </div>
            {ins.stock <= ins.stock_minimo && (
              <div className="mt-2 text-xs text-orange-600 bg-orange-50 rounded-lg px-2 py-1 flex items-center gap-1">
                <AlertTriangle size={11} /> Stock bajo
              </div>
            )}
          </div>
        ))}
      </div>

      {modal === 'form' && (
        <Modal title={editId ? 'Editar insumo' : 'Nuevo insumo'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
              <input value={form.nombre} onChange={e => setForm({...form,nombre:e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unidad de medida</label>
              <select value={form.unidad} onChange={e => setForm({...form,unidad:e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                {UNIDADES.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Stock inicial</label>
              <input type="number" value={form.stock} onChange={e => setForm({...form,stock:e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Stock mínimo (alerta)</label>
              <input type="number" value={form.stock_minimo} onChange={e => setForm({...form,stock_minimo:e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            {msg && <p className="text-xs text-red-500">{msg}</p>}
            <button onClick={guardar} disabled={loading}
              className="w-full py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'stock' && (
        <Modal title="Ajustar stock" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[['entrada','📥 Entrada'],['salida','📤 Salida'],['ajuste','🔧 Ajuste']].map(([v,l]) => (
                <button key={v} onClick={() => setStockForm({...stockForm,tipo:v})}
                  className={`py-2 rounded-xl text-xs font-medium border-2 transition-all ${stockForm.tipo===v?'border-primary bg-primary/5 text-primary':'border-gray-100 text-gray-500'}`}>
                  {l}
                </button>
              ))}
            </div>
            <input type="number" min="0" value={stockForm.cantidad}
              onChange={e => setStockForm({...stockForm,cantidad:e.target.value})}
              placeholder={stockForm.tipo==='ajuste'?'Nuevo stock total':'Cantidad'}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <button onClick={ajustar} disabled={!stockForm.cantidad||loading}
              className="w-full py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}>
              Aplicar
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── TAB RECETAS ───────────────────────────────────────────────────────────────
function TabRecetas() {
  const [productos, setProductos] = useState([])
  const [insumos, setInsumos] = useState([])
  const [recetas, setRecetas] = useState([])
  const [modal, setModal] = useState(false)
  const [prodSel, setProdSel] = useState(null)
  const [ingredientes, setIngredientes] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const cargar = async () => {
    const [p, i, r] = await Promise.all([api.getProductos(), api.getInsumos(), api.getRecetas()])
    setProductos(p.filter(p => p.categoria === 'Chelada' || p.categoria === 'Bebida'))
    setInsumos(i)
    setRecetas(r)
  }
  useEffect(() => { cargar() }, [])

  const abrirReceta = (prod) => {
    const receta = recetas.find(r => r.producto_id === prod.id)
    setProdSel(prod)
    setIngredientes(receta?.ingredientes?.map(i => ({ ...i })) || [])
    setMsg(''); setModal(true)
  }

  const addIngrediente = () => setIngredientes(prev => [...prev, { insumo_id: '', insumo_nombre: '', cantidad: 1 }])

  const updateIng = (idx, field, value) => {
    setIngredientes(prev => prev.map((ing, i) => {
      if (i !== idx) return ing
      if (field === 'insumo_id') {
        const ins = insumos.find(in2 => in2.id === value)
        return { ...ing, insumo_id: value, insumo_nombre: ins?.nombre || '' }
      }
      return { ...ing, [field]: field === 'cantidad' ? +value : value }
    }))
  }

  const removeIng = (idx) => setIngredientes(prev => prev.filter((_, i) => i !== idx))

  const guardar = async () => {
    if (!prodSel) return
    const ings = ingredientes.filter(i => i.insumo_id && i.cantidad > 0)
    setLoading(true)
    try {
      await api.saveReceta({ producto_id: prodSel.id, producto_nombre: prodSel.nombre, ingredientes: ings })
      cargar(); setModal(false)
    } catch (err) { setMsg(err.message) }
    finally { setLoading(false) }
  }

  const getReceta = (prod_id) => recetas.find(r => r.producto_id === prod_id)

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm text-gray-500">Define qué insumos se descuentan automáticamente al vender cada producto.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {productos.map(prod => {
          const receta = getReceta(prod.id)
          return (
            <div key={prod.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-dark">{prod.nombre}</p>
                  <p className="text-xs text-gray-400">{prod.categoria} · ${prod.precio.toFixed(2)}</p>
                </div>
                <button onClick={() => abrirReceta(prod)}
                  className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  <Edit2 size={14} />
                </button>
              </div>

              {receta?.ingredientes?.length ? (
                <div className="space-y-1">
                  {receta.ingredientes.map((ing, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-2 py-1">
                      <span className="text-gray-600 truncate">{ing.insumo_nombre}</span>
                      <span className="font-semibold text-dark ml-2 shrink-0">×{ing.cantidad}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <button onClick={() => abrirReceta(prod)}
                  className="w-full py-2 text-xs text-primary border border-dashed border-primary/30 rounded-xl hover:bg-primary/5 transition-colors">
                  + Agregar receta
                </button>
              )}
            </div>
          )
        })}
      </div>

      {modal && prodSel && (
        <Modal title={`Receta: ${prodSel.nombre}`} onClose={() => setModal(false)}>
          <div className="space-y-3">
            <p className="text-xs text-gray-500">Al vender 1 unidad de este producto se descontarán los siguientes insumos:</p>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {ingredientes.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2">
                  <select value={ing.insumo_id}
                    onChange={e => updateIng(idx, 'insumo_id', e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">-- Insumo --</option>
                    {insumos.map(i => <option key={i.id} value={i.id}>{i.nombre} ({i.unidad})</option>)}
                  </select>
                  <input type="number" min="0.1" step="0.1" value={ing.cantidad}
                    onChange={e => updateIng(idx, 'cantidad', e.target.value)}
                    className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-center focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <button onClick={() => removeIng(idx)} className="text-red-400 hover:text-red-600 p-1">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <button onClick={addIngrediente}
              className="w-full py-2 text-xs text-primary border border-dashed border-primary/30 rounded-xl hover:bg-primary/5 transition-colors flex items-center justify-center gap-1">
              <Plus size={13} /> Agregar insumo
            </button>

            {msg && <p className="text-xs text-red-500">{msg}</p>}

            <button onClick={guardar} disabled={loading}
              className="w-full py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}>
              {loading ? 'Guardando...' : 'Guardar receta'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── PÁGINA PRINCIPAL CON TABS ─────────────────────────────────────────────────
const TABS = [
  { id: 'productos', label: 'Productos', icon: Package },
  { id: 'insumos',   label: 'Insumos',   icon: FlaskConical },
  { id: 'recetas',   label: 'Recetas',   icon: BookOpen },
]

export default function Inventario() {
  const [tab, setTab] = useState('productos')

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-5">
        <h1 className="font-display font-bold text-2xl text-dark">Inventario</h1>
        <p className="text-gray-500 text-sm">Gestiona productos, insumos y recetas</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-white text-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {tab === 'productos' && <TabProductos />}
      {tab === 'insumos'   && <TabInsumos />}
      {tab === 'recetas'   && <TabRecetas />}
    </div>
  )
}
