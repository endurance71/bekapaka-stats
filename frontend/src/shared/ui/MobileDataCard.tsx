import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

export interface MobileStatItem {
    label: string;
    value: ReactNode;
    emphasize?: boolean;
    tone?: 'success' | 'danger' | 'muted';
}

interface MobileDataCardProps {
    rank?: number | string;
    title: ReactNode;
    subtitle?: ReactNode;
    highlight?: ReactNode;
    leading?: ReactNode;
    stats: MobileStatItem[];
    /** Liczba kolumn siatki statystyk (domyślnie dopasowana do liczby pól). */
    statsColumns?: 2 | 3 | 4;
    className?: string;
    accent?: boolean;
    footer?: ReactNode;
}

const resolveStatsColumns = (count: number, override?: 2 | 3 | 4): number => {
    if (override) return override;
    if (count <= 1) return 1;
    if (count === 2) return 2;
    if (count === 3) return 3;
    if (count === 4) return 4;
    if (count === 6) return 3;
    if (count % 3 === 0) return 3;
    if (count % 4 === 0) return 4;
    return 3;
};

const chunkStats = <T,>(items: T[], size: number): T[][] => {
    const rows: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
        rows.push(items.slice(i, i + size));
    }
    return rows;
};

const statGridColsClass: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
};

function StatCell({ stat }: { stat: MobileStatItem }) {
    return (
        <div
            className={cn(
                'text-center py-2 px-1 rounded-lg bg-bkpk-surface border border-bkpk-border-subtle min-w-0',
                stat.emphasize && 'ring-1 ring-bkpk-primary/25 bg-bkpk-surface-tint-2'
            )}
        >
            <div className="text-[10px] font-bold text-bkpk-text-muted uppercase tracking-wide leading-tight">
                {stat.label}
            </div>
            <div
                className={cn(
                    'text-sm font-bold tabular-nums mt-0.5',
                    stat.emphasize && !stat.tone && 'text-bkpk-primary text-base',
                    stat.emphasize && stat.tone === 'success' && 'text-bkpk-success text-base',
                    stat.emphasize && stat.tone === 'danger' && 'text-bkpk-danger text-base',
                    stat.emphasize && stat.tone === 'muted' && 'text-bkpk-text-muted text-base',
                    !stat.emphasize && stat.tone === 'success' && 'text-bkpk-success',
                    !stat.emphasize && stat.tone === 'danger' && 'text-bkpk-danger',
                    !stat.emphasize && stat.tone === 'muted' && 'text-bkpk-text-muted',
                    !stat.emphasize && !stat.tone && 'text-bkpk-text-primary'
                )}
            >
                {stat.value}
            </div>
        </div>
    );
}

export function MobileDataCard({
    rank,
    title,
    subtitle,
    highlight,
    leading,
    stats,
    statsColumns,
    className,
    accent,
    footer
}: MobileDataCardProps) {
    const columns = resolveStatsColumns(stats.length, statsColumns);
    const statRows = chunkStats(stats, columns);
    const gridClass = statGridColsClass[columns] ?? 'grid-cols-3';

    return (
        <div
            className={cn(
                'rounded-xl border border-bkpk-border-strong bg-bkpk-surface-tint-1 p-4',
                accent && 'border-bkpk-primary/30 bg-bkpk-primary/5',
                className
            )}
        >
            <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {rank != null && (
                        <span className="shrink-0 w-9 h-9 rounded-lg bg-bkpk-surface border border-bkpk-border-subtle flex items-center justify-center text-xs font-black text-bkpk-text-muted tabular-nums">
                            {rank}
                        </span>
                    )}
                    {leading}
                    <div className="min-w-0 flex-1">
                        <div className="font-bold text-bkpk-text-primary text-sm leading-snug break-words uppercase tracking-tight">
                            {title}
                        </div>
                        {subtitle ? (
                            <div className="text-[10px] font-bold text-bkpk-text-muted uppercase tracking-wider mt-1 break-words">
                                {subtitle}
                            </div>
                        ) : null}
                    </div>
                </div>
                {highlight ? <div className="shrink-0">{highlight}</div> : null}
            </div>

            {stats.length > 0 ? (
                <div className="space-y-2">
                    {statRows.map((row, rowIndex) =>
                        row.length < columns ? (
                            <div key={rowIndex} className="flex justify-center gap-2">
                                {row.map((stat) => (
                                    <div key={stat.label} className="flex-1 max-w-[calc((100%-1rem)/3)]">
                                        <StatCell stat={stat} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div key={rowIndex} className={cn('grid gap-2', gridClass)}>
                                {row.map((stat) => (
                                    <StatCell key={stat.label} stat={stat} />
                                ))}
                            </div>
                        )
                    )}
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
    return <div className={cn('space-y-2.5 p-3', className)}>{children}</div>;
}
