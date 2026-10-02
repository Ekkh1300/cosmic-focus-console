import { useEffect, useState } from 'react'

import { Modal } from '../glass/Modal'
import { GlassButton } from '../glass/GlassButton'
import { FieldInput, FieldTextarea, FieldSelect, NumberStepper } from '../glass/Field'
import { useT } from '../../hooks/useCopy'
import { actions, useSelector } from '../../store/appStore'
import type { Category, Task } from '../../types'

interface TaskComposerProps {
  open: boolean
  editing: Task | null
  onClose: () => void
}

/** Create / edit dialog shared by the timer panel and the tasks page. */
export function TaskComposer({ open, editing, onClose }: TaskComposerProps) {
  const t = useT()
  const lang = useSelector((s) => s.settings.lang)

  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [category, setCategory] = useState<Category>('study')
  const [estimate, setEstimate] = useState(25)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(editing?.title ?? '')
    setNote(editing?.note ?? '')
    setCategory(editing?.category ?? 'study')
    setEstimate(editing?.estimateMin ?? 25)
    setError(false)
  }, [open, editing])

  const submit = () => {
    if (!title.trim()) {
      setError(true)
      return
    }
    if (editing) {
      actions.updateTask(editing.id, {
        title: title.trim(),
        note: note.trim() || undefined,
        category,
        estimateMin: estimate,
      })
    } else {
      actions.addTask({ title, note, category, estimateMin: estimate })
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? t('edit_task') : t('add_task')}
      closeLabel={t('close')}
      footer={
        <>
          <GlassButton tone="ghost" onClick={onClose}>
            {t('cancel')}
          </GlassButton>
          <GlassButton tone="primary" onClick={submit}>
            {t('save')}
          </GlassButton>
        </>
      }
    >
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <FieldInput
          label={t('task_title')}
          name="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            if (error) setError(false)
          }}
          placeholder={t('task_title_ph')}
          maxLength={160}
          autoComplete="off"
          aria-invalid={error}
          required
        />
        {error ? (
          <p className="form__error" role="alert">
            {lang === 'fa' ? 'عنوان وظیفه را وارد کن.' : 'Please enter a task title.'}
          </p>
        ) : null}

        <FieldTextarea
          label={t('task_note')}
          name="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('task_note_ph')}
          rows={3}
          maxLength={600}
        />

        <div className="form__row">
          <FieldSelect
            label={t('task_category')}
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          >
            <option value="study">{t('cat_study')}</option>
            <option value="work">{t('cat_work')}</option>
            <option value="personal">{t('cat_personal')}</option>
            <option value="other">{t('cat_other')}</option>
          </FieldSelect>

          <NumberStepper
            label={t('task_estimate')}
            value={estimate}
            onChange={setEstimate}
            min={1}
            max={480}
            step={5}
            suffix={lang === 'fa' ? '′' : 'm'}
          />
        </div>
      </form>
    </Modal>
  )
}
