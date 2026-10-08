import { describe, expect, it } from 'vitest';
import { difficultyFromOpponent, isBekapakaName } from './matchUtils';
import { hasPlusMinus } from '../../features/games/BoxScoreModern';

describe('difficultyFromOpponent', () => {
    it('rywal bez meczów → brak oceny', () => {
        expect(difficultyFromOpponent({ wins: 0, losses: 0 })).toBeNull();
        expect(difficultyFromOpponent({})).toBeNull();
        expect(difficultyFromOpponent({ wins: 0, losses: 1 })).toBeNull(); // 1–2 mecze rywala: za mało, by ocenić
    });

    it('% zwycięstw rywala → 1–5', () => {
        expect(difficultyFromOpponent({ wins: 0, losses: 4 })).toBe(1);
        expect(difficultyFromOpponent({ wins: 2, losses: 2 })).toBe(3);
        expect(difficultyFromOpponent({ wins: 4, losses: 0 })).toBe(5);
    });

    it('bilans bezpośredni przesuwa o 1, w granicach 1–5', () => {
        expect(difficultyFromOpponent({ wins: 2, losses: 2, h2h: { wins: 3, losses: 0 } })).toBe(2);
        expect(difficultyFromOpponent({ wins: 2, losses: 2, h2h: { wins: 0, losses: 2 } })).toBe(4);
        expect(difficultyFromOpponent({ wins: 4, losses: 0, h2h: { wins: 0, losses: 3 } })).toBe(5);
        // jeden mecz bezpośredni to za mało
        expect(difficultyFromOpponent({ wins: 2, losses: 2, h2h: { wins: 1, losses: 0 } })).toBe(3);
    });
});

describe('isBekapakaName', () => {
    it('rozpoznaje obie nazwy', () => {
        expect(isBekapakaName('BeKaPaKa BOBOLICE')).toBe(true);
        expect(isBekapakaName('Bobolice')).toBe(true);
        expect(isBekapakaName('GMVT TEAM')).toBe(false);
    });
});

describe('hasPlusMinus', () => {
    it('same zera lub brak = KALK nie podał +/-', () => {
        expect(hasPlusMinus([{ plusMinus: 0 }, { plusMinus: 0 }])).toBe(false);
        expect(hasPlusMinus([{ plusMinus: null }, {}])).toBe(false);
        expect(hasPlusMinus([{ plusMinus: 0 }, { plusMinus: '-3' }])).toBe(true);
    });
});
