import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  async function fetchUser() {
    try {
      const { data } = await api.get('/auth/me')
      setUser(data.data)
    } catch {
      localStorage.removeItem('accessToken')
    } finally {
      setLoading(false)
    }
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('accessToken', data.data.accessToken)
    setUser(data.data.user)
    return data.data.user
  }

  async function register(formData) {
    const { data } = await api.post('/auth/register', formData)
    localStorage.setItem('accessToken', data.data.accessToken)
    setUser(data.data.user)
    return data.data.user
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } catch {}
    localStorage.removeItem('accessToken')
    setUser(null)
  }

  async function updateProfile(formData) {
    const { data } = await api.put('/auth/me', formData)
    setUser(data.data)
    return data.data
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, fetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
