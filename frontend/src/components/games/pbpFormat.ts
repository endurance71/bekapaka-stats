import type { PbpEvent, PbpRun } from './kalkMatchTypes';

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
    return `Run ${run.points}:0`;
}

export interface PbpPeriodGroup {
    period: number;
    events: PbpEvent[];
    /** Wynik po okresie (ostatnie zdarzenie okresu, także neutralne). */
    endScore: { home: number; away: number } | null;
}

/**
 * Grupowanie zdarzeń po okresach z filtrami (okres, tylko punkty). Zdarzenia neutralne pomijane.
 * @param period 'all' albo numer okresu
 */
export function groupEventsByPeriod(
    events: PbpEvent[],
    { period = 'all', scoringOnly = false }: { period?: number | 'all'; scoringOnly?: boolean } = {}
): PbpPeriodGroup[] {
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
        if (scoringOnly && !ev.isScoring) continue;
        g.events.push(ev);
    }
    return [...groups.values()].sort((a, b) => a.period - b.period);
}
