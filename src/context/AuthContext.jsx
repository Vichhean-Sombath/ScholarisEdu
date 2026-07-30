import { createContext, useContext, useEffect, useState } from 'react'
import { getCurrentUser, getToken, loginUser, logoutUser, registerUser } from '../services/authService'
import { confirmLogout, toastSuccess } from '../utils/sweetAlert'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = getCurrentUser()
    const token = getToken()
    setUser(token ? stored : null)
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const result = await loginUser(email, password)
    setUser(result.user)
    return result
  }

  const register = async (userData) => {
    const result = await registerUser(userData)
    setUser(result.user)
    return result
  }

  const logout = async () => {
    const confirmed = await confirmLogout()
    if (!confirmed) return
    await logoutUser()
    setUser(null)
    toastSuccess('Logged out successfully.')
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
