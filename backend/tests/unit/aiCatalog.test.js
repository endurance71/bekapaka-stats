import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

const prismaMock = mockDeep();
const SEASON = 'season_2026-2027';
const LONG_PLAN = ['Profil', 'Priorytety pozycyjne', 'Mocne strony', 'Do poprawy', 'Propozycje treningowe', 'Trend', 'Fokus na najbliższy trening', 'Cele sezonu']
  .map((t) => `## ${t}\n\n${'Tekst planu z liczbami 12.5 PPG. '.repeat(8)}`)
  .join('\n\n');

describe('getAiAnalysesCatalog — staleness', () => {
  beforeEach(() => {
    mockReset(prismaMock);
    vi.doMock('../../lib/prisma.js', () => ({ prisma: prismaMock }));
    vi.doMock('../../seasonService.js', () => ({ resolveSeasonId: vi.fn(async (s) => s || SEASON) }));
    vi.doMock('../../dataStore.js', () => ({
      listGames: vi.fn(async () => [
        { id: '4124', date: '2026-10-04T10:00:00Z', opponent: 'Kosz-All-In', result: 'W', scoreUs: 86, scoreThem: 20, dataSource: 'kalk' },
        { id: 'lm-future', date: '2099-01-01T10:00:00Z', opponent: 'Przyszły', result: null, dataSource: 'league', hasBoxScore: false }
      ])
    }));
    vi.doMock('../../kalk/kalkGameView.js', () => ({
      kalkMatchToGameDetail: vi.fn(() => ({ teams: [{ isBekapaka: true, players: [{ name: 'X' }] }] }))
    }));
    vi.doMock('../../ai/generate.js', () => ({ getTeamBriefingCached: vi.fn(async () => null) }));
    vi.doMock('../../ai/buildBriefingContext.js', () => ({ buildBriefingContext: vi.fn() }));
    vi.doMock('../../ai/buildMatchContext.js', () => ({
      getMatchAiStaleness: vi.fn(async ({ aiSummaryHash }) => ({ stale: aiSummaryHash !== 'match-new', reason: 'hash-changed', currentHash: 'match-new' }))
    }));
    vi.doMock('../../ai/buildPlayerContext.js', () => ({
      buildPlayerContext: vi.fn(async () => ({ hash: 'player-new', payload: {} }))
    }));
    vi.doMock('../../ai/buildScoutingContext.js', () => ({
      buildScoutingContext: vi.fn(async () => ({ hash: 'scout-new', payload: {} }))
    }));
    process.env.GEMINI_API_KEY = 'test';
  });

  afterEach(() => {
    vi.resetModules();
    for (const m of [
      '../../seasonService.js',
      '../../dataStore.js',
      '../../kalk/kalkGameView.js',
      '../../ai/generate.js',
      '../../ai/buildBriefingContext.js',
      '../../ai/buildMatchContext.js',
      '../../ai/buildPlayerContext.js',
      '../../ai/buildScoutingContext.js'
    ]) vi.doUnmock(m);
    delete process.env.GEMINI_API_KEY;
  });

  it('computes real staleness for players / scouting / matches and excludes future schedule rows', async () => {
    prismaMock.kalkSeason.findUnique.mockResolvedValue({ id: SEASON, startsAt: new Date('2026-09-01'), endsAt: new Date('2027-08-31'), isActive: true });
    prismaMock.kalkMatch.findMany.mockResolvedValue([
      { id: '4124', seasonId: SEASON, isFinished: true, aiSummary: 'x', aiSummaryHash: 'match-old', aiSummaryAt: new Date(), aiSummaryModel: 'gemini' }
    ]);
    prismaMock.rosterPlayer.findMany.mockResolvedValue([
      { id: 'p-fresh', firstName: 'A', lastName: 'Aktualny', aiDevelopmentSummary: LONG_PLAN, aiDevelopmentHash: 'player-new', aiDevelopmentModel: 'gemini-3.5-flash', aiDevelopmentAt: new Date() },
      { id: 'p-old', firstName: 'B', lastName: 'Stary', aiDevelopmentSummary: LONG_PLAN, aiDevelopmentHash: 'player-old', aiDevelopmentModel: 'template', aiDevelopmentAt: new Date() },
      { id: 'p-none', firstName: 'C', lastName: 'Brak', aiDevelopmentSummary: null }
    ]);
    prismaMock.leagueTeam.findMany.mockResolvedValue([{ name: 'Kosz-All-In' }, { name: 'BeKaPaKa Bobolice' }]);
    prismaMock.scoutingAiReport.findMany.mockResolvedValue([
      { opponentKey: `${SEASON}::kosz`, opponentName: 'Kosz-All-In', summaryMd: 'Raport.', sourceHash: 'scout-old', generatedAt: new Date('2026-10-05') },
      // stary klucz z poprzedniego sezonu — nie należy do 2026/27
      { opponentKey: 'inny', opponentName: 'Inny', summaryMd: 'Stary.', sourceHash: 'x', generatedAt: new Date('2026-03-01') }
    ]);

    const { getAiAnalysesCatalog } = await import('../../ai/catalog.js');
    const cat = await getAiAnalysesCatalog(SEASON);
    const byId = new Map(cat.items.map((i) => [i.id, i]));

    expect(byId.get('player:p-fresh').stale).toBe(false);
    expect(byId.get('player:p-old').stale).toBe(true);
    expect(byId.get('player:p-old').isTemplate).toBe(true);
    expect(byId.get('player:p-none').stale).toBe(false);
    expect(byId.get('match:4124').stale).toBe(true);
    expect(byId.get('scouting-plan:kosz').stale).toBe(true);
    expect(byId.has('scouting-plan:inny')).toBe(false);
    expect(byId.has('match:lm-future')).toBe(false);
    expect(cat.summary.upcomingExcluded).toBe(1);
    expect(cat.summary.stale).toBeGreaterThanOrEqual(3);
    expect(cat.summary.templates).toBe(1);
  });
});

describe('scoutingReportsForSeason / legacyReportMatchesSeason', () => {
  afterEach(() => vi.resetModules());

  it('prefers season-scoped rows and accepts legacy rows only within season dates', async () => {
    vi.doMock('../../lib/prisma.js', () => ({ prisma: prismaMock }));
    const { scoutingReportsForSeason } = await import('../../ai/catalog.js');
    const season = { id: 'season_2025-2026', startsAt: new Date('2025-09-01'), endsAt: new Date('2026-08-31') };
    const map = scoutingReportsForSeason(
      [
        { opponentKey: 'kosz', opponentName: 'Kosz', generatedAt: new Date('2026-02-01') },
        { opponentKey: 'brd', opponentName: 'Brd', generatedAt: new Date('2026-02-01') },
        { opponentKey: 'season_2025-2026::brd', opponentName: 'Brd', generatedAt: new Date('2026-03-01') },
        { opponentKey: 'stary', opponentName: 'Stary', generatedAt: new Date('2024-02-01') }
      ],
      season
    );
    expect(map.get('kosz').legacy).toBe(true);
    expect(map.get('brd').legacy).toBe(false);
    expect(map.has('stary')).toBe(false);
  });
});
