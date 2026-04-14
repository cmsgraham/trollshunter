import { C } from './config'
import { createSprites } from './sprites'
import { audio } from './audio'

// ─── GAME FACTORY ─────────────────────────────────────────
export function createGame(canvas, onStateChange) {
  const ctx = canvas.getContext('2d')
  canvas.width = C.W
  canvas.height = C.H
  ctx.imageSmoothingEnabled = false

  const spr = createSprites()

  // ─── STATE ────────────────────────────────────────────
  let state = 'MENU' // MENU | PLAYING | WAVE_CLEAR | GAME_OVER
  let raf = 0
  let lastTime = 0
  let score = 0
  let best = +(localStorage.getItem('ti_best') || 0)
  let bestWave = +(localStorage.getItem('ti_bestWave') || 0)
  let lives = C.LIVES
  let wave = 0
  let streak = 0
  let longestStreak = 0
  let streakTimer = 0
  let fireTimer = 0
  let waveTimer = 0
  let invulnTimer = 0
  let shakeAmt = 0

  // Entities
  let player = { x: C.W / 2, y: C.H - 36 }
  let bullets = []
  let eBullets = []
  let enemies = []
  let particles = []
  let pops = [] // text popups
  let streakPop = null
  let weapon = 'normal' // 'normal' | 'dual' | 'triple'
  let weaponTimer = 0
  let powerups = []
  let gameOverTimer = 0

  // Stars
  const stars = Array.from({ length: 80 }, () => ({
    x: Math.random() * C.W,
    y: Math.random() * C.H,
    s: 8 + Math.random() * 25,
    r: Math.random() < 0.3 ? 1.5 : 0.8,
    b: 0.3 + Math.random() * 0.5,
  }))

  // ─── INPUT ────────────────────────────────────────────
  const keys = {}
  let touchX = null
  let touching = false

  function kd(e) {
    keys[e.code] = true
    if (e.code === 'Space' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') e.preventDefault()
    if ((e.code === 'Space' || e.code === 'Enter') && state !== 'PLAYING') {
      if (state !== 'GAME_OVER' || gameOverTimer <= 0) startGame()
    }
  }
  function ku(e) { keys[e.code] = false }

  function ts(e) {
    e.preventDefault()
    const rect = canvas.getBoundingClientRect()
    const t = e.touches[0]
    touchX = ((t.clientX - rect.left) / rect.width) * C.W
    touching = true
    if (state !== 'PLAYING') {
      if (state !== 'GAME_OVER' || gameOverTimer <= 0) startGame()
    }
  }
  function tm(e) {
    e.preventDefault()
    const rect = canvas.getBoundingClientRect()
    const t = e.touches[0]
    touchX = ((t.clientX - rect.left) / rect.width) * C.W
  }
  function te() { touching = false; touchX = null }

  // ─── WAVES ────────────────────────────────────────────
  function spawnWave() {
    wave++
    enemies = []
    const rows = Math.min(3 + Math.floor(wave / 3), 7)
    const cols = Math.min(4 + Math.floor(wave / 3), 8)
    const gapX = 34
    const gapY = 30
    const startX = (C.W - (cols - 1) * gapX) / 2
    const startY = 50

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let type = 'troll'
        if (wave >= 3 && r === 0) type = 'spam'
        if (wave >= 5 && r < 2 && Math.random() < 0.3) type = 'spam'
        if (wave >= 6 && r === 0 && c % 2 === 0) type = 'elite'
        if (wave >= 9 && r < 2 && Math.random() < 0.2) type = 'elite'

        const scale = 2
        const w = (type === 'elite' ? 11 : 9) * scale
        const h = (type === 'elite' ? 10 : 8) * scale
        enemies.push({
          type,
          x: startX + c * gapX,
          y: startY + r * gapY,
          w, h, scale,
          hp: type === 'elite' ? 2 : 1,
          pts: type === 'troll' ? 10 : type === 'spam' ? 20 : 30,
          flash: 0,
          anim: Math.random() * Math.PI * 2,
        })
      }
    }
    // Group movement
    enemies._dir = 1
    enemies._speed = 18 + wave * 3
    enemies._startCount = enemies.length
    enemies._dropTimer = 0
    enemies._shootMult = 1 + wave * 0.15
  }

  // ─── START / RESET ────────────────────────────────────
  function startGame() {
    if (state === 'PLAYING') return
    score = 0
    lives = C.LIVES
    wave = 0
    streak = 0
    longestStreak = 0
    player = { x: C.W / 2, y: C.H - 36 }
    bullets = []
    eBullets = []
    particles = []
    pops = []
    streakPop = null
    invulnTimer = 0
    weapon = 'normal'
    weaponTimer = 0
    powerups = []
    gameOverTimer = 0
    state = 'WAVE_CLEAR'
    waveTimer = 1.2
    spawnWave()
    audio.click()
    notify()
  }

  function notify() { if (onStateChange) onStateChange({ state, score, best, wave }) }

  // ─── PARTICLES ────────────────────────────────────────
  function burst(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.4
      const sp = 40 + Math.random() * 80
      particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.3 + Math.random() * 0.3,
        maxLife: 0.5,
        size: 1 + Math.random() * 2,
        color,
      })
    }
  }

  function addPop(x, y, text, color = '#fff', size = 8) {
    pops.push({ x, y, text, color, size, life: 0.8, vy: -40 })
  }

  // ─── UPDATE ───────────────────────────────────────────
  function update(dt) {
    if (state === 'WAVE_CLEAR') {
      waveTimer -= dt
      if (waveTimer <= 0) {
        state = 'PLAYING'
        notify()
      }
      updateStars(dt)
      return
    }
    if (state !== 'PLAYING') {
      updateStars(dt)
      if (state === 'GAME_OVER' && gameOverTimer > 0) gameOverTimer -= dt
      return
    }

    // Player movement
    let dx = 0
    if (keys.ArrowLeft || keys.KeyA) dx = -1
    if (keys.ArrowRight || keys.KeyD) dx = 1
    if (touching && touchX !== null) {
      const diff = touchX - player.x
      if (Math.abs(diff) > 4) dx = diff > 0 ? 1 : -1
    }
    player.x += dx * C.PLAYER_SPEED * dt
    player.x = Math.max(8, Math.min(C.W - 8, player.x))

    // Shooting
    fireTimer -= dt
    const wantShoot = keys.Space || touching
    if (wantShoot && fireTimer <= 0 && bullets.length < C.MAX_BULLETS) {
      if (weapon === 'triple') {
        bullets.push({ x: player.x, y: player.y - 6, w: 3, h: 5, vx: 0 })
        bullets.push({ x: player.x - 8, y: player.y - 4, w: 3, h: 5, vx: -35 })
        bullets.push({ x: player.x + 8, y: player.y - 4, w: 3, h: 5, vx: 35 })
      } else if (weapon === 'dual') {
        bullets.push({ x: player.x - 5, y: player.y - 6, w: 3, h: 5, vx: 0 })
        bullets.push({ x: player.x + 5, y: player.y - 6, w: 3, h: 5, vx: 0 })
      } else {
        bullets.push({ x: player.x, y: player.y - 6, w: 3, h: 5, vx: 0 })
      }
      fireTimer = C.FIRE_RATE
      audio.shoot()
    }

    // Update bullets
    bullets = bullets.filter(b => {
      b.y -= C.BULLET_SPEED * dt
      b.x += (b.vx || 0) * dt
      return b.y > -10 && b.x > -10 && b.x < C.W + 10
    })

    // Update enemy bullets
    eBullets = eBullets.filter(b => {
      b.y += C.ENEMY_BULLET_SPEED * dt
      return b.y < C.H + 10
    })

    // Enemy movement (group)
    if (enemies.length > 0) {
      const ratio = 1 - enemies.length / (enemies._startCount || 40)
      const spd = enemies._speed * (1 + ratio * 1.5 + (ratio > 0.7 ? (ratio - 0.7) * 5 : 0))
      let minX = Infinity, maxX = -Infinity
      for (const e of enemies) {
        minX = Math.min(minX, e.x - e.w / 2)
        maxX = Math.max(maxX, e.x + e.w / 2)
      }

      let drop = false
      if (maxX + spd * dt * enemies._dir > C.W - 4 || minX + spd * dt * enemies._dir < 4) {
        enemies._dir *= -1
        drop = true
      }

      for (const e of enemies) {
        e.x += spd * enemies._dir * dt
        if (drop) e.y += 8
        e.anim += dt * 3
        if (e.flash > 0) e.flash -= dt

        // Enemy shooting
        if (Math.random() < C.ENEMY_SHOOT_CHANCE * enemies._shootMult * dt * 60) {
          eBullets.push({ x: e.x, y: e.y + e.h / 2, w: 3, h: 4 })
        }
      }
    }

    // Collision: bullets → enemies
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const b = bullets[bi]
      for (let ei = enemies.length - 1; ei >= 0; ei--) {
        const e = enemies[ei]
        if (Math.abs(b.x - e.x) < (b.w + e.w) / 2 && Math.abs(b.y - e.y) < (b.h + e.h) / 2) {
          bullets.splice(bi, 1)
          e.hp--
          e.flash = 0.08
          if (e.hp <= 0) {
            // Kill!
            const color = e.type === 'troll' ? '#44ff44' : e.type === 'spam' ? '#88aaff' : '#ff6633'
            burst(e.x, e.y, color, 10)
            score += e.pts * (1 + Math.floor(streak / 5))
            streak++
            streakTimer = 2
            if (streak > longestStreak) longestStreak = streak

            // Kill text
            const kt = C.KILL_TEXT[Math.floor(Math.random() * C.KILL_TEXT.length)]
            addPop(e.x, e.y - 6, kt, color, 7)
            addPop(e.x, e.y + 4, `+${e.pts * (1 + Math.floor(streak / 5))}`, '#fff', 6)

            // Streak milestones
            const sm = C.STREAK.find(s => s.n === streak)
            if (sm) {
              streakPop = { text: sm.label, color: sm.color, life: 1.5 }
              shakeAmt = 6
              audio.streak()
            } else {
              shakeAmt = 3
            }

            enemies.splice(ei, 1)
            audio.destroy()

            // Power-up drop
            if (Math.random() < C.POWERUP_DROP_CHANCE) {
              powerups.push({
                type: Math.random() < 0.65 ? 'dual' : 'triple',
                x: e.x, y: e.y,
              })
            }
          } else {
            audio.hit()
            shakeAmt = 2
          }
          break
        }
      }
    }

    // Streak timer
    if (streak > 0) {
      streakTimer -= dt
      if (streakTimer <= 0) streak = 0
    }

    // Weapon timer
    if (weaponTimer > 0) {
      weaponTimer -= dt
      if (weaponTimer <= 0) { weapon = 'normal'; weaponTimer = 0 }
    }

    // Update & collect power-ups
    const WLEVELS = { normal: 0, dual: 1, triple: 2 }
    for (let i = powerups.length - 1; i >= 0; i--) {
      const p = powerups[i]
      p.y += C.POWERUP_SPEED * dt
      if (p.y > C.H + 10) { powerups.splice(i, 1); continue }
      if (Math.abs(p.x - player.x) < 14 && Math.abs(p.y - player.y) < 14) {
        if (WLEVELS[p.type] >= WLEVELS[weapon]) weapon = p.type
        weaponTimer = C.POWERUP_DURATION
        powerups.splice(i, 1)
        audio.streak()
        addPop(player.x, player.y - 16, weapon === 'triple' ? 'TRIPLE!' : 'DUAL!', weapon === 'triple' ? '#ff44ff' : '#ffcc00', 10)
        shakeAmt = 3
      }
    }

    // Collision: enemy bullets → player
    invulnTimer -= dt
    if (invulnTimer <= 0) {
      for (let i = eBullets.length - 1; i >= 0; i--) {
        const b = eBullets[i]
        if (Math.abs(b.x - player.x) < 7 && Math.abs(b.y - player.y) < 7) {
          eBullets.splice(i, 1)
          hitPlayer()
          break
        }
      }
    }

    // Collision: enemies reaching player
    for (const e of enemies) {
      if (e.y + e.h / 2 > player.y - 8) {
        hitPlayer()
        break
      }
    }

    // Particles
    particles = particles.filter(p => {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.life -= dt
      return p.life > 0
    })

    // Text pops
    pops = pops.filter(p => {
      p.y += p.vy * dt
      p.life -= dt
      return p.life > 0
    })

    // Streak pop
    if (streakPop) {
      streakPop.life -= dt
      if (streakPop.life <= 0) streakPop = null
    }

    // Shake decay
    shakeAmt *= 0.88

    // Wave clear check
    if (enemies.length === 0 && state === 'PLAYING') {
      state = 'WAVE_CLEAR'
      waveTimer = 2
      audio.waveComplete()
      spawnWave()
      notify()
    }

    updateStars(dt)
  }

  function hitPlayer() {
    if (invulnTimer > 0) return
    lives--
    streak = 0
    invulnTimer = 1.5
    shakeAmt = 8
    burst(player.x, player.y, '#ff4444', 15)
    audio.playerHit()
    if (lives <= 0) {
      state = 'GAME_OVER'
      gameOverTimer = 1.5
      if (score > best) { best = score; localStorage.setItem('ti_best', best) }
      if (wave > bestWave) { bestWave = wave; localStorage.setItem('ti_bestWave', bestWave) }
      audio.gameOver()
      notify()
    }
  }

  function updateStars(dt) {
    for (const s of stars) {
      s.y += s.s * dt
      if (s.y > C.H) { s.y = -2; s.x = Math.random() * C.W }
    }
  }

  // ─── RENDER ───────────────────────────────────────────
  function render() {
    const sx = shakeAmt > 0.5 ? (Math.random() - 0.5) * shakeAmt : 0
    const sy = shakeAmt > 0.5 ? (Math.random() - 0.5) * shakeAmt : 0

    ctx.save()
    ctx.translate(sx, sy)

    // Background
    ctx.fillStyle = C.BG
    ctx.fillRect(-4, -4, C.W + 8, C.H + 8)

    // Stars
    for (const s of stars) {
      ctx.globalAlpha = s.b
      ctx.fillStyle = '#8888cc'
      ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.r, s.r)
    }
    ctx.globalAlpha = 1

    // Grid lines (bottom area)
    ctx.strokeStyle = 'rgba(232,101,26,0.04)'
    for (let y = C.H - 60; y < C.H; y += 10) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(C.W, y); ctx.stroke()
    }

    // Enemies
    for (const e of enemies) {
      const sprite = e.flash > 0 ? spr[e.type + 'Hit'] || spr[e.type] : spr[e.type]
      const wobble = Math.sin(e.anim) * 0.8
      drawSprite(sprite, e.x, e.y + wobble, e.scale || 2)
    }

    // Player
    if (state === 'PLAYING' || state === 'WAVE_CLEAR') {
      if (invulnTimer <= 0 || Math.floor(invulnTimer * 10) % 2 === 0) {
        const sp = invulnTimer > 0 ? spr.playerHit : spr.player
        drawSprite(sp, player.x, player.y, 2)
      }
    }

    // Bullets
    for (const b of bullets) drawSprite(spr.bullet, b.x, b.y, 1.5)
    for (const b of eBullets) drawSprite(spr.enemyBullet, b.x, b.y, 1.5)

    // Power-ups
    for (const p of powerups) {
      const bob = Math.sin(Date.now() / 200) * 2
      const col = p.type === 'triple' ? '#ff44ff' : '#ffcc00'
      ctx.globalAlpha = 0.25
      ctx.fillStyle = col
      ctx.beginPath()
      ctx.arc(p.x, p.y + bob, 9, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
      drawSprite(spr['powerup' + (p.type === 'triple' ? 'Triple' : 'Dual')], p.x, p.y + bob, 2)
    }

    // Weapon indicator near player
    if (weapon !== 'normal' && (state === 'PLAYING' || state === 'WAVE_CLEAR')) {
      const col = weapon === 'triple' ? '#ff44ff' : '#ffcc00'
      ctx.font = 'bold 7px monospace'
      ctx.textAlign = 'center'
      ctx.globalAlpha = 0.7
      ctx.fillStyle = col
      ctx.fillText(weapon === 'triple' ? 'TRIPLE' : 'DUAL', player.x, player.y + 16)
      const barW = 28
      const filled = (weaponTimer / C.POWERUP_DURATION) * barW
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.fillRect(player.x - barW / 2, player.y + 18, barW, 2)
      ctx.fillStyle = col
      ctx.fillRect(player.x - barW / 2, player.y + 18, filled, 2)
      ctx.globalAlpha = 1
    }

    // Particles
    for (const p of particles) {
      ctx.globalAlpha = p.life / p.maxLife
      ctx.fillStyle = p.color
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size)
    }
    ctx.globalAlpha = 1

    // Text pops
    for (const p of pops) {
      ctx.globalAlpha = Math.min(1, p.life * 2)
      ctx.fillStyle = p.color
      ctx.font = `bold ${p.size}px monospace`
      ctx.textAlign = 'center'
      ctx.fillText(p.text, Math.floor(p.x), Math.floor(p.y))
    }
    ctx.globalAlpha = 1

    // Streak center text
    if (streakPop) {
      const a = Math.min(1, streakPop.life * 1.5)
      const s = 1 + (1 - a) * 0.3
      ctx.save()
      ctx.globalAlpha = a
      ctx.translate(C.W / 2, C.H * 0.38)
      ctx.scale(s, s)
      ctx.font = 'bold 16px monospace'
      ctx.textAlign = 'center'
      ctx.fillStyle = streakPop.color
      ctx.shadowColor = streakPop.color
      ctx.shadowBlur = 12
      ctx.fillText(streakPop.text, 0, 0)
      ctx.shadowBlur = 0
      ctx.restore()
    }

    // HUD
    renderHUD()

    // Overlays
    if (state === 'MENU') renderMenu()
    if (state === 'WAVE_CLEAR') renderWaveAnnounce()
    if (state === 'GAME_OVER') renderGameOver()

    // Vignette
    const vg = ctx.createRadialGradient(C.W / 2, C.H / 2, C.H * 0.35, C.W / 2, C.H / 2, C.H * 0.75)
    vg.addColorStop(0, 'transparent')
    vg.addColorStop(1, 'rgba(0,0,0,0.35)')
    ctx.fillStyle = vg
    ctx.fillRect(0, 0, C.W, C.H)

    ctx.restore()
  }

  function drawSprite(sprite, x, y, scale) {
    const w = sprite.width * scale
    const h = sprite.height * scale
    ctx.drawImage(sprite, Math.floor(x - w / 2), Math.floor(y - h / 2), w, h)
  }

  function renderHUD() {
    // HUD background
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.fillRect(0, 0, C.W, 40)

    ctx.font = 'bold 13px monospace'
    ctx.textAlign = 'left'
    ctx.fillStyle = '#fff'
    ctx.fillText(`SCORE ${score}`, 8, 17)
    ctx.textAlign = 'right'
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.font = 'bold 10px monospace'
    ctx.fillText(`BEST ${best}`, C.W - 8, 17)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#e8651a'
    ctx.font = 'bold 11px monospace'
    ctx.fillText(`WAVE ${wave}`, C.W / 2, 17)

    // Lives
    for (let i = 0; i < lives; i++) {
      drawSprite(spr.heart, C.W - 16 - i * 14, 32, 1.5)
    }

    // Streak bar
    if (streak > 0) {
      const maxW = 70
      const w = Math.min(maxW, (streak / 15) * maxW)
      const sm = C.STREAK.slice().reverse().find(s => streak >= s.n)
      ctx.fillStyle = sm ? sm.color : '#44ff44'
      ctx.globalAlpha = 0.6
      ctx.fillRect(8, 24, w, 4)
      ctx.globalAlpha = 1
      ctx.font = 'bold 8px monospace'
      ctx.textAlign = 'left'
      ctx.fillStyle = sm ? sm.color : '#aaa'
      ctx.fillText(`×${streak}`, 10, 36)
    }
  }

  function renderMenu() {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(0, 0, C.W, C.H)

    ctx.textAlign = 'center'
    ctx.fillStyle = '#e8651a'
    ctx.font = 'bold 22px monospace'
    ctx.fillText('TROLLS', C.W / 2, C.H * 0.3)
    ctx.fillText('INVADERS', C.W / 2, C.H * 0.3 + 26)

    ctx.fillStyle = '#fff'
    ctx.font = '9px monospace'
    ctx.fillText('Defend the feed. Block the trolls.', C.W / 2, C.H * 0.48)

    ctx.fillStyle = '#e8651a'
    ctx.font = 'bold 11px monospace'
    const blink = Math.sin(Date.now() / 300) > 0
    if (blink) ctx.fillText('TAP OR PRESS SPACE', C.W / 2, C.H * 0.62)

    if (best > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.font = '8px monospace'
      ctx.fillText(`BEST: ${best}  WAVE: ${bestWave}`, C.W / 2, C.H * 0.72)
    }
  }

  function renderWaveAnnounce() {
    const a = Math.min(1, waveTimer)
    ctx.globalAlpha = a
    ctx.textAlign = 'center'
    ctx.fillStyle = '#e8651a'
    ctx.font = 'bold 20px monospace'
    ctx.fillText(`WAVE ${wave}`, C.W / 2, C.H * 0.42)
    ctx.fillStyle = '#fff'
    ctx.font = '8px monospace'
    ctx.fillText('Get ready...', C.W / 2, C.H * 0.42 + 20)
    ctx.globalAlpha = 1
  }

  function renderGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.75)'
    ctx.fillRect(0, 0, C.W, C.H)

    ctx.textAlign = 'center'

    // GAME OVER title with glow
    ctx.save()
    ctx.fillStyle = '#ff4444'
    ctx.font = 'bold 28px monospace'
    ctx.shadowColor = '#ff0000'
    ctx.shadowBlur = 20
    ctx.fillText('GAME OVER', C.W / 2, C.H * 0.26)
    ctx.shadowBlur = 0
    ctx.restore()

    // Divider
    ctx.strokeStyle = 'rgba(255,68,68,0.3)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(C.W * 0.2, C.H * 0.30)
    ctx.lineTo(C.W * 0.8, C.H * 0.30)
    ctx.stroke()

    // Score
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 14px monospace'
    ctx.fillText(`SCORE: ${score}`, C.W / 2, C.H * 0.38)

    // Best
    if (score >= best) {
      ctx.save()
      ctx.fillStyle = '#ffcc00'
      ctx.font = 'bold 12px monospace'
      ctx.shadowColor = '#ffcc00'
      ctx.shadowBlur = 10
      ctx.fillText('\u2605 NEW BEST \u2605', C.W / 2, C.H * 0.44)
      ctx.shadowBlur = 0
      ctx.restore()
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.font = '10px monospace'
      ctx.fillText(`BEST: ${best}`, C.W / 2, C.H * 0.44)
    }

    // Stats
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '9px monospace'
    ctx.fillText(`WAVES ${wave}  \u00b7  STREAK ${longestStreak}`, C.W / 2, C.H * 0.52)

    // PRESS START — only after delay
    if (gameOverTimer <= 0) {
      const blink = Math.sin(Date.now() / 400) > 0
      if (blink) {
        ctx.fillStyle = '#e8651a'
        ctx.font = 'bold 13px monospace'
        ctx.fillText('\u2500 PRESS START \u2500', C.W / 2, C.H * 0.64)
      }
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.font = '8px monospace'
      ctx.fillText('SPACE / TAP TO CONTINUE', C.W / 2, C.H * 0.69)
    }
  }

  // ─── GAME LOOP ────────────────────────────────────────
  function loop(ts) {
    const dt = Math.min(0.05, (ts - lastTime) / 1000)
    lastTime = ts
    update(dt)
    render()
    raf = requestAnimationFrame(loop)
  }

  // ─── PUBLIC API ───────────────────────────────────────
  return {
    start() {
      window.addEventListener('keydown', kd)
      window.addEventListener('keyup', ku)
      canvas.addEventListener('touchstart', ts, { passive: false })
      canvas.addEventListener('touchmove', tm, { passive: false })
      canvas.addEventListener('touchend', te)
      canvas.addEventListener('touchcancel', te)
      lastTime = performance.now()
      raf = requestAnimationFrame(loop)
      notify()
    },
    destroy() {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
      canvas.removeEventListener('touchstart', ts)
      canvas.removeEventListener('touchmove', tm)
      canvas.removeEventListener('touchend', te)
      canvas.removeEventListener('touchcancel', te)
    },
    toggleMute() { return audio.toggle() },
    getState() { return { state, score, best, wave, bestWave } },
  }
}
