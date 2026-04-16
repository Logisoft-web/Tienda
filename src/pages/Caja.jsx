import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { DollarSign, TrendingUp, TrendingDown, Lock, Unlock, Plus, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function Caja() {
  const { isAdmin, user } = useAuth()
  const [caja, setCaja] = useState(undefined) // undefined=cargando, null=cerrada
  const [movimientos, setMovimientos] = useState([])
  const [montoApertura, setMontoApertura] = useState('')
  const [montoCierre, setMontoCierre] = useState('')
  const [showApertura, setShowApertura] = useState(false)
  const [showCierre, setShowCierre] = useState(false)
  const [showMovimiento, setShowMovimiento] = useState(false)
  const [movForm, setMovForm] = useState({ tipo: 'ingreso', concepto: '', monto: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const hoy = format(new Date(), 'yyyy-MM-dd')

  const cargar = async () => {
    const [c, m] = await Promise.all([
      api.getCajaEstado().catch(() => null),
      api.getMovimientos({ fecha: hoy }).catch(() => [])
    ])
    setCaja(c)
    setMovimientos(m)
  }

  useEffect(() => { cargar() }, [])

  const totalIngresos = movimientos.filter(m => m.tipo === 'ingreso' || m.tipo === 'apertura').reduce((s, m) => s + m.monto, 0)
  const totalEgresos = movimientos.filter(m => m.tipo === 'egreso' || m.tipo === 'cierre').reduce((s, m) => s + m.monto, 0)
  const saldoActual = totalIngresos - totalEgresos

  const abrirCaja = async () => {
    setLoading(true)
    try {
      await api.abrirCaja({ monto_inicial: parseFloat(montoApertura || 0) })
      setShowApertura(false); setMontoApertura(''); cargar()
    } catch (err) { setMsg(err.message) }
    finally { setLoading(false) }
  }

  const cerrarCaja = async () => {
    setLoading(true)
    try {
      await api.cerrarCaja({ monto_final: parseFloat(montoCierre || saldoActual) })
      setShowCierre(false); setMontoCierre(''); cargar()
    } catch (err) { setMsg(err.message) }
    finally { setLoading(false) }
  }

  const agregarMovimiento = async () => {
    setLoading(true)
    try {
      await api.addMovimiento({ ...movForm, monto: parseFloat(movForm.monto) })
      setShowMovimiento(false); setMovForm({ tipo: 'ingreso', concepto: '', monto: '' }); cargar()
    } catch (err) { setMsg(err.message) }
    finally { setLoading(false) }
  }

  const tipoColor = (tipo) => {
    if (tipo === 'ingreso' || tipo === 'apertura') return 'text-green-600 bg-green-50'
    return 'text-red-500 bg-red-50'
  }

  const tipoIcon = (tipo) => {
    if (tipo === 'ingreso' || tipo === 'apertura') return '+'
    return '-'
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-dark">Caja</h1>
          <p className="text-gray-500 text-sm capitalize">{format(new Date(), "EEEE d 'de' MMMM", { locale: es })}</p>
        </div>
        <button onClick={cargar} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
          <RefreshCw size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Estado de caja */}
      <div className={`rounded-2xl p-5 mb-6 flex items-center justify-between ${caja ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-center gap-3">
          {caja ? <Unlock size={24} className="text-green-600" /> : <Lock size={24} className="text-red-500" />}
          <div>
            <p className={`font-bold text-lg ${caja ? 'text-green-700' : 'text-red-600'}`}>
              Caja {caja ? 'ABIERTA' : 'CERRADA'}
            </p>
            {caja && <p className="text-xs text-green-600">Abierta a las {format(new Date(caja.abierta_en), 'HH:mm')}</p>}
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            {!caja ? (
              <button onClick={() => setShowApertura(true)}
                className="px-4 py-2 rounded-xl text-white text-sm font-semibold"
                style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}>
                Abrir caja
              </button>
            ) : (
              <>
                <button onClick={() => setShowMovimiento(true)}
                  className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1">
                  <Plus size={14} /> Movimiento
                </button>
                <button onClick={() => setShowCierre(true)}
                  className="px-4 py-2 rounded-xl bg-dark text-white text-sm font-semibold">
                  Cerrar caja
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <TrendingUp size={20} className="text-green-500 mx-auto mb-1" />
          <p className="text-xs text-gray-500">Ingresos</p>
          <p className="font-bold text-green-600 text-lg">${totalIngresos.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <TrendingDown size={20} className="text-red-400 mx-auto mb-1" />
          <p className="text-xs text-gray-500">Egresos</p>
          <p className="font-bold text-red-500 text-lg">${totalEgresos.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <DollarSign size={20} className="text-primary mx-auto mb-1" />
          <p className="text-xs text-gray-500">Saldo</p>
          <p className="font-bold text-primary text-lg">${saldoActual.toFixed(2)}</p>
        </div>
      </div>

      {/* Movimientos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-display font-semibold text-dark">Movimientos del día</h3>
        </div>
        <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
          {movimientos.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <DollarSign size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sin movimientos hoy</p>
            </div>
          ) : (
            movimientos.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${tipoColor(m.tipo)}`}>
                  {tipoIcon(m.tipo)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark truncate">{m.concepto}</p>
                  <p className="text-xs text-gray-400">{m.usuario} · {format(new Date(m.creado_en), 'HH:mm')}</p>
                </div>
                <p className={`font-bold text-sm ${m.tipo === 'ingreso' || m.tipo === 'apertura' ? 'text-green-600' : 'text-red-500'}`}>
                  {tipoIcon(m.tipo)}${m.monto.toFixed(2)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal apertura */}
      {showApertura && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full fade-in">
            <h3 className="font-display font-bold text-xl text-dark mb-4">Abrir caja</h3>
            <label className="block text-sm text-gray-600 mb-1">Monto inicial en caja</label>
            <input type="number" value={montoApertura} onChange={e => setMontoApertura(e.target.value)}
              placeholder="0.00" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4" />
            {msg && <p className="text-red-500 text-xs mb-3">{msg}</p>}
            <div className="flex gap-3">
              <button onClick={() => setShowApertura(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">Cancelar</button>
              <button onClick={abrirCaja} disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}>
                Abrir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cierre */}
      {showCierre && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full fade-in">
            <h3 className="font-display font-bold text-xl text-dark mb-2">Cerrar caja</h3>
            <p className="text-sm text-gray-500 mb-4">Saldo calculado: <strong className="text-primary">${saldoActual.toFixed(2)}</strong></p>
            <label className="block text-sm text-gray-600 mb-1">Monto físico en caja</label>
            <input type="number" value={montoCierre} onChange={e => setMontoCierre(e.target.value)}
              placeholder={saldoActual.toFixed(2)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4" />
            {montoCierre && (
              <div className={`text-center text-sm font-bold mb-4 ${parseFloat(montoCierre) >= saldoActual ? 'text-green-600' : 'text-red-500'}`}>
                Diferencia: ${(parseFloat(montoCierre) - saldoActual).toFixed(2)}
              </div>
            )}
            {msg && <p className="text-red-500 text-xs mb-3">{msg}</p>}
            <div className="flex gap-3">
              <button onClick={() => setShowCierre(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">Cancelar</button>
              <button onClick={cerrarCaja} disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-dark text-white text-sm font-semibold disabled:opacity-50">
                Cerrar caja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal movimiento */}
      {showMovimiento && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full fade-in">
            <h3 className="font-display font-bold text-xl text-dark mb-4">Nuevo movimiento</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[['ingreso', '📥 Ingreso'], ['egreso', '📤 Egreso']].map(([v, l]) => (
                  <button key={v} onClick={() => setMovForm({ ...movForm, tipo: v })}
                    className={`py-2 rounded-xl text-sm font-medium border-2 transition-all ${movForm.tipo === v ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-500'}`}>
                    {l}
                  </button>
                ))}
              </div>
              <input type="text" placeholder="Concepto" value={movForm.concepto}
                onChange={e => setMovForm({ ...movForm, concepto: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <input type="number" placeholder="Monto" value={movForm.monto}
                onChange={e => setMovForm({ ...movForm, monto: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            {msg && <p className="text-red-500 text-xs mt-2">{msg}</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowMovimiento(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">Cancelar</button>
              <button onClick={agregarMovimiento} disabled={!movForm.concepto || !movForm.monto || loading}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
