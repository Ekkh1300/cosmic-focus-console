/** Compact unique id — good enough for localStorage records. */
export function uid(prefix = 'id'): string {
  const rand = Math.random().toString(36).slice(2, 9)
  return `${prefix}_${Date.now().toString(36)}${rand}`
}
