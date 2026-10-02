import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'

import { GlassSurface } from '../glass/GlassSurface'
import { useT } from '../../hooks/useCopy'
import { categoryMinutes } from '../../store/stats'
import { localizeDigits } from '../../utils/format'
import type { Category, Task } from '../../types'
import { categoryKey } from '../../i18n'

const CATEGORY_COLOR: Record<Category, string> = {
  study: 'var(--accent)',
  work: '#7aa2ff',
  personal: '#67e8f9',
  other: '#f472b6',
}

/** Horizontal share bars for time distributed across categories. */
export const CategoryBars = memo(function CategoryBars({
  tasks,
  lang,
}: {
  tasks: Task[]
  lang: 'fa' | 'en'
}) {
  const t = useT()
  const rows = useMemo(() => categoryMinutes(tasks).filter((r) => r.minutes > 0), [tasks])
  const total = rows.reduce((s, r) => s + r.minutes, 0)

  return (
    <GlassSurface variant="panel" className="chart-card" radius={22}>
      <header className="chart-card__head">
        <div>
          <h3 className="chart-card__title">{t('distribution')}</h3>
          <p className="chart-card__sub text-3">{t('distribution_sub')}</p>
        </div>
      </header>

      {rows.length === 0 ? (
        <p className="chart-card__empty text-3">{t('no_sessions')}</p>
      ) : (
        <ul className="cat-bars">
          {rows.map((row, i) => {
            const pct = total ? (row.minutes / total) * 100 : 0
            return (
              <li className="cat-bars__row" key={row.category}>
                <span className="cat-bars__label">
                  <span
                    className="cat-bars__dot"
                    style={{ background: CATEGORY_COLOR[row.category] }}
                    aria-hidden
                  />
                  {t(categoryKey(row.category))}
                </span>
                <span className="cat-bars__track">
                  <motion.span
                    className="cat-bars__fill"
                    style={{ background: CATEGORY_COLOR[row.category] }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: Math.max(0.02, pct / 100) }}
                    transition={{ duration: 0.8, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  />
                </span>
                <span className="cat-bars__value num">
                  {localizeDigits(Math.round(row.minutes), lang)}
                  {lang === 'fa' ? '′' : 'm'}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </GlassSurface>
  )
})
