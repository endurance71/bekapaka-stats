import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

const prismaMock = mockDeep();

describe('P0/P1: KALK 2026/2027 Safe Sync & Player Stats', () => {
  let dataStore;

  beforeEach(async () => {
    mockReset(prismaMock);
    vi.doMock('../../lib/prisma.js', () => ({
      prisma: prismaMock,
    }));
    dataStore = await import('../../dataStore.js');
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('Test 1: Empty KALK roster for BeKaPaKa does NOT unlink players, preserves existing mappings and logs warning', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Active season 2026-2027
    prismaMock.kalkSeason.findFirst.mockResolvedValue({
      id: 'season_2026-2027',
      slug: '2026-2027',
      isActive: true
    });

    // kalkPlayers only from other teams in Dywizja II (none for BeKaPaKa)
    prismaMock.kalkPlayer.findMany.mockResolvedValue([
      { id: '2026-2027__alan-budny', name: 'Budny Alan', team: 'Atomówki' },
      { id: '2026-2027__tomasz-b', name: 'Tomasz B', team: 'Fasolki' }
    ]);

    // Roster has 14 players with existing kalkPlayerId
    prismaMock.rosterPlayer.findMany.mockResolvedValue([
      { id: 'rp-1', firstName: 'Damian', lastName: 'Motyliński', kalkPlayerId: '2025-2026__zawodnikdamian-motylinski43130html' },
      { id: 'rp-2', firstName: 'Paweł', lastName: 'Szulgo', kalkPlayerId: '2025-2026__zawodnikpawel-szulgo43070html' }
    ]);

    const result = await dataStore.syncPlayersFromKalk();

    expect(result.status).toBe('no_source_data');
    expect(result.synced).toBe(0);
    // CRITICAL: prisma.rosterPlayer.update with kalkPlayerId: null must NEVER be called
    expect(prismaMock.rosterPlayer.update).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('WARNING: KALK season season_2026-2027 currently exposes no players for BeKaPaKa'));

    consoleWarnSpy.mockRestore();
  });

  it('Test 2: Repeated sync is idempotent (no changes, no duplicates, no unlinking)', async () => {
    prismaMock.kalkSeason.findFirst.mockResolvedValue({
      id: 'season_2026-2027',
      slug: '2026-2027',
      isActive: true
    });

    // 0 players in s50
    prismaMock.kalkPlayer.findMany.mockResolvedValue([]);

    const run1 = await dataStore.syncPlayersFromKalk();
    const run2 = await dataStore.syncPlayersFromKalk();

    expect(run1.status).toBe('no_source_data');
    expect(run2.status).toBe('no_source_data');
    expect(prismaMock.rosterPlayer.update).not.toHaveBeenCalled();
    expect(prismaMock.rosterPlayer.create).not.toHaveBeenCalled();
  });

  it('Test 5: Player stats without match return 0 averages and null advanced stats (no season leak)', async () => {
    prismaMock.kalkSeason.findFirst.mockResolvedValue({
      id: 'season_2026-2027',
      slug: '2026-2027',
      isActive: true
    });
    prismaMock.kalkSeason.findUnique.mockResolvedValue({
      id: 'season_2026-2027',
      slug: '2026-2027',
      isActive: true
    });

    // Roster player with legacy 2025/2026 TS%/eFG% stored in table columns
    prismaMock.rosterPlayer.findMany.mockResolvedValue([
      {
        id: 'rp-1',
        firstName: 'Damian',
        lastName: 'Motyliński',
        number: 24,
        position: 'PG',
        kalkPlayerId: '2025-2026__zawodnikdamian-motylinski43130html',
        gamesPlayed: 15,
        ppg: 14.5,
        rpg: 5.2,
        apg: 4.1,
        tsPercentage: 41.8,
        eFgPercentage: 42.9,
        plusMinus: 1.2
      }
    ]);

    // No game logs in active season 2026-2027
    prismaMock.kalkPlayerGameLog.findMany.mockResolvedValue([]);

    const roster = await dataStore.getRoster('season_2026-2027');
    expect(roster).toHaveLength(1);
    const p = roster[0];

    // Must be reset to 0 for counting stats and null for advanced stats in active season
    expect(p.gamesPlayed).toBe(0);
    expect(p.points).toBe(0);
    expect(p.ppg).toBe(0);
    expect(p.rpg).toBe(0);
    expect(p.apg).toBe(0);
    expect(p.tsPercentage).toBeNull();
    expect(p.eFgPercentage).toBeNull();
    expect(p.plusMinus).toBeNull();
  });

  it('Test 6: First match simulation correctly calculates PPG, RPG, APG, TS%, eFG% and +/- from game log', async () => {
    prismaMock.kalkSeason.findFirst.mockResolvedValue({
      id: 'season_2026-2027',
      slug: '2026-2027',
      isActive: true
    });
    prismaMock.kalkSeason.findUnique.mockResolvedValue({
      id: 'season_2026-2027',
      slug: '2026-2027',
      isActive: true
    });

    prismaMock.rosterPlayer.findMany.mockResolvedValue([
      {
        id: 'rp-1',
        firstName: 'Damian',
        lastName: 'Motyliński',
        number: 24,
        position: 'PG',
        kalkPlayerId: '2025-2026__zawodnikdamian-motylinski43130html',
        gamesPlayed: 0,
        ppg: 0,
        rpg: 0,
        apg: 0,
        tsPercentage: 0,
        eFgPercentage: 0,
        plusMinus: 0
      }
    ]);

    // Simulate 1 finished game log in season 2026-2027:
    // 20 pts, 5 reb, 4 ast, 7/14 FGM/FGA (50%), 2/5 3PM/3PA, 4/4 FTM/FTA, +10 +/-
    // eFG% = (7 + 0.5 * 2) / 14 * 100 = 8 / 14 * 100 = 57.1%
    // TS% = 20 / (2 * (14 + 0.44 * 4)) * 100 = 20 / (2 * 15.76) * 100 = 20 / 31.52 * 100 = 63.5%
    prismaMock.kalkPlayerGameLog.findMany.mockResolvedValue([
      {
        id: 'log-1',
        seasonId: 'season_2026-2027',
        kalkPlayerId: '2025-2026__zawodnikdamian-motylinski43130html',
        kalkMatchId: 'match-1',
        opponentName: 'Atomówki',
        stats: {
          pts: 20,
          reb: 5,
          ast: 4,
          fgm: 7,
          fga: 14,
          three_pm: 2,
          three_pa: 5,
          ftm: 4,
          fta: 4,
          plus_minus: 10,
          eval: 22
        },
        kalkMatch: {
          date: new Date('2026-10-04T18:00:00Z')
        }
      }
    ]);

    const roster = await dataStore.getRoster('season_2026-2027');
    expect(roster).toHaveLength(1);
    const p = roster[0];

    expect(p.gamesPlayed).toBe(1);
    expect(p.points).toBe(20);
    expect(p.ppg).toBe(20);
    expect(p.rpg).toBe(5);
    expect(p.apg).toBe(4);
    expect(p.eFgPercentage).toBe(57.1);
    expect(p.tsPercentage).toBe(63.5);
    expect(p.plusMinus).toBe(10);
  });
});
