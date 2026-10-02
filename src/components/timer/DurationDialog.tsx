import { useState } from 'react'
import { Clock } from 'lucide-react'

import { Modal } from '../glass/Modal'
import { GlassButton } from '../glass/GlassButton'
import { NumberStepper } from '../glass/Field'
import { useT } from '../../hooks/useCopy'
import { activePreset, useSelector } from '../../store/appStore'
import { localizeDigits } from '../../utils/format'
import { phaseKey } from '../../i18n'
import type { Phase } from '../../types'

interface DurationDialogProps {
  open: boolean
  phase: Phase
  onClose: () => void
  onApply: (minutes: number) => void
}

const QUICK: Record<Phase, number[]> = {
  focus: [15, 25, 45, 60, 90],
  short: [3, 5, 10, 15],
  long: [10, 15, 20, 30],
}

const LIMITS: Record<Phase, { min: number; max: number; step: number }> = {
  focus: { min: 1, max: 240, step: 5 },
  short: { min: 1, max: 120, step: 1 },
  long: { min: 1, max: 120, step: 5 },
}

/**
 * Set a custom length for the phase that is currently selected.
 *
 * The parent mounts this component only while the dialog is open, so the
 * draft value always starts from the preset's current duration — no effect
 * needed to re-seed state.
 */
export function DurationDialog({ open, phase, onClose, onApply }: DurationDialogProps) {
  const t = useT()
  const preset = useSelector(activePreset)
  const lang = useSelector((s) => s.settings.lang)
  const limits = LIMITS[phase]

  const current =
    phase === 'focus' ? preset.focusMin : phase === 'short' ? preset.shortMin : preset.longMin
  const [value, setValue] = useState(current)

  const apply = () => {
    onApply(value)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('duration_title')}
      description={`${t(phaseKey(phase))} · ${t('duration_desc')}`}
      closeLabel={t('close')}
      width={400}
      footer={
        <>
          <GlassButton tone="ghost" onClick={onClose}>
            {t('cancel')}
          </GlassButton>
          <GlassButton tone="primary" onClick={apply}>
            <Clock size={15} />
            <span>{t('duration_apply')}</span>
          </GlassButton>
        </>
      }
    >
      <div className="duration-dialog">
        <div className="duration-dialog__value num">
          {localizeDigits(value, lang)}
          <span className="duration-dialog__unit">{t('minutes_unit')}</span>
        </div>

        <NumberStepper
          label={t('set_duration')}
          value={value}
          onChange={setValue}
          min={limits.min}
          max={limits.max}
          step={limits.step}
        />

        <div className="duration-dialog__quick" role="group" aria-label={t('duration_quick')}>
          <span className="field__label">{t('duration_quick')}</span>
          <div className="chip-row">
            {QUICK[phase].map((min) => (
              <button
                key={min}
                type="button"
                className={`chip ${value === min ? 'is-active' : ''}`}
                aria-pressed={value === min}
                onClick={() => setValue(min)}
              >
                {localizeDigits(min, lang)}
                {lang === 'fa' ? '′' : 'm'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
