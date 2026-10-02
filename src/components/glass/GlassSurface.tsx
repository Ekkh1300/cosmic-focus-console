import { forwardRef, useCallback, type CSSProperties, type HTMLAttributes, type PointerEvent } from 'react'

export type GlassVariant = 'primary' | 'panel' | 'control' | 'ghost'

export interface GlassSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  variant?: GlassVariant
  /** Adds the soft light bleed used between neighbouring panels. */
  fused?: boolean
  accentTint?: boolean
  radius?: number
  /** Follow the pointer with a moving specular highlight. */
  reactive?: boolean
  style?: CSSProperties
}

/**
 * The material primitive. Every panel in the app is built from this so the
 * optical layers stay consistent across the whole console.
 */
export const GlassSurface = forwardRef<HTMLDivElement, GlassSurfaceProps>(function GlassSurface(
  { variant = 'panel', fused, accentTint, radius, reactive = true, className = '', style, children, onPointerMove, ...rest },
  ref,
) {
  const handleMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (onPointerMove) onPointerMove(e)
      if (!reactive) return
      const el = e.currentTarget
      const rect = el.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 100
      const y = ((e.clientY - rect.top) / Math.max(1, rect.height)) * 100
      el.style.setProperty('--gx', `${x.toFixed(2)}%`)
      el.style.setProperty('--gy', `${y.toFixed(2)}%`)
    },
    [reactive, onPointerMove],
  )

  const classes = [
    'glass',
    variant === 'primary' ? 'glass--primary' : '',
    variant === 'panel' ? 'glass--panel' : '',
    variant === 'control' ? 'glass--control' : '',
    variant === 'ghost' ? 'glass--ghost' : '',
    fused ? 'glass--fused' : '',
    accentTint ? 'glass--accent' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      ref={ref}
      className={classes}
      style={radius != null ? { ...style, borderRadius: radius } : style}
      onPointerMove={handleMove}
      {...rest}
    >
      {children}
    </div>
  )
})
