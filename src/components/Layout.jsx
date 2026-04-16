import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, ShoppingCart, Package, DollarSign,
  BarChart2, Users, LogOut, Menu, X, Beer
} from 'lucide-react'
import { useState } from 'react'

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
  const [open, setOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const items = navItems.filter(i => !i.adminOnly || isAdmin)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-dark text-white shadow-xl">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <img src="/logo.png" alt="Enjoy Cheladas" className="w-10 h-10 rounded-full object-cover" />
          <div>
            <p className="font-display font-bold text-sm leading-tight">Enjoy Cheladas</p>
            <p className="text-xs text-white/50">Sistema POS</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
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

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-dark text-white flex items-center justify-between px-4 py-3 shadow-lg">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="" className="w-8 h-8 rounded-full object-cover" />
          <span className="font-display font-bold text-sm">Enjoy Cheladas</span>
        </div>
        <button onClick={() => setOpen(!open)} className="p-1">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-dark/95 text-white pt-16 px-4">
          <nav className="space-y-1">
            {items.map(({ to, icon: Icon, label, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                    isActive ? 'bg-primary text-white' : 'text-white/70'
                  }`
                }
              >
                <Icon size={20} /> {label}
              </NavLink>
            ))}
          </nav>
          <button onClick={handleLogout} className="flex items-center gap-2 text-white/50 mt-6 px-4 py-2 text-sm">
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 overflow-auto md:pt-0 pt-14">
        <Outlet />
      </main>
    </div>
  )
}
