import { useEffect, useState } from 'react'
import { Clock as ClockIcon } from 'lucide-react'

import { useSelector } from '../../store/appStore'
import { useT } from '../../hooks/useCopy'
import { localizeDigits } from '../../utils/format'
import type { Lang } from '../../types'

function splitTime(d: Date, lang: Lang): { hm: string; sec: string } {
  const p = (n: number) => String(n).padStart(2, '0')
  return {
    hm: localizeDigits(`${p(d.getHours())}:${p(d.getMinutes())}`, lang),
    sec: localizeDigits(p(d.getSeconds()), lang),
  }
}

/** Solar Hijri weekday + date for Persian, Gregorian for English. */
function formatDate(d: Date, lang: Lang): string {
  try {
    if (lang === 'fa') {
      return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(d)
    }
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(d)
  } catch {
    return new Intl.DateTimeFormat(lang === 'fa' ? 'fa-IR' : 'en-GB', {
      day: 'numeric',
      month: 'short',
    }).format(d)
  }
}

/**
 * Live wall clock for the top bar. Isolated in its own component with a 1s
 * interval, so showing the time never re-renders the rest of the console.
 * It carries no live region — a screen reader should not be told the minute
 * over and over — and it resyncs on focus because browsers throttle timers in
 * background tabs.
 */
export function Clock() {
  const t = useT()
  const lang = useSelector((s) => s.settings.lang)
  const show = useSelector((s) => s.settings.showClock)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const tick = () => setNow(new Date())
    const id = window.setInterval(tick, 1000)
    const resync = () => {
      if (!document.hidden) tick()
    }
    document.addEventListener('visibilitychange', resync)
    window.addEventListener('focus', resync)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', resync)
      window.removeEventListener('focus', resync)
    }
  }, [])

  if (!show) return null

  const { hm, sec } = splitTime(now, lang)

  return (
    <div className="clock glass glass--control">
      <ClockIcon className="clock__icon" size={14} aria-hidden />
      <time className="clock__time num" dateTime={now.toISOString()}>
        <span className="clock__hm">{hm}</span>
        <span className="clock__sec">:{sec}</span>
      </time>
      <span className="clock__divider" aria-hidden />
      <span className="clock__date" aria-hidden>
        {formatDate(now, lang)}
      </span>
      <span className="sr-only">{`${t('clock_label')}: ${hm}:${sec}`}</span>
    </div>
  )
}
