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
  let weapon = 'normal' // 'normal' | 'dual' | 'triple' | 'quad' | 'penta'
  let weaponTimer = 0
  let powerups = []
  let gameOverTimer = 0
  let shieldTimer = 0
  let nextLifeAt = C.LIFE_SCORE_INTERVAL

  // Stars — two parallax layers
  const starsBack = Array.from({ length: 60 }, () => ({
    x: Math.random() * C.W,
    y: Math.random() * C.H,
    s: 6 + Math.random() * 12,
    r: 0.6 + Math.random() * 0.3,
    b: 0.15 + Math.random() * 0.25,
  }))
  const starsFront = Array.from({ length: 35 }, () => ({
    x: Math.random() * C.W,
    y: Math.random() * C.H,
    s: 18 + Math.random() * 35,
    r: 1 + Math.random() * 0.8,
    b: 0.35 + Math.random() * 0.45,
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
    audio.unlock()
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
    if (state === 'PLAYING' || state === 'WAVE_CLEAR') return
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
    shieldTimer = 0
    nextLifeAt = C.LIFE_SCORE_INTERVAL
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
      if (Math.abs(diff) > 2) {
        const speed = Math.min(C.PLAYER_SPEED * 2.5, Math.abs(diff) * 12)
        player.x += Math.sign(diff) * speed * dt
      }
    } else {
      player.x += dx * C.PLAYER_SPEED * dt
    }
    player.x = Math.max(8, Math.min(C.W - 8, player.x))

    // Shooting
    fireTimer -= dt
    const wantShoot = keys.Space || touching
    if (wantShoot && fireTimer <= 0 && bullets.length < C.MAX_BULLETS) {
      if (weapon === 'penta') {
        bullets.push({ x: player.x, y: player.y - 6, w: 3, h: 5, vx: 0 })
        bullets.push({ x: player.x - 6, y: player.y - 5, w: 3, h: 5, vx: -25 })
        bullets.push({ x: player.x + 6, y: player.y - 5, w: 3, h: 5, vx: 25 })
        bullets.push({ x: player.x - 12, y: player.y - 3, w: 3, h: 5, vx: -55 })
        bullets.push({ x: player.x + 12, y: player.y - 3, w: 3, h: 5, vx: 55 })
      } else if (weapon === 'quad') {
        bullets.push({ x: player.x - 5, y: player.y - 6, w: 3, h: 5, vx: 0 })
        bullets.push({ x: player.x + 5, y: player.y - 6, w: 3, h: 5, vx: 0 })
        bullets.push({ x: player.x - 10, y: player.y - 4, w: 3, h: 5, vx: -40 })
        bullets.push({ x: player.x + 10, y: player.y - 4, w: 3, h: 5, vx: 40 })
      } else if (weapon === 'triple') {
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
      b.y += (b.spd || C.ENEMY_BULLET_SPEED) * dt
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

        // Enemy shooting — aggression scales with player weapon
        const WAGGRO = { normal: 1, dual: 1.08, triple: 1.18, quad: 1.3, penta: 1.45 }
        const weaponAggro = WAGGRO[weapon] || 1
        if (Math.random() < C.ENEMY_SHOOT_CHANCE * enemies._shootMult * weaponAggro * dt * 60) {
          const bulletSpd = C.ENEMY_BULLET_SPEED * (1 + (weaponAggro - 1) * 0.35)
          eBullets.push({ x: e.x, y: e.y + e.h / 2, w: 3, h: 4, spd: bulletSpd })
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

            // Score milestone extra life
            if (score >= nextLifeAt && lives < C.MAX_LIVES) {
              lives++
              nextLifeAt += C.LIFE_SCORE_INTERVAL
              addPop(player.x, player.y - 24, '+1 LIFE!', '#ff5555', 10)
              audio.streak()
            }

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
              const roll = Math.random()
              let ptype
              if (roll < 0.03) ptype = 'life'
              else if (roll < 0.08) ptype = 'shield'
              else if (roll < 0.15) ptype = 'penta'
              else if (roll < 0.25) ptype = 'quad'
              else if (roll < 0.48) ptype = 'triple'
              else ptype = 'dual'
              powerups.push({
                type: ptype,
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
    const WLEVELS = { normal: 0, dual: 1, triple: 2, quad: 3, penta: 4 }
    const PFAST = { quad: true, penta: true, shield: true, life: true }
    for (let i = powerups.length - 1; i >= 0; i--) {
      const p = powerups[i]
      p.y += (PFAST[p.type] ? C.POWERUP_FAST_SPEED : C.POWERUP_SPEED) * dt
      if (p.y > C.H + 10) { powerups.splice(i, 1); continue }
      if (Math.abs(p.x - player.x) < 14 && Math.abs(p.y - player.y) < 14) {
        if (p.type === 'life') {
          if (lives < C.MAX_LIVES) {
            lives++
            addPop(player.x, player.y - 16, '+1 LIFE!', '#ff5555', 10)
          } else {
            score += 100
            addPop(player.x, player.y - 16, '+100', '#ffcc00', 10)
          }
        } else if (p.type === 'shield') {
          shieldTimer = C.SHIELD_DURATION
          addPop(player.x, player.y - 16, 'SHIELD!', '#44ff44', 10)
        } else {
          if (WLEVELS[p.type] >= WLEVELS[weapon]) weapon = p.type
          weaponTimer = C.POWERUP_DURATION
          const labels = { dual: 'DUAL!', triple: 'TRIPLE!', quad: 'QUAD!', penta: 'PENTA!' }
          const colors = { dual: '#ffcc00', triple: '#ff44ff', quad: '#44ddff', penta: '#ff6600' }
          addPop(player.x, player.y - 16, labels[weapon], colors[weapon], 10)
        }
        powerups.splice(i, 1)
        audio.streak()
        shakeAmt = 3
      }
    }

    // Collision: enemy bullets → player
    invulnTimer -= dt
    if (shieldTimer > 0) shieldTimer -= dt
    if (invulnTimer <= 0 && shieldTimer <= 0) {
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
      if (e.y + e.h / 2 > player.y - 8 && shieldTimer <= 0) {
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
    if (lifeLostTimer > 0) lifeLostTimer -= dt

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

  let lifeLostTimer = 0

  function hitPlayer() {
    if (invulnTimer > 0) return
    lives--
    lifeLostTimer = 0.4
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
    for (const s of starsBack) {
      s.y += s.s * dt
      if (s.y > C.H) { s.y = -2; s.x = Math.random() * C.W }
    }
    for (const s of starsFront) {
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

    // Stars — back layer (dim, slow)
    for (const s of starsBack) {
      ctx.globalAlpha = s.b
      ctx.fillStyle = '#6666aa'
      ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.r, s.r)
    }
    // Stars — front layer (bright, fast)
    for (const s of starsFront) {
      ctx.globalAlpha = s.b
      ctx.fillStyle = '#aaaadd'
      ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.r, s.r)
    }
    ctx.globalAlpha = 1

    // Grid lines (bottom area)
    ctx.strokeStyle = 'rgba(232,101,26,0.04)'
    for (let y = C.H - 60; y < C.H; y += 10) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(C.W, y); ctx.stroke()
    }

    // Enemies — squash/stretch idle with subtle blink
    for (const e of enemies) {
      const sprite = e.flash > 0 ? spr[e.type + 'Hit'] || spr[e.type] : spr[e.type]
      const wobbleY = Math.sin(e.anim) * 0.8
      const squash = 1 + Math.sin(e.anim * 1.7) * 0.06
      const stretch = 1 - Math.sin(e.anim * 1.7) * 0.06
      const sc = e.scale || 2
      const w = sprite.width * sc * squash
      const h = sprite.height * sc * stretch
      ctx.drawImage(sprite, Math.floor(e.x - w / 2), Math.floor(e.y + wobbleY - h / 2), w, h)
    }

    // Player
    if (state === 'PLAYING' || state === 'WAVE_CLEAR') {
      if (invulnTimer <= 0 || Math.floor(invulnTimer * 10) % 2 === 0) {
        const sp = invulnTimer > 0 ? spr.playerHit : spr.player
        drawSprite(sp, player.x, player.y, 2)
      }
    }

    // Bullets with glow
    ctx.save()
    for (const b of bullets) {
      ctx.globalAlpha = 0.15
      ctx.fillStyle = '#ff9944'
      ctx.beginPath()
      ctx.arc(b.x, b.y, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
      drawSprite(spr.bullet, b.x, b.y, 1.5)
    }
    for (const b of eBullets) {
      ctx.globalAlpha = 0.12
      ctx.fillStyle = '#66ff66'
      ctx.beginPath()
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
      drawSprite(spr.enemyBullet, b.x, b.y, 1.5)
    }
    ctx.restore()

    // Power-ups
    const PSPRITE_MAP = { dual: 'powerupDual', triple: 'powerupTriple', quad: 'powerupQuad', penta: 'powerupPenta', shield: 'powerupShield', life: 'powerupLife' }
    const PCOL_MAP = { dual: '#ffcc00', triple: '#ff44ff', quad: '#44ddff', penta: '#ff6600', shield: '#44ff44', life: '#ff5555' }
    for (const p of powerups) {
      const bob = Math.sin(Date.now() / 200) * 2
      const col = PCOL_MAP[p.type] || '#fff'
      ctx.globalAlpha = 0.25
      ctx.fillStyle = col
      ctx.beginPath()
      ctx.arc(p.x, p.y + bob, 9, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
      drawSprite(spr[PSPRITE_MAP[p.type]], p.x, p.y + bob, 2)
    }

    // Shield bubble around player
    if (shieldTimer > 0 && (state === 'PLAYING' || state === 'WAVE_CLEAR')) {
      const pulse = 1 + Math.sin(Date.now() / 100) * 0.08
      const r = 16 * pulse
      ctx.save()
      ctx.globalAlpha = Math.min(0.35, shieldTimer * 0.3)
      ctx.strokeStyle = '#44ff44'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(player.x, player.y, r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = Math.min(0.12, shieldTimer * 0.1)
      ctx.fillStyle = '#44ff44'
      ctx.fill()
      ctx.restore()
    }

    // Weapon indicator near player
    if (weapon !== 'normal' && (state === 'PLAYING' || state === 'WAVE_CLEAR')) {
      const wcols = { dual: '#ffcc00', triple: '#ff44ff', quad: '#44ddff', penta: '#ff6600' }
      const wlabels = { dual: 'DUAL', triple: 'TRIPLE', quad: 'QUAD', penta: 'PENTA' }
      const col = wcols[weapon]
      ctx.font = 'bold 7px monospace'
      ctx.textAlign = 'center'
      ctx.globalAlpha = 0.7
      ctx.fillStyle = col
      ctx.fillText(wlabels[weapon], player.x, player.y + 16)
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
    // HUD background — gradient fade, not hard bar
    const hg = ctx.createLinearGradient(0, 0, 0, 38)
    hg.addColorStop(0, 'rgba(0,0,0,0.55)')
    hg.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = hg
    ctx.fillRect(0, 0, C.W, 38)

    // WAVE — center, primary, glowing
    ctx.save()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#e8651a'
    ctx.font = 'bold 14px monospace'
    ctx.shadowColor = '#e8651a'
    ctx.shadowBlur = 8
    ctx.fillText(`WAVE ${wave}`, C.W / 2, 16)
    ctx.shadowBlur = 0
    ctx.restore()

    // SCORE — left, secondary
    ctx.font = 'bold 11px monospace'
    ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fillText(`${score}`, 8, 16)

    // BEST — right, tertiary
    ctx.textAlign = 'right'
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.font = '8px monospace'
    ctx.fillText(`BEST ${best}`, C.W - 8, 16)

    // Lives — top-right, tight spacing, animate on loss
    for (let i = 0; i < lives; i++) {
      let sc = 1.3
      if (lifeLostTimer > 0 && i === lives - 1) {
        // Pulse the last remaining heart
        sc = 1.3 + Math.sin(lifeLostTimer * 25) * 0.4
      }
      drawSprite(spr.heart, C.W - 12 - i * 11, 28, sc)
    }
    // Ghost hearts for lost lives
    for (let i = lives; i < C.MAX_LIVES; i++) {
      ctx.globalAlpha = 0.12
      drawSprite(spr.heart, C.W - 12 - i * 11, 28, 1.3)
      ctx.globalAlpha = 1
    }

    // Streak bar
    if (streak > 0) {
      const maxW = 60
      const w = Math.min(maxW, (streak / 15) * maxW)
      const sm = C.STREAK.slice().reverse().find(s => streak >= s.n)
      ctx.fillStyle = sm ? sm.color : '#44ff44'
      ctx.globalAlpha = 0.5
      ctx.fillRect(8, 22, w, 3)
      ctx.globalAlpha = 1
      ctx.font = 'bold 7px monospace'
      ctx.textAlign = 'left'
      ctx.fillStyle = sm ? sm.color : '#aaa'
      ctx.fillText(`×${streak}`, 10, 32)
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
    const scale = 1 + (1 - a) * 0.15
    ctx.save()
    ctx.globalAlpha = a
    ctx.textAlign = 'center'
    ctx.translate(C.W / 2, C.H * 0.40)
    ctx.scale(scale, scale)
    ctx.fillStyle = '#e8651a'
    ctx.font = 'bold 24px monospace'
    ctx.shadowColor = '#e8651a'
    ctx.shadowBlur = 16
    ctx.fillText(`WAVE ${wave}`, 0, 0)
    ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = '8px monospace'
    ctx.fillText('INCOMING...', 0, 18)
    ctx.restore()
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
    addTouchZone(el) {
      el.addEventListener('touchstart', ts, { passive: false })
      el.addEventListener('touchmove', tm, { passive: false })
      el.addEventListener('touchend', te)
      el.addEventListener('touchcancel', te)
    },
    removeTouchZone(el) {
      el.removeEventListener('touchstart', ts)
      el.removeEventListener('touchmove', tm)
      el.removeEventListener('touchend', te)
      el.removeEventListener('touchcancel', te)
    },
    getState() { return { state, score, best, wave, bestWave } },
  }
}
