import { AnimatePresence } from 'framer-motion'
import { Plus, Sparkle } from 'lucide-react'

import { TaskItem } from './TaskItem'
import { GlassSurface } from '../glass/GlassSurface'
import { GlassButton } from '../glass/GlassButton'
import { EmptyState } from '../glass/EmptyState'
import { useT } from '../../hooks/useCopy'
import { actions, useSelector } from '../../store/appStore'
import { localizeDigits } from '../../utils/format'
import type { Task } from '../../types'

interface TaskPanelProps {
  onAdd: () => void
  onEdit: (task: Task) => void
  onJumpToTasks: () => void
}

/** Floating left rail on the timer page — today's shortlist, always visible. */
export function TaskPanel({ onAdd, onEdit, onJumpToTasks }: TaskPanelProps) {
  const t = useT()
  const tasks = useSelector((s) => s.tasks)
  const activeId = useSelector((s) => s.timer.taskId)
  const lang = useSelector((s) => s.settings.lang)

  const today = tasks.filter((task) => !task.done).slice(0, 7)
  const remaining = today.reduce((sum, task) => sum + task.estimateMin, 0)

  return (
    <GlassSurface variant="panel" className="side-panel task-panel" radius={24}>
      <header className="side-panel__head">
        <div>
          <span className="label-caps">{t('tasks_today')}</span>
          <h2 className="side-panel__title">{t('nav_tasks')}</h2>
        </div>
        <GlassButton tone="ghost" size="sm" iconOnly aria-label={t('add_task')} onClick={onAdd}>
          <Plus size={16} />
        </GlassButton>
      </header>

      <div className="side-panel__meta">
        <span className="num">
          {localizeDigits(today.length, lang)} · {localizeDigits(remaining, lang)}
          {lang === 'fa' ? '′' : 'm'}
        </span>
        <span className="text-3">{t('tasks_left')}</span>
      </div>

      <div className="side-panel__body">
        {today.length === 0 ? (
          <EmptyState
            icon={<Sparkle size={22} />}
            title={t('empty_tasks')}
            subtitle={t('empty_tasks_sub')}
            action={
              <GlassButton tone="primary" size="sm" onClick={onAdd}>
                <Plus size={15} />
                <span>{t('add_task')}</span>
              </GlassButton>
            }
          />
        ) : (
          <ul className="task-list task-list--compact">
            <AnimatePresence initial={false}>
              {today.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  lang={lang}
                  active={task.id === activeId}
                  compact
                  onToggle={actions.toggleTask}
                  onActivate={(id) => actions.focusTask(id)}
                  onStart={actions.startTask}
                  onEdit={onEdit}
                  onDelete={actions.deleteTask}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <footer className="side-panel__foot">
        <button type="button" className="link-btn" onClick={onJumpToTasks}>
          {t('tasks_all')} →
        </button>
      </footer>
    </GlassSurface>
  )
}
