import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Lock, Pencil, Plus, Trash2, Zap } from 'lucide-react'

import { PageHeader } from '../components/common/PageHeader'
import { GlassSurface } from '../components/glass/GlassSurface'
import { GlassButton } from '../components/glass/GlassButton'
import { Modal } from '../components/glass/Modal'
import { EmptyState } from '../components/glass/EmptyState'
import { FieldInput, FieldTextarea, NumberStepper } from '../components/glass/Field'
import { useT } from '../hooks/useCopy'
import { actions, activePreset, useSelector } from '../store/appStore'
import { kindDescKey, kindKey } from '../i18n'
import { localizeDigits } from '../utils/format'
import type { Preset } from '../types'

interface Draft {
  id?: string
  name: string
  description: string
  focusMin: number
  shortMin: number
  longMin: number
}

const EMPTY_DRAFT: Draft = {
  name: '',
  description: '',
  focusMin: 30,
  shortMin: 5,
  longMin: 15,
}

export function PresetsPage() {
  const t = useT()
  const presets = useSelector((s) => s.presets)
  const active = useSelector(activePreset)
  const lang = useSelector((s) => s.settings.lang)

  const [draft, setDraft] = useState<Draft | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Preset | null>(null)

  const openNew = () => setDraft({ ...EMPTY_DRAFT })
  const openEdit = (p: Preset) =>
    setDraft({
      id: p.id,
      name: p.builtin ? t(kindKey(p.kind)) : p.name,
      description: p.builtin ? t(kindDescKey(p.kind)) : (p.description ?? ''),
      focusMin: p.focusMin,
      shortMin: p.shortMin,
      longMin: p.longMin,
    })

  const save = () => {
    if (!draft) return
    if (!draft.name.trim()) return
    const isBuiltin = presets.some((p) => p.id === draft.id && p.builtin)
    if (isBuiltin && draft.id) {
      actions.updateBuiltinPreset(draft.id, {
        focusMin: draft.focusMin,
        shortMin: draft.shortMin,
        longMin: draft.longMin,
      })
    } else {
      actions.savePreset({
        id: draft.id,
        name: draft.name,
        description: draft.description || undefined,
        kind: 'custom',
        focusMin: draft.focusMin,
        shortMin: draft.shortMin,
        longMin: draft.longMin,
        accent: active.accent,
      })
    }
    setDraft(null)
  }

  return (
    <div className="page page--presets">
      <PageHeader
        title={t('presets_title')}
        subtitle={t('presets_sub')}
        actions={
          <GlassButton tone="primary" onClick={openNew}>
            <Plus size={16} />
            <span>{t('new_preset')}</span>
          </GlassButton>
        }
      />

      {presets.length === 0 ? (
        <EmptyState
          icon={<Zap size={24} />}
          title={t('empty_presets')}
          subtitle={t('empty_presets_sub')}
          action={
            <GlassButton tone="primary" onClick={openNew}>
              <Plus size={16} />
              <span>{t('new_preset')}</span>
            </GlassButton>
          }
        />
      ) : (
        <div className="preset-grid">
          {presets.map((p, i) => {
            const isActive = p.id === active.id
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              >
                <GlassSurface
                  variant={isActive ? 'primary' : 'panel'}
                  className={`preset-card card-hover ${isActive ? 'is-active' : ''}`}
                  radius={22}
                >
                  <header className="preset-card__head">
                    <div className="preset-card__title-row">
                      <span className="preset-card__icon" aria-hidden>
                        <Zap size={15} />
                      </span>
                      <h3 className="preset-card__title">
                        {p.builtin ? t(kindKey(p.kind)) : p.name}
                      </h3>
                      {isActive ? (
                        <span className="preset-card__badge">
                          <Check size={11} /> {t('in_use')}
                        </span>
                      ) : null}
                      {p.builtin ? (
                        <span className="preset-card__lock" title={t('builtin')}>
                          <Lock size={11} aria-hidden />
                          <span className="sr-only">{t('builtin')}</span>
                        </span>
                      ) : null}
                    </div>
                    <p className="preset-card__desc text-2">
                      {p.builtin ? t(kindDescKey(p.kind)) : (p.description ?? t(kindDescKey(p.kind)))}
                    </p>
                  </header>

                  <dl className="preset-card__stats">
                    <div>
                      <dt>{t('focus_dur')}</dt>
                      <dd className="num">
                        {localizeDigits(p.focusMin, lang)}
                        {lang === 'fa' ? '′' : 'm'}
                      </dd>
                    </div>
                    <div>
                      <dt>{t('short_dur')}</dt>
                      <dd className="num">
                        {localizeDigits(p.shortMin, lang)}
                        {lang === 'fa' ? '′' : 'm'}
                      </dd>
                    </div>
                    <div>
                      <dt>{t('long_dur')}</dt>
                      <dd className="num">
                        {localizeDigits(p.longMin, lang)}
                        {lang === 'fa' ? '′' : 'm'}
                      </dd>
                    </div>
                  </dl>

                  <footer className="preset-card__actions">
                    <GlassButton
                      tone={isActive ? 'ghost' : 'primary'}
                      size="sm"
                      onClick={() => actions.applyPreset(p.id)}
                      disabled={isActive}
                    >
                      {isActive ? t('in_use') : t('apply_preset')}
                    </GlassButton>
                    <div className="preset-card__icons">
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => openEdit(p)}
                        aria-label={t('edit_preset')}
                        title={t('edit_preset')}
                      >
                        <Pencil size={14} />
                      </button>
                      {!p.builtin ? (
                        <button
                          type="button"
                          className="icon-btn icon-btn--danger"
                          onClick={() => setConfirmDelete(p)}
                          aria-label={t('delete_preset')}
                          title={t('delete_preset')}
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : null}
                    </div>
                  </footer>
                </GlassSurface>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* create / edit */}
      <Modal
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={draft?.id ? t('edit_preset') : t('new_preset')}
        closeLabel={t('close')}
        footer={
          <>
            <GlassButton tone="ghost" onClick={() => setDraft(null)}>
              {t('cancel')}
            </GlassButton>
            <GlassButton tone="primary" onClick={save}>
              {t('save')}
            </GlassButton>
          </>
        }
      >
        {draft ? (
          <div className="form">
            <FieldInput
              label={t('preset_name')}
              name="presetName"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder={t('preset_name_ph')}
              maxLength={60}
              required
            />
            <FieldTextarea
              label={t('preset_desc')}
              name="presetDesc"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder={t('preset_desc_ph')}
              rows={2}
              maxLength={200}
            />
            <div className="form__row">
              <NumberStepper
                label={t('focus_dur')}
                value={draft.focusMin}
                onChange={(v) => setDraft({ ...draft, focusMin: v })}
                min={1}
                max={240}
                step={5}
              />
              <NumberStepper
                label={t('short_dur')}
                value={draft.shortMin}
                onChange={(v) => setDraft({ ...draft, shortMin: v })}
                min={1}
                max={120}
                step={1}
              />
            </div>
            <div className="form__row">
              <NumberStepper
                label={t('long_dur')}
                value={draft.longMin}
                onChange={(v) => setDraft({ ...draft, longMin: v })}
                min={1}
                max={120}
                step={5}
              />
            </div>
          </div>
        ) : null}
      </Modal>

      {/* delete confirmation */}
      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title={t('delete_preset')}
        description={confirmDelete ? `${confirmDelete.name} — ${t('delete_preset_confirm')}` : ''}
        closeLabel={t('close')}
        width={380}
        footer={
          <>
            <GlassButton tone="ghost" onClick={() => setConfirmDelete(null)}>
              {t('cancel')}
            </GlassButton>
            <GlassButton
              tone="danger"
              onClick={() => {
                if (confirmDelete) actions.deletePreset(confirmDelete.id)
                setConfirmDelete(null)
              }}
            >
              {t('confirm')}
            </GlassButton>
          </>
        }
      />
    </div>
  )
}
