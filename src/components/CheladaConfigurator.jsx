import { useState } from 'react'
import { X, ChevronRight, Check, ShoppingCart } from 'lucide-react'

// ── DATOS DE LA CARTA ─────────────────────────────────────────────────────────
export const SABORES = [
  { id: 'frutos-amarillos',        nombre: 'Frutos Amarillos',         emoji: '🍍' },
  { id: 'sandia-hierbabuena',      nombre: 'Sandía Hierbabuena',       emoji: '🍉' },
  { id: 'pepino-limon-hierbabuena',nombre: 'Pepino-Limón-Hierbabuena', emoji: '🥒' },
  { id: 'frutos-verdes',           nombre: 'Frutos Verdes',            emoji: '🍏' },
  { id: 'fresa-mandarina',         nombre: 'Fresa Mandarina',          emoji: '🍓' },
  { id: 'cereza-limon',            nombre: 'Cereza Limón',             emoji: '🍒' },
  { id: 'maracuya',                nombre: 'Maracuyá',                 emoji: '🌟' },
  { id: 'mango-biche',             nombre: 'Mango Biche',              emoji: '🥭' },
  { id: 'coco',                    nombre: 'Coco',                     emoji: '🥥' },
  { id: 'lulo',                    nombre: 'Lulo',                     emoji: '🍊' },
  { id: 'tamarindo',               nombre: 'Tamarindo',                emoji: '🌿' },
  { id: 'limon-hierbabuena',       nombre: 'Limón-Hierbabuena',        emoji: '🍋' },
  { id: 'frutos-rojos',            nombre: 'Frutos Rojos',             emoji: '🫐' },
]

// precio(sabor_id, bebida_id) → número
export const BEBIDAS = [
  {
    id: 'soda-22',
    nombre: 'Soda / Canada Dry',
    oz: '22oz',
    emoji: '🥤',
    color: '#16a34a',
    bg: '#f0fdf4',
    precio: (sabor) => sabor === 'limon-hierbabuena' ? 8000 : 9000,
  },
  {
    id: 'soda-16',
    nombre: 'Soda / Canada Dry',
    oz: '16oz',
    emoji: '🥤',
    color: '#16a34a',
    bg: '#f0fdf4',
    precio: () => 8000,
  },
  {
    id: 'hatsu-22',
    nombre: 'Hatsu',
    oz: '22oz',
    emoji: '🍵',
    color: '#7c3aed',
    bg: '#fdf4ff',
    precio: () => 10000,
  },
  {
    id: 'hatsu-16',
    nombre: 'Hatsu',
    oz: '16oz',
    emoji: '🍵',
    color: '#7c3aed',
    bg: '#fdf4ff',
    precio: () => 9000,
  },
  {
    id: 'smirnoff-16',
    nombre: 'Smirnoff',
    oz: '16oz',
    emoji: '🍸',
    color: '#ea580c',
    bg: '#fff7ed',
    precio: () => 14000,
  },
]

export const ADICIONES = [
  { id: 'fruta',    nombre: 'Adición Fruta',       precio: 1500, emoji: '🍑' },
  { id: 'gomitas',  nombre: 'Adición Gomitas',      precio: 1200, emoji: '🍬' },
  { id: 'f-rojos',  nombre: 'Frutos Rojos',         precio: 1800, emoji: '🫐' },
  { id: 'f-verdes', nombre: 'Frutos Verdes',        precio: 1800, emoji: '🍏' },
  { id: 'perlas',   nombre: 'Perlas Explosivas',    precio: 2000, emoji: '✨' },
]

export const BORDES = [
  { id: 'sal-limon',   nombre: 'Sal Limón',    emoji: '🍋' },
  { id: 'sal-pimienta',nombre: 'Sal Pimienta', emoji: '🌶️' },
  { id: 'sal-tajin',   nombre: 'Sal Tajín',    emoji: '🧂' },
  { id: 'azucar',      nombre: 'Azúcar',       emoji: '🍬' },
  { id: 'azucar-tajin',nombre: 'Azúcar Tajín', emoji: '🍭' },
]

const PASOS = ['Sabor', 'Bebida', 'Adiciones', 'Borde']

// ── COMPONENTE ────────────────────────────────────────────────────────────────
export default function CheladaConfigurator({ onAgregar, onCerrar, inventario = [] }) {
  const [paso, setPaso] = useState(0)
  const [sabor, setSabor] = useState(null)
  const [bebida, setBebida] = useState(null)
  const [adiciones, setAdiciones] = useState([])
  const [borde, setBorde] = useState(null)

  // ── Helpers de stock ──────────────────────────────────────────────────────
  // Un sabor tiene stock si hay al menos 1 producto tipo 'sabor' enlazado con stock >= porcion_venta
  const saborTieneStock = (saborId) => {
    const prods = inventario.filter(p =>
      p.tipo === 'sabor' && Array.isArray(p.sabores_enlazados) && p.sabores_enlazados.includes(saborId)
    )
    if (prods.length === 0) return false // sin enlace = no disponible
    return prods.some(p => p.stock >= (p.porcion_venta || 100))
  }

  const bebidaTieneStock = (bebidaId) => {
    const enlazados = inventario.filter(p =>
      (p.tipo === 'bebida' || p.tipo === 'objeto') &&
      Array.isArray(p.bebidas_enlazadas) && p.bebidas_enlazadas.includes(bebidaId)
    )
    if (enlazados.length === 0) return false // sin enlace = no disponible
    // Debe haber stock tanto de la bebida como del vaso (objeto)
    const hayBebida = enlazados.some(p => p.tipo === 'bebida' && p.stock >= 1)
    const hayVaso   = enlazados.some(p => p.tipo === 'objeto'  && p.stock >= 1)
    return hayBebida && hayVaso
  }

  const adicionTieneStock = (adicionId) => {
    const prods = inventario.filter(p =>
      p.tipo === 'adicion' && Array.isArray(p.adiciones_enlazadas) && p.adiciones_enlazadas.includes(adicionId)
    )
    if (prods.length === 0) return false // sin enlace = no disponible
    return prods.some(p => p.stock >= (p.porcion_venta || 100))
  }

  const bordeTieneStock = (bordeId) => {
    const prods = inventario.filter(p =>
      p.tipo === 'borde' && Array.isArray(p.bordes_enlazados) && p.bordes_enlazados.includes(bordeId)
    )
    if (prods.length === 0) return false // sin enlace = no disponible
    return prods.some(p => p.stock >= (p.porcion_venta || 10))
  }

  const hayAlgunSaborDisponible = SABORES.some(s => saborTieneStock(s.id))
  const hayAlgunaBebidaDisponible = BEBIDAS.some(b => bebidaTieneStock(b.id))

  const precioBase = bebida ? bebida.precio(sabor?.id) : 0
  const precioAdiciones = adiciones.reduce((s, a) => s + a.precio, 0)
  const total = precioBase + precioAdiciones

  const toggleAdicion = (ad) => {
    setAdiciones(prev =>
      prev.find(a => a.id === ad.id)
        ? prev.filter(a => a.id !== ad.id)
        : [...prev, ad]
    )
  }

  const confirmar = () => {
    const nombre = [
      `${sabor.emoji} ${sabor.nombre}`,
      `${bebida.emoji} ${bebida.nombre} ${bebida.oz}`,
      adiciones.length ? `+ ${adiciones.map(a => a.nombre).join(', ')}` : '',
      borde ? `| Borde: ${borde.nombre}` : '',
    ].filter(Boolean).join(' · ')

    onAgregar({
      producto_id: `chelada-${Date.now()}`,
      nombre_producto: nombre,
      precio_unitario: total,
      cantidad: 1,
      es_combo: false,
      emoji: sabor.emoji,
      es_chelada: true,
      detalle: { sabor, bebida, adiciones, borde },
    })
    onCerrar()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full md:max-w-lg rounded-t-3xl md:rounded-3xl flex flex-col max-h-[92vh]"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              🍺 Arma tu Chelada
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {paso < 4 ? `Paso ${paso + 1} de 4 — ${PASOS[paso]}` : 'Lista para agregar'}
            </p>
          </div>
          <button onClick={onCerrar} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1 px-5 py-3 shrink-0">
          {PASOS.map((p, i) => {
            const done = i < paso
            const active = i === paso
            return (
              <div key={p} className="flex items-center gap-1 flex-1">
                <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => i < paso && setPaso(i)}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                    style={{
                      background: done ? '#16a34a' : active ? 'var(--primary)' : 'var(--bg-raised)',
                      color: done || active ? '#fff' : 'var(--text-dim)',
                    }}>
                    {done ? <Check size={12} /> : i + 1}
                  </div>
                  <span className="text-xs hidden sm:block" style={{ color: active ? 'var(--primary)' : done ? '#16a34a' : 'var(--text-dim)' }}>
                    {p}
                  </span>
                </div>
                {i < PASOS.length - 1 && (
                  <div className="flex-1 h-0.5 rounded-full mx-1"
                    style={{ background: done ? '#16a34a' : 'var(--bg-raised)' }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Contenido del paso */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">

          {/* PASO 0 — Sabor */}
          {paso === 0 && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              {!hayAlgunSaborDisponible && (
                <div className="col-span-2 rounded-xl p-3 text-center text-xs font-semibold"
                  style={{ background:'var(--danger-bg)', color:'var(--danger)' }}>
                  ⚠️ Sin ingredientes en inventario. Registra frutas primero.
                </div>
              )}
              {SABORES.map(s => {
                const disponible = saborTieneStock(s.id)
                return (
                  <button key={s.id}
                    onClick={() => { if (disponible) { setSabor(s); setPaso(1) } }}
                    disabled={!disponible}
                    className="flex items-center gap-3 rounded-2xl p-3 text-left transition-all active:scale-95 relative"
                    style={{
                      background: sabor?.id === s.id ? 'rgba(244,98,42,0.1)' : 'var(--bg-raised)',
                      border: `2px solid ${sabor?.id === s.id ? 'var(--primary)' : 'var(--border)'}`,
                      opacity: disponible ? 1 : 0.45,
                      cursor: disponible ? 'pointer' : 'not-allowed',
                    }}>
                    <span className="text-2xl shrink-0">{s.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold leading-tight block" style={{ color: 'var(--text-primary)' }}>
                        {s.nombre}
                      </span>
                      {!disponible && <span className="text-xs" style={{ color:'var(--danger)' }}>Sin stock</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* PASO 1 — Bebida */}
          {paso === 1 && (
            <div className="space-y-2 pt-1">
              {!hayAlgunaBebidaDisponible && (
                <div className="rounded-xl p-3 text-center text-xs font-semibold"
                  style={{ background:'var(--danger-bg)', color:'var(--danger)' }}>
                  ⚠️ Sin bebidas en inventario. Registra bebidas primero.
                </div>
              )}
              {BEBIDAS.map(b => {
                const precio = b.precio(sabor?.id)
                const disponible = bebidaTieneStock(b.id)
                return (
                  <button key={b.id}
                    onClick={() => { if (disponible) { setBebida(b); setPaso(2) } }}
                    disabled={!disponible}
                    className="w-full flex items-center gap-4 rounded-2xl p-4 text-left transition-all active:scale-95"
                    style={{
                      background: bebida?.id === b.id ? b.bg : 'var(--bg-raised)',
                      border: `2px solid ${bebida?.id === b.id ? b.color : 'var(--border)'}`,
                      opacity: disponible ? 1 : 0.45,
                      cursor: disponible ? 'pointer' : 'not-allowed',
                    }}>
                    <span className="text-3xl shrink-0">{b.emoji}</span>
                    <div className="flex-1">
                      <p className="font-bold text-sm" style={{ color: b.color }}>{b.nombre}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{b.oz}</p>
                      {!disponible && <p className="text-xs font-semibold" style={{ color:'var(--danger)' }}>Sin stock</p>}
                      {disponible && sabor?.id === 'limon-hierbabuena' && b.id === 'soda-22' && (
                        <p className="text-xs mt-0.5 font-medium" style={{ color: '#f59e0b' }}>
                          💡 Precio especial Limón Hierbabuena
                        </p>
                      )}
                    </div>
                    <p className="font-bold text-lg shrink-0" style={{ color: b.color }}>
                      ${precio.toLocaleString('es-CO')}
                    </p>
                  </button>
                )
              })}
            </div>
          )}

          {/* PASO 2 — Adiciones */}
          {paso === 2 && (
            <div className="space-y-2 pt-1">
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                Selección múltiple — cada adición suma al total
              </p>
              {/* Sin adicional */}
              <button
                onClick={() => setAdiciones([])}
                className="w-full flex items-center gap-4 rounded-2xl p-3.5 text-left transition-all"
                style={{
                  background: adiciones.length === 0 ? 'rgba(244,98,42,0.08)' : 'var(--bg-raised)',
                  border: `2px solid ${adiciones.length === 0 ? 'var(--primary)' : 'var(--border)'}`,
                }}>
                <span className="text-2xl shrink-0">🚫</span>
                <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Sin adicional</span>
                {adiciones.length === 0 && <Check size={16} style={{ color: 'var(--primary)' }} />}
              </button>
              {ADICIONES.map(ad => {
                const sel = adiciones.find(a => a.id === ad.id)
                const disponible = adicionTieneStock(ad.id)
                return (
                  <button key={ad.id}
                    onClick={() => { if (disponible) toggleAdicion(ad) }}
                    disabled={!disponible}
                    className="w-full flex items-center gap-4 rounded-2xl p-3.5 text-left transition-all"
                    style={{
                      background: sel ? 'rgba(244,98,42,0.08)' : 'var(--bg-raised)',
                      border: `2px solid ${sel ? 'var(--primary)' : 'var(--border)'}`,
                      opacity: disponible ? 1 : 0.45,
                      cursor: disponible ? 'pointer' : 'not-allowed',
                    }}>
                    <span className="text-2xl shrink-0">{ad.emoji}</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium block" style={{ color: 'var(--text-primary)' }}>
                        {ad.nombre}
                      </span>
                      {!disponible && <span className="text-xs" style={{ color:'var(--danger)' }}>Sin stock</span>}
                    </div>
                    <span className="text-sm font-bold shrink-0" style={{ color: sel ? 'var(--primary)' : 'var(--text-muted)' }}>
                      +${ad.precio.toLocaleString('es-CO')}
                    </span>
                    {sel && <Check size={16} style={{ color: 'var(--primary)' }} />}
                  </button>
                )
              })}
            </div>
          )}

          {/* PASO 3 — Borde */}
          {paso === 3 && (
            <div className="space-y-2 pt-1">
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                Selección única — opcional
              </p>
              <button onClick={() => setBorde(null)}
                className="w-full flex items-center gap-4 rounded-2xl p-3.5 text-left transition-all"
                style={{
                  background: !borde ? 'rgba(244,98,42,0.08)' : 'var(--bg-raised)',
                  border: `2px solid ${!borde ? 'var(--primary)' : 'var(--border)'}`,
                }}>
                <span className="text-2xl">🚫</span>
                <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Sin borde</span>
                {!borde && <Check size={16} style={{ color: 'var(--primary)' }} />}
              </button>
              {BORDES.map(bo => {
                const sinStock = !bordeTieneStock(bo.id)
                return (
                  <button key={bo.id} onClick={() => !sinStock && setBorde(bo)}
                    disabled={sinStock}
                    className="w-full flex items-center gap-4 rounded-2xl p-3.5 text-left transition-all"
                    style={{
                      background: borde?.id === bo.id ? 'rgba(244,98,42,0.08)' : 'var(--bg-raised)',
                      border: `2px solid ${borde?.id === bo.id ? 'var(--primary)' : 'var(--border)'}`,
                      opacity: sinStock ? 0.5 : 1,
                      cursor: sinStock ? 'not-allowed' : 'pointer',
                    }}>
                    <span className="text-2xl shrink-0">{bo.emoji}</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{bo.nombre}</span>
                      {sinStock && <p className="text-xs" style={{ color: 'var(--danger)' }}>Sin stock</p>}
                    </div>
                    {borde?.id === bo.id && <Check size={16} style={{ color: 'var(--primary)' }} />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer — resumen + botones */}
        <div className="px-5 py-4 shrink-0 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>

          {/* Resumen rápido */}
          {(sabor || bebida) && (
            <div className="rounded-xl px-3 py-2 flex items-center justify-between"
              style={{ background: 'var(--bg-raised)' }}>
              <div className="text-xs space-y-0.5">
                {sabor && <p style={{ color: 'var(--text-muted)' }}>{sabor.emoji} {sabor.nombre}</p>}
                {bebida && <p style={{ color: 'var(--text-muted)' }}>{bebida.emoji} {bebida.nombre} {bebida.oz}</p>}
                {adiciones.length > 0 && (
                  <p style={{ color: 'var(--text-muted)' }}>+ {adiciones.map(a => a.nombre).join(', ')}</p>
                )}
                {borde && <p style={{ color: 'var(--text-muted)' }}>Borde: {borde.nombre}</p>}
              </div>
              {bebida && (
                <p className="font-bold text-lg shrink-0 ml-3" style={{ color: 'var(--primary)' }}>
                  ${total.toLocaleString('es-CO')}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {paso > 0 && (
              <button onClick={() => setPaso(p => p - 1)}
                className="px-4 py-3 rounded-xl text-sm font-medium"
                style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                ← Atrás
              </button>
            )}

            {paso < 3 ? (
              <button
                disabled={paso === 0 ? !sabor || !hayAlgunSaborDisponible : paso === 1 ? !bebida || !hayAlgunaBebidaDisponible : false}
                onClick={() => setPaso(p => p + 1)}
                className="flex-1 py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
                Siguiente <ChevronRight size={16} />
              </button>
            ) : (
              <button
                disabled={!sabor || !bebida}
                onClick={confirmar}
                className="flex-1 py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
                <ShoppingCart size={16} /> Agregar — ${total.toLocaleString('es-CO')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
