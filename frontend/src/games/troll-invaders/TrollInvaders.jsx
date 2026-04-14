import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { createGame } from './game'

export default function TrollInvaders() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const game = createGame(canvas)
    gameRef.current = game
    game.start()
    document.body.classList.add('ti-playing')
    return () => {
      game.destroy()
      document.body.classList.remove('ti-playing')
    }
  }, [])

  const handleMute = useCallback(() => {
    if (gameRef.current) gameRef.current.toggleMute()
  }, [])

  // Dpad touch handlers
  const dpad = useCallback((dir, fire) => {
    if (gameRef.current) gameRef.current.setDpad(dir, fire)
  }, [])

  const onPadStart = useCallback((dir) => (e) => {
    e.preventDefault()
    dpad(dir, true)
  }, [dpad])

  const onPadEnd = useCallback((e) => {
    e.preventDefault()
    dpad(0, false)
  }, [dpad])

  return (
    <div className="ti-wrapper">
      <div className="ti-topbar">
        <button className="ti-back" onClick={() => navigate('/games')} aria-label="Back">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"/>
          </svg>
        </button>
        <button className="ti-mute" onClick={handleMute} aria-label="Mute">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M11 5L6 9H2v6h4l5 4V5zm7.07.93a10 10 0 010 14.14l-1.41-1.41a8 8 0 000-11.32l1.41-1.41zM15.54 8.46a6 6 0 010 7.08l-1.41-1.41a4 4 0 000-4.24l1.41-1.43z"/>
          </svg>
        </button>
      </div>
      <div className="ti-canvas-wrap">
        <canvas ref={canvasRef} className="ti-canvas" />
      </div>
      <div className="ti-dpad">
        <div
          className="ti-dpad-zone ti-dpad-left"
          onTouchStart={onPadStart(-1)}
          onTouchEnd={onPadEnd}
          onTouchCancel={onPadEnd}
        >
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/></svg>
        </div>
        <div
          className="ti-dpad-zone ti-dpad-fire"
          onTouchStart={(e) => { e.preventDefault(); dpad(0, true) }}
          onTouchEnd={onPadEnd}
          onTouchCancel={onPadEnd}
        >
          <span className="ti-dpad-fire-label">FIRE</span>
        </div>
        <div
          className="ti-dpad-zone ti-dpad-right"
          onTouchStart={onPadStart(1)}
          onTouchEnd={onPadEnd}
          onTouchCancel={onPadEnd}
        >
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
        </div>
      </div>
      <div className="ti-controls-hint">
        <span>← → Move</span>
        <span>SPACE Shoot</span>
      </div>
    </div>
  )
}
