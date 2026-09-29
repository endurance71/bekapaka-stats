import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

const prismaMock = mockDeep();

describe('P1.5: Player Identity & First Match Simulation across seasons', () => {
  let dataStore;
  let seasonService;
  let parseKalkSlug;

  beforeEach(async () => {
    mockReset(prismaMock);
    vi.doMock('../../lib/prisma.js', () => ({
      prisma: prismaMock,
    }));
    dataStore = await import('../../dataStore.js');
    seasonService = await import('../../seasonService.js');
    parseKalkSlug = seasonService.parseKalkSlug;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('parseKalkSlug handles all 10 legacy, modern, absolute, relative, and query formats', () => {
    const formats = [
      { input: '2025-2026__zawodnikdamian-motylinski43130html', expected: 'damian-motylinski' },
      { input: 'zawodnikdamian-motylinski43130html', expected: 'damian-motylinski' },
      { input: '2026-2027__damian-motylinski', expected: 'damian-motylinski' },
      { input: 'damian-motylinski', expected: 'damian-motylinski' },
      { input: 'https://www.kalk-koszalin.com/zawodnik/damian-motylinski', expected: 'damian-motylinski' },
      { input: 'https://www.kalk-koszalin.com/zawodnik/damian-motylinski?sezon=50', expected: 'damian-motylinski' },
      { input: '/zawodnik/damian-motylinski', expected: 'damian-motylinski' },
      { input: '/zawodnik/damian-motylinski?sezon=50', expected: 'damian-motylinski' },
      { input: 'https://www.kalk-koszalin.com/zawodnik,damian-motylinski,4313,0.html', expected: 'damian-motylinski' },
      { input: 'zawodnik,damian-motylinski,4313,0.html', expected: 'damian-motylinski' }
    ];

    for (const { input, expected } of formats) {
      expect(parseKalkSlug(input)).toBe(expected);
    }
  });

  it('14 BeKaPaKa roster players produce 14 unique kalkSlugs (zero collisions)', () => {
    const rosterKalkIds = [
      '2025-2026__zawodnikjedrzej-bortnik43060html',
      '2025-2026__zawodnikpawel-samusionek43070html',
      '2025-2026__zawodnikpablo-iriarte43080html',
      '2025-2026__zawodnikpatryk-szczesniak44380html',
      '2025-2026__zawodnikmarcin-trawinski45540html',
      '2025-2026__zawodnikmiroslaw-malina44390html',
      '2025-2026__zawodniktomasz-kaszubowski43090html',
      '2025-2026__zawodnikprzemyslaw-klimek43100html',
      '2025-2026__zawodnikrobert-kulik43110html',
      '2025-2026__zawodnikemil-klos43120html',
      '2025-2026__zawodnikdamian-motylinski43130html',
      '2025-2026__zawodniklukasz-gosniak43140html',
      '2025-2026__zawodnikfilip-karpinski43150html',
      '2025-2026__zawodnikfilip-kawecki43160html'
    ];

    const slugs = rosterKalkIds.map(parseKalkSlug);
    const uniqueSlugs = new Set(slugs);

    expect(slugs).toHaveLength(14);
    expect(uniqueSlugs.size).toBe(14);
  });

  it('SIMULATION: Ingesting a season 2026-2027 match with new season KalkPlayer resolves to RosterPlayer and calculates all stats', async () => {
    // 1. Season setup: active season is 2026-2027
    prismaMock.kalkSeason.findFirst.mockResolvedValue({
      id: 'season_2026-2027',
      slug: '2026-2027',
      isActive: true
    });
    prismaMock.kalkSeason.findUnique.mockImplementation(async ({ where }) => {
      if (where.id === 'season_2026-2027') {
        return { id: 'season_2026-2027', slug: '2026-2027', isActive: true };
      }
      if (where.id === 'season_2025-2026') {
        return { id: 'season_2025-2026', slug: '2025-2026', isActive: false };
      }
      return null;
    });

    // 2. RosterPlayer in DB has kalkPlayerId pointing to the 2025-2026 record
    const rosterPlayer = {
      id: 'rp-damian',
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
    };
    prismaMock.rosterPlayer.findMany.mockResolvedValue([rosterPlayer]);
    prismaMock.rosterPlayer.findUnique.mockResolvedValue(rosterPlayer);

    // 3. In season 2026-2027, KALK scraper creates KalkPlayer with season 2026-2027 id
    const kalkPlayer2026 = {
      id: '2026-2027__damian-motylinski',
      seasonId: 'season_2026-2027',
      name: 'Motyliński Damian',
      team: 'BeKaPaKa BOBOLICE'
    };

    const kalkPlayer2025 = {
      id: '2025-2026__zawodnikdamian-motylinski43130html',
      seasonId: 'season_2025-2026',
      name: 'Motyliński Damian',
      team: 'BeKaPaKa BOBOLICE'
    };

    prismaMock.kalkPlayer.findFirst.mockImplementation(async ({ where }) => {
      if (where.seasonId === 'season_2026-2027') {
        if (where.id === '2026-2027__damian-motylinski') return kalkPlayer2026;
        if (where.name?.contains?.toLowerCase() === 'motyliński') return kalkPlayer2026;
      }
      if (where.seasonId === 'season_2025-2026') {
        if (where.id === '2025-2026__zawodnikdamian-motylinski43130html') return kalkPlayer2025;
      }
      return null;
    });

    // 4. KalkPlayerGameLog is saved with the 2026-2027 KalkPlayer ID
    prismaMock.kalkPlayerGameLog.findMany.mockImplementation(async ({ where }) => {
      if (where.seasonId === 'season_2026-2027' && where.kalkPlayerId === '2026-2027__damian-motylinski') {
        return [
          {
            id: 'log-1',
            seasonId: 'season_2026-2027',
            kalkPlayerId: '2026-2027__damian-motylinski',
            kalkMatchId: 'match-1',
            opponentName: 'Atomówki',
            stats: {
              pts: 22,
              reb: 6,
              ast: 5,
              fgm: 8,
              fga: 15,
              three_pm: 2,
              three_pa: 4,
              ftm: 4,
              fta: 5,
              plus_minus: 12,
              eval: 24
            },
            kalkMatch: {
              date: new Date('2026-10-04T18:00:00Z')
            }
          }
        ];
      }
      if (where.seasonId === 'season_2025-2026' && where.kalkPlayerId === '2025-2026__zawodnikdamian-motylinski43130html') {
        return [
          {
            id: 'log-old-1',
            seasonId: 'season_2025-2026',
            kalkPlayerId: '2025-2026__zawodnikdamian-motylinski43130html',
            kalkMatchId: 'match-old-1',
            opponentName: 'Pantery',
            stats: {
              pts: 14,
              reb: 4,
              ast: 3,
              fgm: 5,
              fga: 10,
              three_pm: 1,
              three_pa: 3,
              ftm: 3,
              fta: 4,
              plus_minus: 5,
              eval: 15
            },
            kalkMatch: {
              date: new Date('2026-02-14T18:00:00Z')
            }
          }
        ];
      }
      return [];
    });

    // 5. Test getRoster() resolution for season 2026-2027
    const roster2026 = await dataStore.getRoster('season_2026-2027');
    expect(roster2026).toHaveLength(1);
    const p2026 = roster2026[0];

    // Verification: Player stats correctly assigned
    expect(p2026.gamesPlayed).toBe(1);
    expect(p2026.points).toBe(22);
    expect(p2026.ppg).toBe(22);
    expect(p2026.rpg).toBe(6);
    expect(p2026.apg).toBe(5);
    expect(p2026.plusMinus).toBe(12);
    // eFG% = (8 + 0.5 * 2) / 15 * 100 = 9 / 15 * 100 = 60.0%
    expect(p2026.eFgPercentage).toBe(60.0);
    // TS% = 22 / (2 * (15 + 0.44 * 5)) * 100 = 22 / (2 * 17.2) * 100 = 63.95% -> 64.0%
    expect(p2026.tsPercentage).toBe(64.0);
    expect(p2026.games).toHaveLength(1);
    expect(p2026.games[0].opponent).toBe('Atomówki');

    // 6. Test getPlayerStats() resolution for season 2026-2027
    const stats2026 = await dataStore.getPlayerStats('rp-damian', 'season_2026-2027');
    expect(stats2026.averages.gamesPlayed).toBe(1);
    expect(stats2026.averages.ppg).toBe(22);
    expect(stats2026.averages.rpg).toBe(6);
    expect(stats2026.averages.apg).toBe(5);
    expect(stats2026.averages.plusMinusAvg).toBe(12);

    // 7. Test concurrent multi-season isolation: must retrieve old 2025/26 stats without collision
    const roster2025 = await dataStore.getRoster('season_2025-2026');
    expect(roster2025).toHaveLength(1);
    const p2025 = roster2025[0];
    expect(p2025.gamesPlayed).toBe(1);
    expect(p2025.points).toBe(14);
    expect(p2025.ppg).toBe(14);
    expect(p2025.rpg).toBe(4);
    expect(p2025.apg).toBe(3);
    expect(p2025.plusMinus).toBe(5);
  });
});
