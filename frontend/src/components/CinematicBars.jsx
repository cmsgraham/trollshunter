import { useRef, useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

/**
 * CinematicBars — scroll-driven branded overlay for mobile.
 *
 * A fixed overlay with the bars shield sits on top of the page.
 * As the user scrolls, the overlay fades/scales out over 300px of scroll,
 * revealing the feed content underneath. Simple, performant, no nested scroll.
 */
export default function CinematicBars({ children, total }) {
  const [dismissed, setDismissed] = useState(false)
  const scrollContainer = useRef(null)

  // Track main page scroll position using window scroll
  const { scrollY } = useScroll()

  // Animation range: 0–300px of scroll
  const fadeRange = 350

  // --- Shield transforms ---
  const overlayOpacity = useTransform(scrollY, [0, fadeRange * 0.5, fadeRange], [1, 0.7, 0])
  const overlayScale = useTransform(scrollY, [0, fadeRange], [1, 0.88])
  const overlayY = useTransform(scrollY, [0, fadeRange], [0, -40])
  const overlayBlur = useTransform(scrollY, [fadeRange * 0.4, fadeRange], [0, 8])
  const filterVal = useTransform(overlayBlur, (v) => `blur(${v}px)`)

  // --- Glow ---
  const glowOpacity = useTransform(scrollY, [0, fadeRange * 0.3, fadeRange * 0.7], [0.7, 0.5, 0])

  // --- Title ---
  const titleOpacity = useTransform(scrollY, [0, fadeRange * 0.4], [1, 0])
  const titleY = useTransform(scrollY, [0, fadeRange * 0.4], [0, -24])

  // Once fully scrolled past, remove from DOM to ensure no pointer interference
  useEffect(() => {
    return scrollY.on('change', (v) => {
      setDismissed(v > fadeRange)
    })
  }, [scrollY, fadeRange])

  if (dismissed) {
    return <>{children}</>
  }

  return (
    <>
      {/* Fixed overlay — sits on top of everything */}
      <motion.div
        className="bars-fixed-overlay"
        style={{ opacity: overlayOpacity, pointerEvents: 'none' }}
      >
        {/* Glow */}
        <motion.div
          className="bars-glow"
          style={{ opacity: glowOpacity }}
        />

        {/* Shield image + title */}
        <motion.div
          className="bars-shield-wrapper"
          style={{
            scale: overlayScale,
            y: overlayY,
            filter: filterVal,
          }}
        >
          <img
            src="/logos/trolls_hunter_bars.png"
            alt=""
            className="bars-shield-img"
            draggable={false}
          />
          <motion.div
            className="bars-title"
            style={{ opacity: titleOpacity, y: titleY }}
          >
            <h1>Community Blocklist</h1>
            <p>{total} accounts reported</p>
          </motion.div>
        </motion.div>

        {/* Bottom vignette */}
        <div className="bars-vignette-bottom" />
      </motion.div>

      {/* Content flows normally in the page */}
      {children}
    </>
  )
}
