import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, ShoppingCart, Package, DollarSign,
  BarChart2, Users, LogOut, Menu, X
} from 'lucide-react'
import { useState, useEffect } from 'react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/ventas', icon: ShoppingCart, label: 'Ventas' },
  { to: '/caja', icon: DollarSign, label: 'Caja' },
  { to: '/inventario', icon: Package, label: 'Inventario', adminOnly: true },
  { to: '/reportes', icon: BarChart2, label: 'Reportes', adminOnly: true },
  { to: '/usuarios', icon: Users, label: 'Usuarios', adminOnly: true },
]

export default function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  // Cerrar menú al cambiar de ruta
  useEffect(() => { setOpen(false) }, [location.pathname])

  const handleLogout = () => { logout(); navigate('/login') }
  const items = navItems.filter(i => !i.adminOnly || isAdmin)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Sidebar desktop (≥1024px) ─────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 bg-dark text-white shadow-xl shrink-0">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <img src="/logo.png" alt="Enjoy Cheladas" className="w-10 h-10 rounded-full object-cover" />
          <div>
            <p className="font-display font-bold text-sm leading-tight">Enjoy Cheladas</p>
            <p className="text-xs text-white/50">Sistema POS</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map(({ to, icon: Icon, label, exact }) => (
            <NavLink key={to} to={to} end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}>
              <Icon size={18} />{label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user?.nombre?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.nombre}</p>
              <p className="text-xs text-white/40 capitalize">{user?.rol}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-white/50 hover:text-red-400 text-sm transition-colors w-full">
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Sidebar tablet (768–1023px): barra lateral colapsable ──── */}
      <aside className={`hidden md:flex lg:hidden flex-col bg-dark text-white shadow-xl shrink-0 transition-all duration-300 ${open ? 'w-56' : 'w-16'}`}>
        {/* Toggle */}
        <button onClick={() => setOpen(!open)}
          className="flex items-center justify-center h-16 border-b border-white/10 hover:bg-white/10 transition-colors">
          {open
            ? <div className="flex items-center gap-3 px-4 w-full">
                <img src="/logo.png" alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                <span className="font-display font-bold text-sm truncate">Enjoy Cheladas</span>
              </div>
            : <Menu size={20} className="text-white/70" />
          }
        </button>

        <nav className="flex-1 px-2 py-3 space-y-1">
          {items.map(({ to, icon: Icon, label, exact }) => (
            <NavLink key={to} to={to} end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-primary text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}>
              <Icon size={20} className="shrink-0" />
              {open && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="px-2 py-3 border-t border-white/10">
          <button onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl text-white/50 hover:text-red-400 hover:bg-white/10 transition-all w-full ${open ? '' : 'justify-center'}`}>
            <LogOut size={20} className="shrink-0" />
            {open && <span className="text-sm">Salir</span>}
          </button>
        </div>
      </aside>

      {/* ── Header mobile (<768px) ────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-dark text-white flex items-center justify-between px-4 py-3 shadow-lg">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="" className="w-8 h-8 rounded-full object-cover" />
          <span className="font-display font-bold text-sm">Enjoy Cheladas</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/50 capitalize">{user?.nombre?.split(' ')[0]}</span>
          <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg bg-white/10">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* ── Menú mobile overlay ───────────────────────────────────── */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-dark/97 text-white pt-16 px-4 flex flex-col">
          <nav className="space-y-1 mt-2">
            {items.map(({ to, icon: Icon, label, exact }) => (
              <NavLink key={to} to={to} end={exact}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-4 rounded-2xl text-base font-medium ${
                    isActive ? 'bg-primary text-white' : 'text-white/70 active:bg-white/10'
                  }`}>
                <Icon size={22} />{label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto pb-8 px-4">
            <div className="flex items-center gap-3 mb-4 bg-white/5 rounded-2xl p-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                {user?.nombre?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{user?.nombre}</p>
                <p className="text-xs text-white/40 capitalize">{user?.rol}</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-3 text-white/50 hover:text-red-400 px-2 py-2 text-sm w-full">
              <LogOut size={18} /> Cerrar sesión
            </button>
          </div>
        </div>
      )}

      {/* ── Contenido principal ───────────────────────────────────── */}
      <main className="flex-1 overflow-auto md:pt-0 pt-14">
        <Outlet />
      </main>
    </div>
  )
}
