import { useCallback, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { motion } from 'framer-motion'

export interface SegmentOption<T extends string> {
  value: T
  label: string
  hint?: string
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  /** Slide duration for the liquid indicator. */
  duration?: number
  className?: string
  layout?: 'pill' | 'wide'
}

/**
 * Segmented liquid-glass selector. The indicator physically slides between
 * options instead of cross-fading, so the whole control reads as one material.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  duration = 0.42,
  className = '',
  layout = 'pill',
}: SegmentedControlProps<T>) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  const measure = useCallback(() => {
    const root = rootRef.current
    if (!root) return
    const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('button'))
    const index = options.findIndex((o) => o.value === value)
    const btn = buttons[index]
    if (!btn) return
    // indicator is absolutely positioned inside a LTR-flowing rail
    // offsetLeft is physical in both directions, so no RTL adjustment is needed
    const left = btn.offsetLeft
    setIndicator((prev) =>
      prev.left === left && prev.width === btn.offsetWidth ? prev : { left, width: btn.offsetWidth },
    )
  }, [options, value])

  useLayoutEffect(() => {
    measure()
  }, [measure])

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => measure())
    ro.observe(root)
    root.querySelectorAll('button').forEach((b) => ro.observe(b))
    return () => ro.disconnect()
  }, [measure])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const idx = options.findIndex((o) => o.value === value)
    if (idx < 0) return
    let next = idx
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % options.length
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + options.length) % options.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = options.length - 1
    else return
    e.preventDefault()
    onChange(options[next].value)
    rootRef.current?.querySelectorAll<HTMLButtonElement>('button')[next]?.focus()
  }

  return (
    <div
      ref={rootRef}
      role="tablist"
      aria-label={ariaLabel}
      className={`seg glass glass--control ${layout === 'wide' ? 'seg--wide' : ''} ${className}`}
      data-layout={layout}
      onKeyDown={onKeyDown}
    >
      <motion.span
        className="seg__indicator"
        aria-hidden
        initial={false}
        animate={{ x: indicator.left, width: indicator.width }}
        transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
      />
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            className={`seg__item ${active ? 'is-active' : ''}`}
            onClick={() => onChange(opt.value)}
          >
            <span className="seg__label">{opt.label}</span>
            {opt.hint ? <span className="seg__hint num">{opt.hint}</span> : null}
          </button>
        )
      })}
    </div>
  )
}
