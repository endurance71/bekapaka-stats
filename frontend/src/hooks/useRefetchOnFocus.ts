import { useEffect, useRef } from 'react';

/**
 * Ponowne pobranie danych po powrocie do aplikacji (PWA bywa otwarta w tle godzinami — np. wynik sprzed meczu).
 * Nie częściej niż co `minIntervalMs` (domyślnie 5 min), żeby przełączanie aplikacji nie zasypywało serwera.
 */
export function useRefetchOnFocus(refetch: () => void, minIntervalMs = 5 * 60 * 1000) {
    const lastRun = useRef(Date.now());
    const latest = useRef(refetch);
    latest.current = refetch;

    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState !== 'visible') return;
            if (Date.now() - lastRun.current < minIntervalMs) return;
            lastRun.current = Date.now();
            latest.current();
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [minIntervalMs]);
}
