import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, LayoutList, Settings, Timer, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { PageId } from '../../types'
import { useT } from '../../hooks/useCopy'
import { actions, useSelector } from '../../store/appStore'
import { pageKey } from '../../i18n'

const ITEMS: { id: PageId; icon: LucideIcon }[] = [
  { id: 'timer', icon: Timer },
  { id: 'tasks', icon: LayoutList },
  { id: 'stats', icon: BarChart3 },
  { id: 'presets', icon: Zap },
  { id: 'settings', icon: Settings },
]

/** Floating glass dock with a sliding glow indicator. */
export function BottomNav() {
  const t = useT()
  const page = useSelector((s) => s.page)
  // switching locale flips `dir`, which re-orders the buttons — the indicator has
  // to be measured again or it stays on the physical slot of the old layout
  const lang = useSelector((s) => s.settings.lang)
  const rootRef = useRef<HTMLElement>(null)
  const [metric, setMetric] = useState({ left: 0, width: 0 })

  const measure = useCallback(() => {
    const root = rootRef.current
    if (!root) return
    const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('button[data-nav]'))
    const index = ITEMS.findIndex((i) => i.id === page)
    const btn = buttons[index]
    if (!btn) return
    // offsetLeft is physical regardless of writing direction
    const left = btn.offsetLeft
    setMetric((prev) =>
      prev.left === left && prev.width === btn.offsetWidth ? prev : { left, width: btn.offsetWidth },
    )
  }, [page])

  useLayoutEffect(() => {
    measure()
  }, [measure, lang])

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => measure())
    ro.observe(root)
    // labels change width between locales, so watch the buttons too
    root.querySelectorAll<HTMLElement>('button[data-nav]').forEach((el) => ro.observe(el))
    return () => ro.disconnect()
  }, [measure])

  return (
    <nav className="bottom-nav glass glass--panel" aria-label={t('appSub')} ref={rootRef}>
      <motion.span
        className="bottom-nav__indicator"
        aria-hidden
        initial={false}
        animate={{ x: metric.left, width: metric.width }}
        transition={{ type: 'spring', stiffness: 420, damping: 36, mass: 0.7 }}
      />
      {ITEMS.map(({ id, icon: Icon }) => {
        const active = page === id
        return (
          <button
            key={id}
            data-nav={id}
            type="button"
            className={`bottom-nav__item ${active ? 'is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
            aria-label={t(pageKey(id))}
            onClick={() => actions.setPage(id)}
          >
            <span className="bottom-nav__icon" aria-hidden>
              <Icon size={18} strokeWidth={active ? 2.4 : 1.9} />
            </span>
            <span className="bottom-nav__label">{t(pageKey(id))}</span>
          </button>
        )
      })}
    </nav>
  )
}
