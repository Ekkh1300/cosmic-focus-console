import type { Lang, Phase, Settings } from '../types'

export type NotifyPermissionState = 'unsupported' | 'default' | 'granted' | 'denied'

export function notificationSupport(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function permissionState(): NotifyPermissionState {
  if (!notificationSupport()) return 'unsupported'
  return Notification.permission as NotifyPermissionState
}

export async function requestPermission(): Promise<NotifyPermissionState> {
  if (!notificationSupport()) return 'unsupported'
  try {
    const res = await Notification.requestPermission()
    return res as NotifyPermissionState
  } catch {
    return 'denied'
  }
}

/**
 * Fire a system notification, silently doing nothing when the feature is
 * missing, denied, or the page is focused (an in-app banner covers that case).
 */
export function notify(
  title: string,
  body: string,
  settings: Pick<Settings, 'notifications'>,
  fallback?: () => void,
): void {
  if (!settings.notifications) {
    fallback?.()
    return
  }
  if (!notificationSupport() || Notification.permission !== 'granted') {
    fallback?.()
    return
  }
  try {
    new Notification(title, {
      body,
      tag: 'ty-timer',
      silent: false,
      icon: '/favicon.svg',
    })
  } catch {
    fallback?.()
  }
}

export function completionCopy(phase: Phase, lang: Lang): { title: string; body: string } {
  if (lang === 'en') {
    return phase === 'focus'
      ? { title: 'Focus session complete', body: 'Step away for a short break.' }
      : { title: 'Break finished', body: 'Ready for the next focus block.' }
  }
  return phase === 'focus'
    ? { title: 'جلسه‌ی تمرکز کامل شد', body: 'کمی استراحت کن؛ برمی‌گردیم.' }
    : { title: 'استراحت تمام شد', body: 'آماده‌ی شروع جلسه‌ی بعدی.' }
}
