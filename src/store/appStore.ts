import { useRef, useSyncExternalStore } from 'react'

import type {
  Accent,
  PageId,
  Phase,
  Preset,
  SessionLog,
  Settings,
  Task,
  TimerPersist,
} from '../types'
import { dayKey } from '../utils/format'
import { readJSON, storageAvailable, writeJSON } from '../utils/storage'
import { uid } from '../utils/id'
import {
  DEFAULT_DURATIONS,
  MS,
  durationForPhase,
  minutesToMs,
  nextPhase,
  remainingOf,
  sanitizeDuration,
} from '../utils/timerEngine'

/* =========================================================================
   PERSISTED SHAPE
   ========================================================================= */

export interface AppState {
  settings: Settings
  tasks: Task[]
  presets: Preset[]
  sessions: SessionLog[]
  timer: TimerPersist
  page: PageId
}

const KEYS = {
  settings: 'ty.settings.v1',
  tasks: 'ty.tasks.v1',
  presets: 'ty.presets.v1',
  sessions: 'ty.sessions.v1',
  timer: 'ty.timer.v1',
} as const

export const BUILTIN_PRESETS: Preset[] = [
  {
    id: 'pm_pomodoro',
    name: 'pomodoro',
    description: 'mode_pomodoro_d',
    kind: 'pomodoro',
    focusMin: DEFAULT_DURATIONS.focus,
    shortMin: DEFAULT_DURATIONS.short,
    longMin: DEFAULT_DURATIONS.long,
    accent: 'purple',
    builtin: true,
  },
  {
    id: 'pm_deep',
    name: 'deep',
    description: 'mode_deep_d',
    kind: 'deep',
    focusMin: 50,
    shortMin: 10,
    longMin: 20,
    accent: 'blue',
    builtin: true,
  },
  {
    id: 'pm_study',
    name: 'study',
    description: 'mode_study_d',
    kind: 'study',
    focusMin: 45,
    shortMin: 8,
    longMin: 18,
    accent: 'cyan',
    builtin: true,
  },
  {
    id: 'pm_quick',
    name: 'quick',
    description: 'mode_quick_d',
    kind: 'quick',
    focusMin: 15,
    shortMin: 3,
    longMin: 10,
    accent: 'pink',
    builtin: true,
  },
  {
    id: 'pm_custom',
    name: 'custom',
    description: 'mode_custom_d',
    kind: 'custom',
    focusMin: 40,
    shortMin: 8,
    longMin: 15,
    builtin: true,
  },
]

const DEFAULT_SETTINGS: Settings = {
  lang: 'fa',
  theme: 'dark',
  accent: 'purple',
  animations: 'full',
  background: 'planet',
  glass: 'balanced',
  showClock: true,
  sound: true,
  tick: false,
  notifications: false,
  dailyGoalMin: 120,
  longBreakEvery: 4,
  autoStartBreak: false,
  autoStartFocus: false,
}

function defaultTimer(presetId = 'pm_pomodoro'): TimerPersist {
  const preset = BUILTIN_PRESETS.find((p) => p.id === presetId) ?? BUILTIN_PRESETS[0]
  return {
    phase: 'focus',
    durationMs: durationForPhase(preset, 'focus'),
    startedAt: null,
    frozenRemainingMs: durationForPhase(preset, 'focus'),
    running: false,
    status: 'idle',
    presetId: preset.id,
    taskId: null,
    cycleCount: 0,
  }
}

/** Clamp & rehydrate anything that came back from storage. */
function hydrateTimer(raw: unknown, presets: Preset[]): TimerPersist {
  const base = defaultTimer()
  if (!raw || typeof raw !== 'object') return base
  const t = raw as Partial<TimerPersist>
  const phase: Phase = t.phase === 'short' || t.phase === 'long' ? t.phase : 'focus'
  const preset = presets.find((p) => p.id === t.presetId) ?? presets[0] ?? BUILTIN_PRESETS[0]
  const duration =
    Number.isFinite(t.durationMs) && (t.durationMs as number) > 0
      ? Math.min(24 * 60 * MS.m, (t.durationMs as number))
      : durationForPhase(preset, phase)

  const startedAt = typeof t.startedAt === 'number' ? t.startedAt : null
  const running = Boolean(t.running) && startedAt != null
  const frozen =
    typeof t.frozenRemainingMs === 'number' && t.frozenRemainingMs >= 0
      ? t.frozenRemainingMs
      : duration

  const hydrated: TimerPersist = {
    phase,
    durationMs: duration,
    startedAt: running ? startedAt : null,
    frozenRemainingMs: running ? duration : frozen,
    running,
    status: running ? 'running' : t.status === 'completed' ? 'completed' : frozen < duration ? 'paused' : 'idle',
    presetId: preset.id,
    taskId: typeof t.taskId === 'string' ? t.taskId : null,
    cycleCount: Number.isFinite(t.cycleCount) ? Math.max(0, Number(t.cycleCount)) : 0,
  }
  return hydrated
}

function hydrateTasks(raw: unknown): Task[] {
  if (!Array.isArray(raw)) return []
  const out: Task[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const t = item as Partial<Task>
    if (typeof t.title !== 'string' || !t.title.trim()) continue
    out.push({
      id: typeof t.id === 'string' ? t.id : uid('task'),
      title: t.title.slice(0, 160),
      note: typeof t.note === 'string' ? t.note.slice(0, 600) : undefined,
      category: (['study', 'work', 'personal', 'other'] as const).includes(
        t.category as Task['category'],
      )
        ? (t.category as Task['category'])
        : 'other',
      estimateMin: Number.isFinite(t.estimateMin)
        ? Math.min(600, Math.max(1, Math.round(Number(t.estimateMin))))
        : 25,
      done: Boolean(t.done),
      createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now(),
      completedAt: typeof t.completedAt === 'number' ? t.completedAt : undefined,
      focusedMin: Number.isFinite(t.focusedMin) ? Math.max(0, Number(t.focusedMin)) : 0,
    })
  }
  return out
}

function hydratePresets(raw: unknown): Preset[] {
  const list = Array.isArray(raw) ? (raw as Partial<Preset>[]) : []
  const byId = new Map<string, Partial<Preset>>()
  for (const item of list) {
    if (item && typeof item === 'object' && typeof item.id === 'string') byId.set(item.id, item)
  }

  // built-in recipes keep their translated names; only the durations the user
  // edited are restored on top of the defaults
  const clampDur = (v: unknown, fallback: number, max: number) =>
    Number.isFinite(v) ? Math.min(max, Math.max(1, Math.round(Number(v)))) : fallback

  const builtins: Preset[] = BUILTIN_PRESETS.map((base) => {
    const saved = byId.get(base.id)
    if (!saved) return base
    return {
      ...base,
      focusMin: clampDur(saved.focusMin, base.focusMin, 240),
      shortMin: clampDur(saved.shortMin, base.shortMin, 120),
      longMin: clampDur(saved.longMin, base.longMin, 120),
    }
  })

  const custom: Preset[] = []
  for (const item of list) {
    if (!item || typeof item !== 'object') continue
    if (item.builtin) continue
    if (typeof item.name !== 'string' || !item.name.trim()) continue
    custom.push({
      id: typeof item.id === 'string' ? item.id : uid('preset'),
      name: item.name.slice(0, 60),
      description:
        typeof item.description === 'string' ? item.description.slice(0, 200) : undefined,
      kind: 'custom',
      focusMin: clampDur(item.focusMin, 25, 240),
      shortMin: clampDur(item.shortMin, 5, 120),
      longMin: clampDur(item.longMin, 15, 120),
      accent: (['purple', 'blue', 'cyan', 'pink'] as Accent[]).includes(item.accent as Accent)
        ? (item.accent as Accent)
        : undefined,
      builtin: false,
    })
  }
  return [...builtins, ...custom]
}

function hydrateSessions(raw: unknown): SessionLog[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((s): s is SessionLog => Boolean(s) && typeof s === 'object' && 'startedAt' in (s as object))
    .slice(-800)
}

const PAGES: PageId[] = ['timer', 'tasks', 'stats', 'presets', 'settings']

/** Deep links (e.g. #/stats) decide where the app opens. */
function initialPage(): PageId {
  if (typeof window === 'undefined') return 'timer'
  const raw = window.location.hash.replace(/^#\/?/, '')
  return (PAGES as string[]).includes(raw) ? (raw as PageId) : 'timer'
}

function initialState(): AppState {
  const presets = hydratePresets(readJSON(KEYS.presets, null))
  const settings = { ...DEFAULT_SETTINGS, ...readJSON<Partial<Settings>>(KEYS.settings, {}) }
  const tasks = hydrateTasks(readJSON(KEYS.tasks, null))
  const sessions = hydrateSessions(readJSON(KEYS.sessions, null))
  const timer = hydrateTimer(readJSON(KEYS.timer, null), presets)

  // never leave a "running" timer stuck from a previous session — but do carry
  // the elapsed time across, so reopening the page restores the real countdown
  if (timer.running) {
    const remaining = remainingOf(timer, Date.now())
    timer.running = false
    timer.startedAt = null
    timer.frozenRemainingMs = remaining
    timer.status = remaining <= 0 ? 'completed' : remaining < timer.durationMs ? 'paused' : 'idle'
  }

  // drop tasks that the timer still points at
  if (timer.taskId && !tasks.some((t) => t.id === timer.taskId)) timer.taskId = null

  return { settings, tasks, presets, sessions, timer, page: initialPage() }
}

/* =========================================================================
   STORE
   ========================================================================= */

let state: AppState = initialState()
let snapshot: AppState = state
const listeners = new Set<() => void>()

function persist(partial: Partial<AppState>) {
  if (partial.settings) writeJSON(KEYS.settings, partial.settings)
  if (partial.tasks) writeJSON(KEYS.tasks, partial.tasks)
  if (partial.presets) writeJSON(KEYS.presets, partial.presets)
  if (partial.sessions) writeJSON(KEYS.sessions, partial.sessions.slice(-800))
  if (partial.timer) writeJSON(KEYS.timer, partial.timer)
}

export function getState(): AppState {
  return state
}

function setState(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
  const next = typeof patch === 'function' ? patch(state) : patch
  state = { ...state, ...next }
  snapshot = state
  persist(next)
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Whole-state hook. Store writes are rare, so a full re-render is cheap. */
export function useStore(): AppState {
  return useSyncExternalStore(subscribe, () => snapshot, () => snapshot)
}

/**
 * Selector hook. The last value is kept in a ref so selectors that build new
 * objects still return a stable reference when nothing actually changed —
 * otherwise useSyncExternalStore would loop.
 */
export function useSelector<T>(
  selector: (s: AppState) => T,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T {
  const cache = useRef<{ value: T } | null>(null)
  if (cache.current === null) cache.current = { value: selector(state) }

  const getSnapshot = (): T => {
    const next = selector(state)
    const holder = cache.current as { value: T }
    if (isEqual(holder.value, next)) return holder.value
    holder.value = next
    return next
  }

  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return value
}

/* =========================================================================
   ACTIONS
   ========================================================================= */

export const actions = {
  /* ---- navigation ---- */
  setPage(page: PageId) {
    if (state.page !== page) setState({ page })
  },

  /* ---- settings ---- */
  patchSettings(patch: Partial<Settings>) {
    setState({ settings: { ...state.settings, ...patch } })
  },

  /* ---- tasks ---- */
  addTask(input: Partial<Task> & { title: string }): Task {
    const task: Task = {
      id: uid('task'),
      title: input.title.trim().slice(0, 160),
      note: input.note?.trim() ? input.note.trim().slice(0, 600) : undefined,
      category: input.category ?? 'study',
      estimateMin: Math.min(600, Math.max(1, Math.round(input.estimateMin ?? 25))),
      done: false,
      createdAt: Date.now(),
      focusedMin: 0,
    }
    setState({ tasks: [task, ...state.tasks] })
    return task
  },

  updateTask(id: string, patch: Partial<Task>) {
    setState({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })
  },

  toggleTask(id: string) {
    setState({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? { ...t, done: !t.done, completedAt: t.done ? undefined : Date.now() }
          : t,
      ),
    })
  },

  deleteTask(id: string) {
    setState({
      tasks: state.tasks.filter((t) => t.id !== id),
      timer: state.timer.taskId === id ? { ...state.timer, taskId: null } : state.timer,
    })
  },

  clearCompletedTasks() {
    setState({ tasks: state.tasks.filter((t) => !t.done) })
  },

  /* ---- presets ---- */
  savePreset(input: Omit<Preset, 'builtin' | 'id'> & { id?: string }): Preset {
    const preset: Preset = {
      id: input.id ?? uid('preset'),
      name: input.name.trim().slice(0, 60) || 'Custom',
      description: input.description?.trim().slice(0, 200),
      kind: input.kind ?? 'custom',
      focusMin: Math.min(240, Math.max(1, Math.round(input.focusMin))),
      shortMin: Math.min(120, Math.max(1, Math.round(input.shortMin))),
      longMin: Math.min(120, Math.max(1, Math.round(input.longMin))),
      accent: input.accent,
      builtin: false,
    }
    const exists = state.presets.some((p) => p.id === preset.id)
    const presets = exists
      ? state.presets.map((p) => (p.id === preset.id ? preset : p))
      : [...state.presets, preset]
    setState({ presets })

    // editing the active recipe reloads the timer immediately
    if (state.timer.presetId === preset.id) actions.applyPreset(preset.id, true)
    return preset
  },

  /** Built-in recipes stay editable but are never removed from the list. */
  updateBuiltinPreset(id: string, patch: Partial<Pick<Preset, 'focusMin' | 'shortMin' | 'longMin'>>) {
    setState({ presets: state.presets.map((p) => (p.id === id ? { ...p, ...patch } : p)) })
    if (state.timer.presetId === id) actions.applyPreset(id, true)
  },

  deletePreset(id: string) {
    const preset = state.presets.find((p) => p.id === id)
    if (!preset || preset.builtin) return
    const presets = state.presets.filter((p) => p.id !== id)
    setState({ presets })
    if (state.timer.presetId === id) actions.applyPreset('pm_pomodoro', true)
  },

  /* ---- timer ---- */
  applyPreset(id: string, keepRunning = false) {
    const preset = state.presets.find((p) => p.id === id)
    if (!preset) return
    const phase = state.timer.phase
    const durationMs = durationForPhase(preset, phase)
    setState({
      timer: {
        ...state.timer,
        presetId: preset.id,
        durationMs,
        frozenRemainingMs: durationMs,
        startedAt: keepRunning && state.timer.running ? Date.now() : null,
        running: keepRunning ? state.timer.running : false,
        status: keepRunning ? state.timer.status : 'idle',
      },
      settings:
        preset.accent && preset.accent !== state.settings.accent
          ? { ...state.settings, accent: preset.accent }
          : state.settings,
    })
  },

  setPhase(phase: Phase) {
    const preset = state.presets.find((p) => p.id === state.timer.presetId) ?? BUILTIN_PRESETS[0]
    const durationMs = durationForPhase(preset, phase)
    setState({
      timer: {
        ...state.timer,
        phase,
        durationMs,
        frozenRemainingMs: durationMs,
        startedAt: null,
        running: false,
        status: 'idle',
      },
    })
  },

  /**
   * Set a custom duration for the phase currently on screen, on whichever
   * recipe is loaded. The clock restarts with the new length so the ring and
   * the stored duration never disagree.
   */
  setPhaseDuration(rawMinutes: number) {
    const minutes = sanitizeDuration(rawMinutes)
    const phase = state.timer.phase
    const presetId = state.timer.presetId

    const presets = state.presets.map((p) =>
      p.id !== presetId
        ? p
        : {
            ...p,
            focusMin: phase === 'focus' ? minutes : p.focusMin,
            shortMin: phase === 'short' ? minutes : p.shortMin,
            longMin: phase === 'long' ? minutes : p.longMin,
          },
    )

    const ms = minutesToMs(minutes)
    setState({
      presets,
      timer: {
        ...state.timer,
        durationMs: ms,
        frozenRemainingMs: ms,
        startedAt: null,
        running: false,
        status: 'idle',
      },
    })
  },

  setTask(taskId: string | null) {
    setState({ timer: { ...state.timer, taskId } })
  },

  start() {
    const now = Date.now()
    const timer = state.timer
    const remaining =
      timer.status === 'completed'
        ? timer.durationMs
        : timer.running
          ? remainingOf(timer, now)
          : timer.frozenRemainingMs > 0
            ? timer.frozenRemainingMs
            : timer.durationMs

    setState({
      timer: {
        ...timer,
        startedAt: now,
        frozenRemainingMs: remaining,
        running: true,
        status: 'running',
      },
    })
  },

  pause() {
    const now = Date.now()
    if (!state.timer.running) return
    setState({
      timer: {
        ...state.timer,
        frozenRemainingMs: remainingOf(state.timer, now),
        startedAt: null,
        running: false,
        status: 'paused',
      },
    })
  },

  toggle() {
    if (state.timer.running) actions.pause()
    else actions.start()
  },

  reset() {
    setState({
      timer: {
        ...state.timer,
        frozenRemainingMs: state.timer.durationMs,
        startedAt: null,
        running: false,
        status: 'idle',
      },
    })
  },

  /** Jump to the next phase without scoring the current one. */
  skip() {
    actions.advance(false)
  },

  /** Called once when the clock hits zero. */
  complete(now = Date.now()) {
    const timer = state.timer
    const startedAt = timer.startedAt ?? now - timer.durationMs
    const minutes = Math.round(timer.durationMs / MS.m)
    const session: SessionLog = {
      id: uid('sess'),
      startedAt,
      endedAt: now,
      minutes,
      phase: timer.phase,
      taskId: timer.taskId ?? undefined,
      presetId: timer.presetId,
    }

    const cycleCount = timer.phase === 'focus' ? timer.cycleCount + 1 : timer.cycleCount

    setState({
      sessions: [...state.sessions, session],
      timer: {
        ...timer,
        running: false,
        startedAt: null,
        frozenRemainingMs: 0,
        status: 'completed',
        cycleCount,
      },
      tasks: timer.taskId
        ? state.tasks.map((t) =>
            t.id === timer.taskId
              ? { ...t, focusedMin: (t.focusedMin ?? 0) + minutes }
              : t,
          )
        : state.tasks,
    })
  },

  /** Move past the completion banner and load the following phase. */
  advance(autoStart = false) {
    const { timer, settings, presets } = state
    const preset = presets.find((p) => p.id === timer.presetId) ?? BUILTIN_PRESETS[0]
    const phase =
      timer.status === 'completed'
        ? nextPhase(timer.phase, timer.cycleCount, settings.longBreakEvery)
        : timer.phase
    const durationMs = durationForPhase(preset, phase)
    const shouldAuto =
      autoStart ||
      (phase === 'focus' ? settings.autoStartFocus : settings.autoStartBreak)

    setState({
      timer: {
        ...timer,
        phase,
        durationMs,
        frozenRemainingMs: durationMs,
        startedAt: shouldAuto ? Date.now() : null,
        running: shouldAuto,
        status: shouldAuto ? 'running' : 'idle',
      },
    })
  },

  /** Associate a task with the running timer without leaving the current page. */
  focusTask(taskId: string) {
    actions.setTask(taskId)
  },

  /** Attach a task, load focus, start the clock and jump to the console. */
  startTask(taskId: string) {
    actions.setTask(taskId)
    actions.setPhase('focus')
    actions.start()
    actions.setPage('timer')
  },

  /* ---- data ---- */
  resetAll() {
    setState({
      tasks: [],
      presets: [...BUILTIN_PRESETS],
      sessions: [],
      timer: defaultTimer(),
    })
  },
}

/* =========================================================================
   DERIVED HELPERS
   ========================================================================= */

export function activePreset(s: AppState): Preset {
  return s.presets.find((p) => p.id === s.timer.presetId) ?? s.presets[0] ?? BUILTIN_PRESETS[0]
}

export function activeTask(s: AppState): Task | null {
  return s.tasks.find((t) => t.id === s.timer.taskId) ?? null
}

export function storageHealthy(): boolean {
  return storageAvailable
}

export const DEFAULT_TIMER = defaultTimer
export function todaySessionCount(s: AppState): number {
  const key = dayKey(Date.now())
  return s.sessions.filter((s2) => s2.phase === 'focus' && dayKey(s2.startedAt) === key).length
}
