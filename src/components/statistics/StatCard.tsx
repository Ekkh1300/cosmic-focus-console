import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

import { GlassSurface } from '../glass/GlassSurface'

interface StatCardProps {
  label: string
  value: string
  hint?: string
  icon?: ReactNode
  accent?: boolean
  /** 0–1 renders a hairline progress under the value. */
  progress?: number
  index?: number
}

/** Small glass tile used across the dashboard and the right rail. */
export function StatCard({ label, value, hint, icon, accent, progress, index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="stat-card-wrap"
    >
      <GlassSurface
        variant="control"
        className={`stat-card ${accent ? 'stat-card--accent' : ''} card-hover`}
        radius={18}
      >
        <div className="stat-card__top">
          <span className="stat-card__label">{label}</span>
          {icon ? <span className="stat-card__icon" aria-hidden>{icon}</span> : null}
        </div>
        <div className="stat-card__value num">{value}</div>
        {hint ? <div className="stat-card__hint text-3">{hint}</div> : null}
        {progress != null ? (
          <div
            className="stat-card__bar"
            role="progressbar"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={label}
          >
            <motion.span
              className="stat-card__bar-fill"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: Math.max(0.02, Math.min(1, progress)) }}
              transition={{ duration: 0.9, delay: 0.15 + index * 0.05, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'right center' }}
            />
          </div>
        ) : null}
      </GlassSurface>
    </motion.div>
  )
}
