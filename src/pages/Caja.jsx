import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { DollarSign, TrendingUp, TrendingDown, Lock, Unlock, Plus, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function Caja() {
  const { isAdmin } = useAuth()
  const [caja, setCaja] = useState(undefined)
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

  const ingresosManual = movimientos.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
  const egresosManual  = movimientos.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)
  const ventasEfectivo = caja?.ventas_efectivo_hoy ?? 0
  const cambiosHoy     = caja?.cambios_hoy ?? 0
  const montoInicial   = caja?.monto_inicial ?? 0
  const totalIngresos  = montoInicial + ventasEfectivo + ingresosManual
  const totalEgresos   = cambiosHoy + egresosManual
  const saldoActual    = caja?.efectivo_disponible ?? (totalIngresos - totalEgresos)

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

  const esIngreso = (tipo) => tipo === 'ingreso' || tipo === 'apertura'

  // Modal base reutilizable
  const Modal = ({ title, onClose, children }) => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl w-full max-w-sm shadow-2xl fade-in"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-display text-lg" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl" style={{ color: 'var(--text-primary)' }}>Caja</h1>
          <p className="text-sm capitalize" style={{ color: 'var(--text-muted)' }}>
            {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </div>
        <button onClick={cargar}
          className="p-2 rounded-xl transition-colors"
          style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }}>
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Estado de caja */}
      <div className="rounded-2xl p-5 mb-6 flex items-center justify-between"
        style={{
          background: caja ? 'var(--success-bg)' : 'var(--danger-bg)',
          border: `1px solid ${caja ? 'var(--success-border)' : 'var(--danger-border)'}`
        }}>
        <div className="flex items-center gap-3">
          {caja
            ? <Unlock size={24} style={{ color: 'var(--success)' }} />
            : <Lock size={24} style={{ color: 'var(--danger)' }} />
          }
          <div>
            <p className="font-bold text-lg" style={{ color: caja ? 'var(--success)' : 'var(--danger)' }}>
              Caja {caja ? 'ABIERTA' : 'CERRADA'}
            </p>
            {caja && (
              <p className="text-xs" style={{ color: 'var(--success)' }}>
                Abierta a las {format(new Date(caja.abierta_en), 'HH:mm')}
              </p>
            )}
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            {!caja ? (
              <button onClick={() => setShowApertura(true)}
                className="px-4 py-2 rounded-xl text-white text-sm font-semibold"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
                Abrir caja
              </button>
            ) : (
              <>
                <button onClick={() => setShowMovimiento(true)}
                  className="px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1 transition-colors"
                  style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  <Plus size={14} /> Movimiento
                </button>
                <button onClick={() => setShowCierre(true)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                  Cerrar caja
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Resumen financiero */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          {
            icon: TrendingUp, label: 'Ingresos hoy',
            value: `$${(caja?.ingresos_ventas_hoy ?? 0).toLocaleString('es-CO')}`,
            sub: `${caja?.num_ventas_hoy ?? 0} ventas`,
            iconColor: 'var(--success)', valueBg: 'var(--success-bg)', valueBorder: 'var(--success-border)', valueColor: 'var(--success)'
          },
          {
            icon: TrendingDown, label: 'Egresos hoy',
            value: `$${totalEgresos.toLocaleString('es-CO')}`,
            sub: `Cambios: $${(caja?.cambios_hoy ?? 0).toLocaleString('es-CO')}`,
            iconColor: 'var(--danger)', valueBg: 'var(--danger-bg)', valueBorder: 'var(--danger-border)', valueColor: 'var(--danger)'
          },
          {
            icon: DollarSign, label: 'Apertura',
            value: `$${(caja?.monto_inicial ?? 0).toLocaleString('es-CO')}`,
            sub: 'Monto inicial',
            iconColor: 'var(--info)', valueBg: 'var(--info-bg)', valueBorder: 'var(--info-border)', valueColor: 'var(--info)'
          },
          {
            icon: DollarSign, label: 'Saldo en caja',
            value: `$${saldoActual.toLocaleString('es-CO')}`,
            sub: 'Efectivo disponible',
            iconColor: saldoActual >= 0 ? 'var(--primary)' : 'var(--danger)',
            valueBg: saldoActual >= 0 ? 'rgba(244,98,42,0.1)' : 'var(--danger-bg)',
            valueBorder: saldoActual >= 0 ? 'var(--border-hover)' : 'var(--danger-border)',
            valueColor: saldoActual >= 0 ? 'var(--primary)' : 'var(--danger)'
          },
        ].map(({ icon: Icon, label, value, sub, iconColor, valueBg, valueBorder, valueColor }) => (
          <div key={label} className="rounded-2xl p-4"
            style={{ background: valueBg, border: `1px solid ${valueBorder}` }}>
            <div className="flex items-center gap-2 mb-1">
              <Icon size={16} style={{ color: iconColor }} />
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
            </div>
            <p className="font-bold text-lg" style={{ color: valueColor }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Movimientos */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-display text-base" style={{ color: 'var(--text-primary)' }}>
            Movimientos del día
          </h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {movimientos.length === 0 ? (
            <div className="text-center py-10" style={{ color: 'var(--text-dim)' }}>
              <DollarSign size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sin movimientos hoy</p>
            </div>
          ) : (
            movimientos.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                  style={{
                    background: esIngreso(m.tipo) ? 'var(--success-bg)' : 'var(--danger-bg)',
                    color: esIngreso(m.tipo) ? 'var(--success)' : 'var(--danger)'
                  }}>
                  {esIngreso(m.tipo) ? '+' : '-'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{m.concepto}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {m.usuario} · {format(new Date(m.creado_en), 'HH:mm')}
                  </p>
                </div>
                <p className="font-bold text-sm"
                  style={{ color: esIngreso(m.tipo) ? 'var(--success)' : 'var(--danger)' }}>
                  {esIngreso(m.tipo) ? '+' : '-'}${m.monto.toFixed(2)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal apertura */}
      {showApertura && (
        <Modal title="Abrir caja" onClose={() => setShowApertura(false)}>
          <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
            Monto inicial en caja
          </label>
          <input type="number" value={montoApertura}
            onChange={e => setMontoApertura(e.target.value)}
            placeholder="0.00"
            className="input-dark text-lg font-bold text-center mb-4" />
          {msg && <p className="text-xs mb-3" style={{ color: 'var(--danger)' }}>{msg}</p>}
          <div className="flex gap-3">
            <button onClick={() => setShowApertura(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              Cancelar
            </button>
            <button onClick={abrirCaja} disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
              Abrir
            </button>
          </div>
        </Modal>
      )}

      {/* Modal cierre */}
      {showCierre && (
        <Modal title="Cerrar caja" onClose={() => setShowCierre(false)}>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Saldo calculado: <strong style={{ color: 'var(--primary)' }}>${saldoActual.toFixed(2)}</strong>
          </p>
          <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
            Monto físico en caja
          </label>
          <input type="number" value={montoCierre}
            onChange={e => setMontoCierre(e.target.value)}
            placeholder={saldoActual.toFixed(2)}
            className="input-dark text-lg font-bold text-center mb-4" />
          {montoCierre && (
            <div className="text-center text-sm font-bold mb-4"
              style={{ color: parseFloat(montoCierre) >= saldoActual ? 'var(--success)' : 'var(--danger)' }}>
              Diferencia: ${(parseFloat(montoCierre) - saldoActual).toFixed(2)}
            </div>
          )}
          {msg && <p className="text-xs mb-3" style={{ color: 'var(--danger)' }}>{msg}</p>}
          <div className="flex gap-3">
            <button onClick={() => setShowCierre(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              Cancelar
            </button>
            <button onClick={cerrarCaja} disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              Cerrar caja
            </button>
          </div>
        </Modal>
      )}

      {/* Modal movimiento */}
      {showMovimiento && (
        <Modal title="Nuevo movimiento" onClose={() => setShowMovimiento(false)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[['ingreso', '📥 Ingreso'], ['egreso', '📤 Egreso']].map(([v, l]) => (
                <button key={v} onClick={() => setMovForm({ ...movForm, tipo: v })}
                  className="py-2 rounded-xl text-sm font-medium border-2 transition-all"
                  style={{
                    borderColor: movForm.tipo === v ? 'var(--primary)' : 'var(--border)',
                    background: movForm.tipo === v ? 'rgba(244,98,42,0.1)' : 'transparent',
                    color: movForm.tipo === v ? 'var(--primary)' : 'var(--text-muted)'
                  }}>
                  {l}
                </button>
              ))}
            </div>
            <input type="text" placeholder="Concepto" value={movForm.concepto}
              onChange={e => setMovForm({ ...movForm, concepto: e.target.value })}
              className="input-dark" />
            <input type="number" placeholder="Monto" value={movForm.monto}
              onChange={e => setMovForm({ ...movForm, monto: e.target.value })}
              className="input-dark" />
          </div>
          {msg && <p className="text-xs mt-2" style={{ color: 'var(--danger)' }}>{msg}</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowMovimiento(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              Cancelar
            </button>
            <button onClick={agregarMovimiento}
              disabled={!movForm.concepto || !movForm.monto || loading}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
              Guardar
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
