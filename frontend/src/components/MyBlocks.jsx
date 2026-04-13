import { useState, useEffect } from 'react'
import { getMyBlocks } from '../api/client'
import { useAuth } from '../App'

export default function MyBlocks() {
  const { user } = useAuth()
  const [blocks, setBlocks] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    getMyBlocks()
      .then(setBlocks)
      .catch((err) => setError(err.message))
  }, [user])

  if (!user) {
    return (
      <div className="page-center">
        <h2>Login Required</h2>
        <p>Login to see your blocked accounts.</p>
      </div>
    )
  }

  if (error) return <div className="error-message">{error}</div>
  if (!blocks) return <div className="loading">Loading...</div>

  return (
    <div className="my-blocks-page">
      <h1>My Blocked Accounts</h1>
      <p className="subtitle">You have blocked {blocks.total} accounts through TrollHunter.</p>

      {blocks.blocked_trolls.length === 0 ? (
        <div className="empty-state">
          <p>You haven't blocked anyone yet. Browse the list and start blocking!</p>
        </div>
      ) : (
        <div className="blocks-list">
          {blocks.blocked_trolls.map(troll => (
            <div key={troll.id} className="block-item">
              <span className="block-username">@{troll.x_username}</span>
              {troll.x_display_name && <span className="block-name">{troll.x_display_name}</span>}
              <span className="category-badge category-small" style={{
                backgroundColor: { troll: '#e74c3c', bot: '#3498db', spam: '#f39c12', hate: '#8e44ad' }[troll.category]
              }}>
                {troll.category}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
