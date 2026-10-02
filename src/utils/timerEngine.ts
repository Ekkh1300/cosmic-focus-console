import type { Phase, Preset, TimerPersist } from '../types'

export const MS = { s: 1000, m: 60_000 }

export const DEFAULT_DURATIONS: Record<Phase, number> = {
  focus: 25,
  short: 5,
  long: 15,
}

/** Fallback durations when no preset is attached to the timer. */
export function defaultDurationMs(phase: Phase): number {
  return DEFAULT_DURATIONS[phase] * MS.m
}

/**
 * Remaining milliseconds from a persisted snapshot.
 * Pure timestamp maths — immune to tab throttling and backgrounding.
 */
export function remainingOf(state: TimerPersist, now: number): number {
  if (state.running && state.startedAt != null) {
    const elapsed = now - state.startedAt
    return Math.max(0, state.durationMs - elapsed)
  }
  return Math.max(0, state.frozenRemainingMs)
}

export function progressOf(state: TimerPersist, now: number): number {
  if (state.durationMs <= 0) return 1
  const remaining = remainingOf(state, now)
  return 1 - remaining / state.durationMs
}

/** Next phase in the focus → short → focus … → long cadence. */
export function nextPhase(current: Phase, cycleCount: number, every: number): Phase {
  if (current === 'focus') {
    return cycleCount > 0 && cycleCount % Math.max(1, every) === 0 ? 'long' : 'short'
  }
  return 'focus'
}

/** Duration in ms for a phase according to a preset. */
export function durationForPhase(preset: Preset, phase: Phase): number {
  const min = phase === 'focus' ? preset.focusMin : phase === 'short' ? preset.shortMin : preset.longMin
  return minutesToMs(min)
}

export function minutesToMs(min: number): number {
  return Math.max(1, Math.round(min)) * MS.m
}

export function sanitizeDuration(min: unknown): number {
  const n = Number(min)
  if (!Number.isFinite(n)) return 25
  return Math.min(240, Math.max(1, Math.round(n)))
}
