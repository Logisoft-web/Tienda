import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { setUnauthorizedHandler } from '../services/api'

const AuthContext = createContext(null)

// Decodifica el payload del JWT sin librería externa
function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

function isTokenExpired(token) {
  const payload = parseJwt(token)
  if (!payload?.exp) return true
  // exp está en segundos, Date.now() en ms
  return Date.now() >= payload.exp * 1000
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem('pos_token')
    localStorage.removeItem('pos_user')
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    const t = localStorage.getItem('pos_token')
    const u = localStorage.getItem('pos_user')
    if (t && u && !isTokenExpired(t)) {
      setToken(t)
      setUser(JSON.parse(u))
    } else if (t) {
      // Token expirado — limpiar
      logout()
    }
    setLoading(false)
  }, [])

  // Registrar handler para que api.js pueda hacer logout ante 401
  useEffect(() => {
    setUnauthorizedHandler(logout)
  }, [logout])

  // Verificar expiración cada minuto mientras la app está abierta
  useEffect(() => {
    if (!token) return
    const interval = setInterval(() => {
      if (isTokenExpired(token)) logout()
    }, 60 * 1000)
    return () => clearInterval(interval)
  }, [token, logout])

  const login = (tokenData, userData) => {
    localStorage.setItem('pos_token', tokenData)
    localStorage.setItem('pos_user', JSON.stringify(userData))
    setToken(tokenData)
    setUser(userData)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAdmin: user?.rol === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
