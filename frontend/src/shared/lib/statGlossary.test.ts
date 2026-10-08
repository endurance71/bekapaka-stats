import { describe, expect, it } from 'vitest';
import { GLOSSARY_GROUPS, STAT, resultLabel, resultLetter } from './statGlossary';

describe('statGlossary', () => {
    it('każdy wpis ma skrót, nazwę, wyjaśnienie i grupę ze słowniczka', () => {
        for (const [key, e] of Object.entries(STAT)) {
            expect(e.short, key).toBeTruthy();
            expect(e.long, key).toBeTruthy();
            expect(e.hint.length, key).toBeGreaterThan(5);
            expect(GLOSSARY_GROUPS).toContain(e.group);
        }
    });

    it('straty i punkty stracone mają różne skróty', () => {
        expect(STAT.tov.short).toBe('Str');
        expect(STAT.pointsAgainst.short).toBe('Strac.');
    });

    it('W/P w całym panelu', () => {
        expect(resultLetter('W')).toBe('W');
        expect(resultLetter('Z')).toBe('W');
        expect(resultLetter('L')).toBe('P');
        expect(resultLetter(null)).toBe('–');
        expect(resultLabel('L')).toBe('Porażka');
    });
});
