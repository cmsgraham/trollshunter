import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../App'

export default function MobileNav() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleHomeClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault()
      navigate('/', { replace: true, state: { reset: Date.now() } })
    }
  }

  return (
    <nav className="mobile-nav">
      <NavLink to="/" end onClick={handleHomeClick} className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 1.696L.622 8.807l1.06 1.696L3 9.679V19.5C3 20.881 4.119 22 5.5 22h13c1.381 0 2.5-1.119 2.5-2.5V9.679l1.318.824 1.06-1.696L12 1.696zM12 16.5c-1.933 0-3.5-1.567-3.5-3.5s1.567-3.5 3.5-3.5 3.5 1.567 3.5 3.5-1.567 3.5-3.5 3.5z"/></svg>
        <span>Home</span>
      </NavLink>
      <NavLink to="/stats" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M8.75 21V3h2v18h-2zM18.75 21V8h2v13h-2zM3.75 21v-8h2v8h-2zM13.75 21v-5h2v5h-2z"/></svg>
        <span>Stats</span>
      </NavLink>
      <NavLink to="/games" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M21 6H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1zm-1 10H4V8h16v8zM6.5 13a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm4-1h2v2h-2v-2zm5.5 1a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/></svg>
        <span>Arcade</span>
      </NavLink>
      {user && (
        <NavLink to="/report" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M3 12c0-4.97 4.03-9 9-9s9 4.03 9 9-4.03 9-9 9-9-4.03-9-9zm10-4h-2v3H8v2h3v3h2v-3h3v-2h-3V8z"/></svg>
          <span>Report</span>
        </NavLink>
      )}
      {user?.is_admin && (
        <NavLink to="/admin" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 1C5.9 1 1 5.9 1 12s4.9 11 11 11 11-4.9 11-11S18.1 1 12 1zm1 15h-2v-2h2v2zm0-4h-2V6h2v6z"/></svg>
          <span>Admin</span>
        </NavLink>
      )}
      <NavLink to="/login" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M5.651 19h12.698c-.337-1.8-1.023-3.21-1.945-4.19C15.318 13.65 13.838 13 12 13s-3.317.65-4.404 1.81c-.922.98-1.608 2.39-1.945 4.19zm.486-5.56C7.627 11.85 9.648 11 12 11s4.373.85 5.863 2.44c1.477 1.58 2.366 3.8 2.632 6.46l.11 1.1H3.395l.11-1.1c.266-2.66 1.155-4.88 2.632-6.46zM12 4c-1.105 0-2 .9-2 2s.895 2 2 2 2-.9 2-2-.895-2-2-2zM8 6c0-2.21 1.791-4 4-4s4 1.79 4 4-1.791 4-4 4-4-1.79-4-4z"/></svg>
        <span>{user ? 'Profile' : 'Login'}</span>
      </NavLink>
    </nav>
  )
}
