import { useEffect, useMemo, useRef, useState } from 'react'
import { Orbit } from 'lucide-react'

import { CosmicBackground } from './components/background/CosmicBackground'
import { SvgDefs } from './components/background/SvgDefs'
import { BottomNav } from './components/navigation/BottomNav'
import { NoticeBanner, type NoticeTone } from './components/common/NoticeBanner'
import { Clock } from './components/common/Clock'
import { LangToggle } from './components/common/LangToggle'
import { TimerPage } from './pages/TimerPage'
import { TasksPage } from './pages/TasksPage'
import { StatisticsPage } from './pages/StatisticsPage'
import { PresetsPage } from './pages/PresetsPage'
import { SettingsPage } from './pages/SettingsPage'

import { useAppearance } from './hooks/useAppearance'
import { useDocumentTitle } from './hooks/useDocumentTitle'
import { useTimerLoop } from './hooks/useClock'
import { useAppShortcuts } from './hooks/useShortcuts'
import { usePointer } from './hooks/usePointer'
import { useCopy } from './hooks/useCopy'
import { useT } from './hooks/useCopy'
import { actions, storageHealthy, useSelector } from './store/appStore'
import { completionCopy, notify } from './utils/notify'
import { play, unlockAudio } from './utils/sound'
import { webglAvailable } from './utils/webgl'
import type { PageId } from './types'

interface Notice {
  id: string
  message: string
  tone: NoticeTone
}

const VALID_PAGES: PageId[] = ['timer', 'tasks', 'stats', 'presets', 'settings']

export default function App() {
  useAppearance()
  useDocumentTitle()
  useTimerLoop()
  usePointer()

  const t = useT()
  const copy = useCopy()
  const page = useSelector((s) => s.page)
  const settings = useSelector((s) => s.settings)
  const timer = useSelector((s) => s.timer)
  const tasks = useSelector((s) => s.tasks)

  const searchRef = useRef<HTMLInputElement>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  const pushNotice = (message: string, tone: NoticeTone = 'info') =>
    setNotice({ id: String(Date.now()), message, tone })

  /* ---- keyboard ---- */
  useAppShortcuts()
  useEffect(() => {
    const onFocusSearch = () => {
      actions.setPage('tasks')
      window.setTimeout(() => {
        searchRef.current?.focus()
        window.dispatchEvent(new Event('ty:focus-search'))
      }, 60)
    }
    window.addEventListener('ty:request-search', onFocusSearch)
    return () => window.removeEventListener('ty:request-search', onFocusSearch)
  }, [])

  /* ---- unlock audio on first gesture ---- */
  useEffect(() => {
    const unlock = () => {
      unlockAudio()
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  /* ---- environment notices (once) ---- */
  useEffect(() => {
    if (!storageHealthy()) pushNotice(copy('storage_off'), 'warn')
    else if (!webglAvailable()) pushNotice(copy('webgl_off'), 'info')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---- react to timer lifecycle: sound + system notification ---- */
  const statusRef = useRef(timer.status)
  useEffect(() => {
    const prev = statusRef.current
    const next = timer.status
    statusRef.current = next
    if (prev === next) return

    if (next === 'running' && prev !== 'running') play('start', settings)
    if (next === 'paused') play('pause', settings)
    if (next === 'completed') {
      play('complete', settings)
      const copyText = completionCopy(timer.phase, settings.lang)
      notify(copyText.title, copyText.body, settings, () => pushNotice(copyText.title, 'info'))
    }
  }, [timer.status, timer.phase, settings])

  /* ---- task completion chime ---- */
  const doneCount = useMemo(() => tasks.filter((task) => task.done).length, [tasks])
  const prevDone = useRef(doneCount)
  useEffect(() => {
    if (doneCount > prevDone.current) play('task', settings)
    prevDone.current = doneCount
  }, [doneCount, settings])

  /* ---- close any overlay via Escape ---- */
  useEffect(() => {
    const onClose = () => setNotice(null)
    window.addEventListener('ty:close-overlay', onClose)
    return () => window.removeEventListener('ty:close-overlay', onClose)
  }, [])

  /* ---- deep links: #/tasks, #/stats, … keep working across reloads ---- */
  useEffect(() => {
    const hash = `#/${page}`
    if (window.location.hash !== hash) window.history.replaceState(null, '', hash)
  }, [page])

  useEffect(() => {
    const onHash = () => {
      const next = window.location.hash.replace(/^#\/?/, '') as PageId
      if (VALID_PAGES.includes(next)) actions.setPage(next)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const pageNode = () => {
    switch (page) {
      case 'tasks':
        return <TasksPage searchRef={searchRef} />
      case 'stats':
        return <StatisticsPage />
      case 'presets':
        return <PresetsPage />
      case 'settings':
        return <SettingsPage />
      case 'timer':
      default:
        return <TimerPage />
    }
  }

  return (
    <div className="shell" data-page={page}>
      <a className="skip-link" href="#main">
        {t('skip_to_content')}
      </a>

      <CosmicBackground />
      <SvgDefs />

      <header className="topbar">
        <div className="brand">
          <span className="brand__mark" aria-hidden>
            <Orbit size={17} />
          </span>
          <span className="brand__text">
            <span className="brand__name">{t('app')}</span>
            <span className="brand__sub">{t('appSub')}</span>
          </span>
        </div>

        <div className="topbar__hud">
          <div className="topbar__status">
            <span className={`pulse-dot ${timer.running ? 'is-on' : ''}`} aria-hidden />
            <span className="topbar__status-text">
              {timer.running
                ? t('running_hint')
                : timer.status === 'paused'
                  ? t('paused_hint')
                  : t('idle_hint')}
            </span>
          </div>
          <LangToggle />
          <Clock />
        </div>
      </header>

      <main id="main" className="stage" tabIndex={-1}>
        {/*
          Navigation is deliberately CSS-animated rather than driven by
          AnimatePresence: the transition must complete even when the browser
          throttles requestAnimationFrame (background tab, occluded window).
        */}
        <div key={page} className="stage__inner page-enter">
          {pageNode()}
        </div>
      </main>

      <BottomNav />

      <NoticeBanner
        id={notice?.id ?? 'none'}
        tone={notice?.tone ?? 'info'}
        message={notice?.message ?? ''}
        onClose={() => setNotice(null)}
      />
    </div>
  )
}
