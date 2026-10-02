import { useEffect, useRef } from 'react'

import { useReducedMotion } from '../../hooks/useAppearance'
import { getPointer, subscribePointer } from '../../hooks/usePointer'
import { useSelector } from '../../store/appStore'

interface Star {
  x: number
  y: number
  z: number
  r: number
  tw: number
  hue: number
}

/**
 * Canvas starfield. Depth layers drift against the pointer for a quiet sense
 * of parallax; stars twinkle on a slow sine so the field never feels static.
 */
export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const density = useSelector((s) => s.settings.background)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let width = 0
    let height = 0
    let stars: Star[] = []

    const build = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const area = (width * height) / 1000
      const factor =
        density === 'minimal' ? 0.28 : density === 'nebula' ? 1.1 : density === 'planet' ? 1 : 1.5
      const count = Math.round(Math.min(520, Math.max(90, area * 0.42 * factor)))

      stars = Array.from({ length: count }, () => {
        const z = Math.random()
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          z,
          r: 0.35 + z * 1.25,
          tw: Math.random() * Math.PI * 2,
          hue: Math.random() < 0.16 ? 190 + Math.random() * 40 : 220 + Math.random() * 40,
        }
      })
    }

    build()
    const ro = new ResizeObserver(build)
    ro.observe(document.documentElement)

    let raf = 0
    let t = 0
    let px = 0
    let py = 0
    let tx = 0
    let ty = 0
    let visible = !document.hidden

    const unsub = subscribePointer(() => {
      const p = getPointer()
      tx = (p.x - 0.5) * 2
      ty = (p.y - 0.5) * 2
    })

    const draw = () => {
      t += reduced ? 0 : 0.016
      px += (tx - px) * 0.03
      py += (ty - py) * 0.03

      ctx.clearRect(0, 0, width, height)
      for (const s of stars) {
        const par = 4 + s.z * 14
        const x = s.x + px * par
        const y = s.y + py * par * 0.7
        const flicker = reduced ? 1 : 0.62 + Math.sin(t * (0.7 + s.z * 1.4) + s.tw) * 0.38
        const alpha = (0.24 + s.z * 0.66) * flicker

        ctx.beginPath()
        ctx.fillStyle = `hsla(${s.hue}, 90%, ${78 + s.z * 16}%, ${alpha})`
        ctx.arc(x, y, s.r, 0, Math.PI * 2)
        ctx.fill()

        // brighter stars get a soft bloom instead of a hard pixel
        if (s.z > 0.88) {
          ctx.beginPath()
          ctx.fillStyle = `hsla(${s.hue}, 90%, 86%, ${alpha * 0.16})`
          ctx.arc(x, y, s.r * 4.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      if (visible) raf = requestAnimationFrame(draw)
    }

    const onVis = () => {
      visible = !document.hidden
      if (visible) {
        if (!raf) raf = requestAnimationFrame(draw)
      } else if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }
    document.addEventListener('visibilitychange', onVis)
    raf = requestAnimationFrame(draw)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      unsub()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [reduced, density])

  return <canvas ref={canvasRef} className="starfield" aria-hidden="true" />
}
