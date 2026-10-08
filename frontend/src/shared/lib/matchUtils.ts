/** Wspólne pomocnicze dla meczów w panelu (rozpoznanie BeKaPaKa, poziom trudności, formaty dat). */

const BEKAPAKA_KEYWORDS = ['bekapaka', 'bobolice'];

/** Jak `isBekapakaTeamName` w backendzie (backend/kalk/parseMatchBoxScore.js). */
export function isBekapakaName(name?: string | null): boolean {
    const n = (name ?? '').toLowerCase();
    return BEKAPAKA_KEYWORDS.some((k) => n.includes(k));
}

export interface OpponentForm {
    wins?: number | null;
    losses?: number | null;
    /** Bilans BeKaPaKa z tym rywalem (wszystkie sezony) */
    h2h?: { wins: number; losses: number } | null;
}

/**
 * Poziom trudności 1–5 z bilansu rywala w sezonie (% zwycięstw → 1–5), ±1 gdy bilans bezpośredni jest wyraźny.
 * Rywal bez rozegranych meczów → null (nie zgadujemy).
 */
export function difficultyFromOpponent({ wins, losses, h2h }: OpponentForm): 1 | 2 | 3 | 4 | 5 | null {
    const w = wins ?? 0;
    const l = losses ?? 0;
    if (w + l === 0) return null;
    let level = 1 + Math.round(4 * (w / (w + l)));
    if (h2h && h2h.wins + h2h.losses >= 2) {
        if (h2h.wins > h2h.losses) level -= 1;
        else if (h2h.losses > h2h.wins) level += 1;
    }
    return Math.min(5, Math.max(1, level)) as 1 | 2 | 3 | 4 | 5;
}

/** Mecze KALK są w Polsce — czas polski niezależnie od strefy telefonu. */
const MATCH_TZ = 'Europe/Warsaw';

/** „niedz., 18.10.2026” */
export function formatMatchDate(iso: string | Date): string {
    const d = new Date(iso);
    return d.toLocaleDateString('pl-PL', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: MATCH_TZ });
}

/** „14:40” */
export function formatMatchTime(iso: string | Date): string {
    return new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', timeZone: MATCH_TZ });
}
