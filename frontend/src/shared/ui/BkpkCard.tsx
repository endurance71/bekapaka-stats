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
    /** Animacja wejścia (domyślnie wyłączona — treść widać od razu) */
    animateEntrance?: boolean;
}

const paddings = {
    none: 'p-0',
    sm: 'p-2.5 sm:p-4',
    md: 'p-3.5 sm:p-5 md:p-6',
    lg: 'p-4 sm:p-6 md:p-8',
};

const variants = {
    // Digital 2.0: płaska płyta + linia 1 px (bez blur, cienia i zaokrągleń)
    glass: 'bg-bkpk-surface border border-bkpk-border-subtle',
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
    animateEntrance = false,
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
                'relative transition-[transform,border-color,background-color] duration-200',
                !overflowVisible && 'overflow-hidden',
                variants[variant],
                paddings[padding],
                (hoverEffect || onClick) && 'hover:border-bkpk-border-strong hover:bg-bkpk-surface-elevated',
                onClick && 'cursor-pointer',
                className
            )}
            whileHover={!prefersReducedMotion && (hoverEffect || onClick) ? { y: -2 } : undefined}
            whileTap={!prefersReducedMotion && onClick ? { scale: 0.995 } : undefined}
            initial={animateEntrance && !prefersReducedMotion ? { opacity: 0, y: 6 } : false}
            animate={animateEntrance && !prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
            transition={animateEntrance && !prefersReducedMotion ? { duration: 0.25, ease: [0.16, 1, 0.3, 1] } : undefined}
        >
            {(title || icon) && (
                <div className="flex items-center gap-2.5 sm:gap-3 mb-3.5 sm:mb-6 pb-2.5 sm:pb-4 border-b border-bkpk-border-subtle">
                    {icon && <div className="flex items-center justify-center w-9 h-9 border border-bkpk-border-strong text-bkpk-primary shrink-0">{icon}</div>}
                    {title && <h2 className="font-display text-[22px] sm:text-[24px] leading-tight text-bkpk-text-primary">{title}</h2>}
                </div>
            )}
            {children}
        </motion.div>
    );
}

// Re-add default export to maintain compatibility with legacy imports
export default BkpkCard;
