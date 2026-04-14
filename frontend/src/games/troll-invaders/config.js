export const C = {
  W: 320,
  H: 480,

  PLAYER_SPEED: 180,
  FIRE_RATE: 0.15,
  MAX_BULLETS: 25,
  BULLET_SPEED: 400,
  LIVES: 3,
  MAX_LIVES: 4,
  LIFE_SCORE_INTERVAL: 2000,

  ENEMY_BULLET_SPEED: 150,
  ENEMY_SHOOT_CHANCE: 0.003, // per enemy per frame

  POWERUP_DROP_CHANCE: 0.12,
  POWERUP_SPEED: 65,
  POWERUP_FAST_SPEED: 95,
  POWERUP_DURATION: 8,
  SHIELD_DURATION: 5,

  STREAK: [
    { n: 3, label: 'CLEANUP', color: '#44ff44' },
    { n: 6, label: 'THREAD LOCKED', color: '#44ccff' },
    { n: 10, label: 'MOD MODE', color: '#ff44ff' },
    { n: 15, label: 'FULL PURGE', color: '#ff4444' },
  ],

  KILL_TEXT: ['BLOCKED!', 'BANNED!', 'MUTED!', 'REPORTED!', 'SILENCED!'],

  WAVE_MSGS: [
    '',
    'The trolls are here...',
    'They learned to type faster',
    'Now with worse grammar',
    'They discovered CAPS LOCK',
    'Their takes are getting hotter',
    'They\'re replying to old threads',
    'Someone shared their opinions',
    'They found the comment section',
    'They\'re making alt accounts',
    'The ratio is getting worse',
    'They discovered quote tweets',
    'Their profiles have no photo',
    'Egg avatars incoming!',
    'They\'re typing "actually..."',
    'They won\'t touch grass',
    'Their moms want them outside',
    'They\'re citing Wikipedia',
    'Bold claims, zero sources',
    'They unionized',
    'Final form: reply guys',
  ],

  BG: '#0a0a14',
}
