import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

export interface MobileStatItem {
    label: string;
    value: ReactNode;
    emphasize?: boolean;
}

interface MobileDataCardProps {
    rank?: number | string;
    title: ReactNode;
    subtitle?: ReactNode;
    highlight?: ReactNode;
    leading?: ReactNode;
    stats: MobileStatItem[];
    className?: string;
    accent?: boolean;
    footer?: ReactNode;
}

export function MobileDataCard({
    rank,
    title,
    subtitle,
    highlight,
    leading,
    stats,
    className,
    accent,
    footer
}: MobileDataCardProps) {
    const colCount = stats.length;
    const gridClass =
        colCount <= 2
            ? 'grid-cols-2'
            : colCount === 3
              ? 'grid-cols-3'
              : colCount === 5
                ? 'grid-cols-3'
                : 'grid-cols-4';

    return (
        <div
            className={cn(
                'rounded-xl border border-bkpk-border-strong bg-bkpk-surface-tint-1 p-4',
                accent && 'border-bkpk-primary/30 bg-bkpk-primary/5',
                className
            )}
        >
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {rank != null && (
                        <span className="shrink-0 w-8 h-8 rounded-lg bg-bkpk-surface-tint-4 border border-bkpk-border-subtle flex items-center justify-center text-xs font-black text-bkpk-text-muted tabular-nums">
                            {rank}
                        </span>
                    )}
                    {leading}
                    <div className="min-w-0 flex-1">
                        <div className="font-bold text-bkpk-text-primary text-sm leading-snug break-words">
                            {title}
                        </div>
                        {subtitle ? (
                            <div className="text-[10px] font-bold text-bkpk-text-muted uppercase tracking-wider mt-1 break-words">
                                {subtitle}
                            </div>
                        ) : null}
                    </div>
                </div>
                {highlight ? <div className="shrink-0 text-right">{highlight}</div> : null}
            </div>

            {stats.length > 0 ? (
                <div className={cn('grid gap-2', gridClass)}>
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className={cn(
                                'text-center py-2 px-1 rounded-lg bg-bkpk-surface border border-bkpk-border-subtle',
                                stat.emphasize && 'ring-1 ring-bkpk-primary/25 bg-bkpk-surface-tint-2'
                            )}
                        >
                            <div className="text-[10px] font-bold text-bkpk-text-muted uppercase tracking-wide leading-tight">
                                {stat.label}
                            </div>
                            <div
                                className={cn(
                                    'text-sm font-bold tabular-nums mt-0.5',
                                    stat.emphasize ? 'text-bkpk-primary text-base' : 'text-bkpk-text-primary'
                                )}
                            >
                                {stat.value}
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}

            {footer ? <div className="mt-3 pt-3 border-t border-bkpk-border-subtle">{footer}</div> : null}
        </div>
    );
}

export function MobileDataList({
    children,
    className
}: {
    children: ReactNode;
    className?: string;
}) {
    return <div className={cn('md:hidden space-y-2.5 p-3', className)}>{children}</div>;
}

export function DesktopTableShell({
    children,
    className
}: {
    children: ReactNode;
    className?: string;
}) {
    return <div className={cn('hidden md:block overflow-x-auto', className)}>{children}</div>;
}
