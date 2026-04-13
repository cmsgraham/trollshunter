import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register, getLoginXUrl } from '../api/client'
import { useAuth } from '../App'

export default function AuthPage() {
  const { user, loginSuccess } = useAuth()
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [xLoading, setXLoading] = useState(false)
  const [error, setError] = useState('')

  // Show error from OAuth redirect
  const urlError = new URLSearchParams(window.location.search).get('error')

  if (user) {
    navigate('/', { replace: true })
    return null
  }

  const handleXLogin = async () => {
    setXLoading(true)
    setError('')
    try {
      const data = await getLoginXUrl()
      window.location.href = data.authorization_url
    } catch (err) {
      setError('Failed to connect to X. Check if API keys are configured.')
      setXLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let result
      if (isRegister) {
        result = await register(username, email, password)
      } else {
        result = await login(username, password)
      }
      loginSuccess(result.access_token, result.user)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <img src="/logos/trolls_hunter_logo_only.png" alt="TrollsHunter" className="auth-logo" />
      <div className="auth-card">
        <h1>Welcome to TrollsHunter</h1>
        <p className="subtitle">Login to report and vote on trolls.</p>

        {(error || urlError) && (
          <div className="error-message">{error || `Login failed: ${urlError}`}</div>
        )}

        <button
          onClick={handleXLogin}
          disabled={xLoading}
          className="btn btn-x-login"
          style={{ width: '100%', marginBottom: '1.5rem' }}
        >
          {xLoading ? 'Connecting...' : '𝕏 Login with X'}
        </button>

        <div className="auth-divider">
          <span>or use username &amp; password</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="your_username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="x-input"
              autoComplete="username"
            />
          </div>

          {isRegister && (
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                autoComplete="email"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="x-input"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-pill btn-pill-lg btn-pill-primary" style={{ width: '100%' }}>
            {loading ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
          </button>
        </form>

        <div className="auth-toggle">
          {isRegister ? (
            <p>Already have an account? <button onClick={() => { setIsRegister(false); setError('') }} className="link-btn">Login</button></p>
          ) : (
            <p>Don't have an account? <button onClick={() => { setIsRegister(true); setError('') }} className="link-btn">Register</button></p>
          )}
        </div>
      </div>
    </div>
  )
}
