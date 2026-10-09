import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchJSON, peekApiCache } from '../lib/api';

interface CachedState<T> {
    data: T | null;
    /** Kiedy dane przyszły z serwera (ms) */
    updatedAt: number | null;
    error: unknown;
    /** Pierwsze wczytanie (brak danych do pokazania) */
    loading: boolean;
    /** Odświeżanie w tle (dane już widać) */
    refreshing: boolean;
}

/**
 * Dane z API z pamięcią między stronami: jeśli ten adres był już wczytany, dane widać od razu,
 * a gdy są starsze niż `ttlMs`, odświeżają się w tle (bez loadera). Błąd przy odświeżaniu nie chowa danych.
 * `path = null` — nic nie pobiera (np. brak sezonu).
 */
export function useCachedJSON<T>(path: string | null, ttlMs = 60_000) {
    const initial = (): CachedState<T> => {
        const cached = path ? peekApiCache<T>(path) : undefined;
        return { data: cached?.data ?? null, updatedAt: cached?.at ?? null, error: null, loading: Boolean(path && !cached), refreshing: false };
    };
    const [state, setState] = useState<CachedState<T>>(initial);
    const pathRef = useRef(path);

    const load = useCallback(
        async (force = false) => {
            if (!path) return;
            const cached = peekApiCache<T>(path);
            if (cached) {
                setState((s) => ({ ...s, data: cached.data, updatedAt: cached.at, error: null, loading: false }));
                if (!force && Date.now() - cached.at < ttlMs) return;
                setState((s) => ({ ...s, refreshing: true }));
            } else {
                setState({ data: null, updatedAt: null, error: null, loading: true, refreshing: false });
            }
            try {
                const data = await fetchJSON<T>(path);
                if (pathRef.current !== path) return;
                setState({ data, updatedAt: Date.now(), error: null, loading: false, refreshing: false });
            } catch (error) {
                if (pathRef.current !== path) return;
                // Z danymi z pamięci: zostają na ekranie, błąd tylko gdy nie ma czego pokazać
                setState((s) => ({ ...s, error: s.data == null ? error : null, loading: false, refreshing: false }));
            }
        },
        [path, ttlMs]
    );

    useEffect(() => {
        pathRef.current = path;
        void load();
    }, [path, load]);

    const reload = useCallback(() => load(true), [load]);
    return { ...state, reload };
}
