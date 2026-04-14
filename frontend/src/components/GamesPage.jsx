import { Link } from 'react-router-dom'

export default function GamesPage() {
  const best = +(localStorage.getItem('ti_best') || 0)
  const bestWave = +(localStorage.getItem('ti_bestWave') || 0)

  return (
    <>
      <div className="page-top-bar">
        <h1>Arcade</h1>
        <p className="subtitle">Mini-games inside TrollsHunter</p>
      </div>

      <div className="games-grid">
        <Link to="/games/troll-invaders" className="game-card-link">
          <div className="game-card-arcade">
            <div className="game-card-bg">
              {/* Decorative pixel trolls */}
              <div className="game-card-pixel t1" />
              <div className="game-card-pixel t2" />
              <div className="game-card-pixel t3" />
              <div className="game-card-pixel t4" />
              <div className="game-card-pixel t5" />
            </div>
            <div className="game-card-body">
              <span className="game-card-badge">FEATURED</span>
              <h2 className="game-card-name">TROLLS INVADERS</h2>
              <p className="game-card-desc">Defend the feed. Eliminate the trolls. Don't get overwhelmed.</p>
              {best > 0 && (
                <div className="game-card-stats">
                  <span>Best: {best}</span>
                  <span>Wave: {bestWave}</span>
                </div>
              )}
              <div className="game-card-cta">PLAY NOW →</div>
            </div>
          </div>
        </Link>
      </div>
    </>
  )
}
