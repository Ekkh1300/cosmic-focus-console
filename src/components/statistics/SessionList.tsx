import { GlassSurface } from '../glass/GlassSurface'
import { EmptyState } from '../glass/EmptyState'
import { useT } from '../../hooks/useCopy'
import { phaseStatusKey } from '../../i18n'
import { localizeDigits } from '../../utils/format'
import type { SessionLog } from '../../types'
import { History } from 'lucide-react'

interface SessionListProps {
  sessions: SessionLog[]
  taskTitle: (id?: string) => string | null
  lang: 'fa' | 'en'
}

/** Recent focus blocks, newest first, with a soft day separator. */
export function SessionList({ sessions, taskTitle, lang }: SessionListProps) {
  const t = useT()
  const recent = [...sessions].reverse().slice(0, 12)

  if (recent.length === 0) {
    return (
      <GlassSurface variant="panel" className="chart-card" radius={22}>
        <EmptyState
          icon={<History size={22} />}
          title={t('no_sessions')}
          subtitle={t('no_sessions_sub')}
        />
      </GlassSurface>
    )
  }

  return (
    <GlassSurface variant="panel" className="chart-card" radius={22}>
      <header className="chart-card__head">
        <div>
          <h3 className="chart-card__title">{t('recent_sessions')}</h3>
        </div>
      </header>

      <ul className="session-list">
        {recent.map((s) => {
          const title = taskTitle(s.taskId)
          const d = new Date(s.startedAt)
          const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
          return (
            <li className="session-item" key={s.id}>
              <span className="session-item__marker" aria-hidden />
              <div className="session-item__main">
                <span className="session-item__title">{title ?? t(phaseStatusKey(s.phase))}</span>
                <span className="session-item__meta text-3">
                  {localizeDigits(time, lang)} · {new Date(s.startedAt).toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-GB')}
                </span>
              </div>
              <span className="session-item__dur num">
                {localizeDigits(s.minutes, lang)}
                {lang === 'fa' ? '′' : 'm'}
              </span>
            </li>
          )
        })}
      </ul>
    </GlassSurface>
  )
}
