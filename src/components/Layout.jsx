import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, ShoppingCart, Package, DollarSign,
  BarChart2, Users, LogOut, Menu, X, RefreshCw, WifiOff, Settings
} from 'lucide-react'
import { useState, useEffect } from 'react'

function usePWA() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const updateServiceWorker = () => window.location.reload()
  return { needRefresh, setNeedRefresh, updateServiceWorker }
}

const navItems = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard',    exact: true },
  { to: '/ventas',        icon: ShoppingCart,    label: 'Ventas' },
  { to: '/caja',          icon: DollarSign,      label: 'Caja' },
  { to: '/clientes',      icon: Users,           label: 'Clientes' },
  { to: '/inventario',    icon: Package,         label: 'Inventario',   adminOnly: true },
  { to: '/reportes',      icon: BarChart2,        label: 'Reportes',     adminOnly: true },
  { to: '/usuarios',      icon: Users,           label: 'Usuarios',     adminOnly: true },
  { to: '/configuracion', icon: Settings,        label: 'Configuración', adminOnly: true },
]

export default function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const { needRefresh, setNeedRefresh, updateServiceWorker } = usePWA()

  useEffect(() => {
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  useEffect(() => { setOpen(false) }, [location.pathname])

  const handleLogout = () => { logout(); navigate('/login') }
  const items = navItems.filter(i => !i.adminOnly || isAdmin)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>

      {/* Banner: actualización */}
      {needRefresh && (
        <div className="fixed top-0 left-0 right-0 z-[100] px-4 py-2.5 flex items-center justify-between text-sm shadow-sm"
          style={{ background: 'var(--info-bg)', color: 'var(--info)', borderBottom: '1px solid var(--info-border)' }}>
          <div className="flex items-center gap-2">
            <RefreshCw size={14} />
            <span>Nueva versión disponible</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => updateServiceWorker(true)}
              className="font-semibold px-3 py-1 rounded-lg text-xs transition-colors"
              style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--info)' }}>
              Actualizar
            </button>
            <button onClick={() => setNeedRefresh(false)} style={{ color: 'var(--info)' }}>
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Banner: offline */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[99] py-2 flex items-center justify-center gap-2 text-xs"
          style={{ background: 'var(--warning-bg)', color: 'var(--warning)', borderBottom: '1px solid var(--warning-border)' }}>
          <WifiOff size={13} />
          <span>Sin conexión — modo offline</span>
        </div>
      )}

      {/* ── Sidebar desktop ── */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0"
        style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 shadow-sm"
            style={{ border: '2px solid var(--border-hover)' }}>
            <img src="/logo.png" alt="Enjoy Cheladas" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-display text-base leading-none" style={{ color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
              ENJOY CHELADAS
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Sistema POS</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {items.map(({ to, icon: Icon, label, exact }) => (
            <NavLink key={to} to={to} end={exact}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={({ isActive }) => isActive
                ? { background: 'rgba(244,98,42,0.1)', color: 'var(--primary)' }
                : { color: 'var(--text-muted)' }
              }>
              {({ isActive }) => (
                <>
                  <Icon size={17} style={{ color: isActive ? 'var(--primary)' : 'var(--text-dim)' }} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: 'rgba(244,98,42,0.12)', color: 'var(--primary)' }}>
              {user?.nombre?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.nombre}</p>
              <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{user?.rol}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-medium transition-colors w-full py-1.5 px-1 rounded-lg"
            style={{ color: 'var(--text-dim)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-bg)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.background = 'transparent' }}>
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Sidebar tablet ── */}
      <aside className={`hidden md:flex lg:hidden flex-col shrink-0 transition-all duration-300 ${open ? 'w-52' : 'w-14'}`}
        style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}>
        <button onClick={() => setOpen(!open)}
          className="flex items-center justify-center h-14 transition-colors"
          style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          {open
            ? <div className="flex items-center gap-2.5 px-4 w-full">
                <img src="/logo.png" alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
                <span className="font-display text-sm truncate" style={{ color: 'var(--text-primary)' }}>ENJOY CHELADAS</span>
              </div>
            : <Menu size={18} />
          }
        </button>
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {items.map(({ to, icon: Icon, label, exact }) => (
            <NavLink key={to} to={to} end={exact}
              style={({ isActive }) => isActive
                ? { background: 'rgba(244,98,42,0.1)', color: 'var(--primary)', display:'flex', alignItems:'center', gap:'10px', padding:'10px', borderRadius:'10px', fontSize:'13px', fontWeight:600 }
                : { color: 'var(--text-muted)', display:'flex', alignItems:'center', gap:'10px', padding:'10px', borderRadius:'10px', fontSize:'13px', fontWeight:600 }
              }>
              <Icon size={18} className="shrink-0" />
              {open && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="px-2 py-3" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={handleLogout}
            className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl transition-all w-full ${open ? '' : 'justify-center'}`}
            style={{ color: 'var(--text-dim)' }}>
            <LogOut size={17} className="shrink-0" />
            {open && <span className="text-sm font-medium">Salir</span>}
          </button>
        </div>
      </aside>

      {/* ── Header mobile ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 shadow-sm"
        style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="" className="w-8 h-8 rounded-xl object-cover" />
          <span className="font-display text-sm" style={{ color: 'var(--text-primary)', letterSpacing: '0.05em' }}>ENJOY CHELADAS</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{user?.nombre?.split(' ')[0]}</span>
          <button onClick={() => setOpen(!open)}
            className="p-1.5 rounded-lg"
            style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* ── Menú mobile overlay ── */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 pt-14 flex flex-col"
          style={{ background: 'var(--bg-card)' }}>
          <nav className="px-4 pt-4 space-y-1">
            {items.map(({ to, icon: Icon, label, exact }) => (
              <NavLink key={to} to={to} end={exact}
                style={({ isActive }) => isActive
                  ? { background: 'rgba(244,98,42,0.1)', color: 'var(--primary)', display:'flex', alignItems:'center', gap:'14px', padding:'14px 16px', borderRadius:'14px', fontSize:'15px', fontWeight:700 }
                  : { color: 'var(--text-secondary)', display:'flex', alignItems:'center', gap:'14px', padding:'14px 16px', borderRadius:'14px', fontSize:'15px', fontWeight:600 }
                }>
                <Icon size={20} />{label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto pb-8 px-4">
            <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl" style={{ background: 'var(--bg-raised)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                style={{ background: 'rgba(244,98,42,0.12)', color: 'var(--primary)' }}>
                {user?.nombre?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.nombre}</p>
                <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{user?.rol}</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-3 text-sm font-medium px-2 py-2 w-full"
              style={{ color: 'var(--text-muted)' }}>
              <LogOut size={17} /> Cerrar sesión
            </button>
          </div>
        </div>
      )}

      {/* ── Contenido principal ── */}
      <main className={`flex-1 overflow-auto md:pt-0 pt-14 ${needRefresh || !isOnline ? 'mt-10' : ''}`}
        style={{ background: 'var(--bg-base)' }}>
        <Outlet />
      </main>
    </div>
  )
}
