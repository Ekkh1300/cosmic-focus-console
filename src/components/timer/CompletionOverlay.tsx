import { Coffee, Sparkles } from 'lucide-react'

import { GlassButton } from '../glass/GlassButton'
import { useT } from '../../hooks/useCopy'
import type { Phase } from '../../types'

interface CompletionOverlayProps {
  open: boolean
  phase: Phase
  taskTitle?: string
  onPrimary: () => void
  onSecondary: () => void
}

/**
 * Completion moment: the panel swells, particles fan outward and a soft glow
 * settles. Deliberately restrained — an acknowledgement, not an explosion.
 *
 * Mounts and unmounts immediately with a CSS entrance, so dismissing it can
 * never leave the screen blocked when animation frames are suspended.
 */
export function CompletionOverlay({
  open,
  phase,
  taskTitle,
  onPrimary,
  onSecondary,
}: CompletionOverlayProps) {
  const t = useT()
  const isFocus = phase === 'focus'

  if (!open) return null

  return (
    <div className="completion overlay-in" role="status" aria-live="polite">
      <div className="completion__particles" aria-hidden>
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} style={{ ['--i' as string]: i }} />
        ))}
      </div>

      <div className="completion__card glass glass--primary overlay-pop">
        <div className="completion__icon" aria-hidden>
          {isFocus ? <Sparkles size={26} /> : <Coffee size={26} />}
        </div>
        <h2 className="completion__title">{t('session_complete')}</h2>
        <p className="completion__sub text-2">
          {taskTitle ? taskTitle : t('session_complete_sub')}
        </p>
        <div className="completion__actions">
          <GlassButton tone="primary" size="md" onClick={onPrimary} autoFocus>
            {isFocus ? t('take_break') : t('start_next')}
          </GlassButton>
          <GlassButton tone="ghost" size="md" onClick={onSecondary}>
            {t('back_to_timer')}
          </GlassButton>
        </div>
      </div>
    </div>
  )
}
