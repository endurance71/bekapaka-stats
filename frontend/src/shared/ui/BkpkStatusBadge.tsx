import type { ReactNode } from 'react'
import { cn } from '../lib/utils'

export type BkpkStatusBadgeVariant = 'success' | 'danger' | 'warning'

export interface BkpkStatusBadgeProps {
    children: ReactNode
    variant?: BkpkStatusBadgeVariant
    className?: string
}

const variantClasses: Record<BkpkStatusBadgeVariant, string> = {
    success: 'bkpk-status-badge--success',
    danger: 'bkpk-status-badge--danger',
    warning: 'bg-bkpk-warning/15 text-bkpk-warning border border-bkpk-warning/25',
}

/** Semantic status pill with WCAG-safe contrast on tinted backgrounds. */
export default function BkpkStatusBadge({
    children,
    variant = 'success',
    className,
}: BkpkStatusBadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider',
                variantClasses[variant],
                className
            )}
        >
            {children}
        </span>
    )
}
