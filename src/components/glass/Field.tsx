import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

interface FieldShellProps {
  label: string
  hint?: string
  htmlFor?: string
  children: ReactNode
  className?: string
}

export function Field({ label, hint, htmlFor, children, className = '' }: FieldShellProps) {
  return (
    <label className={`field ${className}`} htmlFor={htmlFor}>
      <span className="field__label">{label}</span>
      {children}
      {hint ? <span className="field__hint text-3">{hint}</span> : null}
    </label>
  )
}

export interface FieldInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
}

export const FieldInput = forwardRef<HTMLInputElement, FieldInputProps>(function FieldInput(
  { label, hint, id, className = '', ...rest },
  ref,
) {
  const autoId = `f_${rest.name ?? 'x'}_${Math.abs(hash(label))}`
  const fieldId = id ?? autoId
  return (
    <Field label={label} hint={hint} htmlFor={fieldId} className={className}>
      <input ref={ref} id={fieldId} className="input glass glass--ghost" {...rest} />
    </Field>
  )
})

export interface FieldTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  hint?: string
}

export function FieldTextarea({ label, hint, id, className = '', ...rest }: FieldTextareaProps) {
  const autoId = `f_${rest.name ?? 'x'}_${Math.abs(hash(label))}`
  const fieldId = id ?? autoId
  return (
    <Field label={label} hint={hint} htmlFor={fieldId} className={className}>
      <textarea id={fieldId} className="input input--area glass glass--ghost" {...rest} />
    </Field>
  )
}

export interface FieldSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  hint?: string
}

export function FieldSelect({ label, hint, id, className = '', children, ...rest }: FieldSelectProps) {
  const autoId = `f_${rest.name ?? 'x'}_${Math.abs(hash(label))}`
  const fieldId = id ?? autoId
  return (
    <Field label={label} hint={hint} htmlFor={fieldId} className={className}>
      <select id={fieldId} className="input input--select glass glass--ghost" {...rest}>
        {children}
      </select>
    </Field>
  )
}

/** Number stepper with glass controls — nicer than the native spinners. */
export function NumberStepper({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  suffix?: string
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v))
  return (
    <div className="stepper">
      <span className="field__label">{label}</span>
      <div className="stepper__shell glass glass--control">
        <button
          type="button"
          className="stepper__btn"
          aria-label={`${label} −`}
          onClick={() => onChange(clamp(value - step))}
        >
          −
        </button>
        <output className="stepper__value num" aria-live="polite">
          {value}
          {suffix ? <span className="stepper__suffix">{suffix}</span> : null}
        </output>
        <button
          type="button"
          className="stepper__btn"
          aria-label={`${label} +`}
          onClick={() => onChange(clamp(value + step))}
        >
          +
        </button>
      </div>
    </div>
  )
}

function hash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return h
}
