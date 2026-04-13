import { useState } from 'react'

export default function Unsubscribe() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  // Pre-fill from URL param
  const params = new URLSearchParams(window.location.search)
  const prefill = params.get('email') || ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    const addr = email || prefill
    if (!addr) return
    setLoading(true)
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addr }),
      })
      if (res.ok) {
        setStatus('success')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
    setLoading(false)
  }

  if (status === 'success') {
    return (
      <div className="auth-page">
        <img src="/logos/trolls_hunter_logo_only.png" alt="TrollsHunter" className="auth-logo" />
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h1>Unsubscribed</h1>
          <p className="subtitle">You have been successfully removed from our mailing list.</p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: '16px' }}>
            You will no longer receive emails from TrollsHunter.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <img src="/logos/trolls_hunter_logo_only.png" alt="TrollsHunter" className="auth-logo" />
      <div className="auth-card">
        <h1>Unsubscribe</h1>
        <p className="subtitle">Enter your email to unsubscribe from TrollsHunter emails.</p>

        {status === 'error' && (
          <div className="error-message">Something went wrong. Please try again.</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="unsub-email">Email address</label>
            <input
              id="unsub-email"
              type="email"
              placeholder="you@example.com"
              defaultValue={prefill}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="x-input"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-pill btn-pill-primary" style={{ width: '100%' }}>
            {loading ? 'Processing...' : 'Unsubscribe'}
          </button>
        </form>
      </div>
    </div>
  )
}
