import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { fetchTrolls, detectCountry } from '../api/client'
import { useAuth } from '../App'
import TrollCard from './TrollCard'
import CinematicBars from './CinematicBars'
import COUNTRIES from '../data/countries'
import { getIntroText } from '../data/introText'

const categories = ['', 'troll', 'bot', 'spam', 'hate', 'politics', 'sports', 'entertainment', 'news', 'scam', 'other']
const categoryLabels = { '': 'All', troll: 'Trolls', bot: 'Bots', spam: 'Spam', hate: 'Hate', politics: 'Politics', sports: 'Sports', entertainment: 'Entertainment', news: 'News', scam: 'Scam', other: 'Other' }

export default function TrollList() {
  const { user } = useAuth()
  const location = useLocation()
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
  const intro = getIntroText()

  // Reset all filters when Home is clicked (location.state.reset changes)
  useEffect(() => {
    if (location.state?.reset) {
      setCategory('')
      setSearch('')
      setSearchInput('')
      setPage(1)
      window.scrollTo(0, 0)
    }
  }, [location.state])

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

  const [introSeen, setIntroSeen] = useState(() => !!sessionStorage.getItem('introSeen'))

  // Listen for sessionStorage changes (set by CinematicBars on dismiss)
  useEffect(() => {
    const check = () => {
      if (sessionStorage.getItem('introSeen')) setIntroSeen(true)
    }
    window.addEventListener('storage', check)
    const interval = setInterval(check, 300)
    return () => { window.removeEventListener('storage', check); clearInterval(interval) }
  }, [])

  const totalPages = Math.ceil(total / 20)

  return (
    <>
      {/* Mobile intro — only on first visit this session */}
      {!introSeen && (
        <section className="intro-section">
          <img
            src="/logos/trolls_hunter_full_logo.png"
            alt="TrollsHunter"
            className="intro-logo"
            draggable={false}
          />
          <h2>{intro.heading}</h2>
          <p>
            {intro.p1} <strong>{intro.p1Bold}</strong>.
          </p>
          <p>{intro.p2}</p>
          <p className="intro-cta">{intro.cta}</p>
        </section>
      )}

      {/* Mobile cinematic bars — only on first visit this session */}
      {!introSeen ? (
        <CinematicBars>
          <div className="bars-feed-inner">
          {/* Sticky search + filters on mobile */}
          <div className="mobile-sticky-controls">
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
            <div className="sort-wrapper">
              <div className="sort-group">
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
          </div>
          <div className="troll-feed">
            {trolls.map(troll => (
              <TrollCard key={troll.id} troll={troll} onRefresh={loadTrolls} />
            ))}
          </div>
        </div>
      </CinematicBars>
      ) : (
        <div className="bars-feed-inner no-intro">
          <div className="mobile-sticky-controls">
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
            <div className="sort-wrapper">
              <div className="sort-group">
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
          </div>
          <div className="troll-feed">
            {trolls.map(troll => (
              <TrollCard key={troll.id} troll={troll} onRefresh={loadTrolls} />
            ))}
          </div>
        </div>
      )}

      {/* Desktop intro + header */}
      <div className="page-top-bar">
        <h1>{intro.heading}</h1>
        <p className="subtitle">
          {intro.p1} <strong>{intro.p1Bold}</strong>.
        </p>
        <p className="subtitle">{intro.p2}</p>
      </div>

      {/* Desktop search */}
      <div className="search-bar-wrapper desktop-only">
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

      {/* Desktop category tabs */}
      <div className="filter-tabs desktop-only">
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

      {/* Sort + Country filter (desktop only) */}
      <div className="sort-wrapper desktop-only">
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

      {/* Desktop feed */}
      <div className="troll-feed desktop-only">
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
