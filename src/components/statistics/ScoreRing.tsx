import { memo, useEffect, useRef } from 'react'

import { GlassSurface } from '../glass/GlassSurface'
import { useT } from '../../hooks/useCopy'
import { localizeDigits } from '../../utils/format'

interface ScoreRingProps {
  score: number
  lang: 'fa' | 'en'
  size?: number
}

/** Focus score — a single glowing arc, animated once on mount. */
export const ScoreRing = memo(function ScoreRing({ score, lang, size = 148 }: ScoreRingProps) {
  const t = useT()
  const arcRef = useRef<SVGCircleElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const r = (size - 16) / 2
  const c = 2 * Math.PI * r

  useEffect(() => {
    const target = Math.max(0, Math.min(100, score))
    const duration = 1100
    const start = performance.now()
    let raf = 0

    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      const value = target * eased
      if (arcRef.current) arcRef.current.style.strokeDashoffset = String(c * (1 - value / 100))
      if (textRef.current) textRef.current.textContent = localizeDigits(Math.round(value), lang)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [score, c, lang])

  return (
    <GlassSurface variant="panel" className="score-card" radius={22}>
      <div
        className="score-card__ring"
        style={{ width: size, height: size }}
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t('focus_score')}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7de8ff" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.09)"
            strokeWidth="10"
          />
          <circle
            ref={arcRef}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ filter: 'drop-shadow(0 0 10px var(--accent-glow))' }}
          />
        </svg>
        <div className="score-card__value num">
          <span ref={textRef}>{localizeDigits(score, lang)}</span>
          <span className="score-card__unit">%</span>
        </div>
      </div>
      <p className="score-card__label">{t('focus_score')}</p>
    </GlassSurface>
  )
})
