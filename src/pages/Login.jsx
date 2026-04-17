import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

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
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>

      {/* Panel izquierdo — branding */}
      <div className="hidden lg:flex flex-col items-center justify-center w-5/12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #F4622A 0%, #E8920A 100%)' }}>

        {/* Patrón de fondo sutil */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '28px 28px'
          }} />

        {/* Glow ambiental */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: '#fff' }} />

        <div className="relative z-10 flex flex-col items-center text-center px-12">
          <div className="w-28 h-28 rounded-2xl overflow-hidden mb-8 shadow-2xl"
            style={{ border: '3px solid rgba(255,255,255,0.4)' }}>
            <img src="/logo.png" alt="Enjoy Cheladas" className="w-full h-full object-cover" />
          </div>

          <h1 className="font-display text-5xl mb-2 text-white" style={{ letterSpacing: '0.06em' }}>
            ENJOY<br />CHELADAS
          </h1>
          <p className="text-sm font-medium mb-12" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Sistema de Punto de Venta
          </p>

          <div className="flex gap-8">
            {[['🍺', 'Ventas'], ['📦', 'Inventario'], ['📊', 'Reportes']].map(([emoji, label]) => (
              <div key={label} className="text-center">
                <div className="text-2xl mb-1">{emoji}</div>
                <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center px-6" style={{ background: 'var(--bg-base)' }}>
        <div className="w-full max-w-sm fade-in">

          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg"
              style={{ border: '2px solid var(--border-hover)' }}>
              <img src="/logo.png" alt="Enjoy Cheladas" className="w-full h-full object-cover" />
            </div>
          </div>

          <h2 className="font-display text-4xl mb-1" style={{ color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
            BIENVENIDO
          </h2>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
            Ingresa tus credenciales para continuar
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}>
                Usuario
              </label>
              <input
                type="text"
                value={form.usuario}
                onChange={e => setForm({ ...form, usuario: e.target.value })}
                className="input-dark"
                placeholder="tu_usuario"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}>
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input-dark pr-11"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-dim)' }}>
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl"
                style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger-border)' }}>
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 mt-2"
              style={{
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(244,98,42,0.35)'
              }}>
              {loading ? 'Ingresando...' : 'Ingresar al sistema'}
            </button>
          </form>

          <p className="text-center text-xs mt-8" style={{ color: 'var(--text-dim)' }}>
            Enjoy Cheladas POS · San Gil, Colombia
          </p>
        </div>
      </div>
    </div>
  )
}
