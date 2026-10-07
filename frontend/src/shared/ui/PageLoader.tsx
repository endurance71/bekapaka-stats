import { cn } from '../lib/utils';

export interface PageLoaderProps {
    label?: string;
    /** Pełna wysokość ekranu (trasa) zamiast bloku w treści. */
    fullScreen?: boolean;
    className?: string;
}

/** Wspólny stan ładowania: trzy paski stroju pulsujące kolejno + etykieta. */
export function PageLoader({ label = 'Ładowanie…', fullScreen = false, className }: PageLoaderProps) {
    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                'flex flex-col items-center justify-center gap-4 text-bkpk-text-muted',
                fullScreen ? 'min-h-[100dvh] bg-bkpk-bg' : 'min-h-[40vh] py-12',
                className
            )}
        >
            <span className="flex items-end gap-1.5" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                    <i
                        key={i}
                        className="block w-1.5 h-6 bg-bkpk-primary animate-pulse"
                        style={{ animationDelay: `${i * 160}ms`, opacity: 0.4 + i * 0.3 }}
                    />
                ))}
            </span>
            <span className="label-caps text-xs">{label}</span>
        </div>
    );
}

export default PageLoader;
