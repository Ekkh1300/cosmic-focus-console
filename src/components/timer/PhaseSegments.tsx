import { SegmentedControl } from '../glass/SegmentedControl'
import { useT } from '../../hooks/useCopy'
import { localizeDigits } from '../../utils/format'
import { useSelector, activePreset } from '../../store/appStore'
import type { Phase } from '../../types'

/** Focus / Short / Long selector with each duration shown inline. */
export function PhaseSegments({ onChange }: { onChange: (p: Phase) => void }) {
  const t = useT()
  const phase = useSelector((s) => s.timer.phase)
  const preset = useSelector(activePreset)
  const lang = useSelector((s) => s.settings.lang)

  return (
    <SegmentedControl<Phase>
      ariaLabel={t('phase_focus')}
      value={phase}
      onChange={onChange}
      options={[
        {
          value: 'focus',
          label: t('phase_focus'),
          hint: `${localizeDigits(preset.focusMin, lang)}′`,
        },
        {
          value: 'short',
          label: t('phase_short'),
          hint: `${localizeDigits(preset.shortMin, lang)}′`,
        },
        {
          value: 'long',
          label: t('phase_long'),
          hint: `${localizeDigits(preset.longMin, lang)}′`,
        },
      ]}
    />
  )
}
