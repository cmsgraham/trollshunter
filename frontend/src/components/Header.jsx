import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../App'

export default function Header() {
  const { user, logout } = useAuth()
  const [navOpen, setNavOpen] = useState(false)

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <span className="logo-icon">🛡️</span>
          <span className="logo-text">TrollHunter</span>
        </Link>

        <button className="hamburger" onClick={() => setNavOpen(!navOpen)} aria-label="Toggle menu">
          {navOpen ? '✕' : '☰'}
        </button>

        <nav className={`nav${navOpen ? ' nav-open' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setNavOpen(false)}>Browse</Link>
          {user && <Link to="/report" className="nav-link" onClick={() => setNavOpen(false)}>Report</Link>}
          <Link to="/stats" className="nav-link" onClick={() => setNavOpen(false)}>Stats</Link>
        </nav>

        <div className="auth-section">
          {user ? (
            <div className="user-info">
              {user.x_profile_image_url && (
                <img src={user.x_profile_image_url} alt="" className="user-avatar" />
              )}
              <span className="user-name">{user.display_name || user.x_username || user.username}</span>
              <button onClick={logout} className="btn btn-secondary btn-sm">Logout</button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary">Login / Register</Link>
          )}
        </div>
      </div>
    </header>
  )
}
