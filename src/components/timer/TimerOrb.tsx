import { memo, useEffect, useState } from 'react'
import { ListTodo } from 'lucide-react'

import { EnergyRing } from './EnergyRing'
import { ProgressRing } from './ProgressRing'
import { useRemainingText } from '../../hooks/useClock'
import { useT } from '../../hooks/useCopy'
import { useSelector, activePreset } from '../../store/appStore'
import { formatClock } from '../../utils/format'
import { phaseStatusKey } from '../../i18n'
import type { Phase } from '../../types'

/** Keeps the orb inside whatever vertical room the viewport actually has. */
function useOrbSize(): number {
  const calc = () => {
    if (typeof window === 'undefined') return 344
    const byHeight = window.innerHeight - 340
    const byWidth = window.innerWidth < 1180 ? window.innerWidth - 96 : 9999
    return Math.round(Math.max(236, Math.min(344, byHeight, byWidth)))
  }
  const [size, setSize] = useState(calc)
  useEffect(() => {
    let frame = 0
    const onResize = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        setSize(calc())
      })
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])
  return size
}

interface TimerOrbProps {
  running: boolean
  phase: Phase
  status: 'idle' | 'running' | 'paused' | 'completed'
  taskTitle: string | null
  finalMinute: boolean
}

/**
 * The console's centrepiece. Digits come from the rAF clock (one render per
 * second); the ring and orbiting energy are driven frame-by-frame in place.
 */
export const TimerOrb = memo(function TimerOrb({
  running,
  phase,
  status,
  taskTitle,
  finalMinute,
}: TimerOrbProps) {
  const t = useT()
  const lang = useSelector((s) => s.settings.lang)
  const preset = useSelector(activePreset)
  const size = useOrbSize()

  const time = useRemainingText((ms) => formatClock(ms, lang))
  const modeLabel = t(`mode_${preset.kind}` as 'mode_deep')
  const primary = taskTitle ?? modeLabel
  const eyebrow =
    status === 'completed'
      ? t('session_complete')
      : running
        ? t('focus_on')
        : status === 'paused'
          ? t('pause')
          : t('ready')
  const hint = running
    ? t('running_hint')
    : status === 'paused'
      ? t('paused_hint')
      : t('idle_hint')

  return (
    <div className="orb-stack">
      <EnergyRing active={running} finalMinute={finalMinute} size={size} />

      <div
        className={`orb glass glass--primary ${running ? 'is-breathing' : ''} ${
          finalMinute ? 'is-final' : ''
        }`}
        style={{ width: size, height: size }}
      >
        <div className="orb__rings" aria-hidden>
          <ProgressRing size={size} stroke={8} />
        </div>

        <div className="orb__inner" style={{ fontSize: Math.max(12, size * 0.041) }}>
          <span className="orb__eyebrow label-caps">{eyebrow}</span>

          <div
            className="orb__time num"
            role="timer"
            aria-live="off"
            aria-atomic="true"
            style={{ fontSize: size * 0.215 }}
          >
            {time}
          </div>

          <div className="orb__label-row">
            <span className="orb__label" title={primary}>
              {primary}
            </span>
          </div>

          <div className="orb__status">
            <span className="orb__status-dot" aria-hidden />
            <span>{t(phaseStatusKey(phase))}</span>
          </div>

          <p className="orb__hint text-3">{hint}</p>
        </div>

        <div className="orb__sheen" aria-hidden />
      </div>
    </div>
  )
})

/** Compact "current task" pill shown under the controls. */
export function TaskChip({ title, onClick }: { title: string | null; onClick: () => void }) {
  const t = useT()
  return (
    <button type="button" className="task-chip glass glass--control pressable" onClick={onClick}>
      <ListTodo size={15} aria-hidden />
      <span className="task-chip__label">
        <span className="task-chip__kicker">{t('current_task')}</span>
        <span className="task-chip__title">{title ?? t('no_task')}</span>
      </span>
    </button>
  )
}
