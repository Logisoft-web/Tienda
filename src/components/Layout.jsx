import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, ShoppingCart, Package, DollarSign,
  BarChart2, Users, LogOut, X, RefreshCw, WifiOff, Settings, Shield, Gift, ChevronRight
} from 'lucide-react'
import { useState, useEffect } from 'react'

function usePWA() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const updateServiceWorker = () => window.location.reload()
  return { needRefresh, setNeedRefresh, updateServiceWorker }
}

const navItems = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard',     exact: true },
  { to: '/ventas',        icon: ShoppingCart,    label: 'Ventas' },
  { to: '/caja',          icon: DollarSign,      label: 'Caja' },
  { to: '/clientes',      icon: Users,           label: 'Clientes' },
  { to: '/inventario',    icon: Package,         label: 'Inventario',    adminOnly: true },
  { to: '/combos',        icon: Gift,            label: 'Combos',        adminOnly: true },
  { to: '/reportes',      icon: BarChart2,       label: 'Reportes',      adminOnly: true },
  { to: '/usuarios',      icon: Users,           label: 'Usuarios',      adminOnly: true },
  { to: '/configuracion', icon: Settings,        label: 'Configuración', adminOnly: true },
  { to: '/superadmin',    icon: Shield,          label: 'Super Admin',   superOnly: true },
]

// Items que aparecen en el bottom nav mobile (los más usados)
const bottomNavItems = [
  { to: '/',       icon: LayoutDashboard, label: 'Inicio',   exact: true },
  { to: '/ventas', icon: ShoppingCart,    label: 'Ventas' },
  { to: '/caja',   icon: DollarSign,      label: 'Caja' },
  { to: '/clientes', icon: Users,         label: 'Clientes' },
]

export default function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const { needRefresh, setNeedRefresh, updateServiceWorker } = usePWA()

  const diasGracia = (() => {
    if (!user?.plan_expira || user.rol === 'superadmin') return null
    const dias = Math.floor((new Date() - new Date(user.plan_expira)) / (1000 * 60 * 60 * 24))
    if (dias > 0 && dias <= 5) return 5 - dias
    return null
  })()

  useEffect(() => {
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  useEffect(() => { setDrawerOpen(false) }, [location.pathname])

  const handleLogout = () => { logout(); navigate('/login') }
  const isSuperAdmin = user?.rol === 'superadmin'
  const items = navItems.filter(i => {
    if (i.superOnly) return isSuperAdmin
    if (i.adminOnly) return isAdmin || isSuperAdmin
    return true
  })

  const bannerCount = (needRefresh ? 1 : 0) + (!isOnline ? 1 : 0) + (diasGracia !== null ? 1 : 0)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>

      {/* ── Banners sistema ── */}
      <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col">
        {needRefresh && (
          <div className="flex items-center justify-between px-4 py-2.5 text-xs font-medium"
            style={{ background: 'var(--info-bg)', color: 'var(--info)', borderBottom: '1px solid var(--info-border)' }}>
            <div className="flex items-center gap-2"><RefreshCw size={13}/> Nueva versión disponible</div>
            <div className="flex gap-2">
              <button onClick={() => updateServiceWorker(true)}
                className="font-bold px-3 py-1 rounded-lg"
                style={{ background: 'rgba(37,99,235,0.12)', color: 'var(--info)' }}>
                Actualizar
              </button>
              <button onClick={() => setNeedRefresh(false)}><X size={14}/></button>
            </div>
          </div>
        )}
        {diasGracia !== null && (
          <div className="py-2 flex items-center justify-center gap-2 text-xs font-semibold"
            style={{ background: '#fef3c7', color: '#92400e', borderBottom: '1px solid #fcd34d' }}>
            ⚠️ Plan vencido — {diasGracia} día{diasGracia !== 1 ? 's' : ''} de gracia. Contacta al administrador.
          </div>
        )}
        {!isOnline && (
          <div className="py-2 flex items-center justify-center gap-2 text-xs font-medium"
            style={{ background: 'var(--warning-bg)', color: 'var(--warning)', borderBottom: '1px solid var(--warning-border)' }}>
            <WifiOff size={13}/> Sin conexión — modo offline
          </div>
        )}
      </div>

      {/* ── Sidebar desktop (lg+) ── */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0"
        style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-10 h-10 rounded-2xl overflow-hidden shrink-0"
            style={{ border: '1.5px solid var(--border-hover)', boxShadow: 'var(--shadow-sm)' }}>
            <img src="/logo.png" alt="Enjoy Cheladas" className="w-full h-full object-cover"/>
          </div>
          <div>
            <p className="font-display text-base leading-none tracking-wider" style={{ color: 'var(--text-primary)' }}>
              ENJOY CHELADAS
            </p>
            <p className="text-xs mt-1 font-medium" style={{ color: 'var(--text-dim)' }}>Sistema POS</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {items.map(({ to, icon: Icon, label, exact }) => (
            <NavLink key={to} to={to} end={exact}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group"
              style={({ isActive }) => isActive
                ? { background: 'rgba(244,98,42,0.1)', color: 'var(--primary)' }
                : { color: 'var(--text-muted)' }
              }>
              {({ isActive }) => (
                <>
                  <Icon size={17} style={{ color: isActive ? 'var(--primary)' : 'var(--text-dim)', transition: 'color 0.15s' }}/>
                  <span className="flex-1">{label}</span>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--primary)' }}/>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl mb-1"
            style={{ background: 'var(--bg-raised)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: 'rgba(244,98,42,0.15)', color: 'var(--primary)' }}>
              {user?.nombre?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.nombre}</p>
              <p className="text-xs capitalize font-medium" style={{ color: 'var(--text-dim)' }}>{user?.rol}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2.5 text-xs font-semibold w-full px-3 py-2.5 rounded-xl transition-all duration-150 press-feedback"
            style={{ color: 'var(--text-dim)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-bg)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.background = 'transparent' }}>
            <LogOut size={14}/> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Sidebar tablet (md) — iconos + expandible ── */}
      <aside className="hidden md:flex lg:hidden flex-col w-16 shrink-0"
        style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}>
        <div className="flex items-center justify-center h-16 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <img src="/logo.png" alt="" className="w-9 h-9 rounded-xl object-cover"
            style={{ border: '1.5px solid var(--border-hover)' }}/>
        </div>
        <nav className="flex-1 flex flex-col items-center py-3 gap-1 overflow-y-auto">
          {items.map(({ to, icon: Icon, label, exact }) => (
            <NavLink key={to} to={to} end={exact}
              title={label}
              className="btn-touch w-11 h-11 rounded-xl transition-all duration-150 press-feedback"
              style={({ isActive }) => isActive
                ? { background: 'rgba(244,98,42,0.12)', color: 'var(--primary)' }
                : { color: 'var(--text-dim)' }
              }>
              <Icon size={19}/>
            </NavLink>
          ))}
        </nav>
        <div className="flex flex-col items-center py-3" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={handleLogout} title="Cerrar sesión"
            className="btn-touch w-11 h-11 rounded-xl press-feedback transition-all duration-150"
            style={{ color: 'var(--text-dim)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-bg)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.background = 'transparent' }}>
            <LogOut size={18}/>
          </button>
        </div>
      </aside>

      {/* ── Header mobile ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4"
        style={{
          height: '56px',
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          marginTop: bannerCount * 36
        }}>
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="" className="w-8 h-8 rounded-xl object-cover"
            style={{ border: '1.5px solid var(--border-hover)' }}/>
          <span className="font-display text-sm tracking-wider" style={{ color: 'var(--text-primary)' }}>
            ENJOY CHELADAS
          </span>
        </div>
        <button onClick={() => setDrawerOpen(true)}
          className="btn-touch w-10 h-10 rounded-xl press-feedback"
          style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }}>
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
            <rect width="18" height="2" rx="1" fill="currentColor"/>
            <rect y="6" width="12" height="2" rx="1" fill="currentColor"/>
            <rect y="12" width="15" height="2" rx="1" fill="currentColor"/>
          </svg>
        </button>
      </div>

      {/* ── Drawer mobile (menú completo) ── */}
      {drawerOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}/>
          <div className="md:hidden fixed top-0 right-0 bottom-0 z-[70] w-72 flex flex-col slide-up"
            style={{ background: 'var(--bg-card)', boxShadow: '-8px 0 32px rgba(28,16,8,0.12)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="" className="w-9 h-9 rounded-xl object-cover"/>
                <div>
                  <p className="font-display text-sm tracking-wider" style={{ color: 'var(--text-primary)' }}>ENJOY CHELADAS</p>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-dim)' }}>Sistema POS</p>
                </div>
              </div>
              <button onClick={() => setDrawerOpen(false)}
                className="btn-touch w-9 h-9 rounded-xl press-feedback"
                style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }}>
                <X size={16}/>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {items.map(({ to, icon: Icon, label, exact }) => (
                <NavLink key={to} to={to} end={exact}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-150 press-feedback"
                  style={({ isActive }) => isActive
                    ? { background: 'rgba(244,98,42,0.1)', color: 'var(--primary)' }
                    : { color: 'var(--text-secondary)' }
                  }>
                  {({ isActive }) => (
                    <>
                      <Icon size={20} style={{ color: isActive ? 'var(--primary)' : 'var(--text-dim)' }}/>
                      <span className="flex-1">{label}</span>
                      {isActive && <ChevronRight size={15} style={{ color: 'var(--primary)', opacity: 0.6 }}/>}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="px-4 pb-8 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3 p-3 rounded-2xl mb-3"
                style={{ background: 'var(--bg-raised)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                  style={{ background: 'rgba(244,98,42,0.15)', color: 'var(--primary)' }}>
                  {user?.nombre?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{user?.nombre}</p>
                  <p className="text-xs capitalize font-medium" style={{ color: 'var(--text-dim)' }}>{user?.rol}</p>
                </div>
              </div>
              <button onClick={handleLogout}
                className="flex items-center gap-3 text-sm font-semibold w-full px-4 py-3 rounded-2xl press-feedback transition-all"
                style={{ color: 'var(--danger)', background: 'var(--danger-bg)' }}>
                <LogOut size={17}/> Cerrar sesión
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Bottom nav mobile (accesos rápidos táctiles) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
        style={{
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border)',
          boxShadow: '0 -4px 16px rgba(28,16,8,0.06)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
        {bottomNavItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink key={to} to={to} end={exact}
            className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 press-feedback transition-all duration-150"
            style={({ isActive }) => ({
              color: isActive ? 'var(--primary)' : 'var(--text-dim)',
              minHeight: '56px',
            })}>
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8}/>
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ background: 'var(--primary)' }}/>
                  )}
                </div>
                <span className="text-[10px] font-semibold tracking-wide">{label}</span>
              </>
            )}
          </NavLink>
        ))}
        {/* Botón "más" para el resto del menú */}
        <button onClick={() => setDrawerOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 press-feedback"
          style={{ color: 'var(--text-dim)', minHeight: '56px' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="5" cy="11" r="1.5" fill="currentColor"/>
            <circle cx="11" cy="11" r="1.5" fill="currentColor"/>
            <circle cx="17" cy="11" r="1.5" fill="currentColor"/>
          </svg>
          <span className="text-[10px] font-semibold tracking-wide">Más</span>
        </button>
      </nav>

      {/* ── Contenido principal ── */}
      <main className="flex-1 overflow-auto"
        style={{
          paddingTop: `calc(${bannerCount * 36}px + ${0}px)`,
          paddingBottom: 0,
          background: 'var(--bg-base)',
        }}>
        {/* Mobile: espacio para header fijo + bottom nav */}
        <div className="md:hidden" style={{ height: `calc(56px + ${bannerCount * 36}px)` }}/>
        <div className="md:hidden" style={{ paddingBottom: '72px' }}>
          <Outlet/>
        </div>
        <div className="hidden md:block h-full">
          <Outlet/>
        </div>
      </main>
    </div>
  )
}
