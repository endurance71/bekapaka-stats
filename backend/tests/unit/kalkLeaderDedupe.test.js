import { describe, it, expect } from 'vitest';

/**
 * Lokalna kopia logiki dedupeKalkLeaderRows (prywatna w dataStore).
 */
function normalizeLeaderKey(name, team) {
  const n = (name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const t = (team || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  return `${n}|${t}`;
}

function dedupeKalkLeaderRows(rows) {
  const byKey = new Map();
  for (const row of rows) {
    const key = normalizeLeaderKey(row.name, row.team);
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, row);
      continue;
    }
    const preferNew = row.id.includes('__') && !prev.id.includes('__');
    if (preferNew) byKey.set(key, row);
  }
  return [...byKey.values()];
}

describe('dedupeKalkLeaderRows', () => {
  it('prefers canonical id with season prefix over legacy', () => {
    const rows = dedupeKalkLeaderRows([
      { id: 'zawodnikigor-gierlowski43340', name: 'Gierłowski Igor', team: 'BeKaPaKa', pointsAverage: 10 },
      { id: '2025-2026__43340', name: 'Gierłowski Igor', team: 'BeKaPaKa', pointsAverage: 12 }
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('2025-2026__43340');
  });
});
