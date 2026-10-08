import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { findInvalidAiValues } from '../../ai/payloadUtils.js';

const prismaMock = mockDeep();
const SEASON = 'season_2026-2027';

/** Payload musi przejść JSON round-trip bez strat i bez NaN/undefined. */
function expectCleanPayload(payload) {
  expect(findInvalidAiValues(payload)).toEqual([]);
  expect(JSON.parse(JSON.stringify(payload))).toStrictEqual(payload);
}

function player(name, number, starter, overrides = {}) {
  return {
    name,
    number,
    starter,
    min: '25:00',
    pts: 10,
    two_pm: 4,
    two_pa: 8,
    three_pm: 0,
    three_pa: 2,
    fgm: 4,
    fga: 10,
    ftm: 2,
    fta: 2,
    orb: 1,
    drb: 3,
    reb: 4,
    ast: 2,
    stl: 1,
    tov: 2,
    pf: 2,
    pfDrawn: 1,
    blk: 0,
    plusMinus: 5,
    eval: 9,
    ...overrides
  };
}

function kalkView() {
  const us = [
    player('Filip Karpiński', 69, true, { pts: 28 }),
    player('Dawid Olearczyk', 1, true),
    player('Alan Niwiński', 27, true),
    player('Jan Testowy', 5, true),
    player('Piotr Próbny', 6, true),
    player('Rezerwowy Jeden', 12, false, { pts: 8 })
  ];
  const them = [player('Adam Nowak', 7, true, { pts: 9 }), player('Ewa Gość', 8, true, { pts: 11 })];
  return {
    id: '4124',
    kalkMatchId: '4124',
    dataSource: 'kalk',
    isFromKalkMatch: true,
    seasonId: SEASON,
    date: new Date('2026-10-04T10:00:00Z'),
    opponent: 'Kosz-All-In',
    homeAway: 'home',
    result: 'W',
    scoreUs: 86,
    scoreThem: 20,
    quarters: [{ label: 'Q1', home: 26, away: 4 }],
    teams: [
      { name: 'BeKaPaKa Bobolice', isBekapaka: true, players: us, fourFactors: { efg: 0.4, tovPct: 0.25 } },
      { name: 'Kosz-All-In', isBekapaka: false, players: them }
    ]
  };
}

describe('AI context builders (mocked Prisma, bez sieci)', () => {
  beforeEach(() => {
    mockReset(prismaMock);
    vi.doMock('../../lib/prisma.js', () => ({ prisma: prismaMock }));
  });

  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('../../dataStore.js');
    vi.doUnmock('../../ai/buildMatchContext.js');
  });

  it('buildMatchContext: full box, typed totals, PBP, H2H — clean payload; fast-break only from data', async () => {
    vi.doMock('../../dataStore.js', () => ({ getGameById: vi.fn(async () => kalkView()) }));
    prismaMock.kalkMatch.findUnique.mockResolvedValue({
      id: '4124',
      date: new Date('2026-10-04T10:00:00Z'),
      homeTeamName: 'BeKaPaKa Bobolice',
      guestTeamName: 'Kosz-All-In',
      homeTeamId: '138',
      guestTeamId: '148',
      stageLabel: 'Sezon zasadniczy',
      roundLabel: 'Kolejka - 3',
      overtimes: 0,
      info: {
        quarters: [{ period: 1, label: 'Kw. 1', home: 26, away: 4 }],
        flow5: [{ minute: 5, home: 13, away: 2 }],
        mvp: { name: 'Filip Karpiński', number: 69, eval: 36 }
      }
    });
    prismaMock.kalkTeamGameStat.findMany.mockResolvedValue([
      { side: 'home', pts: 86, fgm: 30, fga: 60, twoPm: 25, twoPa: 45, threePm: 5, threePa: 15, ftm: 21, fta: 28, orb: 12, drb: 30, reb: 42, ast: 20, stl: 10, tov: 11, pf: 15, pfDrawn: 20, blk: 3, blkAgainst: 1, eval: 100, startersPts: 58, benchPts: 28, fastBreakPts: 18, ptsOffTurnovers: 12, secondChancePts: 11, ptsInPaint: null, updatedAt: new Date() },
      { side: 'away', pts: 20, fgm: 8, fga: 50, twoPm: 7, twoPa: 35, threePm: 1, threePa: 15, ftm: 3, fta: 8, orb: 5, drb: 18, reb: 23, ast: 4, stl: 3, tov: 25, pf: 20, pfDrawn: 15, blk: 1, blkAgainst: 3, eval: -10, startersPts: null, benchPts: null, fastBreakPts: null, ptsOffTurnovers: null, secondChancePts: null, ptsInPaint: null, updatedAt: new Date() }
    ]);
    let h = 0;
    prismaMock.kalkPlayByPlayEvent.findMany.mockResolvedValue(
      Array.from({ length: 5 }, (_, i) => {
        h += 2;
        return { seq: i + 1, period: 1, clockSec: 580 - i * 10, side: 'home', actionType: 'shot_made', scoreHome: h, scoreAway: 0, isScoring: true };
      })
    );
    prismaMock.kalkMatch.findMany.mockResolvedValue([
      { id: '1', seasonId: 'season_2025-2026', date: new Date('2026-01-10'), homeTeamName: 'Kosz-All-In', guestTeamName: 'BeKaPaKa Bobolice', scoreHome: 50, scoreAway: 60 }
    ]);
    prismaMock.leagueTeam.findMany.mockResolvedValue([
      { name: 'BeKaPaKa Bobolice', position: 1, wins: 1, losses: 0, matches: 1, pointsFor: 86, pointsAgainst: 20 },
      { name: 'Kosz-All-In', position: 8, wins: 0, losses: 1, matches: 1, pointsFor: 20, pointsAgainst: 86 }
    ]);

    const { buildMatchContext } = await import('../../ai/buildMatchContext.js');
    const ctx = await buildMatchContext('4124', { seasonId: SEASON });
    const p = ctx.payload;
    expectCleanPayload(p);
    expect(p.teams.bekapaka.totals.reb).toBe(42);
    expect(p.teams.bekapaka.benchPts).toBe(28);
    expect(p.teams.bekapaka.pointsSources.fastBreakPts).toBe(18);
    expect(p.teams.opponent.pointsSources).toBeNull();
    expect(p.teams.bekapaka.players[0]).toMatchObject({ name: 'Filip Karpiński', pts: 28, twoPt: '4/8', pfDrawn: 1 });
    expect(p.teams.opponent.players).toHaveLength(2);
    expect(p.flow5).toEqual([{ minute: 5, bekapaka: 13, opponent: 2 }]);
    expect(p.meta.mvp).toEqual({ name: 'Filip Karpiński', number: 69, eval: 36 });
    expect(p.playByPlay.available).toBe(true);
    expect(p.playByPlay.runs[0]).toMatchObject({ team: 'bekapaka', points: 10 });
    expect(p.headToHead).toEqual([{ date: '2026-01-10', seasonId: 'season_2025-2026', score: '60:50', result: 'W' }]);
    expect(p.leagueContext.opponent.position).toBe(8);
    expect(p.ruleInsights.find((i) => i.category === 'transition')?.text).toContain('18 pkt');
    expect(JSON.stringify(p)).not.toMatch(/updatedAt/);

    // tabela ligowa nie wpływa na hash (analiza starego meczu nie robi się nieaktualna po kolejce)
    prismaMock.leagueTeam.findMany.mockResolvedValue([]);
    const ctx2 = await buildMatchContext('4124', { seasonId: SEASON });
    expect(ctx2.hash).toBe(ctx.hash);
  });

  it('buildMatchPayloadFromGame without KALK v2 data: no PBP, no point sources, no NaN', async () => {
    vi.doMock('../../dataStore.js', () => ({ getGameById: vi.fn() }));
    const { buildMatchPayloadFromGame } = await import('../../ai/buildMatchContext.js');
    const view = kalkView();
    view.teams[0].players = view.teams[0].players.map(({ starter, ...rest }) => rest);
    const payload = JSON.parse(JSON.stringify(buildMatchPayloadFromGame(view, {})));
    expect(payload.playByPlay.available).toBe(false);
    expect(payload.teams.bekapaka.pointsSources).toBeNull();
    expect(payload.teams.bekapaka.benchPts).toBeNull();
    expect(payload.ruleInsights.some((i) => i.category === 'transition' || i.category === 'depth')).toBe(false);
    expect(findInvalidAiValues(buildMatchPayloadFromGame(view, {}))).toEqual([]);
  });

  it('buildPlayerContext: no volatile fields, real team averages, W/L in game log, career', async () => {
    const gameLog = Array.from({ length: 6 }, (_, i) => ({
      gameId: String(100 + i),
      date: `2026-10-0${i + 1}`,
      opponent: 'Rywal',
      pts: i < 3 ? 20 : 12,
      reb: 5,
      ast: 3,
      stl: 1,
      blk: 0,
      tov: i < 3 ? 6 : 1,
      pf: 2,
      min: '30:00',
      fgm: 8,
      fga: 15,
      three_pm: 1,
      three_pa: 4,
      ftm: 3,
      fta: 4,
      efg: 0.567,
      ts: 0.6,
      plusMinus: 4
    }));
    const statsFor = (updatedAt) => ({
      season: { id: SEASON, label: '2026/2027' },
      player: {
        id: 'p1',
        firstName: 'Filip',
        lastName: 'Karpiński',
        number: 69,
        position: 'SF',
        kalkPlayer: { id: 'x', slug: 'filip-karpinski', raw: { html: '…' }, updatedAt, createdAt: updatedAt }
      },
      leagueKalk: { pointsAverage: 16.33333, eval: 20 },
      averages: { ppg: 16, rpg: 5, apg: 3, efg: 0.567, ts: 0.6, plusMinusAvg: 4, gamesPlayed: 6, minutesPlayed: 180 },
      gameLog
    });
    const getPlayerStats = vi.fn(async () => statsFor(new Date()));
    vi.doMock('../../dataStore.js', () => ({
      getPlayerStats,
      getTrainingPriorities: vi.fn(async () => ({ team: { turnovers: 14.2, efgPercentage: 48.1, ftPercentage: 65 }, league: {} }))
    }));
    prismaMock.kalkSeason.findUnique.mockResolvedValue({ id: SEASON });
    prismaMock.rosterPlayer.findUnique.mockResolvedValue({ goals: null, kalkSlug: 'filip-karpinski', heightCm: null, position: 'SF' });
    // średnia zawodnika drużyny: 2 zawodników × 3 mecze: ppg 10 i 6 → 8; tov 2 i 1 → 1.5
    prismaMock.kalkPlayerGameLog.findMany.mockResolvedValue([
      ...[1, 2, 3].map(() => ({ kalkPlayerId: 'a', pts: 10, tov: 2, stats: {} })),
      ...[1, 2, 3].map(() => ({ kalkPlayerId: 'b', pts: null, tov: null, stats: { pts: 6, tov: 1 } }))
    ]);
    prismaMock.kalkMatch.findMany.mockResolvedValue(
      gameLog.map((g, i) => ({ id: g.gameId, homeTeamName: 'BeKaPaKa Bobolice', scoreHome: i % 2 ? 50 : 70, scoreAway: 60, roundLabel: `Kolejka - ${i + 1}` }))
    );
    prismaMock.kalkPlayerSeasonStat.findMany.mockResolvedValue([
      { seasonId: SEASON, playerSlug: 'filip-karpinski', competition: 'Dywizja II', teamName: 'BeKaPaKa', games: 6, minutesTotal: 10800, pts: 96, twoPm: 30, twoPa: 50, twoPct: 60, threePm: 6, threePa: 24, threePct: 25, ftm: 18, fta: 24, ftPct: 75, orb: 6, drb: 24, reb: 30, ast: 18, stl: 6, tov: 21, blk: 0, pf: 12, pfDrawn: 20, eval: 120, plusMinus: 24, updatedAt: new Date() },
      { seasonId: 'season_2025-2026', playerSlug: 'filip-karpinski', competition: 'Dywizja II', teamName: 'BeKaPaKa', games: 10, minutesTotal: null, pts: 100, twoPm: 40, threePm: 2, ftm: 14, orb: 5, drb: 30, reb: 35, ast: 20, stl: 5, tov: 15, blk: 1, pf: 20, pfDrawn: 10, eval: 90, plusMinus: -5 }
    ]);
    prismaMock.kalkPlayerProfile.findUnique.mockResolvedValue({ slug: 'filip-karpinski', position: 'SF', heightCm: 185, birthYear: 1990 });
    prismaMock.kalkSeason.findMany.mockResolvedValue([{ id: SEASON, label: '2026/2027' }, { id: 'season_2025-2026', label: '2025/2026' }]);

    const { buildPlayerContext } = await import('../../ai/buildPlayerContext.js');
    const ctx = await buildPlayerContext('p1');
    const p = ctx.payload;
    expectCleanPayload(p);
    const json = JSON.stringify(p);
    expect(json).not.toMatch(/"raw"|updatedAt|createdAt|birthYear/);
    expect(p.player).toEqual({ firstName: 'Filip', lastName: 'Karpiński', number: 69, position: 'SF', heightCm: 185 });
    expect(p.teamAverages).toEqual({ ppg: 8, turnoversPerGame: 1.5, playersCounted: 2 });
    expect(p.gameLog[0]).toMatchObject({ result: 'W', score: '70:60', round: 'Kolejka - 1' });
    expect(p.gameLog[1]).toMatchObject({ result: 'L', score: '50:60' });
    expect(p.career).toHaveLength(2);
    expect(p.seasonStats[0]).toMatchObject({ mpg: 30, ppg: 16, threePct: 25, ftPct: 75 });
    const codes = p.signals.map((s) => s.code);
    expect(codes).toContain('high_turnovers');
    expect(codes).toContain('scoring_leader');

    // Zmiana timestampu KalkPlayer nie zmienia hasha
    getPlayerStats.mockResolvedValueOnce(statsFor(new Date('2020-01-01')));
    const ctx2 = await buildPlayerContext('p1');
    expect(ctx2.hash).toBe(ctx.hash);
  });

  it('scoring_leader does not fire without team reference (was: fires for everyone)', async () => {
    const { computePlayerSignals } = await import('../../ai/playerSignals.js');
    const signals = computePlayerSignals({
      averages: { ppg: 2, gamesPlayed: 5 },
      gameLog: [{ tov: 0 }, { tov: 0 }, { tov: 0 }],
      teamAverages: { ppg: null, turnoversPerGame: NaN }
    });
    expect(signals.map((s) => s.code)).not.toContain('scoring_leader');
  });

  it('buildBriefingContext: last box score numbers, trends in %, no NaN', async () => {
    vi.doMock('../../dataStore.js', () => ({
      listGames: vi.fn(async () => [{ id: '4124', seasonId: SEASON, date: '2026-10-04T10:00:00.000Z', opponent: 'Kosz-All-In', result: 'W', scoreUs: 86, scoreThem: 20 }]),
      getTeamTrends: vi.fn(async () => [{ date: '2026-10-04', opponent: 'Kosz-All-In', efg: 0.55, tovPct: 0.123, orbPct: null, ftRate: 0.4, offRtg: 120.44, scoreUs: 86, scoreThem: 20 }]),
      getTrainingPriorities: vi.fn(async () => ({ team: { turnovers: 11, efgPercentage: 55 }, league: { turnovers: 25, efgPercentage: 30 } })),
      getNextOpponentScouting: vi.fn(async () => null)
    }));
    vi.doMock('../../ai/buildMatchContext.js', () => ({
      buildMatchContext: vi.fn(async () => ({
        payload: {
          teams: {
            bekapaka: { totals: { pts: 86, fgm: 30, fga: 60, fgPct: 50, threePm: 5, threePa: 15, threePct: 33.3, ftPct: 75, reb: 42, orb: 12, ast: 20, stl: 10, tov: 11, blk: 3 }, fourFactors: { efgPct: 54.2 }, benchPts: 28, pointsSources: null, players: [{ name: 'Filip Karpiński', number: 69, pts: 28, reb: 6, ast: 4, tov: 2, eval: 36 }] },
            opponent: { totals: {}, fourFactors: {}, players: [{ name: 'Adam Nowak', number: 7, pts: 9 }] }
          },
          playByPlay: { available: false },
          ruleInsights: [{ type: 'warning', text: 'x' }]
        }
      }))
    }));
    const { buildBriefingContext } = await import('../../ai/buildBriefingContext.js');
    const ctx = await buildBriefingContext(SEASON);
    expectCleanPayload(ctx.payload);
    expect(ctx.payload.lastGame.boxScore.totals).toMatchObject({ fg: '30/60', reb: 42, tov: 11 });
    expect(ctx.payload.lastGame.boxScore.topScorers[0].name).toBe('Filip Karpiński');
    expect(ctx.payload.recentTrends[0]).toMatchObject({ efgPct: 55, tovPct: 12.3, orbPct: null, ftRate: 40, offRtg: 120.4 });
    expect(ctx.payload.trainingPriorities.team.turnovers).toBe(11);
  });

  it('scouting: payload degrades gracefully without KALK v2 data and builds clean payload', async () => {
    vi.doMock('../../dataStore.js', () => ({ getGameById: vi.fn() }));
    const { buildScoutingAiPayload, loadScoutingExtras, scoutingReportKey, parseScoutingReportKey } = await import('../../ai/scoutingData.js');
    const extras = await loadScoutingExtras({ opponentName: 'Kosz-All-In', seasonId: SEASON });
    const payload = buildScoutingAiPayload(
      {
        seasonId: SEASON,
        teamInfo: { opponent: { name: 'Kosz-All-In', ppg: 61.333333, oppg: NaN }, bekapaka: { name: 'BeKaPaKa', ppg: 70 } },
        keyPlayers: [{ name: 'Adam Nowak', ppg: 12.25, totalPoints: 49, matches: 4, threePointStats: '-' }],
        form: [],
        advancedStats: { fallbackBasicOnly: true, pace: null, fourFactors: { efg: null, ftr: null } },
        bekapakaAdvancedStats: null
      },
      extras
    );
    const { sanitizeAiPayload } = await import('../../ai/payloadUtils.js');
    const clean = sanitizeAiPayload(payload);
    expectCleanPayload(clean);
    expect(clean.teamInfo.opponent.ppg).toBe(61.3);
    expect(clean.keyPlayers[0]).toMatchObject({ name: 'Adam Nowak', ppg: 12.3, games: 4, threePointStats: null });
    expect(clean.playByPlayTendencies.available).toBe(false);
    expect(clean.headToHead).toEqual([]);
    expect(scoutingReportKey('Kosz-All-In', SEASON)).toBe(`${SEASON}::kosz`);
    expect(parseScoutingReportKey(`${SEASON}::kosz`)).toEqual({ seasonId: SEASON, opponentKey: 'kosz' });
    expect(parseScoutingReportKey('kosz')).toEqual({ seasonId: null, opponentKey: 'kosz' });
  });

  it('buildScoutingContext passes seasonId through and uses a season-scoped key', async () => {
    const getDetailedScouting = vi.fn(async () => ({
      seasonId: SEASON,
      teamInfo: { opponent: { name: 'Kosz-All-In' } },
      aiPayload: { teamInfo: { opponent: { name: 'Kosz-All-In' } } },
      aiPayloadHash: 'h1'
    }));
    vi.doMock('../../dataStore.js', () => ({ getDetailedScouting }));
    const { buildScoutingContext } = await import('../../ai/buildScoutingContext.js');
    const ctx = await buildScoutingContext('Kosz-All-In', SEASON);
    expect(getDetailedScouting).toHaveBeenCalledWith('Kosz-All-In', SEASON, { includeAiPayload: true });
    expect(ctx).toMatchObject({ opponentKey: `${SEASON}::kosz`, seasonId: SEASON, hash: 'h1' });
  });
});
