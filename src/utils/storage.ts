/**
 * Hardened localStorage access. The app must stay usable when storage is
 * blocked (private mode, quota, corrupt payloads).
 */

export const storageAvailable = ((): boolean => {
  try {
    const k = '__ty_probe__'
    window.localStorage.setItem(k, '1')
    window.localStorage.removeItem(k)
    return true
  } catch {
    return false
  }
})()

export function readJSON<T>(key: string, fallback: T): T {
  if (!storageAvailable) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (raw == null) return fallback
    const parsed = JSON.parse(raw) as unknown
    if (parsed === null || typeof parsed !== 'object') return fallback
    return parsed as T
  } catch {
    return fallback
  }
}

export function writeJSON(key: string, value: unknown): boolean {
  if (!storageAvailable) return false
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/** Merge a persisted partial over a full default, ignoring junk types. */
export function merge<T extends object>(base: T, partial: Partial<T> | null | undefined): T {
  if (!partial || typeof partial !== 'object') return base
  const out = { ...base }
  for (const key of Object.keys(base) as (keyof T)[]) {
    const v = partial[key]
    if (v === undefined) continue
    const b = base[key]
    if (typeof b === typeof v || b === null || v === null) {
      ;(out as unknown as Record<string, unknown>)[key as string] = v
    }
  }
  return out
}
