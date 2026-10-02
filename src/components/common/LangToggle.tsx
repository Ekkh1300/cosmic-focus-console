import { Languages } from 'lucide-react'

import { actions, useSelector } from '../../store/appStore'
import { useT } from '../../hooks/useCopy'
import type { Lang } from '../../types'

const LANGS: Lang[] = ['fa', 'en']

/**
 * One-tap language switch in the top bar. Both locales are always complete, so
 * this only has to flip a setting — the whole console (including `dir`) follows
 * through `useAppearance`. Kept out of the settings page on purpose: switching
 * language is something you do in the middle of a session, not once per install.
 */
export function LangToggle() {
  const t = useT()
  const lang = useSelector((s) => s.settings.lang)
  const next: Lang = lang === 'fa' ? 'en' : 'fa'
  const nextLabel = next === 'en' ? t('lang_en') : t('lang_fa')

  return (
    <button
      type="button"
      className="lang-toggle glass glass--control pressable"
      onClick={() => actions.patchSettings({ lang: next })}
      aria-label={`${t('language')}: ${nextLabel}`}
      title={`${t('language')}: ${nextLabel}`}
    >
      <Languages className="lang-toggle__icon" size={14} aria-hidden />
      <span className="lang-toggle__pair" aria-hidden>
        {LANGS.map((code) => (
          <span
            key={code}
            className={`lang-toggle__opt${code === lang ? ' is-active' : ''}`}
          >
            {code === 'fa' ? 'فا' : 'EN'}
          </span>
        ))}
      </span>
    </button>
  )
}