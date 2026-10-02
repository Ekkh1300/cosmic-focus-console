import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCheck, Plus, Search, Sparkle, X } from 'lucide-react'

import { TaskItem } from '../components/tasks/TaskItem'
import { TaskComposer } from '../components/tasks/TaskComposer'
import { PageHeader } from '../components/common/PageHeader'
import { GlassButton } from '../components/glass/GlassButton'
import { EmptyState } from '../components/glass/EmptyState'
import { GlassSurface } from '../components/glass/GlassSurface'
import { SegmentedControl } from '../components/glass/SegmentedControl'
import { useT } from '../hooks/useCopy'
import { actions, useSelector } from '../store/appStore'
import { categoryKey } from '../i18n'
import { localizeDigits } from '../utils/format'
import type { Category, Task } from '../types'

type Filter = 'all' | 'active' | 'done'
type CategoryFilter = 'all' | Category

const CATEGORIES: CategoryFilter[] = ['all', 'study', 'work', 'personal', 'other']

export function TasksPage({ searchRef }: { searchRef?: RefObject<HTMLInputElement | null> }) {
  const t = useT()
  const tasks = useSelector((s) => s.tasks)
  const activeId = useSelector((s) => s.timer.taskId)
  const lang = useSelector((s) => s.settings.lang)

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [composerOpen, setComposerOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const localRef = useRef<HTMLInputElement>(null)
  const inputRef = searchRef ?? localRef

  // "/" shortcut in App focuses this field
  useEffect(() => {
    const onFocusSearch = () => inputRef.current?.focus()
    window.addEventListener('ty:focus-search', onFocusSearch)
    return () => window.removeEventListener('ty:focus-search', onFocusSearch)
  }, [inputRef])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tasks.filter((task) => {
      if (filter === 'active' && task.done) return false
      if (filter === 'done' && !task.done) return false
      if (category !== 'all' && task.category !== category) return false
      if (!q) return true
      return (
        task.title.toLowerCase().includes(q) ||
        (task.note ?? '').toLowerCase().includes(q)
      )
    })
  }, [tasks, query, filter, category])

  const openAdd = () => {
    setEditing(null)
    setComposerOpen(true)
  }
  const openEdit = (task: Task) => {
    setEditing(task)
    setComposerOpen(true)
  }

  const activeCount = tasks.filter((x) => !x.done).length
  const doneCount = tasks.filter((x) => x.done).length

  return (
    <div className="page page--tasks">
      <PageHeader
        title={t('nav_tasks')}
        subtitle={`${localizeDigits(activeCount, lang)} ${t('tasks_left')} · ${localizeDigits(
          doneCount,
          lang,
        )} ${t('done')}`}
        actions={
          <>
            {doneCount > 0 ? (
              <GlassButton tone="ghost" onClick={() => actions.clearCompletedTasks()}>
                <CheckCheck size={16} />
                <span>{t('filter_done')}</span>
              </GlassButton>
            ) : null}
            <GlassButton tone="primary" onClick={openAdd}>
              <Plus size={16} />
              <span>{t('add_task')}</span>
            </GlassButton>
          </>
        }
      />

      <GlassSurface variant="panel" className="tasks-toolbar" radius={20}>
        <div className="search">
          <Search size={16} aria-hidden />
          <input
            ref={inputRef}
            type="search"
            className="search__input"
            placeholder={t('search_ph')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t('search_ph')}
          />
          {query ? (
            <button
              type="button"
              className="search__clear"
              onClick={() => setQuery('')}
              aria-label={t('close')}
            >
              <X size={14} />
            </button>
          ) : null}
        </div>

        <SegmentedControl<Filter>
          ariaLabel={t('filter_all')}
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: t('filter_all') },
            { value: 'active', label: t('filter_active') },
            { value: 'done', label: t('filter_done') },
          ]}
        />

        <div className="chip-row" role="group" aria-label={t('task_category')}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip ${category === c ? 'is-active' : ''}`}
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {c === 'all' ? t('filter_all') : t(categoryKey(c as Category))}
            </button>
          ))}
        </div>
      </GlassSurface>

      {visible.length === 0 ? (
        tasks.length === 0 ? (
          <EmptyState
            icon={<Sparkle size={24} />}
            title={t('empty_tasks')}
            subtitle={t('empty_tasks_sub')}
            action={
              <GlassButton tone="primary" onClick={openAdd}>
                <Plus size={16} />
                <span>{t('add_task')}</span>
              </GlassButton>
            }
          />
        ) : (
          <EmptyState
            icon={<Search size={24} />}
            title={t('no_results')}
            subtitle={t('no_results_sub')}
            action={
              <GlassButton
                tone="secondary"
                onClick={() => {
                  setQuery('')
                  setFilter('all')
                  setCategory('all')
                }}
              >
                {t('filter_all')}
              </GlassButton>
            }
          />
        )
      ) : (
        <motion.ul className="task-list" layout>
          <AnimatePresence initial={false}>
            {visible.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                lang={lang}
                active={task.id === activeId}
                onToggle={actions.toggleTask}
                onActivate={(id) => actions.focusTask(id)}
                onStart={actions.startTask}
                onEdit={openEdit}
                onDelete={actions.deleteTask}
              />
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      <TaskComposer open={composerOpen} editing={editing} onClose={() => setComposerOpen(false)} />
    </div>
  )
}
