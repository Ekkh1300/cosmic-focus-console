import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Clock, Flame, ListChecks, Timer as TimerIcon } from 'lucide-react'

import { TimerOrb, TaskChip } from '../components/timer/TimerOrb'
import { DurationDialog } from '../components/timer/DurationDialog'
import { TimerControls } from '../components/timer/TimerControls'
import { PhaseSegments } from '../components/timer/PhaseSegments'
import { ModeSelector } from '../components/timer/ModeSelector'
import { CompletionOverlay } from '../components/timer/CompletionOverlay'
import { TaskPanel } from '../components/tasks/TaskPanel'
import { TaskComposer } from '../components/tasks/TaskComposer'
import { GlassSurface } from '../components/glass/GlassSurface'
import { GlassButton } from '../components/glass/GlassButton'
import { StatCard } from '../components/statistics/StatCard'
import { useT } from '../hooks/useCopy'
import { useClockFrame } from '../hooks/useClock'
import { actions, activeTask, useSelector } from '../store/appStore'
import { deriveStats } from '../store/stats'
import { formatHM, formatPercent, localizeDigits } from '../utils/format'
import { kindKey, phaseKey } from '../i18n'
import type { Task } from '../types'

export function TimerPage() {
  const t = useT()
  const store = useSelector((s) => s)
  const { settings, timer, presets, tasks, sessions } = store

  const [composerOpen, setComposerOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [durationOpen, setDurationOpen] = useState(false)
  const [finalMinute, setFinalMinute] = useState(false)

  useClockFrame((f) => {
    const isFinal = timer.running && f.remaining > 0 && f.remaining <= 60_000
    setFinalMinute((prev) => (prev === isFinal ? prev : isFinal))
  })

  const preset = presets.find((p) => p.id === timer.presetId) ?? presets[0]
  const task = activeTask(store)
  const stats = useMemo(() => deriveStats(sessions, tasks, settings), [sessions, tasks, settings])

  const phaseMin =
    timer.phase === 'focus'
      ? preset.focusMin
      : timer.phase === 'short'
        ? preset.shortMin
        : preset.longMin

  const labelFor = (p: (typeof presets)[number]) =>
    p.builtin ? t(kindKey(p.kind)) : p.name

  const openAdd = () => {
    setEditing(null)
    setComposerOpen(true)
  }
  const openEdit = (next: Task) => {
    setEditing(next)
    setComposerOpen(true)
  }

  return (
    <div className="page page--timer">
      <div className="timer-grid">
        {/* ---- left: today's tasks ---- */}
        <motion.aside
          className="timer-grid__side"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <TaskPanel
            onAdd={openAdd}
            onEdit={openEdit}
            onJumpToTasks={() => actions.setPage('tasks')}
          />
        </motion.aside>

        {/* ---- centre: the console ---- */}
        <motion.main
          className="timer-grid__center"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <ModeSelector
            presets={presets}
            activeId={timer.presetId}
            onSelect={(id) => actions.applyPreset(id)}
            labelFor={labelFor}
          />

          <div className="orb-zone">
            <TimerOrb
              running={timer.running}
              phase={timer.phase}
              status={timer.status}
              taskTitle={task?.title ?? null}
              finalMinute={finalMinute}
            />
          </div>

          <div className="timer-under">
            <div className="phase-row">
              <PhaseSegments onChange={(p) => actions.setPhase(p)} />
              <button
                type="button"
                className="duration-trigger glass glass--control pressable"
                onClick={() => setDurationOpen(true)}
                aria-label={`${t('set_duration')} — ${t(phaseKey(timer.phase))}`}
                title={t('set_duration')}
              >
                <Clock size={15} aria-hidden />
                <span className="duration-trigger__value num">{localizeDigits(phaseMin, settings.lang)}</span>
              </button>
            </div>

            <TimerControls
              running={timer.running}
              canResume={timer.status === 'paused' || timer.status === 'completed'}
              onStart={() => actions.start()}
              onPause={() => actions.pause()}
              onReset={() => actions.reset()}
              onSkip={() => actions.skip()}
            />
            <TaskChip
              title={task?.title ?? null}
              onClick={() => (task ? actions.setTask(null) : actions.setPage('tasks'))}
            />
            <p className="timer-preset text-3">
              {preset
                ? `${labelFor(preset)} · ${t(phaseKey(timer.phase))} ${localizeDigits(phaseMin, settings.lang)}${
                    settings.lang === 'fa' ? '′' : 'm'
                  }`
                : ''}
            </p>
          </div>
        </motion.main>

        {/* ---- right: live stats ---- */}
        <motion.aside
          className="timer-grid__side timer-grid__side--stats"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
        >
          <GlassSurface variant="panel" className="side-panel stats-rail" radius={24}>
            <header className="side-panel__head">
              <div>
                <span className="label-caps">{t('stats_title')}</span>
                <h2 className="side-panel__title">{t('nav_stats')}</h2>
              </div>
            </header>

            <div className="stats-rail__grid">
              <StatCard
                index={0}
                icon={<TimerIcon size={14} />}
                label={t('today_focus')}
                value={formatHM(stats.todayFocusMin, settings.lang)}
                progress={stats.todayFocusMin / Math.max(1, settings.dailyGoalMin)}
              />
              <StatCard
                index={1}
                icon={<ListChecks size={14} />}
                label={t('sessions')}
                value={localizeDigits(stats.sessions, settings.lang)}
              />
              <StatCard
                index={2}
                icon={<CalendarDays size={14} />}
                label={t('completed_tasks')}
                value={localizeDigits(stats.completedTasks, settings.lang)}
              />
              <StatCard
                index={3}
                icon={<Flame size={14} />}
                label={t('streak')}
                value={`${localizeDigits(stats.streak, settings.lang)} ${
                  settings.lang === 'fa' ? 'روز' : 'd'
                }`}
              />
              <StatCard
                index={4}
                accent
                label={t('focus_score')}
                value={formatPercent(stats.focusScore, settings.lang)}
                progress={stats.focusScore / 100}
              />
            </div>

            <footer className="side-panel__foot">
              <GlassButton tone="ghost" size="sm" onClick={() => actions.setPage('stats')}>
                {t('stats_sub')}
              </GlassButton>
            </footer>
          </GlassSurface>
        </motion.aside>
      </div>

      <TaskComposer
        open={composerOpen}
        editing={editing}
        onClose={() => setComposerOpen(false)}
      />

      {durationOpen ? (
        <DurationDialog
          open
          phase={timer.phase}
          onClose={() => setDurationOpen(false)}
          onApply={(minutes) => actions.setPhaseDuration(minutes)}
        />
      ) : null}

      <CompletionOverlay
        open={timer.status === 'completed'}
        phase={timer.phase}
        taskTitle={task?.title ?? undefined}
        onPrimary={() => actions.advance(true)}
        onSecondary={() => actions.advance(false)}
      />
    </div>
  )
}
