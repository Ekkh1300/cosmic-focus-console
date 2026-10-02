import { memo } from 'react'

/**
 * Decorative outer orbit: two counter-rotating dashed rings plus a few
 * particles that circle the timer. Pure CSS transforms — GPU composited.
 */
export const EnergyRing = memo(function EnergyRing({
  active,
  finalMinute,
  size,
}: {
  active: boolean
  finalMinute: boolean
  size: number
}) {
  const outer = size + 26
  return (
    <div
      className={`energy-ring ${active ? 'is-active' : ''} ${finalMinute ? 'is-final' : ''}`}
      style={{ width: outer, height: outer }}
      aria-hidden="true"
    >
      <svg viewBox={`0 0 ${outer} ${outer}`} width={outer} height={outer}>
        <circle
          className="energy-ring__dash"
          cx={outer / 2}
          cy={outer / 2}
          r={outer / 2 - 4}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1"
          strokeDasharray="2 14"
          strokeLinecap="round"
          opacity={0.55}
        />
        <circle
          className="energy-ring__dash energy-ring__dash--slow"
          cx={outer / 2}
          cy={outer / 2}
          r={outer / 2 - 13}
          fill="none"
          stroke="#7de8ff"
          strokeWidth="0.75"
          strokeDasharray="1 26"
          strokeLinecap="round"
          opacity={0.4}
        />
        <g className="energy-ring__particles">
          {[0, 72, 144, 216, 288].map((deg, i) => {
            const rad = (deg * Math.PI) / 180
            const r = outer / 2 - 4
            const x = outer / 2 + Math.cos(rad) * r
            const y = outer / 2 + Math.sin(rad) * r
            return (
              <circle
                key={deg}
                cx={x}
                cy={y}
                r={i === 0 ? 2.6 : 1.6}
                fill={i % 2 === 0 ? 'var(--accent)' : '#7de8ff'}
                opacity={i === 0 ? 0.95 : 0.55}
              />
            )
          })}
        </g>
      </svg>
      <div className="energy-ring__halo" />
    </div>
  )
})
