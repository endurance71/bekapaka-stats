import { describe, expect, it, vi } from 'vitest';
import { isChunkLoadError, reloadOnceForNewVersion } from './newVersionReload';

const memory = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }; };

describe('przeładowanie po wdrożeniu', () => {
    it('rozpoznaje błąd doczytania pliku strony', () => {
        expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: /assets/League-abc.js'))).toBe(true);
        expect(isChunkLoadError(new Error('Importing a module script failed.'))).toBe(true);
        expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBe(false);
    });

    it('przeładowuje raz, potem nie (bez pętli)', () => {
        const storage = memory();
        const reload = vi.fn();
        expect(reloadOnceForNewVersion(1_000, storage, reload)).toBe(true);
        expect(reloadOnceForNewVersion(5_000, storage, reload)).toBe(false);
        expect(reloadOnceForNewVersion(40_000, storage, reload)).toBe(true);
        expect(reload).toHaveBeenCalledTimes(2);
    });
});
