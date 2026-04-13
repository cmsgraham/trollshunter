import { useState, useEffect, useCallback } from 'react'
import { fetchTrolls, detectCountry } from '../api/client'
import { useAuth } from '../App'
import TrollCard from './TrollCard'
import COUNTRIES from '../data/countries'

const categories = ['', 'troll', 'bot', 'spam', 'hate', 'politics', 'sports', 'entertainment', 'news', 'scam', 'other']
const categoryLabels = { '': 'All', troll: 'Trolls', bot: 'Bots', spam: 'Spam', hate: 'Hate', politics: 'Politics', sports: 'Sports', entertainment: 'Entertainment', news: 'News', scam: 'Scam', other: 'Other' }

export default function TrollList() {
  const { user } = useAuth()
  const [trolls, setTrolls] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState('')
  const [country, setCountry] = useState('')
  const [detectedCountry, setDetectedCountry] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [sortBy, setSortBy] = useState('upvotes')
  const [error, setError] = useState('')

  useEffect(() => {
    detectCountry().then(data => {
      setCountry(data.country_code)
      setDetectedCountry(data.country_code)
    })
  }, [])

  const loadTrolls = useCallback(async () => {
    try {
      const data = await fetchTrolls({ page, category: category || undefined, country: country || undefined, search: search || undefined, sortBy })
      setTrolls(data.trolls)
      setTotal(data.total)
    } catch (err) {
      setError(err.message)
    }
  }, [page, category, country, search, sortBy])

  useEffect(() => {
    loadTrolls()
  }, [loadTrolls])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <>
      {/* Mobile brand hero — hidden on desktop */}
      <div className="mobile-brand-hero">
        <img src="/logos/trolls_hunter_logo_only.png" alt="TrollsHunter" className="mobile-brand-logo" />
        <div className="mobile-brand-text">
          <h1>Community Blocklist</h1>
          <p>{total} accounts reported by the community</p>
        </div>
      </div>

      {/* Sticky top bar (desktop) */}
      <div className="page-top-bar">
        <h1>Community Blocklist</h1>
        <p className="subtitle">{total} accounts reported by the community</p>
      </div>

      {/* Search */}
      <div className="search-bar-wrapper">
        <form onSubmit={handleSearch} className="search-bar">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.824 5.262l4.781 4.781-1.414 1.414-4.781-4.781c-1.447 1.142-3.276 1.824-5.262 1.824-4.694 0-8.5-3.806-8.5-8.5z"/>
          </svg>
          <input
            type="text"
            placeholder="Search accounts"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
      </div>

      {/* Category tabs */}
      <div className="filter-tabs">
        {categories.map(cat => (
          <button
            key={cat}
            className={`filter-tab${category === cat ? ' active' : ''}`}
            onClick={() => { setCategory(cat); setPage(1) }}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Sort + Country filter */}
      <div className="sort-wrapper">
        <div className="sort-group">
          <span className="sort-label">Country</span>
          <select
            value={country}
            onChange={(e) => { setCountry(e.target.value); setPage(1) }}
            className="sort-select"
          >
            <option value="">🌍 All Countries</option>
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.name}{c.code === detectedCountry ? ' (you)' : ''}</option>
            ))}
          </select>
        </div>
        <div className="sort-group">
          <span className="sort-label">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1) }}
            className="sort-select"
          >
            <option value="upvotes">Most Confirmed</option>
            <option value="total_reports">Most Reported</option>
            <option value="created_at">Newest</option>
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Feed */}
      <div className="troll-feed">
        {trolls.map(troll => (
          <TrollCard key={troll.id} troll={troll} onRefresh={loadTrolls} />
        ))}
      </div>

      {trolls.length === 0 && !error && (
        <div className="empty-state">
          <p>No accounts found. {user ? 'Be the first to report one!' : 'Login to report trolls.'}</p>
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
  )
}
