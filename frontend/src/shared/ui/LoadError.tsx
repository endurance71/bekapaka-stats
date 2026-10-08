import { RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

/**
 * Błąd wczytywania (sieć, serwer) — odróżniony od „brak danych”: komunikat + „Spróbuj ponownie”.
 * `error` = ApiError z `lib/api.ts` (polski komunikat) albo dowolny błąd.
 */
export default function LoadError({
    title = 'Nie udało się wczytać danych',
    error,
    onRetry,
    className
}: {
    title?: string;
    error?: unknown;
    onRetry?: () => void;
    className?: string;
}) {
    const detail = error instanceof Error && error.message ? error.message : 'Sprawdź internet i spróbuj ponownie.';
    return (
        <div role="alert" className={cn('py-12 px-4 text-center bg-bkpk-surface border border-dashed border-bkpk-border-strong', className)}>
            <p className="font-display text-xl uppercase text-bkpk-text-primary">{title}</p>
            <p className="mt-2 text-sm text-bkpk-text-secondary">{detail}</p>
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-4 inline-flex items-center gap-2 min-h-[44px] px-4 border border-bkpk-border-strong label-caps text-xs text-bkpk-text-primary hover:border-bkpk-text-primary"
                >
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    Spróbuj ponownie
                </button>
            )}
        </div>
    );
}
