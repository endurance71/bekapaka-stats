import { ChevronRight } from 'lucide-react';

interface ScrollableTableHintProps {
    message?: string;
}

export default function ScrollableTableHint({
    message = 'Przesuń palcem w bok, aby zobaczyć więcej kolumn'
}: ScrollableTableHintProps) {
    return (
        <div className="flex items-center justify-center gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-bkpk-text-muted bg-bkpk-surface-tint-1 border-b border-bkpk-border-subtle">
            <span>{message}</span>
            <ChevronRight className="w-3.5 h-3.5 text-bkpk-primary animate-pulse shrink-0" aria-hidden />
        </div>
    );
}
