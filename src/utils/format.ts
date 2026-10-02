import type { Lang } from '../types'

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

/** Localise Latin digits when the UI language is Persian. */
export function localizeDigits(value: string | number, lang: Lang = 'fa'): string {
  const str = String(value)
  if (lang !== 'fa') return str
  return str.replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)])
}

/** mm:ss — always zero padded so the readout never reflows. */
export function formatClock(ms: number, lang: Lang = 'fa'): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return localizeDigits(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`, lang)
}

/** 02h 35m style readout. */
export function formatHM(minutes: number, lang: Lang = 'fa'): string {
  const total = Math.max(0, Math.round(minutes))
  const h = Math.floor(total / 60)
  const m = total % 60
  return localizeDigits(`${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`, lang)
}

/** 90 min / ۹۰ دقیقه */
export function formatMinutes(minutes: number, lang: Lang = 'fa'): string {
  const n = localizeDigits(minutes, lang)
  return lang === 'fa' ? `${n} دقیقه` : `${n} min`
}

export function formatDurationLong(minutes: number, lang: Lang = 'fa'): string {
  const total = Math.max(0, Math.round(minutes))
  const h = Math.floor(total / 60)
  const m = total % 60
  if (lang === 'fa') {
    const parts: string[] = []
    if (h) parts.push(`${localizeDigits(h)} ساعت`)
    if (m || !h) parts.push(`${localizeDigits(m)} دقیقه`)
    return parts.join(' و ')
  }
  const parts: string[] = []
  if (h) parts.push(`${h}h`)
  if (m || !h) parts.push(`${m}m`)
  return parts.join(' ')
}

export function formatPercent(value: number, lang: Lang = 'fa'): string {
  return `${localizeDigits(Math.round(value), lang)}٪`.replace('٪٪', '٪')
}

/** Local calendar day key: YYYY-MM-DD in the user's timezone. */
export function dayKey(ts: number): string {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
