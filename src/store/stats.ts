import type { DailyStat, DerivedStats, SessionLog, Settings, Task } from '../types'
import { clamp, dayKey } from '../utils/format'

function emptyDay(date: string): DailyStat {
  return { date, focusMin: 0, sessions: 0, tasksDone: 0 }
}

/** Aggregate the raw session log into the numbers the UI shows. */
export function deriveStats(
  sessions: SessionLog[],
  tasks: Task[],
  settings: Settings,
  now = Date.now(),
): DerivedStats {
  const today = dayKey(now)

  const focusSessions = sessions.filter((s) => s.phase === 'focus')

  // --- last 7 days (oldest first) ---
  const last7: DailyStat[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    last7.push(emptyDay(dayKey(d.getTime())))
  }
  const byDate = new Map<string, DailyStat>(last7.map((d) => [d.date, d]))

  for (const s of focusSessions) {
    const key = dayKey(s.startedAt)
    const bucket = byDate.get(key)
    if (bucket) {
      bucket.focusMin += s.minutes
      bucket.sessions += 1
    }
  }

  // completed tasks attributed to their completion day (fall back to creation)
  for (const t of tasks) {
    if (!t.done) continue
    const key = dayKey(t.completedAt ?? t.createdAt)
    const bucket = byDate.get(key)
    if (bucket) bucket.tasksDone += 1
  }

  const todayFocusMin = focusSessions
    .filter((s) => dayKey(s.startedAt) === today)
    .reduce((sum, s) => sum + s.minutes, 0)

  const weekFocusMin = last7.reduce((sum, d) => sum + d.focusMin, 0)

  // --- streak: consecutive days (ending today or yesterday) with focus time ---
  const activeDays = new Set(
    focusSessions.filter((s) => s.minutes > 0).map((s) => dayKey(s.startedAt)),
  )
  let streak = 0
  const cursor = new Date(now)
  if (!activeDays.has(dayKey(now))) cursor.setDate(cursor.getDate() - 1)
  while (activeDays.has(dayKey(cursor.getTime()))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  // --- focus score: goal attainment (70%) + task follow-through (30%) ---
  const goal = Math.max(1, settings.dailyGoalMin)
  const goalPart = clamp(todayFocusMin / goal, 0, 1)
  const todayTasks = tasks.filter(
    (t) => dayKey(t.completedAt ?? t.createdAt) === today || (!t.done && dayKey(t.createdAt) === today),
  )
  const taskPart = todayTasks.length
    ? todayTasks.filter((t) => t.done).length / todayTasks.length
    : clamp(todayFocusMin / goal, 0, 1)
  const focusScore = Math.round(clamp(goalPart * 0.7 + taskPart * 0.3, 0, 1) * 100)

  const completedTasks = tasks.filter((t) => t.done).length

  return {
    todayFocusMin,
    weekFocusMin,
    sessions: focusSessions.length,
    completedTasks,
    streak,
    focusScore,
    last7,
  }
}

/**
 * Minutes actually attributed to each category — only real focus time counts,
 * never the estimate, so the chart never claims work that did not happen.
 */
export function categoryMinutes(tasks: Task[]): { category: Task['category']; minutes: number }[] {
  const map = new Map<Task['category'], number>()
  for (const t of tasks) {
    if (!t.focusedMin) continue
    map.set(t.category, (map.get(t.category) ?? 0) + t.focusedMin)
  }
  return [...map.entries()]
    .map(([category, minutes]) => ({ category, minutes }))
    .sort((a, b) => b.minutes - a.minutes)
}
