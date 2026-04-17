import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  ShoppingCart, TrendingUp, Package, AlertTriangle,
  DollarSign, Clock, Monitor, RefreshCw, BarChart2
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

function StatCard({ icon: Icon, label, value, sub, color, trend }) {
  return (
    <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100 fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs md:text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-xl md:text-2xl font-display font-bold text-dark mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      {trend !== undefined && (
        <div className={`mt-3 text-xs font-medium flex items-center gap-1 ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          <span>{trend >= 0 ? '↑' : '↓'}</span>
          <span>{Math.abs(trend)}% margen bruto</span>
        </div>
      )}
    </div>
  )
}

// Panel exclusivo para admin: cajas activas en tiempo real
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
    const interval = setInterval(cargar, 30000) // refresca cada 30s
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-dark flex items-center gap-2">
          <Monitor size={18} className="text-primary" /> Cajas activas
        </h3>
        <button onClick={cargar} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
          <RefreshCw size={13} className="text-gray-500" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : cajas.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Monitor size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No hay cajas abiertas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cajas.map(c => (
            <div key={c.id} className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl p-3">
              {/* Avatar usuario */}
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
                {c.usuario?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-dark truncate">{c.usuario}</p>
                  <span className="w-2 h-2 rounded-full bg-green-500 shrink-0 animate-pulse" />
                </div>
                <p className="text-xs text-gray-500">
                  Abierta hace {formatDistanceToNow(new Date(c.abierta_en), { locale: es })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-dark">${c.total_hoy?.toFixed(2)}</p>
                <p className="text-xs text-gray-400">{c.ventas_hoy} ventas</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {cajas.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
          <span>{cajas.length} caja{cajas.length > 1 ? 's' : ''} abierta{cajas.length > 1 ? 's' : ''}</span>
          <span>Total: <strong className="text-primary">${cajas.reduce((s, c) => s + (c.total_hoy || 0), 0).toFixed(2)}</strong></span>
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

  const fmt = (n) => `$${Number(n || 0).toFixed(2)}`

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="font-display font-bold text-xl md:text-2xl text-dark">
          ¡Hola, {user?.nombre?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 text-sm mt-0.5 capitalize">
          {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Stats — ahora con 6 métricas incluyendo margen bruto (SaaS Metrics) */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
            <StatCard icon={ShoppingCart} label="Ventas hoy" value={data?.ventas?.total_ventas || 0}
              sub="transacciones" color="bg-primary" />
            <StatCard icon={DollarSign} label="Ingresos hoy" value={`$${fmt(data?.ventas?.ingresos)}`}
              sub="total cobrado" color="bg-green-500" />
            <StatCard icon={TrendingUp} label="Ticket promedio" value={`$${fmt(data?.ventas?.ticket_promedio)}`}
              sub="por venta" color="bg-blue-500" />
            {isAdmin && (
              <>
                <StatCard icon={BarChart2} label="Ganancia bruta" value={`$${fmt(data?.ventas?.ganancia_bruta)}`}
                  sub="después de costos" color="bg-purple-500"
                  trend={data?.ventas?.margen_bruto_pct} />
                <StatCard icon={TrendingUp} label="Margen bruto" value={`${data?.ventas?.margen_bruto_pct || 0}%`}
                  sub="sobre ingresos" color="bg-indigo-500" />
              </>
            )}
          </div>

          {/* Layout principal */}
          <div className="grid lg:grid-cols-2 gap-4">

            {/* Cajas activas — solo admin, primera posición */}
            {isAdmin && <CajasActivas />}

            {/* Top productos */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-display font-semibold text-dark mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" /> Top productos hoy
              </h3>
              {data?.topProductos?.length ? (
                <div className="space-y-3">
                  {data.topProductos.slice(0, 6).map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark truncate">{p.nombre_producto}</p>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                          <div className="bg-primary h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, (p.cantidad / (data.topProductos[0]?.cantidad || 1)) * 100)}%` }} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-dark">{p.cantidad} uds</p>
                        <p className="text-xs text-gray-400">{fmt(p.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-6">Sin ventas hoy</p>
              )}
            </div>

            {/* Ventas por hora */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-display font-semibold text-dark mb-4 flex items-center gap-2">
                <Clock size={18} className="text-primary" /> Ventas por hora
              </h3>
              {data?.porHora?.length ? (
                <div className="space-y-2">
                  {data.porHora.map((h) => (
                    <div key={h.hora} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-12 shrink-0">{h.hora}:00</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                        <div className="h-full rounded-full flex items-center px-2"
                          style={{
                            width: `${Math.max(8, (h.ventas / Math.max(...data.porHora.map(x => x.ventas))) * 100)}%`,
                            background: 'linear-gradient(90deg, #FF6B35, #FDC830)'
                          }}>
                          <span className="text-white text-xs font-medium">{h.ventas}</span>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-dark w-16 text-right shrink-0">{fmt(h.total)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-6">Sin datos de hoy</p>
              )}
            </div>

            {/* Métodos de pago */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-display font-semibold text-dark mb-4">Métodos de pago</h3>
              {data?.porMetodo?.length ? (
                <div className="space-y-3">
                  {data.porMetodo.map((m) => (
                    <div key={m.metodo_pago} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {m.metodo_pago === 'efectivo' ? '💵' : m.metodo_pago === 'tarjeta' ? '💳' : '📱'}
                        </span>
                        <span className="text-sm font-medium capitalize">{m.metodo_pago}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-dark">{fmt(m.monto)}</p>
                        <p className="text-xs text-gray-400">{m.cantidad} ventas</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-6">Sin ventas hoy</p>
              )}
            </div>

            {/* Stock bajo */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-display font-semibold text-dark mb-4 flex items-center gap-2">
                <AlertTriangle size={18} className="text-orange-500" /> Alertas de stock
              </h3>
              {data?.stockBajo?.length ? (
                <div className="space-y-2">
                  {data.stockBajo.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-dark">{p.nombre}</p>
                        <p className="text-xs text-gray-400">{p.categoria}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.stock === 0 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                        {p.stock} / {p.stock_minimo}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-6 text-green-500">
                  <Package size={32} />
                  <p className="text-sm mt-2 text-gray-500">Todo el stock en orden</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
