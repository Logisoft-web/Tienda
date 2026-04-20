import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Ventas from './pages/Ventas'
import Inventario from './pages/Inventario'
import Caja from './pages/Caja'
import Reportes from './pages/Reportes'
import Usuarios from './pages/Usuarios'
import Configuracion from './pages/Configuracion'
import Clientes from './pages/Clientes'
import Combos from './pages/Combos'
import SuperAdmin from './pages/SuperAdmin'

function PrivateRoute({ children, adminOnly = false, superOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"/></div>
  if (!user) return <Navigate to="/login" replace />
  if (superOnly && user.rol !== 'superadmin') return <Navigate to="/" replace />
  if (adminOnly && user.rol !== 'admin' && user.rol !== 'superadmin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="ventas" element={<Ventas />} />
            <Route path="inventario" element={<PrivateRoute adminOnly><Inventario /></PrivateRoute>} />
            <Route path="caja" element={<Caja />} />
            <Route path="reportes" element={<PrivateRoute adminOnly><Reportes /></PrivateRoute>} />
            <Route path="usuarios" element={<PrivateRoute adminOnly><Usuarios /></PrivateRoute>} />
            <Route path="configuracion" element={<PrivateRoute adminOnly><Configuracion /></PrivateRoute>} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="combos" element={<PrivateRoute adminOnly><Combos /></PrivateRoute>} />
            <Route path="superadmin" element={<PrivateRoute superOnly><SuperAdmin /></PrivateRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
