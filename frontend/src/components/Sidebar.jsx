import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../App'

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="sidebar">
      <div className="sidebar-inner">
        <Link to="/" className="sidebar-logo" title="TrollsHunter">
          <img src="/logos/trolls_hunter_full_logo.png" alt="TrollsHunter" className="sidebar-logo-full" />
          <img src="/logos/trolls_hunter_logo_only.png" alt="TrollsHunter" className="sidebar-logo-icon" />
        </Link>

        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 1.696L.622 8.807l1.06 1.696L3 9.679V19.5C3 20.881 4.119 22 5.5 22h13c1.381 0 2.5-1.119 2.5-2.5V9.679l1.318.824 1.06-1.696L12 1.696zM12 16.5c-1.933 0-3.5-1.567-3.5-3.5s1.567-3.5 3.5-3.5 3.5 1.567 3.5 3.5-1.567 3.5-3.5 3.5z"/></svg>
            <span>Home</span>
          </NavLink>

          <NavLink to="/stats" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M8.75 21V3h2v18h-2zM18.75 21V8h2v13h-2zM3.75 21v-8h2v8h-2zM13.75 21v-5h2v5h-2z"/></svg>
            <span>Stats</span>
          </NavLink>

          {user && (
            <NavLink to="/report" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M3 12c0-4.97 4.03-9 9-9s9 4.03 9 9-4.03 9-9 9-9-4.03-9-9zm10-4h-2v3H8v2h3v3h2v-3h3v-2h-3V8z"/></svg>
              <span>Report</span>
            </NavLink>
          )}

          {user?.is_admin && (
            <NavLink to="/admin" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 1.5C6.21 1.5 1.5 6.21 1.5 12S6.21 22.5 12 22.5 22.5 17.79 22.5 12 17.79 1.5 12 1.5zM12 3.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm3 15h-6v-1.5c0-2 4-3.1 6-3.1v4.6zM11 10h2v1.5c2.33.23 4 1.13 4 2.5v1h-2v-.5c0-.55-1.16-1-2.5-1s-2.5.45-2.5 1v.5H8v-1c0-1.37 1.67-2.27 4-2.5V10h-1z"/></svg>
              <span>Admin</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-bottom">
          {user ? (
            <div className="sidebar-user" onClick={logout} title="Click to logout">
              {user.x_profile_image_url ? (
                <img src={`/api/proxy/image?url=${encodeURIComponent(user.x_profile_image_url)}`} alt="" className="sidebar-avatar" />
              ) : (
                <div className="sidebar-avatar sidebar-avatar-placeholder">
                  {(user.display_name || user.username || '?')[0].toUpperCase()}
                </div>
              )}
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user.display_name || user.x_display_name || user.username}</span>
                <span className="sidebar-user-handle">@{user.x_username || user.username}</span>
              </div>
              <span className="sidebar-dots">···</span>
            </div>
          ) : (
            <Link to="/login" className="btn-pill btn-pill-primary sidebar-login">
              Login
            </Link>
          )}
        </div>
      </div>
    </aside>
  )
}
