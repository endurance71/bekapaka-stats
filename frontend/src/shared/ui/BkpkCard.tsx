import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../lib/utils';
import { ReactNode } from 'react';

export interface BkpkCardProps {
    children: ReactNode;
    variant?: 'glass' | 'flat' | 'outline';
    hoverEffect?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    className?: string;
    onClick?: () => void;
    title?: ReactNode;
    icon?: ReactNode;
    overflowVisible?: boolean;
    /** Wyłącz animację wejścia — formularze z inputami nie tracą focusu przy re-renderze */
    animateEntrance?: boolean;
}

const paddings = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-5 sm:p-8',
};

const variants = {
    glass: 'bg-bkpk-glass backdrop-blur-bkpk-glass border border-bkpk-glass-border shadow-bkpk-glow',
    flat: 'bg-bkpk-surface border border-bkpk-border-subtle',
    outline: 'bg-transparent border border-bkpk-border-strong',
};

export function BkpkCard({
    children,
    variant = 'glass',
    hoverEffect = false,
    padding = 'md',
    className,
    onClick,
    title,
    icon,
    overflowVisible = false,
    animateEntrance = true,
}: BkpkCardProps) {
    const prefersReducedMotion = useReducedMotion();
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick();
        }
    };

    return (
        <motion.div
            onClick={onClick}
            onKeyDown={onClick ? handleKeyDown : undefined}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            className={cn(
                'rounded-bkpk-lg transition-[transform,box-shadow,border-color] duration-200',
                !overflowVisible && 'overflow-hidden',
                variants[variant],
                paddings[padding],
                paddings[padding],
                onClick && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bkpk-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bkpk-bg',
                className
            )}
            whileHover={!prefersReducedMotion && (hoverEffect || onClick) ? {
                y: -2,
                scale: 1.005,
                borderColor: 'rgba(236, 167, 44, 0.3)',
                boxShadow: '0 0 15px rgba(236, 167, 44, 0.1)'
            } : undefined}
            whileTap={!prefersReducedMotion && onClick ? { scale: 0.995 } : undefined}
            initial={animateEntrance && !prefersReducedMotion ? { opacity: 0, y: 6 } : false}
            animate={animateEntrance && !prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
            transition={animateEntrance && !prefersReducedMotion ? { duration: 0.25, ease: [0.16, 1, 0.3, 1] } : undefined}
        >
            {(title || icon) && (
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-bkpk-border-strong">
                    {icon && <div className="p-2 rounded-xl bg-bkpk-surface-tint-1 text-bkpk-primary">{icon}</div>}
                    {title && <h2 className="font-outfit text-h3 text-bkpk-text-primary tracking-tight">{title}</h2>}
                </div>
            )}
            {children}
        </motion.div>
    );
}

// Re-add default export to maintain compatibility with legacy imports
export default BkpkCard;
