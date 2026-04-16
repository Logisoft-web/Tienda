import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { ShoppingCart, TrendingUp, Package, AlertTriangle, DollarSign, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-display font-bold text-dark mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
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
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-dark">
          ¡Hola, {user?.nombre?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1 capitalize">
          {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={ShoppingCart} label="Ventas hoy" value={data?.ventas?.total_ventas || 0}
              sub="transacciones" color="bg-primary" />
            <StatCard icon={DollarSign} label="Ingresos hoy" value={fmt(data?.ventas?.ingresos)}
              sub="total cobrado" color="bg-green-500" />
            <StatCard icon={TrendingUp} label="Ticket promedio" value={fmt(data?.ventas?.ticket_promedio)}
              sub="por venta" color="bg-blue-500" />
            <StatCard icon={AlertTriangle} label="Stock bajo" value={data?.stockBajo?.length || 0}
              sub="productos" color="bg-orange-500" />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Top productos */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-display font-semibold text-dark mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" /> Top productos hoy
              </h3>
              {data?.topProductos?.length ? (
                <div className="space-y-3">
                  {data.topProductos.slice(0, 6).map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark truncate">{p.nombre_producto}</p>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                          <div className="bg-primary h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, (p.cantidad / (data.topProductos[0]?.cantidad || 1)) * 100)}%` }} />
                        </div>
                      </div>
                      <div className="text-right">
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
                      <span className="text-xs text-gray-500 w-12">{h.hora}:00</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                        <div className="h-full rounded-full flex items-center px-2"
                          style={{
                            width: `${Math.max(8, (h.ventas / Math.max(...data.porHora.map(x => x.ventas))) * 100)}%`,
                            background: 'linear-gradient(90deg, #FF6B35, #FDC830)'
                          }}>
                          <span className="text-white text-xs font-medium">{h.ventas}</span>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-dark w-20 text-right">{fmt(h.total)}</span>
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
                      <div className="text-right">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.stock === 0 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                          {p.stock} / {p.stock_minimo}
                        </span>
                      </div>
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
