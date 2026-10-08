import { describe, expect, it } from 'vitest';
import { createFakePrisma } from '../helpers/fakePrisma.js';
import {
  computeMatchRecords,
  computeScoringRuns,
  getGameInfo,
  getGamePlayByPlay,
  getPlayerCareer,
  periodLabel,
  rosterKalkSlug
} from '../../kalk/v2/readModels.js';

const S26 = 'season_2026-2027';
const S25 = 'season_2025-2026';
const S23 = 'season_2023-2024';

const seasons = [
  { id: S23, slug: '2023-2024', label: 'Sezon 2023/2024', isActive: false },
  { id: S25, slug: '2025-2026', label: 'Sezon 2025/2026', isActive: false },
  { id: S26, slug: '2026-2027', label: 'Sezon 2026/2027', isActive: true }
];

const player = (name, slug, number, stats) => ({ name, slug, number, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, eval: 0, ...stats });

function match(overrides = {}) {
  return {
    id: '4124',
    seasonId: S26,
    slug: '4124',
    date: new Date('2026-10-04T10:00:00Z'),
    homeTeamId: '138',
    guestTeamId: '148',
    homeTeamName: 'BeKaPaKa Bobolice',
    guestTeamName: 'Kosz-All-In',
    scoreHome: 86,
    scoreAway: 20,
    isFinished: true,
    sourceSite: 'v2',
    hasPlayByPlay: true,
    overtimes: 0,
    refereeList: ['Jan Kowalski', 'Adam Nowak'],
    commissioner: 'Piotr Zieliński',
    stageLabel: 'Sezon zasadniczy',
    roundLabel: 'Kolejka - 3',
    venue: 'ZOS - KOSiR',
    mvpPlayerSlug: 'filip-karpinski',
    mvpEval: 36,
    info: {
      mvp: { slug: 'filip-karpinski', name: 'Filip Karpiński', number: 69, eval: 36 },
      quarters: [{ period: 2, label: 'Kw. 2', home: 23, away: 6 }, { period: 1, label: 'Kw. 1', home: 26, away: 4 }],
      flow5: [{ minute: 5, home: 13, away: 2 }],
      leaders: { pts: [{ slug: 'filip-karpinski', name: 'Filip Karpiński', teamKalkId: '138', value: 28 }] },
      pointsSources: { home: { ptsOffTurnovers: 26, ptsInPaint: 0, secondChancePts: 10, fastBreakPts: 44 }, away: { ptsOffTurnovers: 2, ptsInPaint: 0, secondChancePts: 6, fastBreakPts: 2 } }
    },
    boxScore: {
      teams: [
        {
          name: 'BeKaPaKa Bobolice',
          players: [
            player('F. Karpiński', 'filip-karpinski', 69, { pts: 28, reb: 6, ast: 4, stl: 2, blk: 0, eval: 36 }),
            player('D. Olearczyk', 'dawid-olearczyk', 1, { pts: 12, reb: 6, ast: 11, stl: 2, blk: 1, eval: 24 })
          ]
        },
        {
          name: 'Kosz-All-In',
          players: [
            player('F. Filipczak', 'filip-filipczak', 11, { pts: 8, reb: 5, ast: 1, eval: -2 }),
            player('J. Redlarski', 'jakub-redlarski', 12, { pts: 8, reb: 3, ast: 2, eval: -5 })
          ]
        }
      ]
    },
    ...overrides
  };
}

describe('periodLabel', () => {
  it('labels regulation and overtime periods', () => {
    expect(periodLabel(1)).toBe('Q1');
    expect(periodLabel(4)).toBe('Q4');
    expect(periodLabel(5)).toBe('OT1');
  });
});

describe('computeScoringRuns', () => {
  it('detects unanswered runs with sequence bounds', () => {
    const events = [
      { seq: 1, period: 1, scoreHome: 2, scoreAway: 0 },
      { seq: 2, period: 1, scoreHome: 2, scoreAway: 2 },
      { seq: 3, period: 1, scoreHome: 5, scoreAway: 2 },
      { seq: 4, period: 1, scoreHome: 5, scoreAway: 2 }, // bez zmiany wyniku (np. zbiórka)
      { seq: 5, period: 1, scoreHome: 7, scoreAway: 2 },
      { seq: 6, period: 2, scoreHome: 10, scoreAway: 2 },
      { seq: 7, period: 2, scoreHome: 12, scoreAway: 2 },
      { seq: 8, period: 2, scoreHome: 12, scoreAway: 4 }
    ];
    const runs = computeScoringRuns(events, 8);
    expect(runs).toEqual([
      { side: 'home', points: 10, startSeq: 3, endSeq: 7, period: 1, endPeriod: 2, fromScore: { home: 2, away: 2 }, toScore: { home: 12, away: 2 } }
    ]);
  });
});

describe('getGamePlayByPlay', () => {
  it('returns null for unknown match', async () => {
    const prisma = createFakePrisma({ kalkSeason: seasons, kalkMatch: [match()] });
    expect(await getGamePlayByPlay(prisma, '9999', { seasonId: S26 })).toBeNull();
  });

  it('returns available:false when the match has no play-by-play', async () => {
    const prisma = createFakePrisma({ kalkSeason: seasons, kalkMatch: [match({ hasPlayByPlay: false })] });
    const data = await getGamePlayByPlay(prisma, '4124', { seasonId: S26 });
    expect(data.available).toBe(false);
    expect(data.events).toEqual([]);
    expect(data.bekapakaSide).toBe('home');
  });

  it('returns events, periods, runs and lead stats', async () => {
    const ev = (seq, period, side, h, a, extra = {}) => ({
      seasonId: S26, kalkMatchId: '4124', seq, period, clockSec: 600 - seq * 10, side, actionRaw: 'x',
      actionType: h + a > 0 ? 'shot_made' : 'period_start', scoreHome: h, scoreAway: a, isScoring: false, ...extra
    });
    const events = [
      ev(1, 1, null, 0, 0),
      ev(2, 1, 'away', 0, 2, { isScoring: true }),
      ev(3, 1, 'home', 2, 2, { isScoring: true }),
      ev(4, 1, 'home', 5, 2, { isScoring: true }),
      ev(5, 2, 'home', 13, 2, { isScoring: true })
    ];
    const prisma = createFakePrisma({ kalkSeason: seasons, kalkMatch: [match()], kalkPlayByPlayEvent: events });
    const data = await getGamePlayByPlay(prisma, '4124', { seasonId: S26 });
    expect(data.available).toBe(true);
    expect(data.events).toHaveLength(5);
    expect(data.events[0]).not.toHaveProperty('kalkMatchId');
    expect(data.periods).toEqual([
      { period: 1, label: 'Q1', scoreHome: 5, scoreAway: 2 },
      { period: 2, label: 'Q2', scoreHome: 13, scoreAway: 2 }
    ]);
    expect(data.runs).toHaveLength(1);
    expect(data.runs[0]).toMatchObject({ side: 'home', points: 13, startSeq: 3, endSeq: 5 });
    expect(data.leadChanges).toBe(1);
    expect(data.ties).toBe(1);
    expect(data.largestLead).toEqual({ home: 11, away: 2 });
  });
});

describe('computeMatchRecords', () => {
  it('picks top performers per team with ties', () => {
    const rec = computeMatchRecords(match());
    expect(rec.home.pts).toEqual({ value: 28, players: [{ name: 'F. Karpiński', slug: 'filip-karpinski', number: 69 }] });
    expect(rec.home.ast.value).toBe(11);
    expect(rec.home.blk.players[0].slug).toBe('dawid-olearczyk');
    expect(rec.away.pts.players.map((p) => p.slug)).toEqual(['filip-filipczak', 'jakub-redlarski']);
    expect(rec.away.blk).toBeNull();
    expect(rec.away.eval.value).toBe(-2);
  });
});

describe('getGameInfo', () => {
  const previous = [
    // v2, te same ID drużyn, inna nazwa rywala (zmiana nazwy) → H2H
    { id: '4001', seasonId: S26, date: new Date('2026-09-01T10:00:00Z'), homeTeamId: '148', guestTeamId: '138', homeTeamName: 'Kosz All In (stara nazwa)', guestTeamName: 'BeKaPaKa Bobolice', scoreHome: 50, scoreAway: 60, isFinished: true, sourceSite: 'v2', boxScore: {} },
    // legacy po nazwach
    { id: '900', seasonId: S25, date: new Date('2025-11-01T10:00:00Z'), homeTeamId: null, guestTeamId: null, homeTeamName: 'BeKaPaKa BOBOLICE', guestTeamName: 'Kosz-All-In', scoreHome: 70, scoreAway: 72, isFinished: true, sourceSite: 'legacy', boxScore: {} },
    { id: '800', seasonId: S23, date: new Date('2024-01-10T10:00:00Z'), homeTeamId: null, guestTeamId: null, homeTeamName: 'Kosz-All-In', guestTeamName: 'BeKaPaKa', scoreHome: 40, scoreAway: 80, isFinished: true, sourceSite: 'v2', boxScore: {} },
    // legacy z tym samym ID co rywal, ale inna drużyna → nie H2H
    { id: '700', seasonId: S25, date: new Date('2025-10-01T10:00:00Z'), homeTeamId: '148', guestTeamId: '999', homeTeamName: 'Inna Drużyna', guestTeamName: 'BeKaPaKa Bobolice', scoreHome: 10, scoreAway: 20, isFinished: true, sourceSite: 'legacy', boxScore: {} },
    // późniejszy mecz → pominięty
    { id: '5000', seasonId: S26, date: new Date('2027-01-01T10:00:00Z'), homeTeamId: '138', guestTeamId: '148', homeTeamName: 'BeKaPaKa Bobolice', guestTeamName: 'Kosz-All-In', scoreHome: 1, scoreAway: 0, isFinished: true, sourceSite: 'v2', boxScore: {} },
    // nierozegrany → pominięty
    { id: '4002', seasonId: S26, date: new Date('2026-09-20T10:00:00Z'), homeTeamId: '138', guestTeamId: '148', homeTeamName: 'BeKaPaKa Bobolice', guestTeamName: 'Kosz-All-In', scoreHome: null, scoreAway: null, isFinished: false, sourceSite: 'v2', boxScore: {} }
  ];
  const teamStat = (side, extra) => ({ seasonId: S26, kalkMatchId: '4124', side, teamName: side, opponentName: 'x', pts: 0, ptsAgainst: 0, startersPts: 58, benchPts: 28, updatedAt: new Date(), ...extra });

  it('returns 404 shape (null) for unknown match', async () => {
    const prisma = createFakePrisma({ kalkSeason: seasons, kalkMatch: [match()] });
    expect(await getGameInfo(prisma, 'nope')).toBeNull();
  });

  it('builds info with MVP, referees, team stats, records and ordered H2H', async () => {
    const prisma = createFakePrisma({
      kalkSeason: seasons,
      kalkMatch: [match(), ...previous],
      kalkTeamGameStat: [teamStat('home', { pts: 86 }), teamStat('away', { pts: 20, startersPts: 20, benchPts: 0 })]
    });
    const info = await getGameInfo(prisma, '4124', { seasonId: S26 });
    expect(info.mvp).toMatchObject({ slug: 'filip-karpinski', side: 'home', teamName: 'BeKaPaKa Bobolice', line: { pts: 28, eval: 36 } });
    expect(info.referees).toEqual(['Jan Kowalski', 'Adam Nowak']);
    expect(info.commissioner).toBe('Piotr Zieliński');
    expect(info.quarters.map((q) => q.label)).toEqual(['Q1', 'Q2']);
    expect(info.leaders.pts[0].side).toBe('home');
    expect(info.teamStats.home).toMatchObject({ startersPts: 58, benchPts: 28 });
    expect(info.teamStats.home).not.toHaveProperty('seasonId');
    expect(info.teamStats.away.benchPts).toBe(0);
    expect(info.records.home.pts.value).toBe(28);
    expect(info.h2h.focusSide).toBe('home');
    expect(info.h2h.meetings.map((m) => m.matchId)).toEqual(['4001', '900', '800']);
    expect(info.h2h.meetings[0]).toMatchObject({ focusAtHome: false, focusScore: 60, otherScore: 50, focusWon: true });
    expect(info.h2h.meetings[1]).toMatchObject({ focusScore: 70, otherScore: 72, focusWon: false });
    expect(info.h2h).toMatchObject({ games: 3, focusWins: 2, otherWins: 1 });
  });

  it('limits H2H to 10 meetings', async () => {
    const many = Array.from({ length: 14 }, (_, i) => ({
      id: `h${i}`, seasonId: S25, date: new Date(Date.UTC(2025, 0, i + 1)), homeTeamId: null, guestTeamId: null,
      homeTeamName: 'BeKaPaKa Bobolice', guestTeamName: 'Kosz-All-In', scoreHome: 60 + i, scoreAway: 50, isFinished: true, sourceSite: 'legacy', boxScore: {}
    }));
    const prisma = createFakePrisma({ kalkSeason: seasons, kalkMatch: [match(), ...many] });
    const info = await getGameInfo(prisma, '4124', { seasonId: S26 });
    expect(info.h2h.meetings).toHaveLength(10);
    expect(info.h2h.meetings[0].matchId).toBe('h13');
  });
});

describe('getPlayerCareer', () => {
  const statRow = (seasonId, extra) => ({
    seasonId, playerSlug: 'filip-karpinski', competition: 'Dywizja II', teamKey: '138', teamName: 'BeKaPaKa Bobolice', teamKalkId: '138',
    games: 2, minutesTotal: 60, pts: 30, twoPm: 10, twoPa: 20, twoPct: 50, threePm: 2, threePa: 5, threePct: 40, ftm: 4, fta: 8, ftPct: 50,
    orb: 2, drb: 8, reb: 10, ast: 5, stl: 3, tov: 4, blk: 1, pf: 6, pfDrawn: 2, eval: 25, plusMinus: 0, source: 'kalk-page', ...extra
  });

  it('resolves roster id → slug, averages per game and fills missing seasons from profile', async () => {
    const prisma = createFakePrisma({
      kalkSeason: seasons,
      rosterPlayer: [{ id: 'r1', firstName: 'Filip', lastName: 'Karpiński', kalkSlug: null, kalkPlayerId: '2026-2027__filip-karpinski', position: 'SF', heightCm: null, number: 69 }],
      kalkPlayerProfile: [{
        slug: 'filip-karpinski', fullName: 'Filip Karpiński', position: 'SF', heightCm: 185, birthYear: null, lastNumber: 69,
        otherCompetitions: [
          { seasonLabel: '2025/2026', competition: 'Dywizja II', teamName: 'BeKaPaKa BOBOLICE', teamKalkId: '138', games: 12, minutesTotal: 25416, pts: 179, twoPm: 82, twoPct: 49.7, threePm: 1, threePct: 20, ftm: 12, ftPct: 44.4, orb: 29, drb: 70, reb: 99, ast: 21, stl: 31, tov: 31, blk: 1, pf: 26, pfDrawn: 24, eval: 198, plusMinus: -22 },
          { seasonLabel: '2026/2027', competition: 'Dywizja II', teamName: 'BeKaPaKa Bobolice', games: 99, pts: 999 },
          { seasonLabel: '2019/2020', competition: 'Dywizja II', teamName: 'Old', games: 5, pts: 10 }
        ]
      }],
      kalkPlayerSeasonStat: [statRow(S26)],
      kalkMatch: [match()],
      kalkPlayerGameLog: [
        { id: 'l1', seasonId: S26, kalkPlayerId: '2026-2027__filip-karpinski', kalkMatchId: '4124', playerSlug: 'filip-karpinski', teamName: 'BeKaPaKa', opponentName: 'Kosz-All-In', isWin: true, starter: true, pts: 28, reb: 6, ast: 4, stl: 2, blk: 0, eval: 36, stats: {} },
        { id: 'l2', seasonId: S26, kalkPlayerId: '2026-2027__filip-karpinski', kalkMatchId: '4125', playerSlug: null, teamName: 'BeKaPaKa', opponentName: 'Pantery', isWin: false, stats: { pts: 12, reb: 11, ast: 1, eval: 15, starter: false } }
      ]
    });
    const career = await getPlayerCareer(prisma, 'r1');
    expect(career.slug).toBe('filip-karpinski');
    expect(career.profile).toMatchObject({ position: 'SF', heightCm: 185 });
    expect(career.seasons.map((s) => s.seasonLabel)).toEqual(['2025/2026', '2026/2027']);

    const current = career.seasons[1];
    expect(current.source).toBe('kalk-page');
    expect(current.perGame).toMatchObject({ pts: 15, reb: 5, ast: 2.5, min: 30, eval: 12.5 });
    expect(current.pct).toEqual({ fg: 48, two: 50, three: 40, ft: 50 });

    const past = career.seasons[0];
    expect(past.source).toBe('kalk-profile');
    expect(past.perGame.min).toBe(35.3); // sekundy z profilu → minuty
    expect(past.perGame.pts).toBe(14.9);

    expect(career.gameLogSummary).toHaveLength(1);
    expect(career.gameLogSummary[0]).toMatchObject({ seasonLabel: '2026/2027', games: 2, wins: 1, losses: 1, starts: 1, doubleDoubles: 1 });
    expect(career.gameLogSummary[0].bestPts).toMatchObject({ value: 28, matchId: '4124', opponent: 'Kosz-All-In' });
    expect(career.gameLogSummary[0].bestPts.date).toBe('2026-10-04T10:00:00.000Z');
  });

  it('accepts a kalk slug directly and 404s (null) for unknown players', async () => {
    const prisma = createFakePrisma({ kalkSeason: seasons, kalkPlayerSeasonStat: [statRow(S26)] });
    const career = await getPlayerCareer(prisma, 'filip-karpinski');
    expect(career.rosterPlayerId).toBeNull();
    expect(career.seasons).toHaveLength(1);
    expect(await getPlayerCareer(prisma, 'nobody-here')).toBeNull();
  });

  it('roster player without KALK identity returns empty career', async () => {
    const prisma = createFakePrisma({ kalkSeason: seasons, rosterPlayer: [{ id: 'r2', firstName: 'QA', lastName: 'Panel', kalkSlug: null, kalkPlayerId: null, position: 'PG', heightCm: 180, number: 5 }] });
    const career = await getPlayerCareer(prisma, 'r2');
    expect(career).toMatchObject({ slug: null, seasons: [], profile: { position: 'PG', heightCm: 180 } });
  });

  it('rosterKalkSlug prefers kalkSlug', () => {
    expect(rosterKalkSlug({ kalkSlug: 'a', kalkPlayerId: '2026-2027__b' })).toBe('a');
    expect(rosterKalkSlug({ kalkPlayerId: '2026-2027__b' })).toBe('b');
    expect(rosterKalkSlug({ kalkPlayerId: 'legacy-id' })).toBeNull();
  });
});
