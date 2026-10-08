/**
 * Po wdrożeniu stare pliki JS znikają z serwera: aplikacja otwarta z tła nie doczyta kolejnej strony
 * („Failed to fetch dynamically imported module”). Jedno przeładowanie pobiera nową wersję;
 * znacznik w sessionStorage chroni przed pętlą, gdy serwer naprawdę nie działa.
 */
const FLAG = 'bkpk_new_version_reload';
const WINDOW_MS = 30_000;

export function isChunkLoadError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error ?? '');
    return /dynamically imported module|Importing a module script failed|error loading dynamically|Loading chunk|preload/i.test(message);
}

/** true = przeładowanie uruchomione; false = już próbowaliśmy przed chwilą (pokaż ekran błędu). */
export function reloadOnceForNewVersion(now = Date.now(), storage: Pick<Storage, 'getItem' | 'setItem'> = sessionStorage, reload = () => window.location.reload()): boolean {
    try {
        const last = Number(storage.getItem(FLAG) || 0);
        if (last && now - last < WINDOW_MS) return false;
        storage.setItem(FLAG, String(now));
    } catch {
        // brak sessionStorage — przeładuj raz bez znacznika
    }
    reload();
    return true;
}

export function installNewVersionReload() {
    window.addEventListener('vite:preloadError', (event) => {
        if (reloadOnceForNewVersion()) event.preventDefault();
    });
}
