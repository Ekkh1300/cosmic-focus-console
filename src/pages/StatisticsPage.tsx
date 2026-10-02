import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, CheckCircle2, Flame, ListChecks, Timer as TimerIcon, Zap } from 'lucide-react'

import { PageHeader } from '../components/common/PageHeader'
import { StatCard } from '../components/statistics/StatCard'
import { WeekChart } from '../components/statistics/WeekChart'
import { ScoreRing } from '../components/statistics/ScoreRing'
import { CategoryBars } from '../components/statistics/CategoryBars'
import { SessionList } from '../components/statistics/SessionList'
import { GlassSurface } from '../components/glass/GlassSurface'
import { useT } from '../hooks/useCopy'
import { useSelector } from '../store/appStore'
import { deriveStats } from '../store/stats'
import { formatHM, formatPercent, localizeDigits } from '../utils/format'

export function StatisticsPage() {
  const t = useT()
  const sessions = useSelector((s) => s.sessions)
  const tasks = useSelector((s) => s.tasks)
  const settings = useSelector((s) => s.settings)
  const lang = settings.lang

  const stats = useMemo(
    () => deriveStats(sessions, tasks, settings),
    [sessions, tasks, settings],
  )

  const taskTitle = (id?: string) => {
    if (!id) return null
    return tasks.find((task) => task.id === id)?.title ?? null
  }

  const goalPct = stats.todayFocusMin / Math.max(1, settings.dailyGoalMin)

  return (
    <div className="page page--stats">
      <PageHeader title={t('stats_title')} subtitle={t('stats_sub')} />

      <div className="stats-grid">
        <StatCard
          index={0}
          accent
          icon={<TimerIcon size={14} />}
          label={t('today_focus')}
          value={formatHM(stats.todayFocusMin, lang)}
          hint={
            goalPct >= 1
              ? t('goal_reached')
              : `${t('goal_progress')} · ${formatHM(settings.dailyGoalMin, lang)}`
          }
          progress={goalPct}
        />
        <StatCard
          index={1}
          icon={<Zap size={14} />}
          label={t('week_focus')}
          value={formatHM(stats.weekFocusMin, lang)}
        />
        <StatCard
          index={2}
          icon={<ListChecks size={14} />}
          label={t('sessions')}
          value={localizeDigits(stats.sessions, lang)}
        />
        <StatCard
          index={3}
          icon={<CheckCircle2 size={14} />}
          label={t('completed_tasks')}
          value={localizeDigits(stats.completedTasks, lang)}
        />
        <StatCard
          index={4}
          icon={<Flame size={14} />}
          label={t('streak')}
          value={`${localizeDigits(stats.streak, lang)} ${lang === 'fa' ? 'روز' : 'days'}`}
        />
        <StatCard
          index={5}
          icon={<CalendarDays size={14} />}
          label={t('daily_goal')}
          value={`${localizeDigits(Math.min(100, Math.round(goalPct * 100)), lang)}٪`}
          progress={goalPct}
        />
      </div>

      <div className="stats-charts">
        <motion.div
          className="stats-charts__main"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <WeekChart data={stats.last7} goalMin={settings.dailyGoalMin} lang={lang} />
          <CategoryBars tasks={tasks} lang={lang} />
        </motion.div>

        <motion.aside
          className="stats-charts__aside"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
          <ScoreRing score={stats.focusScore} lang={lang} />
          <SessionList sessions={sessions} taskTitle={taskTitle} lang={lang} />
        </motion.aside>
      </div>

      {stats.sessions > 0 ? (
        <GlassSurface variant="ghost" className="stats-footnote" radius={16}>
          <span className="text-3">
            {`${t('sessions')}: ${localizeDigits(stats.sessions, lang)} · ${t('week_focus')}: ${formatHM(
              stats.weekFocusMin,
              lang,
            )} · ${t('focus_score')}: ${formatPercent(stats.focusScore, lang)}`}
          </span>
        </GlassSurface>
      ) : null}
    </div>
  )
}
