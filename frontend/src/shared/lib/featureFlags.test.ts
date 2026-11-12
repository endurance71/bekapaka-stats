import { describe, expect, it } from 'vitest';
import { PLAYS_ENABLED, playsEnabledFrom } from './featureFlags';

describe('flaga zagrywek', () => {
    it('włącza się tylko dla „true”', () => {
        expect(playsEnabledFrom(undefined)).toBe(false);
        expect(playsEnabledFrom('')).toBe(false);
        expect(playsEnabledFrom('1')).toBe(false);
        expect(playsEnabledFrom(' True ')).toBe(true);
    });

    it('domyślny build (bez VITE_PLAYS_ENABLED) ma zagrywki wyłączone', () => {
        expect(PLAYS_ENABLED).toBe(false);
    });
});
