import { useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  BellRing,
  Clock,
  Database,
  Keyboard,
  Monitor,
  Palette,
  PlayCircle,
  RotateCcw,
  Sparkles,
  Volume2,
  Waves,
} from 'lucide-react'

import { PageHeader } from '../components/common/PageHeader'
import { GlassSurface } from '../components/glass/GlassSurface'
import { GlassButton } from '../components/glass/GlassButton'
import { Toggle } from '../components/glass/Toggle'
import { FieldInput } from '../components/glass/Field'
import { Modal } from '../components/glass/Modal'
import { useT } from '../hooks/useCopy'
import { actions, useSelector, storageHealthy } from '../store/appStore'
import { permissionState, requestPermission } from '../utils/notify'
import { play } from '../utils/sound'
import type { Accent, AnimLevel, BackgroundKind, GlassLevel, Lang, ThemeMode } from '../types'

interface Choice<T> {
  value: T
  label: string
}

function OptionRow<T extends string>({
  label,
  icon,
  value,
  options,
  onChange,
}: {
  label: string
  icon?: ReactNode
  value: T
  options: Choice<T>[]
  onChange: (v: T) => void
}) {
  return (
    <div className="setting-row setting-row--stack">
      <div className="setting-row__text">
        <span className="setting-row__label">
          {icon ? (
            <span className="setting-row__icon" aria-hidden>
              {icon}
            </span>
          ) : null}
          {label}
        </span>
      </div>
      <div className="option-row" role="radiogroup" aria-label={label}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={value === opt.value}
            className={`option ${value === opt.value ? 'is-active' : ''}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Section({
  title,
  icon,
  children,
  index = 0,
}: {
  title: string
  icon: ReactNode
  children: ReactNode
  index?: number
}) {
  return (
    <motion.section
      className="settings-section"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <GlassSurface variant="panel" className="settings-card" radius={22}>
        <header className="settings-card__head">
          <span className="settings-card__icon" aria-hidden>
            {icon}
          </span>
          <h2 className="settings-card__title">{title}</h2>
        </header>
        <div className="settings-card__body">{children}</div>
      </GlassSurface>
    </motion.section>
  )
}

const SHORTCUTS = [
  { keys: ['Space'], label: 'sc_space' },
  { keys: ['R'], label: 'sc_r' },
  { keys: ['N'], label: 'sc_n' },
  { keys: ['T'], label: 'sc_t' },
  { keys: ['S'], label: 'sc_s' },
  { keys: ['P'], label: 'sc_p' },
  { keys: ['/'], label: 'sc_slash' },
  { keys: ['Esc'], label: 'sc_esc' },
] as const

export function SettingsPage() {
  const t = useT()
  const settings = useSelector((s) => s.settings)
  const [confirmReset, setConfirmReset] = useState(false)
  const [notifState, setNotifState] = useState(permissionState())

  const patch = actions.patchSettings

  const enableNotifications = async () => {
    const res = await requestPermission()
    setNotifState(res)
    if (res === 'granted') patch({ notifications: true })
  }

  return (
    <div className="page page--settings">
      <PageHeader title={t('settings_title')} subtitle={t('settings_sub')} />

      <div className="settings-grid">
        <Section title={t('appearance')} icon={<Palette size={16} />} index={0}>
          <OptionRow<Lang>
            label={t('language')}
            value={settings.lang}
            onChange={(lang) => patch({ lang })}
            options={[
              { value: 'fa', label: t('lang_fa') },
              { value: 'en', label: t('lang_en') },
            ]}
          />
          <OptionRow<ThemeMode>
            label={t('theme')}
            icon={<Monitor size={15} />}
            value={settings.theme}
            onChange={(theme) => patch({ theme })}
            options={[
              { value: 'dark', label: t('theme_dark') },
              { value: 'light', label: t('theme_light') },
              { value: 'system', label: t('theme_system') },
            ]}
          />
          <OptionRow<Accent>
            label={t('accent')}
            value={settings.accent}
            onChange={(accent) => patch({ accent })}
            options={[
              { value: 'purple', label: t('accent_purple') },
              { value: 'blue', label: t('accent_blue') },
              { value: 'cyan', label: t('accent_cyan') },
              { value: 'pink', label: t('accent_pink') },
            ]}
          />
          <OptionRow<GlassLevel>
            label={t('glass_intensity')}
            icon={<Waves size={15} />}
            value={settings.glass}
            onChange={(glass) => patch({ glass })}
            options={[
              { value: 'subtle', label: t('glass_subtle') },
              { value: 'balanced', label: t('glass_balanced') },
              { value: 'strong', label: t('glass_strong') },
            ]}
          />
          <Toggle
            label={
              <>
                <span className="setting-row__icon" aria-hidden>
                  <Clock size={15} />
                </span>
                {t('show_clock')}
              </>
            }
            description={t('show_clock_desc')}
            checked={settings.showClock}
            onChange={(showClock) => patch({ showClock })}
          />
        </Section>

        <Section title={t('animations')} icon={<Sparkles size={16} />} index={1}>
          <OptionRow<AnimLevel>
            label={t('animations')}
            value={settings.animations}
            onChange={(animations) => patch({ animations })}
            options={[
              { value: 'full', label: t('anim_full') },
              { value: 'reduced', label: t('anim_reduced') },
              { value: 'off', label: t('anim_off') },
            ]}
          />
          <OptionRow<BackgroundKind>
            label={t('background')}
            value={settings.background}
            onChange={(background) => patch({ background })}
            options={[
              { value: 'planet', label: t('bg_planet') },
              { value: 'nebula', label: t('bg_nebula') },
              { value: 'particles', label: t('bg_particles') },
              { value: 'minimal', label: t('bg_minimal') },
            ]}
          />
        </Section>

        <Section title={t('sound_section')} icon={<Volume2 size={16} />} index={2}>
          <Toggle
            label={t('sound')}
            checked={settings.sound}
            onChange={(sound) => {
              patch({ sound })
              if (sound) play('start', { ...settings, sound: true })
            }}
          />
          <Toggle
            label={t('tick')}
            checked={settings.tick}
            disabled={!settings.sound}
            onChange={(tick) => patch({ tick })}
          />

          <div className="setting-row">
            <div className="setting-row__text">
              <span className="setting-row__label">
                <span className="setting-row__icon" aria-hidden>
                  {settings.notifications ? <BellRing size={15} /> : <Bell size={15} />}
                </span>
                {t('notifications')}
              </span>
              <span className="setting-row__desc text-3">
                {notifState === 'unsupported'
                  ? t('notif_unsupported')
                  : notifState === 'denied'
                    ? t('notif_denied')
                    : notifState === 'granted'
                      ? t('notif_granted')
                      : t('notif_enable')}
              </span>
            </div>
            <div className="setting-row__control">
              {notifState === 'granted' ? (
                <Toggle
                  label={t('notifications')}
                  checked={settings.notifications}
                  onChange={(notifications) => patch({ notifications })}
                />
              ) : (
                <GlassButton
                  tone="secondary"
                  size="sm"
                  disabled={notifState === 'unsupported'}
                  onClick={enableNotifications}
                >
                  {t('notif_enable')}
                </GlassButton>
              )}
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-row__text">
              <span className="setting-row__label">{t('test_sound')}</span>
            </div>
            <GlassButton tone="ghost" size="sm" onClick={() => play('complete', settings)}>
              <PlayCircle size={15} />
              <span>{t('test_sound')}</span>
            </GlassButton>
          </div>
        </Section>

        <Section title={t('timer_section')} icon={<RotateCcw size={16} />} index={3}>
          <FieldInput
            label={t('daily_goal_min')}
            name="dailyGoal"
            type="number"
            min={10}
            max={720}
            step={10}
            value={settings.dailyGoalMin}
            onChange={(e) => patch({ dailyGoalMin: Math.min(720, Math.max(10, Number(e.target.value) || 10)) })}
            className="num"
          />
          <FieldInput
            label={t('long_break_every')}
            name="longEvery"
            type="number"
            min={2}
            max={10}
            value={settings.longBreakEvery}
            onChange={(e) => patch({ longBreakEvery: Math.min(10, Math.max(2, Number(e.target.value) || 4)) })}
            className="num"
          />
          <Toggle
            label={t('auto_start_break')}
            checked={settings.autoStartBreak}
            onChange={(autoStartBreak) => patch({ autoStartBreak })}
          />
          <Toggle
            label={t('auto_start_focus')}
            checked={settings.autoStartFocus}
            onChange={(autoStartFocus) => patch({ autoStartFocus })}
          />
        </Section>

        <Section title={t('shortcuts')} icon={<Keyboard size={16} />} index={4}>
          <ul className="shortcut-list">
            {SHORTCUTS.map((sc) => (
              <li className="shortcut" key={sc.keys.join('+')}>
                <span className="shortcut__label">{t(sc.label)}</span>
                <span className="shortcut__keys">
                  {sc.keys.map((k) => (
                    <kbd key={k}>{k}</kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t('reset_data')} icon={<Database size={16} />} index={5}>
          <div className="setting-row">
            <div className="setting-row__text">
              <span className="setting-row__label">{t('reset_data')}</span>
              <span className="setting-row__desc text-3">
                {storageHealthy() ? t('offline_ready') : t('storage_off')}
              </span>
            </div>
            <GlassButton tone="danger" size="sm" onClick={() => setConfirmReset(true)}>
              {t('reset_data')}
            </GlassButton>
          </div>
        </Section>
      </div>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title={t('reset_data')}
        description={t('reset_data_confirm')}
        closeLabel={t('close')}
        width={380}
        footer={
          <>
            <GlassButton tone="ghost" onClick={() => setConfirmReset(false)}>
              {t('cancel')}
            </GlassButton>
            <GlassButton
              tone="danger"
              onClick={() => {
                actions.resetAll()
                setConfirmReset(false)
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
