import type { ReactNode } from 'react';
import { cn } from '../lib/utils';
import ScrollableTableHint from './ScrollableTableHint';

interface ScrollableTableShellProps {
    children: ReactNode;
    className?: string;
    hint?: string;
    compact?: boolean;
}

export default function ScrollableTableShell({
    children,
    className,
    hint,
    compact = false
}: ScrollableTableShellProps) {
    return (
        <div
            className={cn(
                'overflow-hidden rounded-xl border border-bkpk-border-strong bg-bkpk-surface',
                className
            )}
        >
            <ScrollableTableHint message={hint} />
            <div
                className={cn(
                    'overflow-x-auto overscroll-x-contain',
                    compact && '[&_table]:text-xs [&_th]:px-2 [&_th]:py-2 [&_td]:px-2 [&_td]:py-2'
                )}
            >
                {children}
            </div>
        </div>
    );
}
