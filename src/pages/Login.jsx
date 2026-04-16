import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import { Beer, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [form, setForm] = useState({ usuario: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.login(form)
      login(data.token, data.user)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — branding */}
      <div className="hidden lg:flex flex-col items-center justify-center w-1/2 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FDC830 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <img src="/logo.png" alt="Enjoy Cheladas" className="w-40 h-40 rounded-full object-cover shadow-2xl mb-8 border-4 border-white/30" />
        <h1 className="font-display font-bold text-white text-4xl text-center leading-tight">
          Enjoy<br />Cheladas
        </h1>
        <p className="text-white/80 mt-3 text-lg">Sistema de Punto de Venta</p>
        <div className="mt-10 flex gap-6 text-white/70 text-sm">
          <div className="text-center">
            <p className="font-bold text-white text-2xl">🍺</p>
            <p>Ventas</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-white text-2xl">📦</p>
            <p>Inventario</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-white text-2xl">📊</p>
            <p>Reportes</p>
          </div>
        </div>
      </div>

      {/* Panel derecho — login */}
      <div className="flex-1 flex items-center justify-center px-6 bg-white">
        <div className="w-full max-w-sm fade-in">
          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src="/logo.png" alt="Enjoy Cheladas" className="w-24 h-24 rounded-full object-cover shadow-lg" />
          </div>

          <h2 className="font-display font-bold text-3xl text-dark mb-1">Bienvenido</h2>
          <p className="text-gray-500 mb-8 text-sm">Ingresa tus credenciales para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
              <input
                type="text"
                value={form.usuario}
                onChange={e => setForm({ ...form, usuario: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="tu_usuario"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all pr-12"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            Enjoy Cheladas POS v1.0 · San Gil
          </p>
        </div>
      </div>
    </div>
  )
}
