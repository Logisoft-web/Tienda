import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('pos_token')
    const u = localStorage.getItem('pos_user')
    if (t && u) { setToken(t); setUser(JSON.parse(u)) }
    setLoading(false)
  }, [])

  const login = (tokenData, userData) => {
    localStorage.setItem('pos_token', tokenData)
    localStorage.setItem('pos_user', JSON.stringify(userData))
    setToken(tokenData)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('pos_token')
    localStorage.removeItem('pos_user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAdmin: user?.rol === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
