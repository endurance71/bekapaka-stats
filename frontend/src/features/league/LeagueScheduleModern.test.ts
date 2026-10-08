import { describe, expect, it } from 'vitest';
import { formatPhaseLabel, formatRoundLabel, groupMatchesByPhase } from './LeagueScheduleModern';
import { pluralPl } from '../../shared/lib/plural';

const m = (id: string, extra: Record<string, unknown> = {}) => ({
    id,
    date: '2026-10-04T10:00:00Z',
    homeTeam: 'A',
    guestTeam: 'B',
    scoreHome: null,
    scoreAway: null,
    isFinished: false,
    ...extra,
});

describe('league schedule helpers', () => {
    it('formats round and phase labels', () => {
        expect(formatRoundLabel('Kolejka - 3')).toBe('Kolejka 3');
        expect(formatRoundLabel(null)).toBeNull();
        expect(formatPhaseLabel('PLAYOFF')).toBe('Play-off');
        expect(formatPhaseLabel('Faza play out')).toBe('Faza Play-out');
        expect(formatPhaseLabel('Sezon zasadniczy')).toBe('Sezon zasadniczy');
    });

    it('groups matches by phase in schedule order', () => {
        const groups = groupMatchesByPhase([
            m('1', { phaseLabel: 'Play-off', stageId: 400 }),
            m('2', { phaseLabel: 'Sezon zasadniczy', stageId: 361 }),
            m('3', { phaseLabel: 'Play-off', stageId: 400 }),
        ]);
        expect(groups.map((g) => [g.label, g.matches.map((x) => x.id)])).toEqual([
            ['Play-off', ['1', '3']],
            ['Sezon zasadniczy', ['2']],
        ]);
    });

    it('keeps a single unlabeled group for legacy seasons', () => {
        const groups = groupMatchesByPhase([m('1'), m('2')]);
        expect(groups).toHaveLength(1);
        expect(groups[0].label).toBeNull();
    });

    it('declines Polish nouns', () => {
        expect(pluralPl(1, 'mecz', 'mecze', 'meczów')).toBe('mecz');
        expect(pluralPl(3, 'mecz', 'mecze', 'meczów')).toBe('mecze');
        expect(pluralPl(12, 'mecz', 'mecze', 'meczów')).toBe('meczów');
        expect(pluralPl(22, 'mecz', 'mecze', 'meczów')).toBe('mecze');
    });
});
