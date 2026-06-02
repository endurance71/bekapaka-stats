import { describe, it, expect } from 'vitest';
import { resolveLeagueTeamFromList } from '../../lib/leagueTeamResolve.js';

const TABLE = [
  { name: 'PIWIARNIA BUMERANG', wins: 11, losses: 0, points: 22 },
  { name: 'PANTERY', wins: 10, losses: 1, points: 21 },
  { name: 'MŁODE WILKI', wins: 9, losses: 2, points: 20 },
  { name: 'POLITECHNIKA KOSZALIŃSKA', wins: 6, losses: 5, points: 17 },
  { name: 'BrdCrew', wins: 6, losses: 5, points: 17 },
  { name: 'GRUBIK TEAM', wins: 6, losses: 5, points: 17 },
  { name: '100SIO.PL', wins: 5, losses: 6, points: 16 },
  { name: 'GLAZURIX-Salon Łazienek', wins: 4, losses: 7, points: 15 },
  { name: 'BeKaPaKa BOBOLICE', wins: 3, losses: 8, points: 14 },
  { name: 'GMVT TEAM', wins: 2, losses: 9, points: 13 },
  { name: 'ATOMówki', wins: 2, losses: 9, points: 13 },
  { name: 'EMET BASKET SZCZECINEK', wins: 2, losses: 9, points: 6 }
];

describe('resolveLeagueTeamFromList', () => {
  it('returns 10th place for GMVT TEAM (KALK 2025/26)', () => {
    const { team, rank } = resolveLeagueTeamFromList(TABLE, 'GMVT TEAM');
    expect(team?.name).toBe('GMVT TEAM');
    expect(rank).toBe(10);
  });

  it('does not assign BrdCrew rank to GMVT TEAM', () => {
    const { team, rank } = resolveLeagueTeamFromList(TABLE, 'GMVT TEAM');
    expect(team?.name).not.toBe('BrdCrew');
    expect(rank).not.toBe(5);
  });

  it('resolves BrdCrew at 5th when name matches', () => {
    const { team, rank } = resolveLeagueTeamFromList(TABLE, 'BrdCrew');
    expect(team?.name).toBe('BrdCrew');
    expect(rank).toBe(5);
  });

  it('prefers longest name for ambiguous short query', () => {
    const { team, rank } = resolveLeagueTeamFromList(TABLE, 'Crew');
    expect(team?.name).toBe('BrdCrew');
    expect(rank).toBe(5);
  });
});
