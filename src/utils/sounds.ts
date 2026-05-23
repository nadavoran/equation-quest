// ── Web Audio API sound engine ────────────────────────────────────────────────
// Fully synthesised — no audio files needed, works offline as PWA.

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// ── Envelope helper ───────────────────────────────────────────────────────────
function playTone(
  freq: number,
  type: OscillatorType,
  when: number,
  duration: number,
  dest: AudioNode,
  peak = 0.35,
  attack = 0.01,
) {
  const c = getCtx()
  const osc = c.createOscillator()
  const env = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  env.gain.setValueAtTime(0, when)
  env.gain.linearRampToValueAtTime(peak, when + attack)
  env.gain.exponentialRampToValueAtTime(0.001, when + duration)
  osc.connect(env)
  env.connect(dest)
  osc.start(when)
  osc.stop(when + duration + 0.02)
}

// ── Correct chime: bright C-major arpeggio + sparkle ─────────────────────────
export function playCorrect() {
  const c = getCtx()
  const g = c.createGain()
  g.gain.value = 0.28
  g.connect(c.destination)
  const now = c.currentTime
  const notes: number[] = [523.25, 659.25, 783.99, 1046.5, 1318.5]
  notes.forEach((f, i) => playTone(f, 'sine', now + i * 0.08, 0.38, g, 0.35))
  playTone(2093, 'sine', now + 0.32, 0.45, g, 0.1)
}

// ── Wrong buzz: descending sawtooth pulses + low thud ────────────────────────
export function playWrong() {
  const c = getCtx()
  const g = c.createGain()
  g.gain.value = 0.3
  g.connect(c.destination)
  const now = c.currentTime
  playTone(220, 'sawtooth', now,        0.18, g, 0.28, 0.005)
  playTone(196, 'sawtooth', now + 0.22, 0.18, g, 0.22, 0.005)
  playTone(80,  'sine',     now,        0.28, g, 0.38, 0.01)
}

// ── Streak fanfare: triumphant ascending figure ───────────────────────────────
export function playStreakFanfare(streakLevel: 'medium' | 'high' | 'epic') {
  const c = getCtx()
  const g = c.createGain()
  g.gain.value = 0.32
  g.connect(c.destination)
  const now = c.currentTime

  const medNotes: number[] = [523.25, 659.25, 783.99, 1046.5]
  const highNotes: number[] = [392, 523.25, 659.25, 783.99, 1046.5, 1318.5]
  const epicMelody: number[] = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98, 2093]
  const epicHarmony: number[] = [392, 493.88, 587.33, 783.99, 987.77, 1174.66, 1567.98]

  if (streakLevel === 'medium') {
    medNotes.forEach((f, i) => playTone(f, 'triangle', now + i * 0.1, 0.4, g, 0.3))
  } else if (streakLevel === 'high') {
    highNotes.forEach((f, i) => playTone(f, 'triangle', now + i * 0.09, 0.5, g, 0.32))
    playTone(1046.5, 'sine', now + 0.55, 0.6, g, 0.25)
  } else {
    epicMelody.forEach((f, i) => playTone(f, 'sine',     now + i * 0.09, 0.55, g, 0.28))
    epicHarmony.forEach((f, i) => playTone(f, 'triangle', now + i * 0.09, 0.55, g, 0.14))
    playTone(2093, 'sine', now + 0.7, 0.8, g, 0.22)
  }
}

// ── Background music ──────────────────────────────────────────────────────────
// A proper melodic loop in C major pentatonic with bass + melody layers.
// The melody follows a fixed repeating 16-step pattern so it sounds intentional.

let masterGain: GainNode | null = null
let musicPlaying = false
let scheduleTimer: ReturnType<typeof setTimeout> | null = null

// Note durations (in seconds at 110 BPM → beat = 0.545s)
const BEAT = 0.545
const H = BEAT * 2  // half note
const Q = BEAT      // quarter note
const E = BEAT / 2  // eighth note

// C major pentatonic scale, two octaves
const SCALE = [
  130.81, 146.83, 164.81, 196.00, 220.00, // C2 D2 E2 G2 A2
  261.63, 293.66, 329.63, 392.00, 440.00, // C3 D3 E3 G3 A3
  523.25, 587.33, 659.25, 783.99, 880.00, // C4 D4 E4 G4 A4
]

// 16-step melody pattern (indices into SCALE)
const MELODY_PATTERN: { idx: number; dur: number; vol: number }[] = [
  { idx: 10, dur: Q, vol: 0.18 }, // C4
  { idx: 12, dur: E, vol: 0.15 }, // E4
  { idx: 13, dur: E, vol: 0.15 }, // G4
  { idx: 14, dur: Q, vol: 0.18 }, // A4
  { idx: 12, dur: Q, vol: 0.15 }, // E4
  { idx: 10, dur: H, vol: 0.20 }, // C4 (held)
  { idx: 11, dur: E, vol: 0.14 }, // D4
  { idx: 12, dur: E, vol: 0.15 }, // E4
  { idx: 13, dur: Q, vol: 0.18 }, // G4
  { idx: 11, dur: E, vol: 0.14 }, // D4
  { idx: 10, dur: E, vol: 0.15 }, // C4
  { idx: 8,  dur: Q, vol: 0.14 }, // A3
  { idx: 10, dur: Q, vol: 0.16 }, // C4
  { idx: 12, dur: E, vol: 0.15 }, // E4
  { idx: 13, dur: E, vol: 0.15 }, // G4
  { idx: 10, dur: H, vol: 0.20 }, // C4 (held)
]

// 4-step bass pattern
const BASS_PATTERN: { idx: number; dur: number; vol: number }[] = [
  { idx: 0, dur: H, vol: 0.22 }, // C2
  { idx: 4, dur: H, vol: 0.18 }, // A2
  { idx: 1, dur: H, vol: 0.18 }, // D2
  { idx: 3, dur: H, vol: 0.20 }, // G2
]

// Lookahead scheduling — schedule notes LOOKAHEAD seconds ahead
const LOOKAHEAD = 0.5

interface ScheduleState {
  melodyStep: number
  bassStep: number
  nextNoteTime: number
  melodyBeatCount: number
  bassBeatCount: number
}

let schedState: ScheduleState = {
  melodyStep: 0, bassStep: 0,
  nextNoteTime: 0, melodyBeatCount: 0, bassBeatCount: 0,
}

function scheduleNextNotes() {
  if (!musicPlaying || !masterGain) return
  const c = getCtx()

  while (schedState.nextNoteTime < c.currentTime + LOOKAHEAD) {
    // Melody note
    const mel = MELODY_PATTERN[schedState.melodyStep % MELODY_PATTERN.length]
    playTone(SCALE[mel.idx], 'sine', schedState.nextNoteTime, mel.dur * 0.85, masterGain, mel.vol, 0.02)

    // Bass note every 2 beats (half note)
    if (schedState.melodyBeatCount % 2 === 0) {
      const bass = BASS_PATTERN[schedState.bassStep % BASS_PATTERN.length]
      playTone(SCALE[bass.idx], 'sine', schedState.nextNoteTime, bass.dur * 0.9, masterGain, bass.vol, 0.04)
      schedState.bassStep++
    }

    schedState.nextNoteTime += mel.dur
    schedState.melodyStep++
    schedState.melodyBeatCount++
  }

  scheduleTimer = setTimeout(scheduleNextNotes, (LOOKAHEAD / 2) * 1000)
}

export function startMusic() {
  if (musicPlaying) return
  musicPlaying = true
  const c = getCtx()

  masterGain = c.createGain()
  masterGain.gain.setValueAtTime(0, c.currentTime)
  masterGain.gain.linearRampToValueAtTime(0.6, c.currentTime + 2.5) // gentle fade-in
  masterGain.connect(c.destination)

  // Add a light reverb-like effect with a delay node
  const delay = c.createDelay(0.3)
  delay.delayTime.value = 0.28
  const delayGain = c.createGain()
  delayGain.gain.value = 0.12
  masterGain.connect(delay)
  delay.connect(delayGain)
  delayGain.connect(masterGain)

  schedState = {
    melodyStep: 0, bassStep: 0,
    nextNoteTime: c.currentTime + 0.1,
    melodyBeatCount: 0, bassBeatCount: 0,
  }

  scheduleNextNotes()
}

export function stopMusic(fadeMs = 1500) {
  if (!musicPlaying) return
  musicPlaying = false
  if (scheduleTimer) { clearTimeout(scheduleTimer); scheduleTimer = null }
  if (masterGain) {
    const c = getCtx()
    masterGain.gain.cancelScheduledValues(c.currentTime)
    masterGain.gain.setValueAtTime(masterGain.gain.value, c.currentTime)
    masterGain.gain.linearRampToValueAtTime(0, c.currentTime + fadeMs / 1000)
    const g = masterGain
    setTimeout(() => { try { g.disconnect() } catch {} }, fadeMs + 200)
    masterGain = null
  }
}

export function setMusicEnabled(enabled: boolean) {
  if (enabled) startMusic()
  else stopMusic()
}

export function isMusicPlaying() { return musicPlaying }
