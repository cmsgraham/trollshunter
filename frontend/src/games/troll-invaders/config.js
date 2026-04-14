export const C = {
  W: 320,
  H: 480,

  PLAYER_SPEED: 180,
  FIRE_RATE: 0.15,
  MAX_BULLETS: 15,
  BULLET_SPEED: 400,
  LIVES: 3,

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

  BG: '#0a0a14',
}
