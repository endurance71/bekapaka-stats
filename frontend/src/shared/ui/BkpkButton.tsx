import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { ButtonHTMLAttributes, ReactNode } from 'react';

export interface BkpkButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'ghost' | 'outline' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    className?: string;
}

const variants = {
    primary: 'bkpk-btn-primary border-none text-black hover:shadow-bkpk-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bkpk-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bkpk-bg',
    ghost: 'bg-bkpk-surface-tint-2 text-bkpk-text-primary hover:bg-bkpk-surface-tint-4 border border-bkpk-border-strong backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bkpk-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bkpk-bg',
    outline: 'bg-bkpk-primary/10 border border-bkpk-primary/25 text-bkpk-primary hover:bg-bkpk-primary/15 hover:border-bkpk-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bkpk-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bkpk-bg',
    destructive: 'bg-bkpk-danger-fill text-white hover:bg-bkpk-danger-fill-hover active:bg-bkpk-danger-fill-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bkpk-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bkpk-bg',
};

const sizes = {
    sm: 'px-3 py-1.5 text-sm min-h-[44px]',
    md: 'px-5 py-2.5 text-base min-h-[44px]',
    lg: 'px-8 py-3.5 text-lg min-h-[44px]',
};

/** Shared active/toggle pill style (nav, filters, tabs). */
export const bkpkActivePillClass =
    'bg-bkpk-primary/10 text-bkpk-primary border border-bkpk-primary/25 shadow-[0_0_15px_rgba(236,167,44,0.05)]';

export default function BkpkButton({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    className,
    disabled,
    ...props
}: BkpkButtonProps) {
    const isPrimary = variant === 'primary';

    return (
        <motion.button
            className={cn(
                'relative inline-flex items-center justify-center rounded-bkpk-md font-bold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden',
                variants[variant],
                sizes[size],
                className
            )}
            disabled={disabled || loading}
            {...(props as any)}
        >
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-inherit" aria-hidden="true">
                    <div
                        className={cn(
                            'w-5 h-5 border-2 rounded-full animate-spin',
                            isPrimary ? 'border-black/30 border-t-black' : 'border-white/30 border-t-white'
                        )}
                    />
                </div>
            )}
            <span 
                className={cn(
                    'inline-flex items-center justify-center gap-2',
                    loading && 'opacity-0'
                )}
                aria-live="polite"
            >
                {children}
            </span>
        </motion.button>
    );
}
