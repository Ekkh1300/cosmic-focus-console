import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

/** Shared header so every page opens with the same rhythm. */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <motion.header
      className="page-header"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="page-header__text">
        <h1 className="page-header__title">{title}</h1>
        {subtitle ? <p className="page-header__sub text-2">{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </motion.header>
  )
}
