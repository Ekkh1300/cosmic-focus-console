export type Lang = 'fa' | 'en'
export type ThemeMode = 'dark' | 'light' | 'system'
export type Accent = 'purple' | 'blue' | 'cyan' | 'pink'
export type AnimLevel = 'full' | 'reduced' | 'off'
export type BackgroundKind = 'planet' | 'nebula' | 'minimal' | 'particles'
export type GlassLevel = 'subtle' | 'balanced' | 'strong'

export type PageId = 'timer' | 'tasks' | 'stats' | 'presets' | 'settings'

export type Category = 'study' | 'work' | 'personal' | 'other'

export type PresetKind = 'pomodoro' | 'deep' | 'study' | 'quick' | 'custom'

/** Which segment of a cycle the timer is on. */
export type Phase = 'focus' | 'short' | 'long'

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed'

export interface Settings {
  lang: Lang
  theme: ThemeMode
  accent: Accent
  animations: AnimLevel
  background: BackgroundKind
  glass: GlassLevel
  showClock: boolean
  sound: boolean
  tick: boolean
  notifications: boolean
  dailyGoalMin: number
  longBreakEvery: number
  autoStartBreak: boolean
  autoStartFocus: boolean
}

export interface Task {
  id: string
  title: string
  note?: string
  category: Category
  estimateMin: number
  done: boolean
  createdAt: number
  completedAt?: number
  /** accumulated focused minutes attributed to this task */
  focusedMin: number
}

/** A saved timer recipe. Built-ins ship with the app and stay editable. */
export interface Preset {
  id: string
  name: string
  description?: string
  kind: PresetKind
  focusMin: number
  shortMin: number
  longMin: number
  accent?: Accent
  builtin: boolean
}

export interface SessionLog {
  id: string
  startedAt: number
  endedAt: number
  minutes: number
  phase: Phase
  taskId?: string
  presetId?: string
}

/** Everything the engine needs to restore a live timer after a reload. */
export interface TimerPersist {
  phase: Phase
  durationMs: number
  /** epoch ms at which the current run began (null when not running) */
  startedAt: number | null
  /** remaining ms frozen at the moment of pause */
  frozenRemainingMs: number
  running: boolean
  status: TimerStatus
  presetId: string
  taskId: string | null
  /** focus sessions finished in the current cycle (drives long-break cadence) */
  cycleCount: number
}

export interface DailyStat {
  date: string
  focusMin: number
  sessions: number
  tasksDone: number
}

export interface DerivedStats {
  todayFocusMin: number
  weekFocusMin: number
  sessions: number
  completedTasks: number
  streak: number
  focusScore: number
  last7: DailyStat[]
}
