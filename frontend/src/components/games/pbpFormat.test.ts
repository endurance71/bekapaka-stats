import { describe, expect, it } from 'vitest';
import type { PbpEvent } from './kalkMatchTypes';
import { countPbpCategories, describeEvent, formatClock, groupEventsByPeriod, matchesPbpCategory, periodShortLabel, runLabel, runsByEndSeq } from './pbpFormat';

const ev = (seq: number, period: number, extra: Partial<PbpEvent> = {}): PbpEvent => ({
    seq,
    period,
    clockSec: 600 - seq,
    side: 'home',
    playerName: 'Jan Kowalski',
    playerSlug: null,
    playerNumber: 7,
    actionRaw: 'Celny rzut za 2',
    actionType: 'shot_made',
    shotValue: 2,
    made: true,
    reboundType: null,
    subOutNumber: null,
    scoreHome: seq,
    scoreAway: 0,
    isScoring: true,
    ...extra,
});

describe('pbpFormat', () => {
    it('formats clock and periods', () => {
        expect(formatClock(585)).toBe('9:45');
        expect(formatClock(5)).toBe('0:05');
        expect(formatClock(null)).toBe('–');
        expect(periodShortLabel(2)).toBe('Q2');
        expect(periodShortLabel(5)).toBe('OT1');
    });

    it('describes starters and strips the player name', () => {
        expect(describeEvent({ actionRaw: 'Zmiana: #-2 → Jan Kowalski (#7)', actionType: 'sub', playerName: 'Jan Kowalski' })).toBe('Pierwsza piątka');
        expect(describeEvent({ actionRaw: 'Zbiórka', actionType: 'rebound', playerName: 'Jan Kowalski', reboundType: 'O' })).toBe('Zbiórka w ataku');
        expect(describeEvent({ actionRaw: 'Na boisku: Jan Kowalski (#7)', actionType: 'on_court', playerName: 'Jan Kowalski' })).toBe('Na boisku: (#7)');
        expect(describeEvent({ actionRaw: 'Celny rzut za 2', actionType: 'shot_made', playerName: 'Jan Kowalski' })).toBe('Celny rzut za 2');
    });

    it('groups by period, skips neutral events and filters scoring', () => {
        const events = [
            ev(1, 1, { side: null, actionType: 'period_start', isScoring: false, scoreHome: 0 }),
            ev(2, 1),
            ev(3, 1, { actionType: 'rebound', isScoring: false, scoreHome: 2 }),
            ev(4, 2),
        ];
        const all = groupEventsByPeriod(events);
        expect(all.map((g) => [g.period, g.events.length])).toEqual([[1, 2], [2, 1]]);
        expect(all[0].endScore).toEqual({ home: 2, away: 0 });
        const scoring = groupEventsByPeriod(events, { period: 1, scoringOnly: true });
        expect(scoring).toHaveLength(1);
        expect(scoring[0].events.map((e) => e.seq)).toEqual([2]);
    });

    it('indexes runs by end sequence', () => {
        const map = runsByEndSeq([{ side: 'home', points: 10, startSeq: 3, endSeq: 9, period: 1, endPeriod: 1, fromScore: { home: 0, away: 0 }, toScore: { home: 10, away: 0 } }]);
        expect(runLabel(map.get(9)!)).toBe('Seria 10:0');
    });

    it('categories by actionType: misses include blocked shots and missed FT; counts respect side', () => {
        const events = [
            ev(1, 1),
            ev(2, 1, { actionType: 'shot_blocked', isScoring: false }),
            ev(3, 1, { actionType: 'ft_missed', isScoring: false, side: 'away' }),
            ev(4, 2, { actionType: 'foul', isScoring: false }),
            ev(5, 2, { actionType: 'period_start', side: null, isScoring: false }),
        ];
        expect(matchesPbpCategory(events[1], 'miss')).toBe(true);
        expect(countPbpCategories(events)).toMatchObject({ all: 4, score: 1, miss: 2, foul: 1, rebound: 0 });
        expect(countPbpCategories(events, { side: 'home' })).toMatchObject({ all: 3, miss: 1 });
        const misses = groupEventsByPeriod(events, { category: 'miss', side: 'away' });
        expect(misses.flatMap((g) => g.events.map((e) => e.seq))).toEqual([3]);
    });
});
