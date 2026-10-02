import {
  forwardRef,
  useCallback,
  useRef,
  type ButtonHTMLAttributes,
  type MouseEvent,
} from 'react'

export type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'danger'

export interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ButtonTone
  size?: 'sm' | 'md' | 'lg'
  /** Physical ripple + lift are on by default; disable for static UI. */
  physical?: boolean
  iconOnly?: boolean
}

const toneClass: Record<ButtonTone, string> = {
  primary: 'btn--primary',
  secondary: 'btn--secondary',
  ghost: 'btn--ghost',
  danger: 'btn--danger',
}

const sizeClass: Record<NonNullable<GlassButtonProps['size']>, string> = {
  sm: 'btn--sm',
  md: 'btn--md',
  lg: 'btn--lg',
}

/**
 * Liquid glass button: refraction, soft glow, hover lift, compressive press and
 * a ripple that originates exactly where the pointer landed.
 */
export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(function GlassButton(
  { tone = 'secondary', size = 'md', physical = true, iconOnly, className = '', children, onClick, disabled, ...rest },
  ref,
) {
  const rootRef = useRef<HTMLButtonElement | null>(null)

  const ripple = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    const el = rootRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const span = document.createElement('span')
    const diameter = Math.max(rect.width, rect.height)
    span.className = 'ripple'
    span.style.width = span.style.height = `${diameter}px`
    span.style.left = `${e.clientX - rect.left - diameter / 2}px`
    span.style.top = `${e.clientY - rect.top - diameter / 2}px`
    el.appendChild(span)
    window.setTimeout(() => span.remove(), 640)
  }, [])

  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (physical && !disabled) ripple(e)
      onClick?.(e)
    },
    [physical, disabled, onClick, ripple],
  )

  return (
    <button
      ref={(node) => {
        rootRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }}
      type="button"
      className={[
        'btn',
        `glass glass--control`,
        toneClass[tone],
        sizeClass[size],
        physical ? 'pressable' : '',
        iconOnly ? 'btn--icon' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={handleClick}
      disabled={disabled}
      {...rest}
    >
      <span className="btn__content">{children}</span>
    </button>
  )
})
