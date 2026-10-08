import { describe, expect, it } from 'vitest';
import { goalProgress, rankOf, seasonValues, seasonVsPrevious, shootingSeries, type GameLogEntry } from './meStats';
import { calendarLinks } from '../match/MatchDayCard';

const g = (date: string, o: Partial<GameLogEntry> = {}): GameLogEntry => ({
    gameId: date, date, opponent: 'X', pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, tov: 0,
    fgm: 0, fga: 0, three_pm: 0, three_pa: 0, ftm: 0, fta: 0, eval: null, ...o
});

describe('strona „Ja”', () => {
    it('średnie sezonu: procenty z sumy rzutów, Eval tylko z meczów z wartością', () => {
        const v = seasonValues([g('2026-10-04', { pts: 10, fgm: 4, fga: 10, ftm: 2, fta: 2, eval: 12 }), g('2026-10-11', { pts: 6, fgm: 3, fga: 5, tov: 3 })]);
        expect(v).toMatchObject({ games: 2, ppg: 8, fgPct: 46.7, ftPct: 100, threePct: null, tovPg: 1.5, evalAvg: 12 });
    });

    it('postęp celu; straty — mniej znaczy lepiej', () => {
        expect(goalProgress({ stat: 'ppg', target: 10 }, 8)).toEqual({ current: 8, percent: 80, done: false });
        expect(goalProgress({ stat: 'ppg', target: 10 }, 12)).toMatchObject({ percent: 100, done: true });
        expect(goalProgress({ stat: 'tovPg', target: 2 }, 4)).toMatchObject({ percent: 50, done: false });
        expect(goalProgress({ stat: 'tovPg', target: 2 }, 1.5)).toMatchObject({ percent: 100, done: true });
        expect(goalProgress({ stat: 'ftPct', target: 70 }, null)).toMatchObject({ current: null, done: false });
    });

    it('sezon vs poprzedni tylko z wierszy BeKaPaKa', () => {
        const row = (seasonId: string, seasonSlug: string, teamName: string, games = 5) => ({
            seasonId, seasonSlug, seasonLabel: seasonSlug, teamName, games,
            perGame: { pts: 1, reb: 1, ast: 1, eval: 1 }, pct: { fg: null, three: null, ft: null }
        });
        const rows = [row('s3', '2025-26', 'BeKaPaKa Bobolice'), row('s4', '2026-27', 'BeKaPaKa Bobolice'), row('s4', '2026-27', 'Inna drużyna'), row('s2', '2024-25', 'Inna drużyna')];
        const r = seasonVsPrevious(rows, 's4');
        expect(r.current?.seasonId).toBe('s4');
        expect(r.current?.teamName).toBe('BeKaPaKa Bobolice');
        expect(r.previous?.seasonId).toBe('s3');
        expect(seasonVsPrevious(rows, 's2')).toEqual({ current: null, previous: null });
    });

    it('miejsce w rankingu i seria skuteczności od najstarszego meczu', () => {
        const list = [{ id: 'a', v: 5 }, { id: 'b', v: 9 }, { id: 'c', v: null }];
        expect(rankOf(list, (p) => p.id === 'a', (p) => p.v)).toEqual({ rank: 2, of: 2 });
        const s = shootingSeries([g('2026-10-11', { fgm: 1, fga: 2 }), g('2026-10-04', { ftm: 1, fta: 4 })]);
        expect(s.map((x) => [x.date, x.fg, x.ft])).toEqual([['2026-10-04', null, 25], ['2026-10-11', 50, null]]);
    });

    it('linki kalendarza: plik jednego meczu i subskrypcja webcal', () => {
        expect(calendarLinks('4144', 'sez', 'panel.bekapaka.pl')).toEqual({
            single: '/api/calendar.ics?match=4144&seasonId=sez',
            subscribe: 'webcal://panel.bekapaka.pl/api/calendar.ics'
        });
    });
});
