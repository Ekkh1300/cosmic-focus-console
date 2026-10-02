import { useEffect } from 'react'
import { Info, X } from 'lucide-react'

import { GlassSurface } from '../glass/GlassSurface'

export type NoticeTone = 'info' | 'warn' | 'error'

interface NoticeBannerProps {
  id: string
  tone?: NoticeTone
  message: string
  onClose: () => void
  duration?: number
}

/** Inline system notice (storage blocked, notification denied, …). */
export function NoticeBanner({
  id,
  tone = 'info',
  message,
  onClose,
  duration = 7000,
}: NoticeBannerProps) {
  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(onClose, duration)
    return () => window.clearTimeout(timer)
  }, [id, message, duration, onClose])

  if (!message) return null

  return (
    <div className="notice-positioner overlay-in">
      <GlassSurface variant="control" className={`notice notice--${tone}`} radius={16} role="status">
        <Info size={15} aria-hidden />
        <span className="notice__text">{message}</span>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="close">
          <X size={14} />
        </button>
      </GlassSurface>
    </div>
  )
}
