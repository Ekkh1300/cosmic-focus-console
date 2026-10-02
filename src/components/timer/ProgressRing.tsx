import { memo, useRef } from 'react'

import { useClockFrame } from '../../hooks/useClock'

interface ProgressRingProps {
  /** Diameter in px. */
  size: number
  stroke?: number
  /** Accent colour for the completed arc. */
  color?: string
  trackOpacity?: number
}

/**
 * Circular energy orbit. The arc is written straight to the DOM every frame —
 * no React render is involved, so it stays perfectly smooth at 60fps.
 */
export const ProgressRing = memo(function ProgressRing({
  size,
  stroke = 8,
  color = 'var(--accent)',
  trackOpacity = 0.2,
}: ProgressRingProps) {
  const arcRef = useRef<SVGCircleElement>(null)
  const glowRef = useRef<SVGCircleElement>(null)
  const headRef = useRef<SVGGElement>(null)

  const r = (size - stroke * 2 - 8) / 2
  const c = 2 * Math.PI * r
  const cx = size / 2

  useClockFrame((f) => {
    const p = Math.max(0, Math.min(1, f.progress))
    const offset = c * (1 - p)
    if (arcRef.current) arcRef.current.style.strokeDashoffset = String(offset)
    if (glowRef.current) glowRef.current.style.strokeDashoffset = String(offset)
    if (headRef.current) {
      // -90deg puts 0% at 12 o'clock; sweep clockwise from there
      headRef.current.style.transform = `rotate(${p * 360}deg)`
      headRef.current.style.opacity = f.running || p > 0 ? '1' : '0'
    }
  })

  return (
    <svg
      className="progress-ring"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.9)"
        strokeOpacity={trackOpacity}
        strokeWidth={stroke}
      />
      {/* tick marks at the quarter points give the orbit a measured feel */}
      {[0, 90, 180, 270].map((deg) => {
        const rad = ((deg - 90) * Math.PI) / 180
        const inner = r - stroke * 1.6
        const outer = r + stroke * 1.6
        return (
          <line
            key={deg}
            x1={cx + Math.cos(rad) * inner}
            y1={cx + Math.sin(rad) * inner}
            x2={cx + Math.cos(rad) * outer}
            y2={cx + Math.sin(rad) * outer}
            stroke="rgba(255,255,255,0.28)"
            strokeWidth={1}
          />
        )
      })}
      {/* faint secondary track for depth */}
      <circle
        cx={cx}
        cy={cx}
        r={r + stroke * 0.95}
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        strokeOpacity={0.05}
        strokeWidth={1}
      />
      <circle
        ref={glowRef}
        className="progress-ring__glow timer-ring-glow"
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke * 2.4}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c}
        transform={`rotate(-90 ${cx} ${cx})`}
        style={{ filter: 'blur(9px)', opacity: 0.5 }}
      />
      <circle
        ref={arcRef}
        className="progress-ring__arc"
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke={`url(#ringGradient)`}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c}
        transform={`rotate(-90 ${cx} ${cx})`}
      />
      {/* travelling head — the "energy" that leads the arc */}
      <g ref={headRef} style={{ transformOrigin: `${cx}px ${cx}px` }}>
        <circle cx={cx} cy={cx - r} r={stroke * 0.95} fill={color} />
        <circle cx={cx} cy={cx - r} r={stroke * 2.2} fill={color} opacity={0.28} />
      </g>

      <defs>
        <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="55%" stopColor="var(--accent-2)" />
          <stop offset="100%" stopColor="#7de8ff" />
        </linearGradient>
      </defs>
    </svg>
  )
})
