import type { PbpEvent, PbpRun, Side } from './kalkMatchTypes';

/** Zegar meczowy m:ss (pozostały czas kwarty). */
export function formatClock(sec: number | null | undefined): string {
    if (typeof sec !== 'number' || !Number.isFinite(sec) || sec < 0) return '–';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
}

/** Q1–Q4, OT1… */
export function periodShortLabel(period: number): string {
    return period > 4 ? `OT${period - 4}` : `Q${period}`;
}

/** Pełna etykieta okresu do nagłówka listy. */
export function periodLongLabel(period: number): string {
    return period > 4 ? `Dogrywka ${period - 4}` : `Kwarta ${period}`;
}

/** Zdarzenia techniczne (początek/koniec okresu, „na parkiecie”) — nie pokazujemy w liście. */
export function isNeutralEvent(ev: Pick<PbpEvent, 'side' | 'actionType'>): boolean {
    return !ev.side || ev.actionType === 'period_start' || ev.actionType === 'period_end' || ev.actionType === 'on_court';
}

/**
 * Opis akcji bez powtarzania nazwiska; kod KALK „#-2” (pierwsza piątka) zamieniony na słowa.
 * Zgodne z site/app/mecze/MatchPlayByPlay.tsx (describeAction).
 */
export function describeEvent(ev: Pick<PbpEvent, 'actionRaw' | 'actionType' | 'playerName'> & { reboundType?: string | null }): string {
    const action = ev.actionRaw || '';
    if (ev.actionType === 'sub' && /#-\d/.test(action)) return 'Pierwsza piątka';
    if (ev.actionType === 'rebound' && ev.reboundType) {
        if (ev.reboundType === 'O') return 'Zbiórka w ataku';
        if (ev.reboundType === 'D') return 'Zbiórka w obronie';
        if (ev.reboundType === 'TEAM') return 'Zbiórka zespołowa';
    }
    const sub = action.match(/^Zmiana:\s*(.+?)\s*→\s*(.+)$/);
    if (sub) return `Zmiana: ${sub[1]} → ${sub[2]}`;
    if (ev.playerName && action.includes(ev.playerName)) {
        return action.replace(ev.playerName, '').replace(/\s{2,}/g, ' ').trim();
    }
    return action;
}

/** Runy kończące się na danym zdarzeniu (seq → run) — badge „Run 10:0”. */
export function runsByEndSeq(runs: PbpRun[]): Map<number, PbpRun> {
    return new Map(runs.map((r) => [r.endSeq, r]));
}

/** Tekst badge'a runu: punkty serii : 0. */
export function runLabel(run: Pick<PbpRun, 'points'>): string {
    return `Seria ${run.points}:0`;
}

export interface PbpPeriodGroup {
    period: number;
    events: PbpEvent[];
    /** Wynik po okresie (ostatnie zdarzenie okresu, także neutralne). */
    endScore: { home: number; away: number } | null;
}

/** Rodzaje akcji do filtra — jak na bekapaka.pl (`site/app/mecze/MatchPlayByPlay.tsx`), ale po `actionType`. */
export type PbpCategory = 'all' | 'score' | 'miss' | 'rebound' | 'assist' | 'turnover' | 'steal' | 'block' | 'foul' | 'sub';

export const PBP_CATEGORIES: ReadonlyArray<{ key: PbpCategory; label: string }> = [
    { key: 'all', label: 'Wszystkie akcje' },
    { key: 'score', label: 'Punkty' },
    { key: 'miss', label: 'Niecelne rzuty' },
    { key: 'rebound', label: 'Zbiórki' },
    { key: 'assist', label: 'Asysty' },
    { key: 'turnover', label: 'Straty' },
    { key: 'steal', label: 'Przechwyty' },
    { key: 'block', label: 'Bloki' },
    { key: 'foul', label: 'Faule' },
    { key: 'sub', label: 'Zmiany' },
];

const MISS_TYPES = new Set(['shot_missed', 'shot_blocked', 'ft_missed']);

export function matchesPbpCategory(ev: Pick<PbpEvent, 'actionType' | 'isScoring'>, category: PbpCategory): boolean {
    switch (category) {
        case 'all':
            return true;
        case 'score':
            return ev.isScoring;
        case 'miss':
            return MISS_TYPES.has(ev.actionType);
        default:
            return ev.actionType === category;
    }
}

export interface PbpFilter {
    /** 'all' albo numer okresu */
    period?: number | 'all';
    side?: Side | 'all';
    category?: PbpCategory;
    /** @deprecated = category 'score' */
    scoringOnly?: boolean;
}

const passesScope = (ev: PbpEvent, { period = 'all', side = 'all' }: PbpFilter) =>
    (period === 'all' || ev.period === period) && (side === 'all' || ev.side === side);

/** Liczba zdarzeń w każdym rodzaju akcji dla bieżącej kwarty i drużyny (licznik w filtrze). */
export function countPbpCategories(events: PbpEvent[], filter: Pick<PbpFilter, 'period' | 'side'> = {}): Record<PbpCategory, number> {
    const counts = Object.fromEntries(PBP_CATEGORIES.map((c) => [c.key, 0])) as Record<PbpCategory, number>;
    for (const ev of events) {
        if (isNeutralEvent(ev) || !passesScope(ev, filter)) continue;
        for (const { key } of PBP_CATEGORIES) if (matchesPbpCategory(ev, key)) counts[key] += 1;
    }
    return counts;
}

/**
 * Grupowanie zdarzeń po okresach z filtrami (okres, drużyna, rodzaj akcji). Zdarzenia neutralne pomijane;
 * wynik po okresie liczony ze wszystkich zdarzeń okresu.
 */
export function groupEventsByPeriod(events: PbpEvent[], filter: PbpFilter = {}): PbpPeriodGroup[] {
    const { period = 'all', side = 'all' } = filter;
    const category: PbpCategory = filter.category ?? (filter.scoringOnly ? 'score' : 'all');
    const groups = new Map<number, PbpPeriodGroup>();
    for (const ev of events) {
        if (period !== 'all' && ev.period !== period) continue;
        let g = groups.get(ev.period);
        if (!g) {
            g = { period: ev.period, events: [], endScore: null };
            groups.set(ev.period, g);
        }
        g.endScore = { home: ev.scoreHome, away: ev.scoreAway };
        if (isNeutralEvent(ev)) continue;
        if (side !== 'all' && ev.side !== side) continue;
        if (!matchesPbpCategory(ev, category)) continue;
        g.events.push(ev);
    }
    return [...groups.values()].sort((a, b) => a.period - b.period);
}
