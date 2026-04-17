import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Plus, Edit2, Trash2, User, Search, X, Phone, Mail } from 'lucide-react'

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

const empty = { nombre: '', telefono: '', email: '', notas: '' }

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const cargar = () => api.getClientes().then(setClientes).catch(console.error)
  useEffect(() => { cargar() }, [])

  const filtrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.telefono || '').includes(busqueda)
  )

  const abrirCrear = () => { setForm(empty); setEditId(null); setMsg(''); setModal(true) }
  const abrirEditar = (c) => { setForm({ nombre: c.nombre, telefono: c.telefono||'', email: c.email||'', notas: c.notas||'' }); setEditId(c.id); setMsg(''); setModal(true) }

  const guardar = async () => {
    if (!form.nombre.trim()) { setMsg('Nombre requerido'); return }
    setLoading(true)
    try {
      if (editId) await api.updateCliente(editId, form)
      else await api.createCliente(form)
      cargar(); setModal(false)
    } catch (err) { setMsg(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display font-bold text-2xl text-dark">Clientes</h1>
          <p className="text-gray-500 text-sm">{clientes.length} registrados</p>
        </div>
        <button onClick={abrirCrear}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm"
          style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}>
          <Plus size={15} /> Nuevo cliente
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o teléfono..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtrados.map(c => (
          <div key={c.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold text-sm">{c.nombre[0]?.toUpperCase()}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => abrirEditar(c)} className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200"><Edit2 size={13} /></button>
                <button onClick={() => { api.deleteCliente(c.id); cargar() }} className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100"><Trash2 size={13} /></button>
              </div>
            </div>
            <p className="text-sm font-semibold text-dark">{c.nombre}</p>
            {c.telefono && <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Phone size={10} />{c.telefono}</p>}
            {c.email && <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><Mail size={10} />{c.email}</p>}
            {c.notas && <p className="text-xs text-gray-400 mt-1 italic truncate">{c.notas}</p>}
          </div>
        ))}
        {filtrados.length === 0 && (
          <div className="col-span-3 text-center py-10 text-gray-400">
            <User size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sin clientes registrados</p>
          </div>
        )}
      </div>

      {modal && (
        <Modal title={editId ? 'Editar cliente' : 'Nuevo cliente'} onClose={() => setModal(false)}>
          <div className="space-y-3">
            {[['nombre','Nombre *','text'],['telefono','Teléfono','tel'],['email','Email','email'],['notas','Notas','text']].map(([k,l,t]) => (
              <div key={k}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                <input type={t} value={form[k]} onChange={e => setForm({...form,[k]:e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            ))}
            {msg && <p className="text-xs text-red-500">{msg}</p>}
            <button onClick={guardar} disabled={loading}
              className="w-full py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
