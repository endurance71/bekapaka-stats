import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { findInvalidAiValues } from '../../ai/payloadUtils.js';

const prismaMock = mockDeep();
const SEASON = 'season_2026-2027';

function p(name, o = {}) {
  return { name, min: '20:00', pts: 10, fgm: 4, fga: 9, three_pm: 1, three_pa: 3, ftm: 1, fta: 2, orb: 2, drb: 4, reb: 6, ast: 3, stl: 1, tov: 2, pf: 3, blk: 0, ...o };
}

function km(id) {
  return {
    id,
    seasonId: SEASON,
    date: new Date('2026-10-04T10:00:00Z'),
    homeTeamName: 'BeKaPaKa Bobolice',
    guestTeamName: 'Rywal',
    scoreHome: 40,
    scoreAway: 30,
    isFinished: true,
    boxScore: {
      teams: [
        { name: 'BeKaPaKa Bobolice', isBekapaka: true, players: [p('A'), p('B'), p('C'), p('D')] },
        { name: 'Rywal', isBekapaka: false, players: [p('X', { tov: 5 }), p('Y', { tov: 5 }), p('Z', { pts: 10 })] }
      ]
    }
  };
}

describe('dataStore AI helpers — klucze tov/orb (bez NaN)', () => {
  let dataStore;

  beforeEach(async () => {
    mockReset(prismaMock);
    vi.doMock('../../lib/prisma.js', () => ({ prisma: prismaMock }));
    prismaMock.kalkSeason.findUnique.mockResolvedValue({ id: SEASON });
    prismaMock.kalkSeason.upsert.mockResolvedValue({ id: SEASON });
    dataStore = await import('../../dataStore.js');
  });

  afterEach(() => vi.resetModules());

  it('getTrainingPriorities sums tov / orb from enriched four factors (was NaN)', async () => {
    prismaMock.kalkMatch.findMany.mockResolvedValue([km('1'), km('2')]);
    const res = await dataStore.getTrainingPriorities(SEASON);
    expect(findInvalidAiValues(res)).toEqual([]);
    expect(res.team.turnovers).toBe(8);
    expect(res.league.turnovers).toBe(12);
    expect(res.team.fouls).toBe(12);
    // ORB% = 8 / (8 + 12 DRB rywala)
    expect(res.team.orbPercentage).toBe(40);
    expect(res.team.efgPercentage).toBeGreaterThan(0);
  });

  it('getTeamTrends (KALK) returns tovPct / ftRate / orbPct and point sources from KalkTeamGameStat', async () => {
    prismaMock.kalkMatch.findMany.mockResolvedValue([km('1')]);
    prismaMock.kalkTeamGameStat.findMany.mockResolvedValue([
      { kalkMatchId: '1', side: 'home', fastBreakPts: 9, ptsOffTurnovers: null, secondChancePts: 4, benchPts: 7 }
    ]);
    const trends = await dataStore.getTeamTrends(SEASON);
    expect(trends).toHaveLength(1);
    const t = trends[0];
    expect(t.tovPct).toBeGreaterThan(0);
    expect(t.ftRate).toBeGreaterThan(0);
    expect(t.orbPct).toBe(0.4);
    expect(t.fastBreakPoints).toBe(9);
    expect(t.pointsOffTO).toBeNull();
    expect(t).not.toHaveProperty('tov');
    expect(findInvalidAiValues(t)).toEqual([]);
  });
});
