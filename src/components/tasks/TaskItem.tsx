import { memo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Pencil, Play, Timer, Trash2 } from 'lucide-react'

import type { Task } from '../../types'
import { useT } from '../../hooks/useCopy'
import { categoryKey } from '../../i18n'
import { localizeDigits } from '../../utils/format'

interface TaskItemProps {
  task: Task
  active: boolean
  lang: 'fa' | 'en'
  onToggle: (id: string) => void
  /** Clicking the row associates the task with the timer. */
  onActivate: (id: string) => void
  /** The play control starts a focus block for it. */
  onStart: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  /** Compact rows for the narrow side panel. */
  compact?: boolean
}

export const TaskItem = memo(function TaskItem({
  task,
  active,
  lang,
  onToggle,
  onActivate,
  onStart,
  onEdit,
  onDelete,
  compact = false,
}: TaskItemProps) {
  const t = useT()

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: lang === 'fa' ? 16 : -16, height: 0, marginTop: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={`task-item glass glass--control ${task.done ? 'is-done' : ''} ${
        active ? 'is-active' : ''
      } ${compact ? 'task-item--compact' : ''}`}
    >
      <button
        type="button"
        className="task-item__check"
        role="checkbox"
        aria-checked={task.done}
        aria-label={`${t('complete')}: ${task.title}`}
        onClick={() => onToggle(task.id)}
      >
        <span className="task-item__box">
          <AnimatePresence>
            {task.done ? (
              <motion.span
                className="task-item__tick"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 520, damping: 24 }}
              >
                <Check size={13} strokeWidth={3.4} />
              </motion.span>
            ) : null}
          </AnimatePresence>
        </span>
      </button>

      <button
        type="button"
        className="task-item__body"
        onClick={() => onActivate(task.id)}
        title={t('start_timer')}
      >
        <span className="task-item__title">{task.title}</span>
        <span className="task-item__meta">
          <span className="task-item__cat">{t(categoryKey(task.category))}</span>
          <span className="task-item__dot" aria-hidden />
          <span className="num">
            {localizeDigits(task.estimateMin, lang)}
            {lang === 'fa' ? '′' : 'm'}
          </span>
          {task.focusedMin > 0 ? (
            <>
              <span className="task-item__dot" aria-hidden />
              <span className="task-item__focused num">
                <Timer size={11} aria-hidden /> {localizeDigits(Math.round(task.focusedMin), lang)}
              </span>
            </>
          ) : null}
        </span>
      </button>

      <div className="task-item__actions">
        {!task.done ? (
          <button
            type="button"
            className="icon-btn"
            onClick={() => onStart(task.id)}
            aria-label={t('start_timer')}
            title={t('start_timer')}
          >
            <Play size={14} />
          </button>
        ) : null}
        <button
          type="button"
          className="icon-btn"
          onClick={() => onEdit(task)}
          aria-label={t('edit_task')}
          title={t('edit_task')}
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          className="icon-btn icon-btn--danger"
          onClick={() => onDelete(task.id)}
          aria-label={t('delete')}
          title={t('delete')}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {active ? <span className="task-item__pulse" aria-hidden /> : null}
    </motion.li>
  )
})
