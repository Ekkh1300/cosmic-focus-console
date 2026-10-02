import { motion } from 'framer-motion'

import type { Preset } from '../../types'
import { useT } from '../../hooks/useCopy'
import { kindDescKey } from '../../i18n'
import { useSelector } from '../../store/appStore'
import { localizeDigits } from '../../utils/format'

interface ModeSelectorProps {
  presets: Preset[]
  activeId: string
  onSelect: (id: string) => void
  labelFor: (p: Preset) => string
}

/**
 * Productivity mode rail. Each chip carries its own accent, so choosing a mode
 * subtly re-tints the whole console.
 */
export function ModeSelector({ presets, activeId, onSelect, labelFor }: ModeSelectorProps) {
  const t = useT()
  const lang = useSelector((s) => s.settings.lang)
  const active = presets.find((p) => p.id === activeId)

  return (
    <div className="mode-rail" role="group" aria-label={t('modes')}>
      <span className="mode-rail__title label-caps">{t('modes')}</span>
      <div className="mode-rail__scroller">
        {presets.map((p) => {
          const isActive = p.id === activeId
          return (
            <motion.button
              key={p.id}
              type="button"
              className={`mode-chip glass glass--control ${isActive ? 'is-active' : ''} pressable`}
              onClick={() => onSelect(p.id)}
              aria-pressed={isActive}
              whileTap={{ scale: 0.97 }}
              style={
                isActive && p.accent
                  ? ({ ['--chip-accent' as string]: `var(--accent-${p.accent})` } as Record<string, string>)
                  : undefined
              }
            >
              <span className="mode-chip__dot" aria-hidden />
              <span className="mode-chip__label">{labelFor(p)}</span>
              <span className="mode-chip__time num">
                {localizeDigits(p.focusMin, lang)}
                {lang === 'fa' ? '′' : 'm'}
              </span>
            </motion.button>
          )
        })}
      </div>
      <p className="mode-rail__hint text-3">
        {active
          ? active.builtin
            ? t(kindDescKey(active.kind))
            : (active.description ?? t(kindDescKey(active.kind)))
          : ''}
      </p>
    </div>
  )
}
