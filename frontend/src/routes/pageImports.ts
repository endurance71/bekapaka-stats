/** Leniwe strony panelu — jedna mapa dla `lazy()` w App i dla wczytywania kodu z wyprzedzeniem. */
export const pageImports = {
    trends: () => import('../pages/Trends'),
    profile: () => import('../pages/Profile'),
    administration: () => import('../pages/Administration'),
    gameCenter: () => import('../pages/GameCenter'),
    gameDetail: () => import('../pages/GameDetail'),
    playerProfile: () => import('../pages/PlayerProfile'),
    league: () => import('../pages/League'),
    scouting: () => import('../pages/ScoutingPage'),
    aiCenter: () => import('../pages/AiCenterPage'),
    team: () => import('../pages/TeamPage'),
    glossary: () => import('../pages/Glossary'),
} as const;

export type PageName = keyof typeof pageImports;

/** Strony, na które zawodnik wchodzi najczęściej — kod ładowany w tle po starcie i przy otwarciu menu. */
export const CORE_PAGES: PageName[] = ['gameCenter', 'gameDetail', 'league', 'team', 'profile', 'playerProfile', 'scouting'];

const requested = new Set<PageName>();

function saveData() {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    return Boolean(conn?.saveData);
}

/** Pobiera kod stron z wyprzedzeniem (raz na stronę; błąd sieci nie przeszkadza — `lazy()` spróbuje ponownie). */
export function prefetchPages(names: PageName[] = CORE_PAGES) {
    if (saveData()) return;
    for (const name of names) {
        if (requested.has(name)) continue;
        requested.add(name);
        pageImports[name]().catch(() => requested.delete(name));
    }
}

/** Jak wyżej, ale gdy przeglądarka nic nie robi (po wyrenderowaniu Startu). */
export function prefetchPagesWhenIdle(names: PageName[] = CORE_PAGES) {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(() => prefetchPages(names), { timeout: 4000 });
    else window.setTimeout(() => prefetchPages(names), 2000);
}
