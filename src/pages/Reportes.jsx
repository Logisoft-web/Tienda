import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Download, BarChart2, TrendingUp, ShoppingCart, DollarSign, RefreshCw } from 'lucide-react'
import { format, subDays } from 'date-fns'

const RANGOS = [
  { label: 'Hoy', desde: format(new Date(), 'yyyy-MM-dd'), hasta: format(new Date(), 'yyyy-MM-dd') },
  { label: 'Ayer', desde: format(subDays(new Date(), 1), 'yyyy-MM-dd'), hasta: format(subDays(new Date(), 1), 'yyyy-MM-dd') },
  { label: '7 días', desde: format(subDays(new Date(), 6), 'yyyy-MM-dd'), hasta: format(new Date(), 'yyyy-MM-dd') },
  { label: '30 días', desde: format(subDays(new Date(), 29), 'yyyy-MM-dd'), hasta: format(new Date(), 'yyyy-MM-dd') },
]

export default function Reportes() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [rangoIdx, setRangoIdx] = useState(0)
  const [custom, setCustom] = useState({ desde: format(new Date(), 'yyyy-MM-dd'), hasta: format(new Date(), 'yyyy-MM-dd') })
  const [useCustom, setUseCustom] = useState(false)

  const rango = useCustom ? custom : RANGOS[rangoIdx]

  const cargar = async () => {
    setLoading(true)
    try {
      const d = await api.getResumen(rango)
      setData(d)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [rangoIdx, useCustom, custom.desde, custom.hasta])

  const fmt = (n) => `$${Number(n || 0).toFixed(2)}`
  const maxCantidad = data?.topProductos?.[0]?.cantidad || 1

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-dark">Reportes</h1>
          <p className="text-gray-500 text-sm">Análisis de ventas e inventario</p>
        </div>
        <div className="flex gap-2">
          <button onClick={cargar} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
            <RefreshCw size={16} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => api.descargarCSV(rango)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold shadow-sm"
            style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}>
            <Download size={15} /> Descargar CSV
          </button>
        </div>
      </div>

      {/* Filtros de rango */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-wrap gap-2 mb-3">
          {RANGOS.map((r, i) => (
            <button key={i} onClick={() => { setRangoIdx(i); setUseCustom(false) }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${!useCustom && rangoIdx === i ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {r.label}
            </button>
          ))}
          <button onClick={() => setUseCustom(true)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${useCustom ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            Personalizado
          </button>
        </div>
        {useCustom && (
          <div className="flex gap-3 items-center">
            <input type="date" value={custom.desde} onChange={e => setCustom({ ...custom, desde: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <span className="text-gray-400 text-sm">hasta</span>
            <input type="date" value={custom.hasta} onChange={e => setCustom({ ...custom, hasta: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />)}
        </div>
      ) : data ? (
        <>
          {/* KPIs — incluye margen bruto para admin */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { icon: ShoppingCart, label: 'Total ventas', value: data.ventas?.total_ventas || 0, color: 'bg-primary' },
              { icon: DollarSign, label: 'Ingresos', value: `$${fmt(data.ventas?.ingresos)}`, color: 'bg-green-500' },
              { icon: TrendingUp, label: 'Ticket promedio', value: `$${fmt(data.ventas?.ticket_promedio)}`, color: 'bg-blue-500' },
              { icon: BarChart2, label: 'Margen bruto', value: `${data.ventas?.margen_bruto_pct ?? 0}%`, sub: `$${fmt(data.ventas?.ganancia_bruta)} ganancia`, color: 'bg-purple-500' },
            ].map(({ icon: Icon, label, value, sub, color }) => (
              <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 fade-in">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-2xl font-display font-bold text-dark mt-1">{value}</p>
                    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon size={18} className="text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            {/* Top productos */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-display font-semibold text-dark mb-4">Top productos vendidos</h3>
              {data.topProductos?.length ? (
                <div className="space-y-3">
                  {data.topProductos.map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-1">
                          <p className="text-sm font-medium text-dark truncate">{p.nombre_producto}</p>
                          <p className="text-xs text-gray-500 ml-2 shrink-0">{p.cantidad} uds</p>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="h-2 rounded-full" style={{ width: `${(p.cantidad / maxCantidad) * 100}%`, background: 'linear-gradient(90deg, #FF6B35, #FDC830)' }} />
                        </div>
                        {p.margen && (
                          <p className="text-xs text-purple-500 mt-0.5">Margen: {p.margen}%</p>
                        )}
                      </div>
                      <p className="text-sm font-bold text-dark w-20 text-right shrink-0">${fmt(p.total)}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-400 text-sm text-center py-8">Sin datos en este período</p>}
            </div>

            {/* Métodos de pago */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-display font-semibold text-dark mb-4">Métodos de pago</h3>
              {data.porMetodo?.length ? (
                <div className="space-y-4">
                  {data.porMetodo.map(m => {
                    const total = data.porMetodo.reduce((s, x) => s + x.monto, 0)
                    const pct = total > 0 ? (m.monto / total) * 100 : 0
                    return (
                      <div key={m.metodo_pago}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium capitalize flex items-center gap-1">
                            {m.metodo_pago === 'efectivo' ? '💵' : m.metodo_pago === 'tarjeta' ? '💳' : '📱'}
                            {m.metodo_pago}
                          </span>
                          <span className="text-sm font-bold text-dark">{fmt(m.monto)}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3">
                          <div className="h-3 rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #FF6B35, #FDC830)' }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{m.cantidad} ventas · {pct.toFixed(1)}%</p>
                      </div>
                    )
                  })}
                </div>
              ) : <p className="text-gray-400 text-sm text-center py-8">Sin datos en este período</p>}
            </div>
          </div>

          {/* Ventas por hora */}
          {data.porHora?.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
              <h3 className="font-display font-semibold text-dark mb-4">Ventas por hora</h3>
              <div className="flex items-end gap-1 h-32">
                {data.porHora.map(h => {
                  const maxV = Math.max(...data.porHora.map(x => x.ventas))
                  const pct = maxV > 0 ? (h.ventas / maxV) * 100 : 0
                  return (
                    <div key={h.hora} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-500">{h.ventas}</span>
                      <div className="w-full rounded-t-md" style={{ height: `${Math.max(4, pct)}%`, background: 'linear-gradient(180deg, #FF6B35, #FDC830)', minHeight: '4px' }} />
                      <span className="text-xs text-gray-400">{h.hora}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Stock bajo */}
          {data.stockBajo?.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-display font-semibold text-dark mb-4 text-orange-600">⚠️ Productos con stock bajo</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.stockBajo.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-orange-50 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-dark">{p.nombre}</p>
                      <p className="text-xs text-gray-500">{p.categoria}</p>
                    </div>
                    <span className={`text-sm font-bold px-2 py-1 rounded-full ${p.stock === 0 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                      {p.stock}/{p.stock_minimo}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
