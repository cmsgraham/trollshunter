import { useState, useMemo } from 'react'
import { castVote } from '../api/client'
import { useAuth } from '../App'

const categoryColors = {
  troll: '#f4212e',
  bot: '#1d9bf0',
  spam: '#ff7a00',
  hate: '#7856ff',
  politics: '#00ba7c',
  sports: '#f91880',
  entertainment: '#ffd400',
  news: '#8ecdf7',
  scam: '#ff6347',
  other: '#71767b',
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

      {/* Recent Posts */}
      {troll.recent_posts && troll.recent_posts.length > 0 && (
        <div className="x-recent-posts">
          <div className="x-recent-posts-header">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21-.36.1-.74.15-1.13.15-.28 0-.54-.03-.8-.08.54 1.69 2.11 2.95 3.98 2.98-1.46 1.16-3.31 1.84-5.33 1.84-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/></svg>
            Recent Posts
          </div>
          <div className="x-recent-posts-list">
            {troll.recent_posts.map((post, i) => {
              const urlRegex = /(https?:\/\/t\.co\/[a-zA-Z0-9]+)/g
              const textPart = post.replace(urlRegex, '').trim()
              const urls = post.match(urlRegex) || []
              return (
                <div key={i} className="x-recent-post-card">
                  <div className="x-recent-post-index">{i + 1}</div>
                  <div className="x-recent-post-content">
                    {textPart && <p className="x-recent-post-text">{textPart}</p>}
                    {urls.length > 0 && (
                      <div className="x-recent-post-links">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M18.36 5.64c-1.95-1.96-5.11-1.96-7.07 0L9.88 7.05l1.41 1.42 1.42-1.42c1.17-1.17 3.07-1.17 4.24 0 1.17 1.17 1.17 3.07 0 4.24l-1.42 1.42 1.42 1.41 1.41-1.41c1.96-1.96 1.96-5.12 0-7.07zm-2.12 3.53l-7.07 7.07-1.41-1.41 7.07-7.07 1.41 1.41zm-4.95 7.78l-1.42 1.42c-1.17 1.17-3.07 1.17-4.24 0-1.17-1.17-1.17-3.07 0-4.24l1.42-1.42-1.42-1.41-1.41 1.41c-1.96 1.96-1.96 5.12 0 7.07 1.95 1.96 5.11 1.96 7.07 0l1.41-1.42-1.41-1.41z"/></svg>
                        {urls.map((url, j) => (
                          <a key={j} href={url} target="_blank" rel="noopener noreferrer" className="x-recent-post-link">{url.replace('https://', '')}</a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Metrics (like tweet counters) */}
      <div className="card-metrics">
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
