/**
 * Przełączniki funkcji panelu z builda (Vite). Domyślnie wyłączone — obraz produkcyjny budowany jest bez nich.
 * Lokalnie: `VITE_PLAYS_ENABLED=true` w frontend/.env.local (backend: `PLAYS_ENABLED=true`).
 */
export function playsEnabledFrom(value: string | undefined | null): boolean {
    return String(value ?? '').trim().toLowerCase() === 'true';
}

/** Zagrywki (zakładka „Zagrywki” w „Drużynie”, tablica i generator). */
export const PLAYS_ENABLED = playsEnabledFrom(import.meta.env.VITE_PLAYS_ENABLED);
