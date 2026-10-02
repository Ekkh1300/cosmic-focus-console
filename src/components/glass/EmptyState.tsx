import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  subtitle: string
  action?: ReactNode
}

/** Empty states keep the cosmic voice instead of falling back to stock copy. */
export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <motion.div
      className="empty-state"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="empty-state__halo" aria-hidden />
      <div className="empty-state__icon" aria-hidden>
        {icon}
      </div>
      <p className="empty-state__title">{title}</p>
      <p className="empty-state__sub text-2">{subtitle}</p>
      {action ? <div className="empty-state__action">{action}</div> : null}
    </motion.div>
  )
}
