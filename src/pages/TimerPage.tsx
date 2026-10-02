import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'

import { TimerOrb, TaskChip } from '../components/timer/TimerOrb'
import { DurationDialog } from '../components/timer/DurationDialog'
import { TimerControls } from '../components/timer/TimerControls'
import { PhaseSegments } from '../components/timer/PhaseSegments'
import { ModeSelector } from '../components/timer/ModeSelector'
import { CompletionOverlay } from '../components/timer/CompletionOverlay'
import { useT } from '../hooks/useCopy'
import { useClockFrame } from '../hooks/useClock'
import { actions, activeTask, useSelector } from '../store/appStore'
import { localizeDigits } from '../utils/format'
import { kindKey, phaseKey } from '../i18n'

export function TimerPage() {
  const t = useT()
  const store = useSelector((s) => s)
  const { settings, timer, presets } = store

  const [durationOpen, setDurationOpen] = useState(false)
  const [finalMinute, setFinalMinute] = useState(false)

  useClockFrame((f) => {
    const isFinal = timer.running && f.remaining > 0 && f.remaining <= 60_000
    setFinalMinute((prev) => (prev === isFinal ? prev : isFinal))
  })

  const preset = presets.find((p) => p.id === timer.presetId) ?? presets[0]
  const task = activeTask(store)

  const phaseMin =
    timer.phase === 'focus'
      ? preset.focusMin
      : timer.phase === 'short'
        ? preset.shortMin
        : preset.longMin

  const labelFor = (p: (typeof presets)[number]) =>
    p.builtin ? t(kindKey(p.kind)) : p.name

  return (
    <div className="page page--timer">
      <div className="timer-grid">
        {/* the console is the whole page — no side rails */}
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
      </div>

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
