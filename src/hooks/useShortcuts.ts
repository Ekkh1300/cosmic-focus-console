import { useEffect, useRef } from 'react'

import { actions, useSelector } from '../store/appStore'

export interface ShortcutHandlers {
  onToggle: () => void
  onReset: () => void
  onNext: () => void
  onClose: () => void
  onSearch?: () => void
}

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable === true
  )
}

/**
 * Global keyboard map. Space is prevented from scrolling/clicking whatever
 * happens to hold focus, so the shortcut works from anywhere.
 */
export function useShortcuts(handlers: ShortcutHandlers): void {
  const ref = useRef(handlers)
  ref.current = handlers

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const h = ref.current

      if (e.key === 'Escape') {
        h.onClose()
        return
      }

      if (isTypingTarget(e.target)) return
      if (e.ctrlKey || e.metaKey || e.altKey) return

      switch (e.key) {
        case ' ':
        case 'Spacebar':
          e.preventDefault()
          h.onToggle()
          break
        case 'r':
        case 'R':
        case 'ک':
          e.preventDefault()
          h.onReset()
          break
        case 'n':
        case 'N':
        case 'ن':
          e.preventDefault()
          h.onNext()
          break
        case 't':
        case 'T':
        case 'ت':
          e.preventDefault()
          actions.setPage('timer')
          break
        case 's':
        case 'S':
        case 'س':
          e.preventDefault()
          actions.setPage('tasks')
          break
        case 'p':
        case 'P':
        case 'ح':
          e.preventDefault()
          actions.setPage('stats')
          break
        case 'g':
        case 'G':
        case 'ص':
          e.preventDefault()
          actions.setPage('presets')
          break
        case '/':
          e.preventDefault()
          h.onSearch?.()
          actions.setPage('tasks')
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}

/** Convenience wrapper used by App to wire the default handlers. */
export function useAppShortcuts(onSearch?: () => void): void {
  const status = useSelector((s) => s.timer.status)
  useShortcuts({
    onToggle: () => actions.toggle(),
    onReset: () => actions.reset(),
    onNext: () => actions.advance(status === 'completed'),
    onClose: () => document.dispatchEvent(new CustomEvent('ty:close-overlay')),
    onSearch,
  })
}
