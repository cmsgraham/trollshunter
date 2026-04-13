import { useState, useEffect, useCallback } from 'react'
import { fetchPending, approveTroll, rejectTroll, fetchDisputed, dismissDisputes, removeTroll } from '../api/client'
import { useAuth } from '../App'

const categoryColors = {
  troll: '#f4212e', bot: '#1d9bf0', spam: '#ff7a00', hate: '#7856ff',
  politics: '#00ba7c', sports: '#f91880', entertainment: '#ffd400',
  news: '#8ecdf7', scam: '#ff6347', other: '#71767b',
}

function proxyImg(url) {
  if (!url) return null
  return `/api/proxy/image?url=${encodeURIComponent(url)}`
}

export default function AdminPanel() {
  const { user } = useAuth()
  const [tab, setTab] = useState('pending')
  const [trolls, setTrolls] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [disputed, setDisputed] = useState([])
  const [disputedTotal, setDisputedTotal] = useState(0)
  const [disputedPage, setDisputedPage] = useState(1)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  const loadPending = useCallback(async () => {
    try {
      const data = await fetchPending({ page })
      setTrolls(data.trolls)
      setTotal(data.total)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }, [page])

  const loadDisputed = useCallback(async () => {
    try {
      const data = await fetchDisputed({ page: disputedPage })
      setDisputed(data.trolls)
      setDisputedTotal(data.total)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }, [disputedPage])

  useEffect(() => {
    if (user?.is_admin) {
      loadPending()
      loadDisputed()
    }
  }, [user, loadPending, loadDisputed])

  if (!user || !user.is_admin) {
    return (
      <div className="page-center">
        <h2>Access Denied</h2>
        <p>You need admin privileges to access this page.</p>
      </div>
    )
  }

  const handleApprove = async (id) => {
    setActionLoading(id)
    try {
      await approveTroll(id)
      setTrolls(prev => prev.filter(t => t.id !== id))
      setTotal(prev => prev - 1)
    } catch (err) {
      alert(err.message)
    }
    setActionLoading(null)
  }

  const handleReject = async (id) => {
    if (!confirm('Reject and delete this report?')) return
    setActionLoading(id)
    try {
      await rejectTroll(id)
      setTrolls(prev => prev.filter(t => t.id !== id))
      setTotal(prev => prev - 1)
    } catch (err) {
      alert(err.message)
    }
    setActionLoading(null)
  }

  const handleDismiss = async (id) => {
    setActionLoading(id)
    try {
      await dismissDisputes(id)
      setDisputed(prev => prev.filter(t => t.id !== id))
      setDisputedTotal(prev => prev - 1)
    } catch (err) {
      alert(err.message)
    }
    setActionLoading(null)
  }

  const handleRemove = async (id) => {
    if (!confirm('Remove this troll from the list? (disputes upheld)')) return
    setActionLoading(id)
    try {
      await removeTroll(id)
      setDisputed(prev => prev.filter(t => t.id !== id))
      setDisputedTotal(prev => prev - 1)
    } catch (err) {
      alert(err.message)
    }
    setActionLoading(null)
  }

  const handleTabChange = (newTab) => {
    setTab(newTab)
    setError('')
  }

  const totalPages = Math.ceil(total / 20)
  const disputedTotalPages = Math.ceil(disputedTotal / 20)

  return (
    <>
      <div className="page-top-bar">
        <h1>Admin Panel</h1>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab${tab === 'pending' ? ' admin-tab-active' : ''}`}
          onClick={() => handleTabChange('pending')}
        >
          Pending {total > 0 && <span className="admin-tab-badge">{total}</span>}
        </button>
        <button
          className={`admin-tab${tab === 'disputed' ? ' admin-tab-active' : ''}`}
          onClick={() => handleTabChange('disputed')}
        >
          Disputed {disputedTotal > 0 && <span className="admin-tab-badge admin-tab-badge-red">{disputedTotal}</span>}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {tab === 'pending' && (
        <>
          <div className="admin-feed">
            {trolls.map(troll => (
              <div key={troll.id} className="admin-card">
                <div className="admin-card-left">
                  {troll.x_profile_image_url ? (
                    <img src={proxyImg(troll.x_profile_image_url)} alt="" className="admin-avatar" />
                  ) : (
                    <div className="admin-avatar admin-avatar-placeholder">
                      {troll.x_username[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="admin-card-body">
                  <div className="admin-card-header">
                    <span className="x-display-name">{troll.x_display_name || `@${troll.x_username}`}</span>
                    <span className="x-handle">@{troll.x_username}</span>
                    <span className="category-badge" style={{ backgroundColor: categoryColors[troll.category] }}>
                      {troll.category}
                    </span>
                    {troll.country && <span className="country-badge">{troll.country}</span>}
                  </div>
                  {troll.bio && <p className="admin-bio">{troll.bio}</p>}
                  {/* Reporter details */}
                  {troll.reports && troll.reports.length > 0 && (
                    <div className="admin-reporters">
                      <div className="admin-reporters-title">Reports ({troll.reports.length})</div>
                      {troll.reports.map((report) => (
                        <div key={report.id} className="admin-reporter-item">
                          <div className="admin-reporter-avatar">
                            {report.reporter_profile_image_url ? (
                              <img src={proxyImg(report.reporter_profile_image_url)} alt="" />
                            ) : (
                              <span>{(report.reporter_username || '?')[0].toUpperCase()}</span>
                            )}
                          </div>
                          <div className="admin-reporter-info">
                            <div className="admin-reporter-header">
                              <span className="admin-reporter-name">
                                {report.reporter_display_name || report.reporter_username || 'Anonymous'}
                              </span>
                              {report.reporter_username && (
                                <span className="admin-reporter-handle">@{report.reporter_username}</span>
                              )}
                              <span className="admin-reporter-date">
                                {new Date(report.created_at).toLocaleDateString()} {new Date(report.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                            {report.reason && <p className="admin-reporter-reason">{report.reason}</p>}
                            {report.evidence_url && (
                              <a href={report.evidence_url} target="_blank" rel="noopener noreferrer" className="admin-reporter-evidence">
                                📎 Evidence: {report.evidence_url.replace('https://', '')}
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="admin-meta">
                    <span>{troll.total_reports} report{troll.total_reports !== 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span>{new Date(troll.created_at).toLocaleDateString()}</span>
                    <span>·</span>
                    <a href={troll.profile_url} target="_blank" rel="noopener noreferrer" className="admin-profile-link">
                      View on X ↗
                    </a>
                  </div>
                </div>
                <div className="admin-card-actions">
                  <button
                    onClick={() => handleApprove(troll.id)}
                    disabled={actionLoading === troll.id}
                    className="btn-pill btn-pill-sm btn-pill-primary"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(troll.id)}
                    disabled={actionLoading === troll.id}
                    className="btn-pill btn-pill-sm btn-pill-danger"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>

          {trolls.length === 0 && !error && (
            <div className="empty-state">
              <p>No pending reports. All caught up!</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-pill btn-pill-sm btn-pill-secondary"
              >
                Previous
              </button>
              <span className="page-info">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-pill btn-pill-sm btn-pill-secondary"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {tab === 'disputed' && (
        <>
          <div className="admin-feed">
            {disputed.map(troll => (
              <div key={troll.id} className="admin-card admin-card-disputed">
                <div className="admin-card-left">
                  {troll.x_profile_image_url ? (
                    <img src={proxyImg(troll.x_profile_image_url)} alt="" className="admin-avatar" />
                  ) : (
                    <div className="admin-avatar admin-avatar-placeholder">
                      {troll.x_username[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="admin-card-body">
                  <div className="admin-card-header">
                    <span className="x-display-name">{troll.x_display_name || `@${troll.x_username}`}</span>
                    <span className="x-handle">@{troll.x_username}</span>
                    <span className="category-badge" style={{ backgroundColor: categoryColors[troll.category] }}>
                      {troll.category}
                    </span>
                    {troll.country && <span className="country-badge">{troll.country}</span>}
                  </div>
                  {troll.bio && <p className="admin-bio">{troll.bio}</p>}
                  {/* Reporter details */}
                  {troll.reports && troll.reports.length > 0 && (
                    <div className="admin-reporters">
                      <div className="admin-reporters-title">Reports ({troll.reports.length})</div>
                      {troll.reports.map((report) => (
                        <div key={report.id} className="admin-reporter-item">
                          <div className="admin-reporter-avatar">
                            {report.reporter_profile_image_url ? (
                              <img src={proxyImg(report.reporter_profile_image_url)} alt="" />
                            ) : (
                              <span>{(report.reporter_username || '?')[0].toUpperCase()}</span>
                            )}
                          </div>
                          <div className="admin-reporter-info">
                            <div className="admin-reporter-header">
                              <span className="admin-reporter-name">
                                {report.reporter_display_name || report.reporter_username || 'Anonymous'}
                              </span>
                              {report.reporter_username && (
                                <span className="admin-reporter-handle">@{report.reporter_username}</span>
                              )}
                              <span className="admin-reporter-date">
                                {new Date(report.created_at).toLocaleDateString()} {new Date(report.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                            {report.reason && <p className="admin-reporter-reason">{report.reason}</p>}
                            {report.evidence_url && (
                              <a href={report.evidence_url} target="_blank" rel="noopener noreferrer" className="admin-reporter-evidence">
                                📎 Evidence: {report.evidence_url.replace('https://', '')}
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="admin-meta">
                    <span className="disputes-count">{troll.downvotes} dispute{troll.downvotes !== 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span>{troll.upvotes} confirm{troll.upvotes !== 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span>{troll.total_reports} report{troll.total_reports !== 1 ? 's' : ''}</span>
                    <span>·</span>
                    <a href={troll.profile_url} target="_blank" rel="noopener noreferrer" className="admin-profile-link">
                      View on X ↗
                    </a>
                  </div>
                </div>
                <div className="admin-card-actions">
                  <button
                    onClick={() => handleDismiss(troll.id)}
                    disabled={actionLoading === troll.id}
                    className="btn-pill btn-pill-sm btn-pill-secondary"
                    title="Clear disputes, keep troll on the list"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleRemove(troll.id)}
                    disabled={actionLoading === troll.id}
                    className="btn-pill btn-pill-sm btn-pill-danger"
                    title="Remove troll from the list"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {disputed.length === 0 && !error && (
            <div className="empty-state">
              <p>No disputed reports.</p>
            </div>
          )}

          {disputedTotalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setDisputedPage(p => Math.max(1, p - 1))}
                disabled={disputedPage === 1}
                className="btn-pill btn-pill-sm btn-pill-secondary"
              >
                Previous
              </button>
              <span className="page-info">Page {disputedPage} of {disputedTotalPages}</span>
              <button
                onClick={() => setDisputedPage(p => Math.min(disputedTotalPages, p + 1))}
                disabled={disputedPage === disputedTotalPages}
                className="btn-pill btn-pill-sm btn-pill-secondary"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}
