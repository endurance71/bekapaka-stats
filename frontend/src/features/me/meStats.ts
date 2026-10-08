import { isBekapakaName } from '../../shared/lib/matchUtils';

/** Wpis `gameLog` z GET /api/players/:id/stats (backend/dataStore.js → gameLogEntryFromKalkStats). */
export interface GameLogEntry {
    gameId: string;
    date: string | null;
    opponent: string;
    pts: number;
    reb: number;
    ast: number;
    stl: number;
    blk: number;
    tov: number;
    fgm: number;
    fga: number;
    three_pm: number;
    three_pa: number;
    ftm: number;
    fta: number;
    eval?: number | null;
}

export type GoalStat = 'ppg' | 'rpg' | 'apg' | 'spg' | 'bpg' | 'evalAvg' | 'fgPct' | 'threePct' | 'ftPct' | 'tovPg';
export interface Goal { stat: GoalStat; target: number }
export interface Goals { items: Goal[]; updatedAt?: string | null; updatedBy?: 'player' | 'coach' | null }

/** Te same klucze i zakresy co backend/lib/playerGoals.js (GOAL_STATS). */
export const GOAL_OPTIONS: Record<GoalStat, { label: string; min: number; max: number; pct?: boolean; lowerIsBetter?: boolean }> = {
    ppg: { label: 'Punkty na mecz', min: 0, max: 60 },
    rpg: { label: 'Zbiórki na mecz', min: 0, max: 30 },
    apg: { label: 'Asysty na mecz', min: 0, max: 20 },
    spg: { label: 'Przechwyty na mecz', min: 0, max: 10 },
    bpg: { label: 'Bloki na mecz', min: 0, max: 10 },
    evalAvg: { label: 'Eval na mecz', min: -10, max: 60 },
    fgPct: { label: 'Skuteczność z gry', min: 0, max: 100, pct: true },
    threePct: { label: 'Skuteczność za 3', min: 0, max: 100, pct: true },
    ftPct: { label: 'Skuteczność wolnych', min: 0, max: 100, pct: true },
    tovPg: { label: 'Straty na mecz (mniej = lepiej)', min: 0, max: 15, lowerIsBetter: true }
};
export const MAX_GOALS = 5;

const pct = (made: number, att: number) => (att > 0 ? Math.round((made / att) * 1000) / 10 : null);
const avg = (total: number, n: number) => (n > 0 ? Math.round((total / n) * 10) / 10 : null);

/** Średnie sezonu dla celów — z meczów zawodnika (procenty z sumy rzutów, nie średnia procentów). */
export function seasonValues(gameLog: GameLogEntry[]): Record<GoalStat, number | null> & { games: number } {
    const n = gameLog.length;
    const sum = (k: keyof GameLogEntry) => gameLog.reduce((acc, g) => acc + (Number(g[k]) || 0), 0);
    const evalGames = gameLog.filter((g) => typeof g.eval === 'number');
    return {
        games: n,
        ppg: avg(sum('pts'), n),
        rpg: avg(sum('reb'), n),
        apg: avg(sum('ast'), n),
        spg: avg(sum('stl'), n),
        bpg: avg(sum('blk'), n),
        tovPg: avg(sum('tov'), n),
        evalAvg: avg(evalGames.reduce((a, g) => a + (g.eval as number), 0), evalGames.length),
        fgPct: pct(sum('fgm'), sum('fga')),
        threePct: pct(sum('three_pm'), sum('three_pa')),
        ftPct: pct(sum('ftm'), sum('fta'))
    };
}

/** Postęp celu 0–100 %. Straty: cel osiągnięty, gdy średnia ≤ cel. */
export function goalProgress(goal: Goal, current: number | null) {
    const spec = GOAL_OPTIONS[goal.stat];
    if (current == null) return { current: null, percent: 0, done: false };
    if (spec.lowerIsBetter) {
        const done = current <= goal.target;
        const percent = done ? 100 : current > 0 ? Math.max(0, Math.round((goal.target / current) * 100)) : 100;
        return { current, percent, done };
    }
    const span = goal.target - spec.min;
    const percent = span > 0 ? Math.max(0, Math.min(100, Math.round(((current - spec.min) / span) * 100))) : 100;
    return { current, percent, done: current >= goal.target };
}

interface CareerRowLike {
    seasonId: string | null;
    seasonSlug: string | null;
    seasonLabel: string | null;
    teamName: string;
    games: number;
    perGame: { pts: number | null; reb: number | null; ast: number | null; eval: number | null };
    pct: { fg: number | null; three: number | null; ft: number | null };
}

/** Wiersz BeKaPaKa wybranego sezonu i poprzedniego sezonu w BeKaPaKa (z Kariery). */
export function seasonVsPrevious<T extends CareerRowLike>(rows: T[], seasonId: string | null | undefined) {
    const ours = rows
        .filter((r) => isBekapakaName(r.teamName) && r.games > 0)
        .sort((a, b) => (a.seasonSlug || '').localeCompare(b.seasonSlug || ''));
    const idx = ours.findIndex((r) => r.seasonId === seasonId);
    if (idx < 0) return { current: null, previous: null };
    return { current: ours[idx], previous: idx > 0 ? ours[idx - 1] : null };
}

/** Miejsce zawodnika w rankingu (1 = najlepszy); null gdy brak na liście. */
export function rankOf<T>(list: T[], isMe: (row: T) => boolean, value: (row: T) => number | null | undefined) {
    const sorted = list.filter((r) => value(r) != null).sort((a, b) => (value(b) as number) - (value(a) as number));
    const i = sorted.findIndex(isMe);
    return i < 0 ? null : { rank: i + 1, of: sorted.length };
}

/** Skuteczność rzutów mecz po meczu (od najstarszego); null = brak prób w meczu. */
export function shootingSeries(gameLog: GameLogEntry[]) {
    return [...gameLog]
        .sort((a, b) => String(a.date ?? '').localeCompare(String(b.date ?? '')))
        .map((g) => ({
            gameId: g.gameId,
            date: g.date,
            opponent: g.opponent,
            fg: pct(g.fgm, g.fga),
            three: pct(g.three_pm, g.three_pa),
            ft: pct(g.ftm, g.fta)
        }));
}
