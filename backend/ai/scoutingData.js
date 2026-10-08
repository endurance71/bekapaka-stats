import { prisma } from '../lib/prisma.js';
import { isBekapakaTeamName } from '../kalk/parseMatchBoxScore.js';
import { normalizeOpponentKey } from './normalizeOpponent.js';
import { aggregatePbpTendencies, computePbpInsights } from './pbpInsights.js';
import { isoDate, loadHeadToHead } from './buildMatchContext.js';
import { intOrNull, pctOrNull, roundOrNull, teamNameMatches } from './payloadUtils.js';

const SEASON_KEY_SEPARATOR = '::';

/**
 * Klucz ScoutingAiReport per sezon: `{seasonId}::{opponentKey}`.
 * Stare wiersze (sprzed P6) mają sam `opponentKey` — czytane jako fallback (patrz findScoutingReport).
 * @param {string} opponentName
 * @param {string | null | undefined} seasonId
 */
export function scoutingReportKey(opponentName, seasonId) {
  const base = normalizeOpponentKey(opponentName);
  return seasonId ? `${seasonId}${SEASON_KEY_SEPARATOR}${base}` : base;
}

/**
 * @param {string} key
 * @returns {{ seasonId: string | null, opponentKey: string }}
 */
export function parseScoutingReportKey(key) {
  const idx = String(key || '').indexOf(SEASON_KEY_SEPARATOR);
  if (idx < 0) return { seasonId: null, opponentKey: String(key || '') };
  return { seasonId: key.slice(0, idx), opponentKey: key.slice(idx + SEASON_KEY_SEPARATOR.length) };
}

/**
 * Czy stary raport (bez sezonu w kluczu) może reprezentować dany sezon:
 * data generacji w zakresie dat sezonu, a gdy sezon nie ma dat — tylko sezon aktywny.
 * @param {{ generatedAt?: Date | string | null }} report
 * @param {{ startsAt?: Date | null, endsAt?: Date | null, isActive?: boolean } | null} season
 */
export function legacyReportMatchesSeason(report, season) {
  if (!report || !season) return false;
  const at = report.generatedAt ? new Date(report.generatedAt) : null;
  if (season.startsAt || season.endsAt) {
    if (!at || Number.isNaN(at.getTime())) return false;
    if (season.startsAt && at < new Date(season.startsAt)) return false;
    if (season.endsAt && at > new Date(season.endsAt)) return false;
    return true;
  }
  return Boolean(season.isActive);
}

/**
 * Raport scoutingu dla sezonu: najpierw klucz sezonowy, potem stary klucz (bez sezonu).
 * @param {string} opponentName
 * @param {string | null | undefined} seasonId
 * @returns {Promise<{ report: any | null, key: string, legacy: boolean }>}
 */
export async function findScoutingReport(opponentName, seasonId) {
  const key = scoutingReportKey(opponentName, seasonId);
  const seasonal = seasonId
    ? await prisma.scoutingAiReport.findUnique({ where: { opponentKey: key } })
    : null;
  if (seasonal) return { report: seasonal, key, legacy: false };

  const legacyKey = normalizeOpponentKey(opponentName);
  const legacy = await prisma.scoutingAiReport.findUnique({ where: { opponentKey: legacyKey } });
  if (!legacy) return { report: null, key, legacy: false };
  if (!seasonId) return { report: legacy, key: legacyKey, legacy: true };

  const season = await safe(() => prisma.kalkSeason.findUnique({ where: { id: seasonId } }), null);
  if (legacyReportMatchesSeason(legacy, season)) {
    return { report: legacy, key: legacyKey, legacy: true };
  }
  return { report: null, key, legacy: false };
}

/**
 * @template T
 * @param {() => Promise<T>} fn
 * @param {T} fallback
 * @returns {Promise<T>}
 */
async function safe(fn, fallback) {
  try {
    const value = await fn();
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Sekundy gry z KalkPlayerSeasonStat.minutesTotal (KALK v2 podaje sekundy) → minuty na mecz.
 * @param {number | null | undefined} total
 * @param {number} games
 */
function minutesPerGame(total, games) {
  if (!Number.isFinite(total) || !games) return null;
  const perGame = total / games;
  // > 60 „minut” na mecz jest niemożliwe → wartość w sekundach.
  return roundOrNull(perGame > 60 ? perGame / 60 : perGame, 1);
}

/**
 * @param {Record<string, any>} row — KalkPlayerSeasonStat
 */
export function seasonStatToKeyPlayer(row) {
  const g = row.games || 0;
  const per = (v) => (g > 0 && Number.isFinite(v) ? roundOrNull(v / g, 1) : null);
  return {
    name: row.playerName || row.fullName || row.playerSlug,
    games: g,
    mpg: minutesPerGame(row.minutesTotal, g),
    ppg: per(row.pts),
    rpg: per(row.reb),
    orbPg: per(row.orb),
    apg: per(row.ast),
    spg: per(row.stl),
    bpg: per(row.blk),
    tovPg: per(row.tov),
    pfPg: per(row.pf),
    threePmPg: per(row.threePm),
    threePct: roundOrNull(row.threePct, 1) ?? pctOrNull(row.threePm, row.threePa),
    twoPct: roundOrNull(row.twoPct, 1) ?? pctOrNull(row.twoPm, row.twoPa),
    ftPct: roundOrNull(row.ftPct, 1) ?? pctOrNull(row.ftm, row.fta),
    evalPg: per(row.eval),
    plusMinus: intOrNull(row.plusMinus)
  };
}

/**
 * Stary katalog KalkPlayer → kluczowy zawodnik (gdy brak KalkPlayerSeasonStat).
 * @param {Record<string, any>} p
 */
function legacyKalkPlayerToKeyPlayer(p) {
  const trimmed = String(p.name || '').trim();
  const parts = trimmed.split(/\s+/);
  const name = parts.length === 2 ? `${parts[1]} ${parts[0]}` : trimmed;
  return {
    name,
    games: intOrNull(p.matchesPlayed),
    mpg: roundOrNull(p.minutesAverage, 1),
    ppg: roundOrNull(p.pointsAverage, 1),
    rpg: roundOrNull(p.reboundsAverage, 1),
    apg: roundOrNull(p.assistsAverage, 1),
    spg: roundOrNull(p.stealsAverage, 1),
    bpg: roundOrNull(p.blocksAverage, 1),
    tovPg: roundOrNull(p.turnoversAverage, 1),
    pfPg: roundOrNull(p.foulsAverage, 1),
    threePct: roundOrNull(p.threePointsPct, 1),
    threePointStats: p.threePointStats || null,
    twoPct: roundOrNull(p.twoPointsPct, 1),
    ftPct: roundOrNull(p.ftPct, 1),
    evalPg: roundOrNull(p.eval, 1)
  };
}

const QUARTER_KEYS = ['q1', 'q2', 'q3', 'q4'];

/**
 * Średnie drużyny z KalkTeamGameStat (wiersze rywala + wiersze jego przeciwników).
 * @param {Array<Record<string, any>>} own
 * @param {Array<Record<string, any>>} against
 */
export function teamSeasonAveragesFromStats(own, against) {
  if (!own.length) return null;
  const n = own.length;
  const avg = (rows, key) => {
    const vals = rows.map((r) => r[key]).filter((v) => Number.isFinite(v));
    return vals.length ? roundOrNull(vals.reduce((a, b) => a + b, 0) / vals.length, 1) : null;
  };
  const sum = (rows, key) => rows.reduce((a, r) => a + (Number.isFinite(r[key]) ? r[key] : 0), 0);
  return {
    games: n,
    ppg: avg(own, 'pts'),
    oppg: avg(own, 'ptsAgainst'),
    rpg: avg(own, 'reb'),
    orbPg: avg(own, 'orb'),
    apg: avg(own, 'ast'),
    spg: avg(own, 'stl'),
    bpg: avg(own, 'blk'),
    tovPg: avg(own, 'tov'),
    pfPg: avg(own, 'pf'),
    threePmPg: avg(own, 'threePm'),
    threePct: pctOrNull(sum(own, 'threePm'), sum(own, 'threePa')),
    ftPct: pctOrNull(sum(own, 'ftm'), sum(own, 'fta')),
    benchPtsPg: avg(own, 'benchPts'),
    fastBreakPtsPg: avg(own, 'fastBreakPts'),
    ptsOffTurnoversPg: avg(own, 'ptsOffTurnovers'),
    secondChancePtsPg: avg(own, 'secondChancePts'),
    ptsInPaintPg: avg(own, 'ptsInPaint'),
    quarterScoring: Object.fromEntries(
      QUARTER_KEYS.map((q) => [q, { for: avg(own, q), against: avg(against, q) }])
    )
  };
}

/**
 * Dodatkowe dane scoutingowe z KALK v2 (degradują się do null / available:false dla starych sezonów).
 * @param {{ opponentName: string, seasonId: string | null | undefined }} input
 */
export async function loadScoutingExtras({ opponentName, seasonId }) {
  if (!opponentName) return {};
  const simple = String(opponentName).split('-')[0].trim() || opponentName;

  const statRowForId = seasonId
    ? await safe(
        () =>
          prisma.kalkTeamGameStat.findFirst({
            where: { seasonId, teamName: { contains: simple, mode: 'insensitive' } },
            select: { teamKalkId: true }
          }),
        null
      )
    : null;
  const teamKalkId = statRowForId?.teamKalkId || null;

  const teamWhere = teamKalkId
    ? { OR: [{ teamKalkId }, { teamName: { contains: simple, mode: 'insensitive' } }] }
    : { teamName: { contains: simple, mode: 'insensitive' } };

  const [seasonStats, legacyPlayers, matches, prevSeasonRows, headToHead] = await Promise.all([
    seasonId
      ? safe(
          () =>
            prisma.kalkPlayerSeasonStat.findMany({
              where: {
                seasonId,
                ...(teamKalkId
                  ? { OR: [{ teamKalkId }, { teamName: { contains: simple, mode: 'insensitive' } }] }
                  : { teamName: { contains: simple, mode: 'insensitive' } })
              },
              orderBy: { pts: 'desc' },
              take: 12
            }),
          []
        )
      : [],
    seasonId
      ? safe(
          () =>
            prisma.kalkPlayer.findMany({
              where: { seasonId, team: { contains: simple, mode: 'insensitive' }, name: { not: '' } },
              orderBy: { pointsAverage: 'desc' },
              take: 8
            }),
          []
        )
      : [],
    seasonId
      ? safe(
          () =>
            prisma.kalkMatch.findMany({
              where: {
                seasonId,
                isFinished: true,
                OR: [
                  ...(teamKalkId ? [{ homeTeamId: teamKalkId }, { guestTeamId: teamKalkId }] : []),
                  { homeTeamName: { contains: simple, mode: 'insensitive' } },
                  { guestTeamName: { contains: simple, mode: 'insensitive' } }
                ]
              },
              orderBy: { date: 'desc' },
              take: 12,
              select: {
                id: true,
                date: true,
                homeTeamName: true,
                guestTeamName: true,
                homeTeamId: true,
                guestTeamId: true,
                scoreHome: true,
                scoreAway: true,
                roundLabel: true,
                roundCode: true
              }
            }),
          []
        )
      : [],
    safe(
      () =>
        prisma.kalkTeamGameStat.findMany({
          where: { ...teamWhere, ...(seasonId ? { NOT: { seasonId } } : {}) },
          select: { seasonId: true, pts: true, ptsAgainst: true, isWin: true }
        }),
      []
    ),
    loadHeadToHead({ opponentName, opponentKalkId: teamKalkId, before: null, take: 6 })
  ]);

  const slugs = seasonStats.map((r) => r.playerSlug).filter(Boolean);
  const [profiles, catalog] = slugs.length
    ? await Promise.all([
        safe(
          () => prisma.kalkPlayerProfile.findMany({ where: { slug: { in: slugs } }, select: { slug: true, fullName: true } }),
          []
        ),
        safe(
          () => prisma.kalkPlayer.findMany({ where: { seasonId, slug: { in: slugs } }, select: { slug: true, name: true } }),
          []
        )
      ])
    : [[], []];
  /** @type {Map<string, string>} */
  const nameBySlug = new Map();
  for (const c of catalog) if (c.slug && c.name) nameBySlug.set(c.slug, c.name);
  for (const pr of profiles) if (pr.slug && pr.fullName) nameBySlug.set(pr.slug, pr.fullName);

  const isOpponentSide = (m, side) => {
    const id = side === 'home' ? m.homeTeamId : m.guestTeamId;
    const name = side === 'home' ? m.homeTeamName : m.guestTeamName;
    if (teamKalkId && id) return id === teamKalkId;
    return teamNameMatches(name, opponentName);
  };
  const oppMatches = matches.filter((m) => isOpponentSide(m, 'home') || isOpponentSide(m, 'away'));

  const form = oppMatches.slice(0, 5).map((m) => {
    const oppHome = isOpponentSide(m, 'home');
    const own = oppHome ? m.scoreHome : m.scoreAway;
    const other = oppHome ? m.scoreAway : m.scoreHome;
    const known = own !== null && own !== undefined && other !== null && other !== undefined;
    return {
      date: isoDate(m.date),
      round: m.roundLabel ?? m.roundCode ?? null,
      opponent: oppHome ? m.guestTeamName : m.homeTeamName,
      vsBekapaka: isBekapakaTeamName(oppHome ? m.guestTeamName : m.homeTeamName),
      score: known ? `${own}:${other}` : null,
      result: known ? (own > other ? 'W' : own < other ? 'L' : null) : null
    };
  });

  const matchIds = oppMatches.map((m) => m.id);
  const [statRows, pbpRows] = await Promise.all([
    matchIds.length
      ? safe(() => prisma.kalkTeamGameStat.findMany({ where: { seasonId, kalkMatchId: { in: matchIds } } }), [])
      : [],
    matchIds.length
      ? safe(
          () =>
            prisma.kalkPlayByPlayEvent.findMany({
              where: { seasonId, kalkMatchId: { in: matchIds.slice(0, 8) } },
              orderBy: [{ kalkMatchId: 'asc' }, { seq: 'asc' }],
              select: {
                kalkMatchId: true,
                seq: true,
                period: true,
                clockSec: true,
                side: true,
                playerName: true,
                actionType: true,
                scoreHome: true,
                scoreAway: true,
                isScoring: true
              }
            }),
          []
        )
      : []
  ]);

  const sideByMatch = new Map(oppMatches.map((m) => [m.id, isOpponentSide(m, 'home') ? 'home' : 'away']));
  const ownStats = statRows.filter((r) => sideByMatch.get(r.kalkMatchId) === r.side);
  const againstStats = statRows.filter((r) => sideByMatch.has(r.kalkMatchId) && sideByMatch.get(r.kalkMatchId) !== r.side);

  /** @type {Map<string, object[]>} */
  const eventsByMatch = new Map();
  for (const ev of pbpRows) {
    if (!eventsByMatch.has(ev.kalkMatchId)) eventsByMatch.set(ev.kalkMatchId, []);
    eventsByMatch.get(ev.kalkMatchId).push(ev);
  }
  const pbpList = [...eventsByMatch.entries()].map(([matchId, events]) =>
    computePbpInsights(events, {
      labels: sideByMatch.get(matchId) === 'home'
        ? { home: 'opponent', away: 'other' }
        : { home: 'other', away: 'opponent' }
    })
  );

  /** @type {Map<string, { games: number, wins: number, pts: number, against: number }>} */
  const bySeason = new Map();
  for (const r of prevSeasonRows) {
    const cur = bySeason.get(r.seasonId) || { games: 0, wins: 0, pts: 0, against: 0 };
    cur.games += 1;
    cur.wins += r.isWin ? 1 : 0;
    cur.pts += r.pts || 0;
    cur.against += r.ptsAgainst || 0;
    bySeason.set(r.seasonId, cur);
  }
  const previousSeasons = [...bySeason.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([sid, s]) => ({
      seasonId: sid,
      games: s.games,
      record: `${s.wins}-${s.games - s.wins}`,
      ppg: roundOrNull(s.pts / s.games, 1),
      oppg: roundOrNull(s.against / s.games, 1)
    }));

  return {
    teamKalkId,
    keyPlayers: seasonStats.length
      ? seasonStats
          .filter((r) => (r.games || 0) > 0)
          .map((r) => seasonStatToKeyPlayer({ ...r, playerName: nameBySlug.get(r.playerSlug) || null }))
          .sort((a, b) => (b.ppg ?? 0) - (a.ppg ?? 0))
          .slice(0, 6)
      : legacyPlayers.map(legacyKalkPlayerToKeyPlayer).slice(0, 6),
    keyPlayersSource: seasonStats.length ? 'KalkPlayerSeasonStat' : legacyPlayers.length ? 'KalkPlayer' : null,
    form,
    teamSeasonAverages: teamSeasonAveragesFromStats(ownStats, againstStats),
    playByPlayTendencies: aggregatePbpTendencies(pbpList, 'opponent', 'other'),
    headToHead,
    previousSeasons
  };
}

/**
 * @param {Record<string, any> | null | undefined} adv
 */
function roundAdvanced(adv) {
  if (!adv) return null;
  const r = (v) => roundOrNull(v, 1);
  return {
    ...adv,
    pace: r(adv.pace),
    threePointAccuracy: r(adv.threePointAccuracy),
    fourFactors: adv.fourFactors
      ? Object.fromEntries(Object.entries(adv.fourFactors).map(([k, v]) => [k, r(v)]))
      : null
  };
}

/**
 * @param {Record<string, any> | null | undefined} t
 */
function roundTeamInfo(t) {
  if (!t) return null;
  return { ...t, ppg: roundOrNull(t.ppg, 1), oppg: roundOrNull(t.oppg, 1) };
}

/**
 * Czysty builder payloadu scoutingu dla Gemini.
 * @param {{ seasonId?: string | null, teamInfo: any, keyPlayers?: any[], form?: any[], advancedStats?: any, bekapakaAdvancedStats?: any }} base — z getDetailedScouting
 * @param {Awaited<ReturnType<typeof loadScoutingExtras>>} extras
 */
export function buildScoutingAiPayload(base, extras = {}) {
  const keyPlayers = extras.keyPlayers?.length
    ? extras.keyPlayers
    : (base.keyPlayers || []).map((p) => ({
        name: p.name,
        games: intOrNull(p.matches),
        ppg: roundOrNull(p.ppg, 1),
        totalPoints: intOrNull(p.totalPoints),
        threePointStats: p.threePointStats && p.threePointStats !== '-' ? p.threePointStats : null
      }));

  return {
    seasonId: base.seasonId ?? null,
    teamInfo: {
      opponent: roundTeamInfo(base.teamInfo?.opponent),
      bekapaka: roundTeamInfo(base.teamInfo?.bekapaka)
    },
    keyPlayers,
    form: extras.form?.length ? extras.form : (base.form || []),
    formNote: 'score i result z perspektywy rywala (pierwsza liczba = punkty rywala)',
    teamSeasonAverages: extras.teamSeasonAverages ?? null,
    advancedStats: roundAdvanced(base.advancedStats),
    bekapakaAdvancedStats: roundAdvanced(base.bekapakaAdvancedStats),
    playByPlayTendencies: extras.playByPlayTendencies ?? { available: false, matchesWithPbp: 0 },
    headToHead: extras.headToHead ?? [],
    previousSeasons: extras.previousSeasons ?? []
  };
}
