import { describe, expect, it } from 'vitest';
import { initialSeason, type Season } from './seasons';

const old: Season = { id: 'season_2025-2026', label: 'Sezon 2025/2026', isActive: false, startsAt: '2025-09-01T00:00:00Z' };
const current: Season = { id: 'season_2026-2027', label: 'Sezon 2026/2027', isActive: true, startsAt: '2026-09-01T00:00:00Z' };
describe('sezon źródłowy projektu', () => {
  it('wybiera aktywny sezon niezależnie od kolejności rekordów', () => expect(initialSeason([old, current])).toBe(current.id));
  it('zachowuje sezon meczu już zapisanego w projekcie', () => expect(initialSeason([current, old], old.id)).toBe(old.id));
  it('wybiera najnowszy sezon, jeśli żaden nie jest aktywny', () => expect(initialSeason([old, { ...current, isActive: false }])).toBe(current.id));
  it('obsługuje pustą bazę', () => expect(initialSeason([])).toBe(''));
});
