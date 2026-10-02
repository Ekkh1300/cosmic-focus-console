import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

import { GlassSurface } from './GlassSurface'
import { GlassButton } from './GlassButton'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  width?: number
  closeLabel: string
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input:not([type="hidden"]), select, [tabindex]:not([tabindex="-1"])'

/**
 * Glass dialog with focus trapping and Escape handling.
 *
 * Entrance is pure CSS: the element must mount and unmount immediately, so the
 * dialog can never be left hanging on screen if the browser starves rAF.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 460,
  closeLabel,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const lastActive = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    lastActive.current = document.activeElement as HTMLElement | null

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (!nodes || nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey, true)
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    }, 40)

    return () => {
      document.removeEventListener('keydown', onKey, true)
      window.clearTimeout(t)
      lastActive.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="modal-backdrop overlay-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-positioner">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="overlay-pop"
          style={{ width: 'min(92vw, 100%)', maxWidth: width }}
        >
          <GlassSurface
            variant="primary"
            fused
            className="modal-panel"
            ref={(node) => {
              panelRef.current = node
            }}
          >
            <header className="modal-head">
              <div>
                <h2 className="modal-title">{title}</h2>
                {description ? <p className="modal-desc text-2">{description}</p> : null}
              </div>
              <GlassButton
                tone="ghost"
                size="sm"
                iconOnly
                aria-label={closeLabel}
                onClick={onClose}
                className="modal-close"
              >
                <X size={16} />
              </GlassButton>
            </header>
            {children ? <div className="modal-body">{children}</div> : null}
            {footer ? <footer className="modal-foot">{footer}</footer> : null}
          </GlassSurface>
        </div>
      </div>
    </div>,
    document.body,
  )
}
