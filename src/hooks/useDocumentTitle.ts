import { useEffect, useState } from 'react'

import { useSelector } from '../store/appStore'
import { useClockSubscription } from './useClock'
import { formatClock } from '../utils/format'
import { pageKey, translate, type TKey } from '../i18n'

/** Browser tab shows a live countdown while the timer runs. */
export function useDocumentTitle(): void {
  const lang = useSelector((s) => s.settings.lang)
  const running = useSelector((s) => s.timer.running)
  const frozen = useSelector((s) => s.timer.frozenRemainingMs)
  const page = useSelector((s) => s.page)
  const app = useSelector((s) => translate(s.settings.lang, 'app'))

  const [clock, setClock] = useState(() => formatClock(frozen, lang))
  useClockSubscription((f) => {
    const next = formatClock(f.remaining, lang)
    setClock((prev) => (prev === next ? prev : next))
  })

  useEffect(() => {
    const base = `${app} · ${translate(lang, pageKey(page) as TKey)}`
    document.title = running ? `${clock} — ${base}` : base
  }, [running, clock, lang, page, app])
}
