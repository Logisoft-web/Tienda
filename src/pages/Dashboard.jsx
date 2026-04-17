import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  ShoppingCart, TrendingUp, Package, AlertTriangle,
  DollarSign, Clock, Monitor, RefreshCw, BarChart2
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

function StatCard({ icon: Icon, label, value, sub, colorClass, trend }) {
  return (
    <div className="fade-in rounded-2xl p-4 md:p-5"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs md:text-sm font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}>{label}</p>
          <p className="text-xl md:text-2xl font-display mt-1"
            style={{ color: 'var(--text-primary)', letterSpacing: '0.03em' }}>{value}</p>
          {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>{sub}</p>}
        </div>
        <div className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center ${colorClass}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      {trend !== undefined && (
        <div className={`mt-3 text-xs font-semibold flex items-center gap-1 ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          <span>{trend >= 0 ? '↑' : '↓'}</span>
          <span>{Math.abs(trend)}% margen bruto</span>
        </div>
      )}
    </div>
  )
}

function CajasActivas() {
  const [cajas, setCajas] = useState([])
  const [loading, setLoading] = useState(true)

  const cargar = () => {
    api.getCajasActivas()
      .then(setCajas)
      .catch(() => setCajas([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargar()
    const interval = setInterval(cargar, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-base flex items-center gap-2"
          style={{ color: 'var(--text-primary)' }}>
          <Monitor size={18} style={{ color: 'var(--primary)' }} /> Cajas activas
        </h3>
        <button onClick={cargar}
          className="p-1.5 rounded-lg transition-colors"
          style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }}>
          <RefreshCw size={13} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-16 rounded-xl animate-pulse"
              style={{ background: 'var(--bg-raised)' }} />
          ))}
        </div>
      ) : cajas.length === 0 ? (
        <div className="text-center py-8" style={{ color: 'var(--text-dim)' }}>
          <Monitor size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No hay cajas abiertas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cajas.map(c => (
            <div key={c.id} className="flex items-center gap-3 rounded-xl p-3"
              style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ background: 'var(--primary)' }}>
                {c.usuario?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{c.usuario}</p>
                  <span className="w-2 h-2 rounded-full bg-green-400 shrink-0 animate-pulse" />
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Abierta hace {formatDistanceToNow(new Date(c.abierta_en), { locale: es })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>${c.total_hoy?.toFixed(2)}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.ventas_hoy} ventas</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {cajas.length > 0 && (
        <div className="mt-3 pt-3 flex justify-between text-xs"
          style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          <span>{cajas.length} caja{cajas.length > 1 ? 's' : ''} abierta{cajas.length > 1 ? 's' : ''}</span>
          <span>Total: <strong style={{ color: 'var(--primary)' }}>
            ${cajas.reduce((s, c) => s + (c.total_hoy || 0), 0).toFixed(2)}
          </strong></span>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const hoy = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    api.getResumen({ desde: hoy, hasta: hoy })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const fmt = (n) => `${Number(n || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="font-display text-xl md:text-2xl" style={{ color: 'var(--text-primary)' }}>
          ¡Hola, {user?.nombre?.split(' ')[0]}! 👋
        </h1>
        <p className="text-sm mt-0.5 capitalize" style={{ color: 'var(--text-muted)' }}>
          {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl p-5 h-24 animate-pulse"
              style={{ background: 'var(--bg-card)' }} />
          ))}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
            <StatCard icon={ShoppingCart} label="Ventas hoy"
              value={data?.ventas?.total_ventas || 0}
              sub="transacciones" colorClass="bg-orange-500" />
            <StatCard icon={DollarSign} label="Ingresos hoy"
              value={`$${fmt(data?.ventas?.ingresos)}`}
              sub="total cobrado" colorClass="bg-green-600" />
            <StatCard icon={TrendingUp} label="Ticket promedio"
              value={`$${fmt(data?.ventas?.ticket_promedio)}`}
              sub="por venta" colorClass="bg-blue-600" />
            {isAdmin && (
              <>
                <StatCard icon={BarChart2} label="Ganancia bruta"
                  value={`$${fmt(data?.ventas?.ganancia_bruta)}`}
                  sub="después de costos" colorClass="bg-purple-600"
                  trend={data?.ventas?.margen_bruto_pct} />
                <StatCard icon={TrendingUp} label="Margen bruto"
                  value={`${data?.ventas?.margen_bruto_pct || 0}%`}
                  sub="sobre ingresos" colorClass="bg-indigo-600" />
              </>
            )}
          </div>

          {/* Layout principal */}
          <div className="grid lg:grid-cols-2 gap-4">

            {isAdmin && <CajasActivas />}

            {/* Top productos */}
            <div className="rounded-2xl p-5"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h3 className="font-display text-base mb-4 flex items-center gap-2"
                style={{ color: 'var(--text-primary)' }}>
                <TrendingUp size={18} style={{ color: 'var(--primary)' }} /> Top productos hoy
              </h3>
              {data?.topProductos?.length ? (
                <div className="space-y-3">
                  {data.topProductos.slice(0, 6).map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(244,98,42,0.15)', color: 'var(--primary)' }}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {p.nombre_producto}
                        </p>
                        <div className="w-full rounded-full h-1.5 mt-1"
                          style={{ background: 'var(--bg-raised)' }}>
                          <div className="h-1.5 rounded-full"
                            style={{
                              width: `${Math.min(100, (p.cantidad / (data.topProductos[0]?.cantidad || 1)) * 100)}%`,
                              background: 'linear-gradient(90deg, var(--primary), var(--secondary))'
                            }} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{p.cantidad} uds</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>${fmt(p.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-center py-6" style={{ color: 'var(--text-dim)' }}>Sin ventas hoy</p>
              )}
            </div>

            {/* Ventas por hora */}
            <div className="rounded-2xl p-5"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h3 className="font-display text-base mb-4 flex items-center gap-2"
                style={{ color: 'var(--text-primary)' }}>
                <Clock size={18} style={{ color: 'var(--primary)' }} /> Ventas por hora
              </h3>
              {data?.porHora?.length ? (
                <div className="space-y-2">
                  {data.porHora.map((h) => (
                    <div key={h.hora} className="flex items-center gap-3">
                      <span className="text-xs w-12 shrink-0" style={{ color: 'var(--text-muted)' }}>{h.hora}:00</span>
                      <div className="flex-1 rounded-full h-6 relative overflow-hidden"
                        style={{ background: 'var(--bg-raised)' }}>
                        <div className="h-full rounded-full flex items-center px-2"
                          style={{
                            width: `${Math.max(8, (h.ventas / Math.max(...data.porHora.map(x => x.ventas))) * 100)}%`,
                            background: 'linear-gradient(90deg, var(--primary), var(--secondary))'
                          }}>
                          <span className="text-white text-xs font-medium">{h.ventas}</span>
                        </div>
                      </div>
                      <span className="text-xs font-medium w-16 text-right shrink-0"
                        style={{ color: 'var(--text-primary)' }}>${fmt(h.total)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-center py-6" style={{ color: 'var(--text-dim)' }}>Sin datos de hoy</p>
              )}
            </div>

            {/* Métodos de pago */}
            <div className="rounded-2xl p-5"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h3 className="font-display text-base mb-4" style={{ color: 'var(--text-primary)' }}>
                Métodos de pago
              </h3>
              {data?.porMetodo?.length ? (
                <div className="space-y-3">
                  {data.porMetodo.map((m) => (
                    <div key={m.metodo_pago} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {m.metodo_pago === 'efectivo' ? '💵' : m.metodo_pago === 'tarjeta' ? '💳' : '📱'}
                        </span>
                        <span className="text-sm font-medium capitalize"
                          style={{ color: 'var(--text-secondary)' }}>{m.metodo_pago}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>${fmt(m.monto)}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.cantidad} ventas</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-center py-6" style={{ color: 'var(--text-dim)' }}>Sin ventas hoy</p>
              )}
            </div>

            {/* Stock bajo */}
            <div className="rounded-2xl p-5"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h3 className="font-display text-base mb-4 flex items-center gap-2"
                style={{ color: 'var(--text-primary)' }}>
                <AlertTriangle size={18} style={{ color: 'var(--warning)' }} /> Alertas de stock
              </h3>
              {data?.stockBajo?.length ? (
                <div className="space-y-2">
                  {data.stockBajo.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-2"
                      style={{ borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.nombre}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.categoria}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        p.stock === 0
                          ? 'bg-red-500/15 text-red-400'
                          : 'bg-orange-500/15 text-orange-400'
                      }`}>
                        {p.stock} / {p.stock_minimo}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-6" style={{ color: 'var(--success)' }}>
                  <Package size={32} />
                  <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Todo el stock en orden</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
