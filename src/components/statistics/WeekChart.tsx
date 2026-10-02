import { memo } from 'react'
import { motion } from 'framer-motion'

import type { DailyStat } from '../../types'
import { useT } from '../../hooks/useCopy'
import { localizeDigits } from '../../utils/format'
import { GlassSurface } from '../glass/GlassSurface'

interface WeekChartProps {
  data: DailyStat[]
  goalMin: number
  lang: 'fa' | 'en'
}

const DAY_LABELS = {
  fa: ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'],
  en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
}

/**
 * Seven-day focus flow: glowing columns over a hairline goal line. No chart
 * library — the shape is simple enough to own outright.
 */
export const WeekChart = memo(function WeekChart({ data, goalMin, lang }: WeekChartProps) {
  const t = useT()
  const max = Math.max(goalMin, ...data.map((d) => d.focusMin), 30)
  const todayIdx = data.length - 1

  return (
    <GlassSurface variant="panel" className="chart-card" radius={22}>
      <header className="chart-card__head">
        <div>
          <h3 className="chart-card__title">{t('weekly_flow')}</h3>
          <p className="chart-card__sub text-3">{t('weekly_flow_sub')}</p>
        </div>
        <span className="chart-card__badge num">
          {localizeDigits(
            data.reduce((s, d) => s + d.focusMin, 0),
            lang,
          )}
          {lang === 'fa' ? '′' : 'm'}
        </span>
      </header>

      <div className="week-chart" role="img" aria-label={`${t('weekly_flow')}: ${t('weekly_flow_sub')}`}>
        {data.every((d) => d.focusMin === 0) ? (
          <p className="week-chart__empty text-3">{t('no_sessions_sub')}</p>
        ) : null}
        <div
          className="week-chart__goal"
          style={{ bottom: `${Math.min(94, (goalMin / max) * 100)}%` }}
          aria-hidden
        >
          <span className="week-chart__goal-label num">
            {t('daily_goal')} · {localizeDigits(goalMin, lang)}
            {lang === 'fa' ? '′' : 'm'}
          </span>
        </div>

        <div className="week-chart__cols">
          {data.map((d, i) => {
            const pct = Math.min(100, (d.focusMin / max) * 100)
            const isToday = i === todayIdx
            const weekday = new Date(`${d.date}T12:00:00`).getDay()
            const label = lang === 'fa' ? DAY_LABELS.fa[weekday] : DAY_LABELS.en[weekday]
            return (
              <div className="week-chart__col" key={d.date} title={`${d.date} · ${d.focusMin}′`}>
                <div className="week-chart__track">
                  <motion.div
                    className={`week-chart__bar ${isToday ? 'is-today' : ''} ${
                      d.focusMin >= goalMin ? 'is-goal' : ''
                    }`}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(pct, d.focusMin > 0 ? 4 : 1.5)}%` }}
                    transition={{
                      duration: 0.75,
                      delay: i * 0.06,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                </div>
                <span className={`week-chart__day ${isToday ? 'is-today' : ''}`}>{label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </GlassSurface>
  )
})
