import { useSelector } from '../store/appStore'
import { translate, type TKey } from '../i18n'

/** Bound translator for the current locale. */
export function useT(): (key: TKey) => string {
  const lang = useSelector((s) => s.settings.lang)
  return (key: TKey) => translate(lang, key)
}

/**
 * Same translator, returned from a differently named hook so components can
 * alias it (`const copy = useCopy()`) when they mix copy with other values.
 */
export const useCopy = useT
