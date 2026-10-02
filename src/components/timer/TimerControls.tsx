import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react'

import { GlassButton } from '../glass/GlassButton'
import { useT } from '../../hooks/useCopy'

interface TimerControlsProps {
  running: boolean
  canResume: boolean
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onSkip: () => void
}

export function TimerControls({
  running,
  canResume,
  onStart,
  onPause,
  onReset,
  onSkip,
}: TimerControlsProps) {
  const t = useT()
  const label = running ? t('pause') : canResume ? t('resume') : t('start')

  return (
    <div className="timer-controls">
      <div className="timer-controls__main">
        {/* one button, re-keyed so the swap re-runs a CSS animation only */}
        <GlassButton
          key={running ? 'pause' : 'start'}
          tone="primary"
          size="lg"
          className="btn--start control-swap"
          onClick={running ? onPause : onStart}
          aria-label={label}
        >
          {running ? <Pause size={18} /> : <Play size={18} />}
          <span>{label}</span>
        </GlassButton>

        <GlassButton
          tone="secondary"
          size="lg"
          onClick={onReset}
          aria-label={t('reset')}
          title={`${t('reset')} · R`}
        >
          <RotateCcw size={17} />
          <span>{t('reset')}</span>
        </GlassButton>

        <GlassButton
          tone="ghost"
          size="lg"
          onClick={onSkip}
          aria-label={t('skip')}
          title={`${t('skip')} · N`}
        >
          <SkipForward size={17} />
          <span>{t('skip')}</span>
        </GlassButton>
      </div>
    </div>
  )
}
