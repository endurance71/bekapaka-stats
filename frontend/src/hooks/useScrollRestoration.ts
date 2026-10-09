import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

interface ScrollPos {
    win: number;
    main: number;
}

/** Pozycje przewinięcia per wpis historii (location.key) — żyją do przeładowania strony. */
const positions = new Map<string, ScrollPos>();
const LIMIT = 50;
/** Jak długo czekamy, aż treść urośnie do zapamiętanej wysokości (dane / leniwy kod strony). */
const RESTORE_WINDOW_MS = 1500;

function save(key: string, pos: ScrollPos) {
    positions.delete(key);
    positions.set(key, pos);
    if (positions.size > LIMIT) positions.delete(positions.keys().next().value as string);
}

/**
 * Wstecz (gest / przycisk) wraca w to samo miejsce listy; nowa strona zaczyna się od góry.
 * Zmiana samego `?widok=` nie przewija. Telefon przewija okno, desktop — `<main>`.
 */
export function useScrollRestoration(mainRef: RefObject<HTMLElement | null>) {
    const location = useLocation();
    const navType = useNavigationType();
    const keyRef = useRef(location.key);

    useEffect(() => {
        if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    }, []);

    // Zapisywanie na bieżąco — przed nawigacją, zanim nowa (krótsza) strona przytnie pozycję.
    // Dotknięcie/kliknięcie też zapisuje: nawigacja startuje od stuknięcia w kartę, nawet gdy `scroll` nie zdążył.
    useEffect(() => {
        const main = mainRef.current;
        const record = () => save(keyRef.current, { win: window.scrollY, main: main?.scrollTop ?? 0 });
        window.addEventListener('scroll', record, { passive: true });
        main?.addEventListener('scroll', record, { passive: true });
        document.addEventListener('pointerdown', record, { capture: true, passive: true });
        document.addEventListener('keydown', record, { capture: true, passive: true });
        return () => {
            window.removeEventListener('scroll', record);
            main?.removeEventListener('scroll', record);
            document.removeEventListener('pointerdown', record, { capture: true });
            document.removeEventListener('keydown', record, { capture: true });
        };
    }, [mainRef]);

    useLayoutEffect(() => {
        keyRef.current = location.key;
    }, [location.key]);

    useLayoutEffect(() => {
        const main = mainRef.current;
        const target = navType === 'POP' ? positions.get(location.key) : undefined;
        const apply = (pos: ScrollPos) => {
            window.scrollTo({ top: pos.win, behavior: 'instant' as ScrollBehavior });
            if (main) main.scrollTop = pos.main;
        };
        if (!target || (target.win === 0 && target.main === 0)) {
            apply({ win: 0, main: 0 });
            return;
        }

        // Treść może dojść chwilę później — ponawiamy, aż strona będzie dość wysoka albo użytkownik sam przewinie
        let cancelled = false;
        const started = Date.now();
        const reached = () =>
            Math.abs(window.scrollY - target.win) < 2 && Math.abs((main?.scrollTop ?? 0) - target.main) < 2;
        const stop = () => {
            cancelled = true;
        };
        const tick = () => {
            if (cancelled) return;
            apply(target);
            if (reached() || Date.now() - started > RESTORE_WINDOW_MS) return;
            timer = window.setTimeout(tick, 50);
        };
        let timer = 0;
        tick();
        window.addEventListener('touchstart', stop, { passive: true, once: true });
        window.addEventListener('wheel', stop, { passive: true, once: true });
        return () => {
            stop();
            window.clearTimeout(timer);
            window.removeEventListener('touchstart', stop);
            window.removeEventListener('wheel', stop);
        };
        // Tylko zmiana ścieżki: `?widok=` (zakładki) nie przewija
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);
}

/** Do testów */
export function __resetScrollPositions() {
    positions.clear();
}
