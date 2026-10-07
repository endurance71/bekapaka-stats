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
    primary: 'bkpk-btn-primary border-2 border-transparent text-bkpk-on-primary',
    ghost: 'bg-transparent text-bkpk-text-primary border-2 border-bkpk-border-strong hover:border-bkpk-text-primary hover:bg-bkpk-surface-tint-1',
    outline: 'bg-transparent text-bkpk-text-primary border-2 border-current hover:bg-bkpk-text-primary hover:text-bkpk-bg hover:border-bkpk-text-primary',
    destructive: 'bg-bkpk-danger-fill text-white border-2 border-transparent hover:bg-bkpk-danger-fill-hover active:bg-bkpk-danger-fill-active',
};

const sizes = {
    sm: 'px-4 text-[13px] min-h-[44px]',
    md: 'px-4 sm:px-6 text-[14px] sm:text-[15px] min-h-[48px]',
    lg: 'px-6 sm:px-8 text-[15px] sm:text-base min-h-[56px]',
};

/** Aktywny element przełącznika (segmenty, filtry) — inwersja jak `.segmented` na bekapaka.pl. */
export const bkpkActivePillClass =
    'bg-bkpk-text-primary text-bkpk-bg border border-bkpk-text-primary';

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
                'relative inline-flex items-center justify-center font-text font-semibold uppercase tracking-[0.08em] leading-none transition-colors duration-150 active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden touch-manipulation',
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
                            isPrimary ? 'border-white/30 border-t-white' : 'border-current/30 border-t-current'
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
