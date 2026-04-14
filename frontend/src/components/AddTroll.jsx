import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { reportTroll, detectCountry } from '../api/client'
import { useAuth } from '../App'
import COUNTRIES from '../data/countries'

export default function AddTroll() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [category, setCategory] = useState('troll')
  const [country, setCountry] = useState('')
  const [reason, setReason] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    detectCountry().then(data => setCountry(data.country_code))
  }, [])

  if (!user) {
    return (
      <div className="page-center">
        <h2>Login Required</h2>
        <p>You need to <a href="/login">login or register</a> to report trolls.</p>
      </div>
    )
  }

  const parseUsername = (val) => {
    const trimmed = val.trim()
    // Handle x.com or twitter.com profile URLs (with optional query params like ?s=21)
    const match = trimmed.match(/(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/(@?[\w]+)/i)
    if (match) return match[1].replace(/^@/, '')
    // Strip leading @
    return trimmed.replace(/^@/, '')
  }

  const handleUsernameChange = (e) => {
    setUsername(parseUsername(e.target.value))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await reportTroll({
        x_username: username,
        category,
        country: country || undefined,
        reason: reason || undefined,
        evidence_url: evidenceUrl || undefined,
      })
      alert(`@${username.replace('@', '')} has been reported! It will appear after admin approval.`)
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <>
      <div className="page-top-bar">
        <h1>Report Account</h1>
        <p className="subtitle">Help the community by reporting problematic accounts on X.</p>
      </div>

      <div className="form-section">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">X Username or Profile Link *</label>
            <input
              id="username"
              type="text"
              placeholder="username, @username, or profile link"
              value={username}
              onChange={handleUsernameChange}
              required
              className="x-input"
            />
            <span className="form-hint">Paste a profile link like x.com/username?s=21 — we'll extract it automatically.</span>
          </div>

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="x-select"
            >
              <option value="troll">Troll</option>
              <option value="bot">Bot</option>
              <option value="spam">Spam</option>
              <option value="hate">Hate Speech</option>
              <option value="politics">Politics</option>
              <option value="sports">Sports</option>
              <option value="entertainment">Entertainment</option>
              <option value="news">News / Misinformation</option>
              <option value="scam">Scam</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="country">Country</label>
            <select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="x-select"
            >
              <option value="">— Select Country —</option>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="reason">Reason</label>
            <textarea
              id="reason"
              placeholder="Why should this account be blocked?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={1000}
              className="x-textarea"
            />
          </div>

          <div className="form-group">
            <label htmlFor="evidence">Evidence URL</label>
            <input
              id="evidence"
              type="url"
              placeholder="https://x.com/... (link to problematic tweet)"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              className="x-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="btn-pill btn-pill-lg btn-pill-primary" style={{ width: '100%' }}>
            {loading ? 'Reporting...' : 'Report Account'}
          </button>
        </form>
      </div>
    </>
  )
}
