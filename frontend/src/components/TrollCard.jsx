import { useState, useMemo } from 'react'
import { castVote } from '../api/client'
import { useAuth } from '../App'

const categoryColors = {
  troll: '#e5383b',
  bot: '#4a9eff',
  spam: '#e8651a',
  hate: '#9b5de5',
  politics: '#2dc672',
  sports: '#f15bb5',
  entertainment: '#fee440',
  news: '#72b4f5',
  scam: '#ff6b6b',
  other: '#6b7280',
}

function proxyImg(url) {
  if (!url) return null
  return `/api/proxy/image?url=${encodeURIComponent(url)}`
}

export default function TrollCard({ troll, onRefresh }) {
  const { user } = useAuth()
  const [voting, setVoting] = useState(false)

  const handleVote = async (type) => {
    if (!user) return alert('Login to vote')
    setVoting(true)
    try {
      await castVote(troll.id, type)
      onRefresh()
    } catch (err) {
      alert(err.message)
    }
    setVoting(false)
  }

  return (
    <div className="x-card">
      {/* Banner */}
      <div
        className={`x-banner${!troll.x_banner_url && troll.x_profile_image_url ? ' x-banner-blur' : ''}`}
        style={
          troll.x_banner_url
            ? { backgroundImage: `url(${proxyImg(troll.x_banner_url)})` }
            : troll.x_profile_image_url
              ? { backgroundImage: `url(${proxyImg(troll.x_profile_image_url)})` }
              : {}
        }
      />

      {/* Profile header */}
      <div className="x-profile-header">
        <div className="x-avatar-wrapper">
          {troll.x_profile_image_url ? (
            <img src={proxyImg(troll.x_profile_image_url)} alt="" className="x-avatar" />
          ) : (
            <div className="x-avatar x-avatar-placeholder">
              {troll.x_username[0].toUpperCase()}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="category-badge" style={{ backgroundColor: categoryColors[troll.category] }}>
            {troll.category}
          </span>
          {troll.country && <span className="country-badge" title={troll.country}>{troll.country}</span>}
          {troll.is_verified_troll && <span className="verified-badge" title="Community Verified">⚠️</span>}
        </div>
      </div>

      {/* Name & handle */}
      <div className="x-name-section">
        <div className="x-display-name">{troll.x_display_name || `@${troll.x_username}`}</div>
        <div className="x-handle">@{troll.x_username}</div>
      </div>

      {/* Bio */}
      {troll.bio && <p className="x-bio">{troll.bio}</p>}

      {/* Metrics (like tweet counters) */}
      <div className="card-metrics">
        {troll.followers_count != null && <span className="card-metric"><strong>{troll.followers_count.toLocaleString()}</strong> followers</span>}
        <span className="card-metric"><strong>{troll.total_reports}</strong> reports</span>
        <span className="card-metric"><strong>{troll.upvotes}</strong> confirms</span>
        <span className="card-metric"><strong>{troll.downvotes}</strong> disputes</span>
      </div>

      {/* Action icons (tweet-style) */}
      <div className="card-actions">
        <button
          onClick={() => handleVote('up')}
          disabled={voting || !user}
          className="icon-btn icon-btn-green"
          title="Confirm this is a troll"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M2 12.885c.14 2.976 1.993 7.296 9.2 10.782.24.116.52.116.76 0C19.007 20.18 20.86 15.86 21 12.885V4.515c0-.6-.26-1.17-.72-1.56l-.38-.32c-.52-.44-1.18-.68-1.86-.68H5.96c-.68 0-1.34.24-1.86.68l-.38.32c-.46.39-.72.96-.72 1.56v8.37zm10.56 8.704c-5.86-2.86-7.45-6.37-7.56-8.704v-8.37l.38-.32c.16-.14.38-.2.58-.2h12.08c.2 0 .42.06.58.2l.38.32v8.37c-.11 2.33-1.7 5.84-7.56 8.704-.16.08-.4.08-.56 0h-.32z"/></svg>
          {troll.upvotes > 0 && <span>{troll.upvotes}</span>}
        </button>
        <button
          onClick={() => handleVote('down')}
          disabled={voting || !user}
          className="icon-btn icon-btn-red"
          title="Dispute this report"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 1.5C6.21 1.5 1.5 6.21 1.5 12S6.21 22.5 12 22.5 22.5 17.79 22.5 12 17.79 1.5 12 1.5zm4.28 15.22l-1.06 1.06L12 14.56l-3.22 3.22-1.06-1.06L10.94 13.5 7.72 10.28l1.06-1.06L12 12.44l3.22-3.22 1.06 1.06L13.06 13.5l3.22 3.22z"/></svg>
          {troll.downvotes > 0 && <span>{troll.downvotes}</span>}
        </button>
        <a
          href={troll.profile_url}
          target="_blank"
          rel="noopener noreferrer"
          className="icon-btn icon-btn-blue"
          title="View profile on X"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18.36 5.64c-1.95-1.96-5.11-1.96-7.07 0L9.88 7.05l1.41 1.42 1.42-1.42c1.17-1.17 3.07-1.17 4.24 0 1.17 1.17 1.17 3.07 0 4.24l-1.42 1.42 1.42 1.41 1.41-1.41c1.96-1.96 1.96-5.12 0-7.07zm-2.12 3.53l-7.07 7.07-1.41-1.41 7.07-7.07 1.41 1.41zm-4.95 7.78l-1.42 1.42c-1.17 1.17-3.07 1.17-4.24 0-1.17-1.17-1.17-3.07 0-4.24l1.42-1.42-1.42-1.41-1.41 1.41c-1.96 1.96-1.96 5.12 0 7.07 1.95 1.96 5.11 1.96 7.07 0l1.41-1.42-1.41-1.41z"/></svg>
        </a>
      </div>

      {/* Bottom action buttons */}
      <div className="card-bottom-actions">
        <a
          href={troll.profile_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-pill btn-pill-sm btn-pill-secondary"
        >
          View Profile
        </a>
        <a
          href={troll.profile_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-pill btn-pill-sm btn-pill-danger"
        >
          Block on X
        </a>
      </div>
    </div>
  )
}
