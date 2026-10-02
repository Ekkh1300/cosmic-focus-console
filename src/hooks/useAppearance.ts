import { useEffect, useState } from 'react'

import { useSelector } from '../store/appStore'

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return true
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function systemPrefersReduced(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Mirrors store settings onto <html> so pure-CSS layers can react. */
export function useAppearance(): void {
  const settings = useSelector((s) => s.settings)
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const dark = settings.theme === 'system' ? systemDark : settings.theme === 'dark'
    root.dataset.theme = dark ? 'dark' : 'light'
    root.dataset.accent = settings.accent
    root.dataset.glass = settings.glass

    // honour the OS reduced-motion switch unless the user explicitly chose "full"
    const reduced = systemPrefersReduced()
    root.dataset.motion =
      settings.animations === 'full' && !reduced
        ? 'full'
        : settings.animations === 'off'
          ? 'off'
          : 'reduced'

    root.lang = settings.lang
    root.dir = settings.lang === 'fa' ? 'rtl' : 'ltr'

    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', dark ? '#05060d' : '#eef1fa')
  }, [settings.theme, settings.accent, settings.glass, settings.animations, settings.lang, systemDark])
}

/** True when heavy motion should be avoided for any reason. */
export function useReducedMotion(): boolean {
  const animations = useSelector((s) => s.settings.animations)
  const [osReduced, setOsReduced] = useState(systemPrefersReduced)

  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (e: MediaQueryListEvent) => setOsReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return animations === 'off' || animations === 'reduced' || osReduced
}
