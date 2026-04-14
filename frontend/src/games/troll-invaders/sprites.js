// Pixel art sprites defined as string arrays
// Each char maps to a palette color; '.' = transparent

const DEFS = {
  player: {
    px: [
      '....1....',
      '...121...',
      '..12221..',
      '.1222221.',
      '122222221',
      '122232221',
      '1..222..1',
      '1..1.1..1',
    ],
    pal: { 1: '#e8651a', 2: '#ff9944', 3: '#fff' },
  },
  troll: {
    px: [
      '1.......1',
      '11.....11',
      '.1111111.',
      '.1.232.1.',
      '.1111111.',
      '..14141..',
      '.1111111.',
      '1...1...1',
    ],
    pal: { 1: '#44aa44', 2: '#fff', 3: '#ff3333', 4: '#227722' },
  },
  spam: {
    px: [
      '.1111111.',
      '111111111',
      '11.232.11',
      '111111111',
      '.1144411.',
      '.1111111.',
      '.1.1.1.1.',
      '..1...1..',
    ],
    pal: { 1: '#6688bb', 2: '#fff', 3: '#aaccff', 4: '#445577' },
  },
  elite: {
    px: [
      '1.........1',
      '11.......11',
      '111.....111',
      '.111111111.',
      '.11.232.11.',
      '.111111111.',
      '..1141411..',
      '.111111111.',
      '.1.1...1.1.',
      '11.......11',
    ],
    pal: { 1: '#cc3333', 2: '#ffcc00', 3: '#ff6600', 4: '#881111' },
  },
  bullet: {
    px: ['.1.', '121', '121', '121', '.1.'],
    pal: { 1: '#ff8833', 2: '#ffcc66' },
  },
  powerupDual: {
    px: [
      '..111..',
      '.12221.',
      '1223221',
      '.12221.',
      '..111..',
    ],
    pal: { 1: '#996600', 2: '#ffcc00', 3: '#fff' },
  },
  powerupTriple: {
    px: [
      '..111..',
      '.12221.',
      '1223221',
      '.12221.',
      '..111..',
    ],
    pal: { 1: '#660066', 2: '#ff44ff', 3: '#fff' },
  },
  powerupQuad: {
    px: [
      '..111..',
      '.12221.',
      '1223221',
      '.12221.',
      '..111..',
    ],
    pal: { 1: '#004466', 2: '#44ddff', 3: '#fff' },
  },
  powerupPenta: {
    px: [
      '..111..',
      '.12221.',
      '1223221',
      '.12221.',
      '..111..',
    ],
    pal: { 1: '#662200', 2: '#ff6600', 3: '#fff' },
  },
  powerupShield: {
    px: [
      '..1.1..',
      '.12121.',
      '1213121',
      '1222221',
      '.12221.',
      '..121..',
      '...1...',
    ],
    pal: { 1: '#228822', 2: '#44ff44', 3: '#ffffff' },
  },
  enemyBullet: {
    px: ['.1.', '121', '.1.', '.1.'],
    pal: { 1: '#66ff66', 2: '#aaffaa' },
  },
  heart: {
    px: [
      '.12.12.',
      '1221221',
      '1222221',
      '.12221.',
      '..121..',
      '...1...',
    ],
    pal: { 1: '#cc3333', 2: '#ff5555' },
  },
}

// Pre-render sprite to offscreen canvas
function renderSprite(def) {
  const h = def.px.length
  const w = def.px[0].length
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < def.px[y].length; x++) {
      const ch = def.px[y][x]
      if (ch !== '.') {
        ctx.fillStyle = def.pal[ch]
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }
  return c
}

// Create flipped/tinted variants
function tintSprite(sprite, tint, alpha = 0.6) {
  const c = document.createElement('canvas')
  c.width = sprite.width
  c.height = sprite.height
  const ctx = c.getContext('2d')
  ctx.drawImage(sprite, 0, 0)
  ctx.globalCompositeOperation = 'source-atop'
  ctx.globalAlpha = alpha
  ctx.fillStyle = tint
  ctx.fillRect(0, 0, c.width, c.height)
  return c
}

export function createSprites() {
  const sprites = {}
  for (const [name, def] of Object.entries(DEFS)) {
    sprites[name] = renderSprite(def)
  }
  // Hit flash variants (white tinted)
  sprites.trollHit = tintSprite(sprites.troll, '#fff', 0.8)
  sprites.spamHit = tintSprite(sprites.spam, '#fff', 0.8)
  sprites.eliteHit = tintSprite(sprites.elite, '#fff', 0.8)
  sprites.playerHit = tintSprite(sprites.player, '#ff0000', 0.8)
  return sprites
}
