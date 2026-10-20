import { describe, expect, it } from 'vitest';
import { planSeasonInfo, shortSeasonLabel } from './planSeason';

const seasons = [
    { id: 'season_2025-2026', label: 'Sezon 2025/2026' },
    { id: 'season_2026-2027', label: 'Sezon 2026/2027' }
];

describe('shortSeasonLabel', () => {
    it('skraca etykiety i identyfikatory sezonów', () => {
        expect(shortSeasonLabel('Sezon 2025/2026')).toBe('2025/26');
        expect(shortSeasonLabel('season_2026-2027')).toBe('2026/27');
        expect(shortSeasonLabel('2024/25')).toBe('2024/25');
        expect(shortSeasonLabel('Sezon próbny')).toBe('próbny');
        expect(shortSeasonLabel(null)).toBeNull();
    });
});

describe('planSeasonInfo', () => {
    it('bez zapisanego sezonu nic nie pokazuje (stare plany przed migracją)', () => {
        expect(planSeasonInfo({ planSeasonId: null, selectedSeasonId: 'season_2026-2027', seasons })).toEqual({ seasonLabel: null, note: null });
    });

    it('ten sam sezon: tylko etykieta', () => {
        expect(planSeasonInfo({ planSeasonId: 'season_2025-2026', selectedSeasonId: 'season_2025-2026', seasons, gamesInSelected: 9 })).toEqual({
            seasonLabel: '2025/26',
            note: null
        });
    });

    it('za mało meczów w wybranym sezonie: wyjaśnia, skąd plan', () => {
        expect(planSeasonInfo({ planSeasonId: 'season_2025-2026', selectedSeasonId: 'season_2026-2027', seasons, gamesInSelected: 2 })).toEqual({
            seasonLabel: '2025/26',
            note: 'Za mało meczów w sezonie 2026/27 — pokazujemy plan z sezonu 2025/26'
        });
    });

    it('inny sezon przy wystarczającej lub nieznanej liczbie meczów: neutralna notka', () => {
        const note = 'Plan dotyczy sezonu 2025/26, nie wybranego 2026/27';
        expect(planSeasonInfo({ planSeasonId: 'season_2025-2026', selectedSeasonId: 'season_2026-2027', seasons, gamesInSelected: 5 }).note).toBe(note);
        expect(planSeasonInfo({ planSeasonId: 'season_2025-2026', selectedSeasonId: 'season_2026-2027', seasons, gamesInSelected: null }).note).toBe(note);
    });
});
