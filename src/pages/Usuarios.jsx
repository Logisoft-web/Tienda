import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Plus, Edit2, Trash2, Users, Shield, User, X, Eye, EyeOff } from 'lucide-react'

const emptyForm = { nombre: '', usuario: '', password: '', rol: 'cajero' }

export default function Usuarios() {
  const { user: me } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const cargar = () => api.getUsuarios().then(setUsuarios).catch(console.error)
  useEffect(() => { cargar() }, [])

  const abrirCrear = () => { setForm(emptyForm); setEditId(null); setMsg(''); setModal('form') }
  const abrirEditar = (u) => {
    setForm({ nombre: u.nombre, usuario: u.usuario, password: '', rol: u.rol, activo: u.activo })
    setEditId(u.id); setMsg(''); setModal('form')
  }

  const guardar = async () => {
    if (!form.nombre || !form.usuario) { setMsg('Nombre y usuario son requeridos'); return }
    if (!editId && !form.password) { setMsg('La contraseña es requerida'); return }
    setLoading(true)
    try {
      const data = { nombre: form.nombre, usuario: form.usuario, rol: form.rol, activo: form.activo ?? 1 }
      if (form.password) data.password = form.password
      if (editId) await api.updateUsuario(editId, data)
      else await api.createUsuario({ ...data, password: form.password })
      cargar(); setModal(null)
    } catch (err) { setMsg(err.message) }
    finally { setLoading(false) }
  }

  const eliminar = async (id) => {
    if (id === me.id) return
    if (!confirm('¿Desactivar este usuario?')) return
    await api.deleteUsuario(id); cargar()
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-dark">Usuarios</h1>
          <p className="text-gray-500 text-sm">{usuarios.filter(u => u.activo).length} usuarios activos</p>
        </div>
        <button onClick={abrirCrear}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg"
          style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}>
          <Plus size={16} /> Nuevo usuario
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {usuarios.map(u => (
          <div key={u.id} className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-all ${u.activo ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg ${u.rol === 'admin' ? 'bg-primary' : 'bg-blue-500'}`}>
                {u.nombre[0].toUpperCase()}
              </div>
              <div className="flex gap-1">
                <button onClick={() => abrirEditar(u)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
                  <Edit2 size={14} />
                </button>
                {u.id !== me.id && (
                  <button onClick={() => eliminar(u.id)} className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            <p className="font-semibold text-dark">{u.nombre}</p>
            <p className="text-sm text-gray-500">@{u.usuario}</p>

            <div className="flex items-center gap-2 mt-3">
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${u.rol === 'admin' ? 'bg-primary/10 text-primary' : 'bg-blue-50 text-blue-600'}`}>
                {u.rol === 'admin' ? <Shield size={11} /> : <User size={11} />}
                {u.rol === 'admin' ? 'Administrador' : 'Cajero'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.activo ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {u.activo ? 'Activo' : 'Inactivo'}
              </span>
              {u.id === me.id && <span className="text-xs text-gray-400">(tú)</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal === 'form' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl fade-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-display font-bold text-dark">{editId ? 'Editar usuario' : 'Nuevo usuario'}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre completo</label>
                <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Usuario (login)</label>
                <input value={form.usuario} onChange={e => setForm({ ...form, usuario: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {editId ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
                </label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary pr-10" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Rol</label>
                <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="cajero">Cajero</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              {editId && (
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-gray-600">Estado</label>
                  <button onClick={() => setForm({ ...form, activo: form.activo ? 0 : 1 })}
                    className={`relative w-10 h-5 rounded-full transition-colors ${form.activo ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.activo ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                  <span className="text-xs text-gray-500">{form.activo ? 'Activo' : 'Inactivo'}</span>
                </div>
              )}
              {msg && <p className="text-red-500 text-xs">{msg}</p>}
              <button onClick={guardar} disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}>
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
