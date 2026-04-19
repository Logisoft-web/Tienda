import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Shield, RefreshCw, Key, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'

const PLANES = [
  { id: '1mes',   label: '1 Mes',   dias: 30,  color: '#3b82f6' },
  { id: '6meses', label: '6 Meses', dias: 180, color: '#8b5cf6' },
  { id: '1año',   label: '1 Año',   dias: 365, color: '#10b981' },
]

function diasRestantes(fecha) {
  if (!fecha) return null
  const diff = new Date(fecha) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function SuperAdmin() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalPlan, setModalPlan] = useState(null)   // usuario seleccionado
  const [modalPass, setModalPass] = useState(null)   // usuario seleccionado
  const [nuevaPass, setNuevaPass] = useState('')
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('ok')

  const cargar = async () => {
    setLoading(true)
    try {
      const data = await api.superAdminGetUsuarios()
      setUsuarios(data)
    } catch (e) { mostrarMsg(e.message, 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  const mostrarMsg = (texto, tipo = 'ok') => {
    setMsg(texto); setMsgType(tipo)
    setTimeout(() => setMsg(''), 3500)
  }

  const asignarPlan = async (userId, plan) => {
    try {
      await api.superAdminAsignarPlan(userId, plan)
      mostrarMsg(`Plan ${plan} asignado correctamente`)
      setModalPlan(null)
      cargar()
    } catch (e) { mostrarMsg(e.message, 'error') }
  }

  const resetPlan = async (userId) => {
    if (!confirm('¿Desactivar acceso de este usuario?')) return
    try {
      await api.superAdminResetPlan(userId)
      mostrarMsg('Plan reiniciado — usuario desactivado')
      cargar()
    } catch (e) { mostrarMsg(e.message, 'error') }
  }

  const cambiarPassword = async (userId) => {
    if (!nuevaPass || nuevaPass.length < 6) { mostrarMsg('Mínimo 6 caracteres', 'error'); return }
    try {
      await api.superAdminCambiarPassword(userId, nuevaPass)
      mostrarMsg('Contraseña actualizada')
      setModalPass(null); setNuevaPass('')
    } catch (e) { mostrarMsg(e.message, 'error') }
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-dark">Super Administrador</h1>
            <p className="text-xs text-gray-500">Gestión de planes y accesos</p>
          </div>
        </div>
        <button onClick={cargar}
          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
          <RefreshCw size={16} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Mensaje */}
      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${msgType === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {msg}
        </div>
      )}

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Usuario</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Rol</th>
                <th className="text-center py-3 px-4 text-gray-500 font-medium">Estado</th>
                <th className="text-center py-3 px-4 text-gray-500 font-medium">Plan</th>
                <th className="text-center py-3 px-4 text-gray-500 font-medium">Vence</th>
                <th className="text-center py-3 px-4 text-gray-500 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => {
                const dias = diasRestantes(u.plan_expira)
                const expirado = dias !== null && dias <= 0
                const porVencer = dias !== null && dias > 0 && dias <= 7
                return (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-dark">{u.nombre}</p>
                      <p className="text-xs text-gray-400">@{u.usuario}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        u.rol === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                        u.rol === 'admin' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{u.rol}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {u.activo
                        ? <CheckCircle size={16} className="text-green-500 mx-auto" />
                        : <XCircle size={16} className="text-red-400 mx-auto" />}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {u.plan
                        ? <span className="text-xs font-semibold text-purple-600">{u.plan}</span>
                        : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {u.plan_expira ? (
                        <span className={`text-xs font-semibold flex items-center justify-center gap-1 ${
                          expirado ? 'text-red-500' : porVencer ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          <Clock size={12} />
                          {expirado ? 'Expirado' : `${dias}d`}
                        </span>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      {u.rol !== 'superadmin' && (
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setModalPlan(u)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                            <Calendar size={12} /> Plan
                          </button>
                          <button onClick={() => { setModalPass(u); setNuevaPass('') }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200">
                            <Key size={12} /> Pass
                          </button>
                          {u.plan && (
                            <button onClick={() => resetPlan(u.id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-500 hover:bg-red-100">
                              <XCircle size={12} /> Reset
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal asignar plan */}
      {modalPlan && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6">
            <h3 className="font-bold text-dark mb-1">Asignar plan</h3>
            <p className="text-sm text-gray-500 mb-5">Usuario: <strong>{modalPlan.nombre}</strong></p>
            <div className="space-y-3">
              {PLANES.map(p => (
                <button key={p.id} onClick={() => asignarPlan(modalPlan.id, p.id)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 hover:border-purple-400 transition-all"
                  style={{ borderColor: p.color + '40', background: p.color + '08' }}>
                  <span className="font-semibold" style={{ color: p.color }}>{p.label}</span>
                  <span className="text-xs text-gray-400">{p.dias} días</span>
                </button>
              ))}
            </div>
            <button onClick={() => setModalPlan(null)}
              className="w-full mt-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal cambiar contraseña */}
      {modalPass && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6">
            <h3 className="font-bold text-dark mb-1">Cambiar contraseña</h3>
            <p className="text-sm text-gray-500 mb-4">Usuario: <strong>{modalPass.nombre}</strong></p>
            <input type="password" value={nuevaPass} onChange={e => setNuevaPass(e.target.value)}
              placeholder="Nueva contraseña (mín. 6 caracteres)"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 mb-4" />
            <div className="flex gap-2">
              <button onClick={() => cambiarPassword(modalPass.id)}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                Guardar
              </button>
              <button onClick={() => { setModalPass(null); setNuevaPass('') }}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
