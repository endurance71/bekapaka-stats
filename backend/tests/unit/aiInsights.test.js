import { describe, it, expect } from 'vitest';
import { generateGameInsights } from '../../insights.js';

const ff = { efg: 0.52, tovPct: 0.12 };
const opp = { name: 'Rywal' };

describe('generateGameInsights — źródła punktów tylko z danych', () => {
  it('never emits fast-break / bench numbers when fields are missing (KALK teamStats is an array)', () => {
    const game = { teamStats: [{ name: 'BeKaPaKa' }, { name: 'Rywal' }], quarters: [] };
    const insights = generateGameInsights(game, ff, opp);
    expect(insights.some((i) => i.category === 'transition')).toBe(false);
    expect(insights.some((i) => i.category === 'depth')).toBe(false);
    expect(JSON.stringify(insights)).not.toMatch(/szybkim ataku|ławki/);
  });

  it('ignores legacy object-shaped teamStats keys (no invented numbers)', () => {
    const game = { teamStats: { 'Punkty po szybkim ataku': { home: 30 } } };
    const insights = generateGameInsights(game, ff, opp, { pointsSources: null });
    expect(insights.some((i) => i.category === 'transition')).toBe(false);
  });

  it('emits fast-break insight only with typed KalkTeamGameStat value', () => {
    const withData = generateGameInsights({}, ff, opp, {
      pointsSources: { fastBreakPts: 18, secondChancePts: null, ptsOffTurnovers: null }
    });
    const fb = withData.find((i) => i.category === 'transition');
    expect(fb?.text).toContain('18 pkt');

    const nullData = generateGameInsights({}, ff, opp, { pointsSources: { fastBreakPts: null } });
    expect(nullData.some((i) => i.category === 'transition')).toBe(false);
  });

  it('bench insight uses benchPts or box score with exactly 5 starters', () => {
    expect(generateGameInsights({}, ff, opp, { benchPts: 25 }).find((i) => i.category === 'depth')?.text).toContain('25 pkt');

    const players = [
      ...Array.from({ length: 5 }, (_, i) => ({ name: `S${i}`, starter: true, pts: 5 })),
      { name: 'B1', starter: false, pts: 12 },
      { name: 'B2', starter: false, pts: 10 }
    ];
    expect(generateGameInsights({}, ff, opp, { team: { players } }).find((i) => i.category === 'depth')?.text).toContain('22 pkt');

    // brak oznaczenia piątki (legacy) → brak reguły ławki
    const noStarters = players.map(({ starter, ...p }) => p);
    expect(generateGameInsights({}, ff, opp, { team: { players: noStarters } }).some((i) => i.category === 'depth')).toBe(false);
  });
});
