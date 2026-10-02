/**
 * Synthesised UI sounds via WebAudio — no bundled media, nothing copyrighted,
 * nothing to download. Everything degrades silently if audio is unavailable.
 */

import type { Settings } from '../types'

type Cue = 'start' | 'pause' | 'complete' | 'task' | 'tick' | 'ui'

let ctx: AudioContext | null = null
let master: GainNode | null = null

function ensure(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      ctx = new Ctor()
      master = ctx.createGain()
      master.gain.value = 0.28
      master.connect(ctx.destination)
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(
  freq: number,
  start: number,
  dur: number,
  gain: number,
  type: OscillatorType = 'sine',
  glideTo?: number,
) {
  const ac = ensure()
  if (!ac || !master) return
  const t0 = ac.currentTime + start
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.018)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g)
  g.connect(master)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

export function play(cue: Cue, settings: Pick<Settings, 'sound' | 'tick'>): void {
  if (cue === 'tick') {
    if (!settings.tick || !settings.sound) return
    tone(1180, 0, 0.045, 0.045, 'square')
    return
  }
  if (!settings.sound) return

  switch (cue) {
    case 'start':
      tone(523.25, 0, 0.16, 0.18)
      tone(783.99, 0.07, 0.2, 0.14)
      break
    case 'pause':
      tone(392, 0, 0.18, 0.14, 'sine', 294)
      break
    case 'complete':
      tone(523.25, 0, 0.24, 0.16)
      tone(659.25, 0.1, 0.26, 0.15)
      tone(987.77, 0.2, 0.42, 0.14)
      tone(1318.5, 0.3, 0.5, 0.1)
      break
    case 'task':
      tone(880, 0, 0.1, 0.1)
      tone(1174.66, 0.06, 0.16, 0.09)
      break
    case 'ui':
      tone(660, 0, 0.06, 0.06, 'triangle')
      break
  }
}

/** Browsers require a gesture before audio may start. */
export function unlockAudio(): void {
  ensure()
}
