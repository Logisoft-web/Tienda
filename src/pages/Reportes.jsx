import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Download, BarChart2, TrendingUp, ShoppingCart, DollarSign, RefreshCw, BookOpen } from 'lucide-react'
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
  const [contable, setContable] = useState(null)
  const [tabActiva, setTabActiva] = useState('ventas') // 'ventas' | 'contable'

  const rango = useCustom ? custom : RANGOS[rangoIdx]

  const cargar = async () => {
    setLoading(true)
    try {
      const d = await api.getResumen(rango)
      setData(d)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const cargarContable = async () => {
    try {
      const d = await api.getContableMensual(6)
      setContable(d)
    } catch (err) { console.error(err) }
  }

  useEffect(() => { cargar() }, [rangoIdx, useCustom, custom.desde, custom.hasta])
  useEffect(() => { cargarContable() }, [])

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
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">
            <Download size={15} /> CSV ventas
          </button>
          <button onClick={() => api.descargarContable(rango)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold shadow-sm"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}
            title="Reporte completo para contador: ventas, IVA, base gravable, métodos de pago, detalle por producto">
            <Download size={15} /> Reporte DIAN
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[['ventas','📊 Ventas'],['contable','📒 Contabilidad']].map(([k,l]) => (
          <button key={k} onClick={() => setTabActiva(k)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${tabActiva===k ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            style={tabActiva===k ? { background:'linear-gradient(135deg, #FF6B35, #FDC830)' } : {}}>
            {l}
          </button>
        ))}
      </div>

      {/* Filtros de rango — solo en tab ventas */}
      {tabActiva === 'ventas' && (
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
      )}

      {tabActiva === 'ventas' && (loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />)}
        </div>
      ) : data ? (
        <>
          {/* KPIs — incluye margen bruto para admin */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { icon: ShoppingCart, label: 'Total ventas', value: data.ventas?.total_ventas || 0, color: 'bg-primary' },
              { icon: DollarSign, label: 'Ingresos', value: fmt(data.ventas?.ingresos), color: 'bg-green-500' },
              { icon: TrendingUp, label: 'Ticket promedio', value: fmt(data.ventas?.ticket_promedio), color: 'bg-blue-500' },
              { icon: BarChart2, label: 'Margen bruto', value: `${data.ventas?.margen_bruto_pct ?? 0}%`, sub: `${fmt(data.ventas?.ganancia_bruta)} ganancia`, color: 'bg-purple-500' },
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
                      <p className="text-sm font-bold text-dark w-20 text-right shrink-0">{fmt(p.total)}</p>
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

          {/* Resumen contable */}
          {data?.ventas && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-dark">Resumen contable (DIAN)</h3>
                <button onClick={() => api.descargarContable(rango)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-semibold"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}>
                  <Download size={12} /> Descargar
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Ingresos brutos', value: `$${fmt(data.ventas.ingresos)}`, color: 'text-green-600', sub: 'Total facturado' },
                  { label: 'Base gravable', value: `$${fmt(data.ventas.ingresos / 1.19)}`, color: 'text-blue-600', sub: 'Sin IVA' },
                  { label: 'IVA generado 19%', value: `$${fmt(data.ventas.ingresos - data.ventas.ingresos / 1.19)}`, color: 'text-purple-600', sub: 'A declarar' },
                  { label: 'Descuentos', value: `$${fmt(0)}`, color: 'text-orange-600', sub: 'Total período' },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className={`font-bold text-base mt-0.5 ${item.color}`}>{item.value}</p>
                    <p className="text-xs text-gray-400">{item.sub}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3 border-t border-gray-100 pt-2">
                * Documento Equivalente POS — Régimen Simplificado. El botón "Reporte DIAN" genera el CSV completo con detalle de ventas, items, IVA desglosado y métodos de pago para entregar al contador.
              </p>
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
      ) : null)}

      {/* ── TAB CONTABILIDAD ── */}
      {tabActiva === 'contable' && contable && (
        <div className="space-y-6">
          {/* Valor actual del inventario */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-display font-semibold text-dark mb-4 flex items-center gap-2">
              <BookOpen size={18} className="text-purple-500" /> Valor actual del inventario
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-purple-50 rounded-xl p-4">
                <p className="text-xs text-gray-500">Total inventario en bodega</p>
                <p className="font-bold text-2xl text-purple-700">${Number(contable.valorInventario).toLocaleString('es-CO')}</p>
                <p className="text-xs text-gray-400">Suma del valor registrado por producto</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500 font-medium">Producto</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Stock</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Valor total</th>
                  </tr>
                </thead>
                <tbody>
                  {contable.detalleInventario.map((p, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-2 text-dark">{p.nombre}</td>
                      <td className="py-2 text-right text-gray-600">{p.stock} {p.unidad || ''}</td>
                      <td className="py-2 text-right font-semibold text-purple-700">${Number(p.valor).toLocaleString('es-CO')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumen mensual */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-display font-semibold text-dark mb-2">📅 Resumen mensual</h3>
            <p className="text-xs text-gray-400 mb-4">
              Ganancia = Ventas − Costo de lo vendido &nbsp;·&nbsp; Inventario = suma del valor registrado por producto
            </p>

            {/* KPIs del período total */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {(() => {
                const totVentas   = contable.meses.reduce((s, m) => s + m.totalVentas, 0)
                const totCosto    = contable.meses.reduce((s, m) => s + m.costoVendido, 0)
                const totCompras  = contable.meses.reduce((s, m) => s + m.totalCompras, 0)
                const totGanancia = contable.meses.reduce((s, m) => s + m.gananciaReal, 0)
                return [
                  { label: 'Ventas totales', value: totVentas, color: 'text-green-700', bg: 'bg-green-50' },
                  { label: 'Costo vendido', value: totCosto, color: 'text-orange-700', bg: 'bg-orange-50' },
                  { label: 'Inversión compras', value: totCompras, color: 'text-blue-700', bg: 'bg-blue-50' },
                  { label: 'Ganancia real', value: totGanancia, color: totGanancia >= 0 ? 'text-emerald-700' : 'text-red-600', bg: totGanancia >= 0 ? 'bg-emerald-50' : 'bg-red-50' },
                ].map(k => (
                  <div key={k.label} className={`${k.bg} rounded-xl p-3`}>
                    <p className="text-xs text-gray-500">{k.label}</p>
                    <p className={`font-bold text-lg mt-0.5 ${k.color}`}>${Number(k.value).toLocaleString('es-CO')}</p>
                  </div>
                ))
              })()}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-2 px-2 text-gray-500 font-medium rounded-tl-lg">Mes</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">Ventas</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium"># ventas</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">Costo vendido</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">Compras</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">Ganancia real</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">Margen %</th>
                  </tr>
                </thead>
                <tbody>
                  {contable.meses.map((m, i) => {
                    const margen = m.totalVentas > 0 ? ((m.gananciaReal / m.totalVentas) * 100).toFixed(1) : '0'
                    return (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-2 font-medium text-dark capitalize">{m.label}</td>
                        <td className="py-3 px-2 text-right text-green-600 font-semibold">${Number(m.totalVentas).toLocaleString('es-CO')}</td>
                        <td className="py-3 px-2 text-right text-gray-400">{m.numVentas}</td>
                        <td className="py-3 px-2 text-right text-orange-600">${Number(m.costoVendido).toLocaleString('es-CO')}</td>
                        <td className="py-3 px-2 text-right text-blue-600">
                          ${Number(m.totalCompras).toLocaleString('es-CO')}
                          {m.numCompras > 0 && <span className="text-gray-400 text-xs ml-1">({m.numCompras})</span>}
                        </td>
                        <td className={`py-3 px-2 text-right font-bold ${m.gananciaReal >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                          {m.gananciaReal >= 0 ? '+' : ''}${Number(m.gananciaReal).toLocaleString('es-CO')}
                        </td>
                        <td className={`py-3 px-2 text-right text-xs font-semibold ${+margen >= 30 ? 'text-emerald-600' : +margen >= 10 ? 'text-yellow-600' : 'text-red-500'}`}>
                          {margen}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Inventario final */}
            <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-4">
              <div className="bg-purple-50 rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="text-2xl">📦</span>
                <div>
                  <p className="text-xs text-gray-500">Inventario final (hoy)</p>
                  <p className="font-bold text-lg text-purple-700">${Number(contable.valorInventario).toLocaleString('es-CO')}</p>
                  <p className="text-xs text-gray-400">suma del valor registrado por producto</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 flex-1">
                <strong>Ganancia real</strong> = Ventas − Costo de lo vendido (suma del costo de cada producto vendido ese mes).<br/>
                <strong>Compras</strong> = inversión en reposición de inventario (no se resta de la ganancia, es capital en bodega).<br/>
                <strong>Inventario final</strong> = valor del stock que queda en bodega hoy.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
