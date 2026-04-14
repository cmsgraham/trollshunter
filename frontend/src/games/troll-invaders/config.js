export const C = {
  W: 320,
  H: 480,

  PLAYER_SPEED: 180,
  FIRE_RATE: 0.15,
  MAX_BULLETS: 5,
  BULLET_SPEED: 400,
  LIVES: 3,

  ENEMY_BULLET_SPEED: 150,
  ENEMY_SHOOT_CHANCE: 0.003, // per enemy per frame

  STREAK: [
    { n: 3, label: 'CLEANUP', color: '#44ff44' },
    { n: 6, label: 'THREAD LOCKED', color: '#44ccff' },
    { n: 10, label: 'MOD MODE', color: '#ff44ff' },
    { n: 15, label: 'FULL PURGE', color: '#ff4444' },
  ],

  KILL_TEXT: ['BLOCKED!', 'BANNED!', 'MUTED!', 'REPORTED!', 'SILENCED!'],

  BG: '#0a0a14',
}
