import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { createGame } from './game'

export default function TrollInvaders() {
  const canvasRef = useRef(null)
  const wrapperRef = useRef(null)
  const gameRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const canvas = canvasRef.current
    const wrapper = wrapperRef.current
    if (!canvas) return
    const game = createGame(canvas)
    gameRef.current = game
    // Pass wrapper as touch target so entire screen = one touch surface
    game.start(wrapper)
    document.body.classList.add('ti-playing')
    return () => {
      game.destroy()
      document.body.classList.remove('ti-playing')
    }
  }, [])

  const handleMute = useCallback(() => {
    if (gameRef.current) gameRef.current.toggleMute()
  }, [])

  return (
    <div className="ti-wrapper" ref={wrapperRef}>
      <div className="ti-topbar">
        <button className="ti-back" onClick={() => navigate('/games')} aria-label="Back"
          onTouchStart={e => e.stopPropagation()}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"/>
          </svg>
        </button>
        <button className="ti-mute" onClick={handleMute} aria-label="Mute"
          onTouchStart={e => e.stopPropagation()}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M11 5L6 9H2v6h4l5 4V5zm7.07.93a10 10 0 010 14.14l-1.41-1.41a8 8 0 000-11.32l1.41-1.41zM15.54 8.46a6 6 0 010 7.08l-1.41-1.41a4 4 0 000-4.24l1.41-1.43z"/>
          </svg>
        </button>
      </div>
      <div className="ti-canvas-wrap">
        <canvas ref={canvasRef} className="ti-canvas" />
      </div>
      <div className="ti-controls-hint">
        <span>← → Move</span>
        <span>SPACE Shoot</span>
      </div>
    </div>
  )
}
