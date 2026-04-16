import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Plus, Edit2, Trash2, Package, AlertTriangle, Search, X, Check } from 'lucide-react'

const CATEGORIAS = ['Chelada', 'Bebida', 'Accesorio', 'Ingrediente', 'Otro']

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-display font-bold text-dark">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

const emptyForm = { nombre: '', categoria: 'Chelada', precio: '', costo: '', stock: '', stock_minimo: '5', unidad: 'unidad' }

export default function Inventario() {
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(null) // null | 'crear' | 'editar' | 'stock'
  const [form, setForm] = useState(emptyForm)
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

  const abrirCrear = () => { setForm(emptyForm); setEditId(null); setModal('crear') }
  const abrirEditar = (p) => {
    setForm({ nombre: p.nombre, categoria: p.categoria, precio: p.precio, costo: p.costo, stock: p.stock, stock_minimo: p.stock_minimo, unidad: p.unidad })
    setEditId(p.id); setModal('editar')
  }
  const abrirStock = (p) => { setEditId(p.id); setStockForm({ cantidad: '', tipo: 'entrada' }); setModal('stock') }

  const guardar = async () => {
    setLoading(true)
    try {
      const data = { ...form, precio: parseFloat(form.precio), costo: parseFloat(form.costo || 0), stock: parseInt(form.stock || 0), stock_minimo: parseInt(form.stock_minimo || 5) }
      if (editId) await api.updateProducto(editId, { ...data, activo: 1 })
      else await api.createProducto(data)
      setMsg('Guardado correctamente')
      cargar(); setModal(null)
    } catch (err) { setMsg(err.message) }
    finally { setLoading(false) }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar producto?')) return
    await api.deleteProducto(id); cargar()
  }

  const ajustarStock = async () => {
    setLoading(true)
    try {
      await api.ajustarStock(editId, { cantidad: parseInt(stockForm.cantidad), tipo: stockForm.tipo })
      cargar(); setModal(null)
    } catch (err) { setMsg(err.message) }
    finally { setLoading(false) }
  }

  const stockBajo = productos.filter(p => p.stock <= p.stock_minimo)

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-dark">Inventario</h1>
          <p className="text-gray-500 text-sm">{productos.length} productos registrados</p>
        </div>
        <button onClick={abrirCrear}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}>
          <Plus size={16} /> Nuevo producto
        </button>
      </div>

      {/* Alerta stock bajo */}
      {stockBajo.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-orange-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-orange-700">Stock bajo en {stockBajo.length} producto(s)</p>
            <p className="text-xs text-orange-600 mt-0.5">{stockBajo.map(p => p.nombre).join(', ')}</p>
          </div>
        </div>
      )}

      {/* Búsqueda */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar producto o categoría..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Producto</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Categoría</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Precio</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Costo</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Stock</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Mín.</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-dark">{p.nombre}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">{p.categoria}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-dark">${p.precio.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-gray-500">${p.costo.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold ${p.stock === 0 ? 'text-red-500' : p.stock <= p.stock_minimo ? 'text-orange-500' : 'text-green-600'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">{p.stock_minimo}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => abrirStock(p)} title="Ajustar stock"
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors">
                        <Package size={14} />
                      </button>
                      <button onClick={() => abrirEditar(p)} title="Editar"
                        className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => eliminar(p.id)} title="Eliminar"
                        className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtrados.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Package size={40} className="mx-auto mb-2 opacity-30" />
              <p>No hay productos</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal crear/editar */}
      {(modal === 'crear' || modal === 'editar') && (
        <Modal title={modal === 'crear' ? 'Nuevo producto' : 'Editar producto'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            {[
              { key: 'nombre', label: 'Nombre', type: 'text' },
              { key: 'precio', label: 'Precio de venta', type: 'number' },
              { key: 'costo', label: 'Costo', type: 'number' },
              { key: 'stock', label: 'Stock inicial', type: 'number' },
              { key: 'stock_minimo', label: 'Stock mínimo', type: 'number' },
              { key: 'unidad', label: 'Unidad', type: 'text' },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
              <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
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

      {/* Modal stock */}
      {modal === 'stock' && (
        <Modal title="Ajustar stock" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de movimiento</label>
              <div className="grid grid-cols-3 gap-2">
                {[['entrada', '📥 Entrada'], ['salida', '📤 Salida'], ['ajuste', '🔧 Ajuste']].map(([v, l]) => (
                  <button key={v} onClick={() => setStockForm({ ...stockForm, tipo: v })}
                    className={`py-2 rounded-xl text-xs font-medium border-2 transition-all ${stockForm.tipo === v ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-500'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {stockForm.tipo === 'ajuste' ? 'Nuevo stock total' : 'Cantidad'}
              </label>
              <input type="number" min="0" value={stockForm.cantidad}
                onChange={e => setStockForm({ ...stockForm, cantidad: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <button onClick={ajustarStock} disabled={!stockForm.cantidad || loading}
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
