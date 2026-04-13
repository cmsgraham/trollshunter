import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getMe } from '../api/client'
import { useAuth } from '../App'

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const { loginSuccess } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    const err = searchParams.get('error')

    if (err) {
      setError(`Login failed: ${err}`)
      return
    }

    if (!token) {
      setError('No token received')
      return
    }

    localStorage.setItem('token', token)
    getMe()
      .then((userData) => {
        loginSuccess(token, userData)
        navigate('/', { replace: true })
      })
      .catch(() => {
        localStorage.removeItem('token')
        setError('Failed to load user profile')
      })
  }, [searchParams, loginSuccess, navigate])

  if (error) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Login Failed</h1>
          <p className="error-message">{error}</p>
          <a href="/login" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Try Again
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Logging you in...</h1>
        <p>Please wait while we complete authentication.</p>
      </div>
    </div>
  )
}
