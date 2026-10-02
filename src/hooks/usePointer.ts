import { useEffect, useRef, useState } from 'react'

/**
 * Normalised pointer position shared with the background (planet lighting,
 * star drift). Values are throttled to one write per animation frame and
 * ignored entirely when motion is reduced.
 */
const pointer = { x: 0.5, y: 0.5, active: false }
const listeners = new Set<() => void>()

export function getPointer() {
  return pointer
}

export function subscribePointer(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function usePointer(enabled = true): void {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return
    let frame = 0
    let px = 0
    let py = 0

    const flush = () => {
      frame = 0
      pointer.x = px
      pointer.y = py
      pointer.active = true
      listeners.forEach((l) => l())
    }

    const onMove = (e: PointerEvent) => {
      px = e.clientX / Math.max(1, window.innerWidth)
      py = e.clientY / Math.max(1, window.innerHeight)
      if (!frame) frame = requestAnimationFrame(flush)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [enabled])
}

/** Reactive mirror — re-renders at most once per animation frame. */
export function usePointerValue(): { x: number; y: number } {
  const [, bump] = useState(0)
  const ref = useRef({ x: pointer.x, y: pointer.y })
  ref.current = { x: pointer.x, y: pointer.y }

  useEffect(() => {
    let queued = false
    return subscribePointer(() => {
      if (queued) return
      queued = true
      requestAnimationFrame(() => {
        queued = false
        bump((n) => n + 1)
      })
    })
  }, [])

  return ref.current
}
