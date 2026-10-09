import { useEffect, useRef, useState } from 'react';
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
    // Podpowiedź „przesuń w bok” tylko wtedy, gdy tabela naprawdę się nie mieści (nie na szerokim ekranie)
    const scrollRef = useRef<HTMLDivElement>(null);
    const [overflows, setOverflows] = useState(false);
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const check = () => setOverflows(el.scrollWidth > el.clientWidth + 1);
        check();
        if (typeof ResizeObserver === 'undefined') return;
        const ro = new ResizeObserver(check);
        ro.observe(el);
        if (el.firstElementChild) ro.observe(el.firstElementChild);
        return () => ro.disconnect();
    }, []);

    return (
        <div
            className={cn(
                'overflow-hidden border border-bkpk-border-subtle bg-bkpk-surface',
                className
            )}
        >
            {overflows && <ScrollableTableHint message={hint} />}
            <div
                ref={scrollRef}
                className={cn(
                    'bkpk-table-shell overflow-x-auto overscroll-x-contain',
                    compact && '[&_table]:text-xs [&_th]:px-2 [&_th]:py-2 [&_td]:px-2 [&_td]:py-2'
                )}
            >
                {children}
            </div>
        </div>
    );
}
