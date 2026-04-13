import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import MobileNav from './components/MobileNav'
import TrollList from './components/TrollList'
import AddTroll from './components/AddTroll'
import AuthPage from './components/AuthPage'
import AuthCallback from './components/AuthCallback'
import Stats from './components/Stats'
import AdminPanel from './components/AdminPanel'
import { getMe } from './api/client'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  // Track page visits
  useEffect(() => {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: location.pathname, referer: document.referrer }),
    }).catch(() => {})
  }, [location.pathname])

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const userData = await getMe()
      setUser(userData)
    } catch {
      localStorage.removeItem('token')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const loginSuccess = (token, userData) => {
    localStorage.setItem('token', token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <AuthContext.Provider value={{ user, logout, loginSuccess }}>
      <div className="app-layout">
        <Sidebar />
        <main className="main-column">
          <Routes>
            <Route path="/" element={<TrollList />} />
            <Route path="/report" element={<AddTroll />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/auth/success" element={<AuthCallback />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>
        <MobileNav />
      </div>
    </AuthContext.Provider>
  )
}
