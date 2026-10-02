import { useId, type ReactNode } from 'react'

interface ToggleProps {
  label: ReactNode
  description?: ReactNode
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}

/**
 * Glass switch — physical, keyboard operable, ARIA-correct. The visible label
 * is tied to the control with `aria-labelledby` so it can be rich content.
 */
export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  const labelId = useId()

  return (
    <div className="setting-row">
      <div className="setting-row__text">
        <span className="setting-row__label" id={labelId}>
          {label}
        </span>
        {description ? <span className="setting-row__desc text-3">{description}</span> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        disabled={disabled}
        className={`switch ${checked ? 'is-on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="switch__track">
          <span className="switch__thumb" />
        </span>
      </button>
    </div>
  )
}
