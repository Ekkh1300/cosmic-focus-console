import { useEffect, useRef, useState } from 'react'

import { actions, getState, useSelector } from '../store/appStore'
import { remainingOf } from '../utils/timerEngine'

export interface ClockFrame {
  now: number
  remaining: number
  progress: number
  running: boolean
}

const frame: ClockFrame = { now: Date.now(), remaining: 0, progress: 0, running: false }
const subscribers = new Set<(f: ClockFrame) => void>()

let rafId = 0
let intervalId: ReturnType<typeof setInterval> | 0 = 0
let alreadyCompleted = false

/**
 * rAF gives us smooth motion, but browsers throttle it hard in background or
 * occluded tabs. A 250ms interval runs alongside it so the readout and the
 * completion check stay honest even when frames stop arriving.
 */
const FALLBACK_MS = 250

function readFrame(): ClockFrame {
  const timer = getState().timer
  const now = Date.now()
  const remaining = timer.running ? remainingOf(timer, now) : Math.max(0, timer.frozenRemainingMs)
  frame.now = now
  frame.remaining = remaining
  frame.progress = timer.durationMs > 0 ? 1 - remaining / timer.durationMs : 0
  frame.running = timer.running
  return frame
}

function step() {
  const timer = getState().timer
  readFrame()

  if (timer.running && frame.remaining <= 0 && !alreadyCompleted) {
    alreadyCompleted = true
    actions.complete(frame.now)
  }
  if (!getState().timer.running) alreadyCompleted = false

  subscribers.forEach((cb) => cb(frame))
}

function tick() {
  step()
  rafId = getState().timer.running ? requestAnimationFrame(tick) : 0
}

function stopLoops() {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = 0
  }
}

function ensureLoop() {
  if (typeof window === 'undefined') return
  const running = getState().timer.running

  if (running) {
    if (!rafId) {
      step()
      rafId = requestAnimationFrame(tick)
    }
    if (!intervalId) intervalId = setInterval(step, FALLBACK_MS)
  } else {
    stopLoops()
    step()
  }
}

function subscribe(cb: (f: ClockFrame) => void): () => void {
  subscribers.add(cb)
  ensureLoop()
  return () => {
    subscribers.delete(cb)
    if (subscribers.size === 0) stopLoops()
  }
}

/**
 * Per-frame clock access without React re-renders. Use this for anything that
 * moves every frame (rings, orbiting particles); use useRemainingText for the
 * digits.
 */
export function useClockFrame(cb: (f: ClockFrame) => void): void {
  const ref = useRef(cb)
  ref.current = cb
  useEffect(() => subscribe((f) => ref.current(f)), [])
}

/**
 * Re-renders only when the formatted string actually changes (i.e. about once
 * per second), keeping the main render path cheap.
 */
export function useRemainingText(format: (ms: number) => string): string {
  const durationMs = useSelector((s) => s.timer.durationMs)
  const frozen = useSelector((s) => s.timer.frozenRemainingMs)
  const running = useSelector((s) => s.timer.running)
  const status = useSelector((s) => s.timer.status)

  const fmtRef = useRef(format)
  fmtRef.current = format

  const [text, setText] = useState(() => format(running ? frame.remaining : frozen))

  useEffect(() => {
    setText((prev) => {
      const next = fmtRef.current(readFrame().remaining)
      return prev === next ? prev : next
    })
    return subscribe((f) => {
      const next = fmtRef.current(f.remaining)
      setText((prev) => (prev === next ? prev : next))
    })
  }, [durationMs, frozen, running, status])

  return text
}

/** Subscribe to the clock with a stable callback identity. */
export function useClockSubscription(cb: (f: ClockFrame) => void): void {
  const ref = useRef(cb)
  ref.current = cb
  useEffect(() => subscribe((f) => ref.current(f)), [])
}

/** Keeps the loop in step with the store and with tab visibility. */
export function useTimerLoop(): void {
  const running = useSelector((s) => s.timer.running)

  useEffect(() => {
    ensureLoop()
  }, [running])

  useEffect(() => {
    const resync = () => {
      if (document.hidden) {
        stopLoops()
        return
      }
      stopLoops()
      ensureLoop()
    }
    document.addEventListener('visibilitychange', resync)
    window.addEventListener('focus', resync)
    return () => {
      document.removeEventListener('visibilitychange', resync)
      window.removeEventListener('focus', resync)
    }
  }, [])
}

export function currentFrame(): ClockFrame {
  return readFrame()
}
