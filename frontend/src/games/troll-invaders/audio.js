// Retro sound effects using Web Audio API — no external files needed

let actx = null
let muted = false

function ctx() {
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)()
  if (actx.state === 'suspended') actx.resume()
  return actx
}

function tone(freq, dur, type = 'square', vol = 0.15, slide = 0) {
  if (muted) return
  const a = ctx()
  const osc = a.createOscillator()
  const gain = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, a.currentTime)
  if (slide) osc.frequency.linearRampToValueAtTime(freq + slide, a.currentTime + dur)
  gain.gain.setValueAtTime(vol, a.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur)
  osc.connect(gain)
  gain.connect(a.destination)
  osc.start(a.currentTime)
  osc.stop(a.currentTime + dur)
}

function noise(dur, vol = 0.1) {
  if (muted) return
  const a = ctx()
  const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = a.createBufferSource()
  const gain = a.createGain()
  src.buffer = buf
  gain.gain.setValueAtTime(vol, a.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur)
  src.connect(gain)
  gain.connect(a.destination)
  src.start()
}

export const audio = {
  shoot() { tone(880, 0.08, 'square', 0.1, 200) },
  hit() { tone(300, 0.1, 'square', 0.12, -100); noise(0.06, 0.06) },
  destroy() { noise(0.15, 0.15); tone(200, 0.15, 'sawtooth', 0.1, -150) },
  streak() { tone(523, 0.08, 'square', 0.12); setTimeout(() => tone(659, 0.08, 'square', 0.12), 60); setTimeout(() => tone(784, 0.12, 'square', 0.14), 120) },
  playerHit() { tone(120, 0.3, 'sawtooth', 0.2, -60); noise(0.2, 0.12) },
  waveComplete() { tone(440, 0.1, 'square', 0.1); setTimeout(() => tone(554, 0.1, 'square', 0.1), 80); setTimeout(() => tone(659, 0.1, 'square', 0.1), 160); setTimeout(() => tone(880, 0.2, 'square', 0.12), 240) },
  gameOver() { tone(440, 0.2, 'square', 0.12, -200); setTimeout(() => tone(330, 0.2, 'square', 0.12, -200), 200); setTimeout(() => tone(220, 0.4, 'sawtooth', 0.1, -100), 400) },
  click() { tone(660, 0.04, 'square', 0.06) },
  get muted() { return muted },
  toggle() { muted = !muted; return muted },
}
