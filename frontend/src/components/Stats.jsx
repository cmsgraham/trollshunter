import { useState, useEffect } from 'react'
import { getStats } from '../api/client'

export default function Stats() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((err) => setError(err.message))
  }, [])

  if (error) return <div className="error-message">{error}</div>
  if (!stats) return <div className="loading">Loading...</div>

  return (
    <>
      <div className="page-top-bar">
        <h1>Community Statistics</h1>
      </div>
      <div className="stats-section">

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.total_trolls}</div>
          <div className="stat-label">Total Reported</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.verified_trolls}</div>
          <div className="stat-label">Community Verified</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.total_reports}</div>
          <div className="stat-label">Total Reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.pending_approval}</div>
          <div className="stat-label">Pending Approval</div>
        </div>
      </div>

      <h2>By Category</h2>
      <div className="category-stats">
        {Object.entries(stats.by_category).map(([cat, count]) => (
          <div key={cat} className="category-stat">
            <span className="category-badge" style={{
              backgroundColor: { troll: '#f4212e', bot: '#1d9bf0', spam: '#ff7a00', hate: '#7856ff', politics: '#00ba7c', sports: '#f91880', entertainment: '#ffd400', news: '#8ecdf7', scam: '#ff6347', other: '#71767b' }[cat]
            }}>{cat}</span>
            <span className="category-count">{count}</span>
          </div>
        ))}
      </div>
      </div>
    </>
  )
}
