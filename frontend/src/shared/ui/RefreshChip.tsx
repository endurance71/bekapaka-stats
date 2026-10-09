import { RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

function ago(at: number, now = Date.now()): string {
    const min = Math.floor((now - at) / 60000);
    if (min < 1) return 'przed chwilą';
    if (min < 60) return `${min} min temu`;
    const h = Math.floor(min / 60);
    return `${h} godz. temu`;
}

/**
 * „Zaktualizowano X min temu · ↻” — ręczne odświeżenie (w aplikacji z ekranu głównego nie ma „pociągnij, by odświeżyć”).
 */
export default function RefreshChip({ updatedAt, refreshing, onRefresh, className }: { updatedAt: number | null; refreshing?: boolean; onRefresh: () => void; className?: string }) {
    return (
        <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className={cn(
                'inline-flex items-center gap-1.5 min-h-[44px] -ml-1 px-1 text-xs text-bkpk-text-muted hover:text-bkpk-text-primary disabled:opacity-70 touch-manipulation',
                className
            )}
            aria-label="Odśwież dane"
        >
            <RefreshCw className={cn('w-3.5 h-3.5 shrink-0', refreshing && 'animate-spin')} aria-hidden="true" />
            {refreshing ? 'Odświeżanie…' : updatedAt ? `Zaktualizowano ${ago(updatedAt)}` : 'Odśwież'}
        </button>
    );
}
