import { prisma } from '../lib/prisma.js';
import { getGameById } from '../dataStore.js';
import { generateGameInsights } from '../insights.js';
import { isBekapakaTeamName } from '../kalk/parseMatchBoxScore.js';
import { LEAGUE_TABLE_ORDER_BY, resolveLeagueTeamFromList } from '../lib/leagueTeamResolve.js';
import { hashAiPayload } from './hash.js';
import { AiValidationError } from './errors.js';
import { computePbpInsights } from './pbpInsights.js';
import { hasCompleteMatchAnalysisMarkdown } from './matchAnalysisMarkdown.js';
import {
  clockToSeconds,
  intOrNull,
  pctOrNull,
  roundOrNull,
  sanitizeAiPayload,
  secondsToClock
} from './payloadUtils.js';

const TEAM_LABELS = { bekapaka: 'bekapaka', opponent: 'opponent' };

/**
 * @param {unknown} value
 * @returns {string | null}
 */
export function isoDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
}

/**
 * @param {number | null} made
 * @param {number | null} att
 */
function madeAtt(made, att) {
  if (made === null && att === null) return null;
  return `${made ?? 0}/${att ?? 0}`;
}

/**
 * Normalizuje wiersz zawodnika z box score (legacy: two_pm / three_pm / min, v2: twoPm / secondsPlayed).
 * @param {Record<string, any>} p
 */
export function normalizeBoxPlayer(p) {
  const twoPm = intOrNull(p.twoPm ?? p.two_pm);
  const twoPa = intOrNull(p.twoPa ?? p.two_pa);
  const threePm = intOrNull(p.threePm ?? p.three_pm);
  const threePa = intOrNull(p.threePa ?? p.three_pa);
  const fgm = intOrNull(p.fgm) ?? (twoPm !== null || threePm !== null ? (twoPm ?? 0) + (threePm ?? 0) : null);
  const fga = intOrNull(p.fga) ?? (twoPa !== null || threePa !== null ? (twoPa ?? 0) + (threePa ?? 0) : null);
  const orb = intOrNull(p.orb ?? p.oreb);
  const drb = intOrNull(p.drb ?? p.dreb);
  const reb = intOrNull(p.reb) ?? (orb !== null || drb !== null ? (orb ?? 0) + (drb ?? 0) : null);
  const seconds = intOrNull(p.secondsPlayed) ?? clockToSeconds(p.min);
  return {
    name: p.name || p.playerName || null,
    number: intOrNull(p.number),
    starter: typeof p.starter === 'boolean' ? p.starter : null,
    seconds,
    pts: intOrNull(p.pts),
    twoPm,
    twoPa,
    threePm,
    threePa,
    fgm,
    fga,
    ftm: intOrNull(p.ftm),
    fta: intOrNull(p.fta),
    orb,
    drb,
    reb,
    ast: intOrNull(p.ast),
    stl: intOrNull(p.stl),
    tov: intOrNull(p.tov ?? p.turnovers),
    pf: intOrNull(p.pf),
    pfDrawn: intOrNull(p.pfDrawn),
    blk: intOrNull(p.blk),
    blkAgainst: intOrNull(p.blkAgainst),
    eval: intOrNull(p.eval),
    plusMinus: intOrNull(p.plusMinus ?? p.plus_minus)
  };
}

/**
 * Wiersz zawodnika do promptu (pełny box score).
 * @param {ReturnType<typeof normalizeBoxPlayer>} p
 */
function playerForPrompt(p) {
  return {
    name: p.name,
    number: p.number,
    starter: p.starter,
    min: secondsToClock(p.seconds),
    pts: p.pts,
    fg: madeAtt(p.fgm, p.fga),
    twoPt: madeAtt(p.twoPm, p.twoPa),
    threePt: madeAtt(p.threePm, p.threePa),
    ft: madeAtt(p.ftm, p.fta),
    orb: p.orb,
    drb: p.drb,
    reb: p.reb,
    ast: p.ast,
    stl: p.stl,
    tov: p.tov,
    pf: p.pf,
    pfDrawn: p.pfDrawn,
    blk: p.blk,
    blkAgainst: p.blkAgainst,
    eval: p.eval,
    plusMinus: p.plusMinus
  };
}

const TOTAL_KEYS = [
  'pts', 'fgm', 'fga', 'twoPm', 'twoPa', 'threePm', 'threePa', 'ftm', 'fta',
  'orb', 'drb', 'reb', 'ast', 'stl', 'tov', 'pf', 'pfDrawn', 'blk', 'blkAgainst', 'eval'
];

/**
 * Sumy drużyny: KalkTeamGameStat (typowane) albo suma z zawodników.
 * @param {Record<string, any> | null | undefined} teamStat
 * @param {ReturnType<typeof normalizeBoxPlayer>[]} players
 * @param {number | null | undefined} fallbackPts
 * @returns {Record<string, number | null>}
 */
export function teamTotals(teamStat, players, fallbackPts) {
  if (teamStat) {
    return Object.fromEntries(TOTAL_KEYS.map((k) => [k, intOrNull(teamStat[k])]));
  }
  if (!players.length) {
    return Object.fromEntries(TOTAL_KEYS.map((k) => [k, k === 'pts' ? intOrNull(fallbackPts) : null]));
  }
  return Object.fromEntries(
    TOTAL_KEYS.map((k) => {
      const values = players.map((p) => p[k]).filter((v) => v !== null);
      if (values.length === 0) return [k, k === 'pts' ? intOrNull(fallbackPts) : null];
      return [k, values.reduce((a, b) => a + b, 0)];
    })
  );
}

/**
 * Four factors w procentach (eFG%, TS%, TOV%, FT rate, ORB%) + posiadania i ORtg.
 * @param {Record<string, number | null>} t
 * @param {Record<string, number | null> | null} opp
 */
export function fourFactorsFromTotals(t, opp) {
  const { fgm, fga, threePm, fta, ftm, tov, orb, pts } = t;
  if (fga === null || fga === undefined || fga <= 0) {
    return {
      efgPct: null, tsPct: null, tovPct: null, ftRate: null, ftPct: null,
      orbPct: null, possessions: null, offRtg: null
    };
  }
  const efg = ((fgm ?? 0) + 0.5 * (threePm ?? 0)) / fga;
  const tsDen = 2 * (fga + 0.44 * (fta ?? 0));
  const tovDen = fga + 0.44 * (fta ?? 0) + (tov ?? 0);
  const poss = fga + 0.44 * (fta ?? 0) + (tov ?? 0) - (orb ?? 0);
  const oppDrb = opp?.drb;
  const orbDen = orb !== null && orb !== undefined && oppDrb !== null && oppDrb !== undefined ? orb + oppDrb : null;
  return {
    efgPct: roundOrNull(efg * 100, 1),
    tsPct: pts !== null && pts !== undefined && tsDen > 0 ? roundOrNull((pts / tsDen) * 100, 1) : null,
    tovPct: tov !== null && tov !== undefined && tovDen > 0 ? roundOrNull((tov / tovDen) * 100, 1) : null,
    ftRate: fta !== null && fta !== undefined ? roundOrNull((fta / fga) * 100, 1) : null,
    ftPct: pctOrNull(ftm ?? null, fta ?? null),
    orbPct: orbDen ? roundOrNull((orb / orbDen) * 100, 1) : null,
    possessions: poss > 0 ? roundOrNull(poss, 1) : null,
    offRtg: poss > 0 && pts !== null && pts !== undefined ? roundOrNull((pts / poss) * 100, 1) : null
  };
}

/**
 * Źródła punktów: kolumny KalkTeamGameStat albo KalkMatch.info.pointsSources[side].
 * @param {Record<string, any> | null | undefined} teamStat
 * @param {Record<string, any> | null | undefined} infoSources
 */
export function pointsSourcesFor(teamStat, infoSources) {
  const pick = (key) => intOrNull(teamStat?.[key]) ?? intOrNull(infoSources?.[key]);
  const sources = {
    fastBreakPts: pick('fastBreakPts'),
    ptsOffTurnovers: pick('ptsOffTurnovers'),
    secondChancePts: pick('secondChancePts'),
    ptsInPaint: pick('ptsInPaint')
  };
  return Object.values(sources).some((v) => v !== null) ? sources : null;
}

/**
 * @param {{ home?: number, away?: number }} row
 * @param {'home' | 'away'} usSide
 */
function bySide(row, usSide) {
  const them = usSide === 'home' ? 'away' : 'home';
  return { bekapaka: intOrNull(row?.[usSide]), opponent: intOrNull(row?.[them]) };
}

/**
 * @param {Record<string, number | null>} totals
 */
function withPercentages(totals) {
  return {
    ...totals,
    fgPct: pctOrNull(totals.fgm, totals.fga),
    twoPct: pctOrNull(totals.twoPm, totals.twoPa),
    threePct: pctOrNull(totals.threePm, totals.threePa),
    ftPct: pctOrNull(totals.ftm, totals.fta)
  };
}

/**
 * Czysty builder payloadu analizy meczu.
 * @param {object} game — widok z getGameById (kalkMatchToGameDetail lub legacy Game)
 * @param {{
 *   km?: Record<string, any> | null,
 *   teamGameStats?: Array<Record<string, any>>,
 *   pbpEvents?: Array<Record<string, any>>,
 *   headToHead?: Array<Record<string, any>>,
 *   leagueContext?: Record<string, any> | null
 * }} [extras]
 */
export function buildMatchPayloadFromGame(game, extras = {}) {
  const teamsRaw = game.teams || game.teamStats || [];
  const teams = Array.isArray(teamsRaw) ? teamsRaw : [];
  const bekapakaTeam = teams.find((t) => t?.isBekapaka) || teams[0];
  const opponentTeam = teams.find((t) => t !== bekapakaTeam) || teams[1];

  const km = extras.km || null;
  /** @type {'home' | 'away'} */
  const usSide = km
    ? (isBekapakaTeamName(km.homeTeamName) ? 'home' : 'away')
    : (game.homeAway === 'away' ? 'away' : 'home');
  const themSide = usSide === 'home' ? 'away' : 'home';

  const stats = Array.isArray(extras.teamGameStats) ? extras.teamGameStats : [];
  const usStat = stats.find((s) => s.side === usSide) || null;
  const themStat = stats.find((s) => s.side === themSide) || null;
  const info = km?.info && typeof km.info === 'object' ? km.info : null;

  const usPlayers = (bekapakaTeam?.players || []).map(normalizeBoxPlayer);
  const themPlayers = (opponentTeam?.players || []).map(normalizeBoxPlayer);

  // Kolejność: KalkTeamGameStat → boxScore.teams[].totals (v2) → suma z zawodników.
  const boxTotals = (team) => (team?.totals && typeof team.totals === 'object' && Number.isFinite(team.totals.pts) ? team.totals : null);
  const usTotals = teamTotals(usStat || boxTotals(bekapakaTeam), usPlayers, bekapakaTeam?.pts ?? game.scoreUs);
  const themTotals = teamTotals(themStat || boxTotals(opponentTeam), themPlayers, opponentTeam?.pts ?? game.scoreThem);

  const usSources = pointsSourcesFor(usStat, info?.pointsSources?.[usSide]);
  const themSources = pointsSourcesFor(themStat, info?.pointsSources?.[themSide]);

  const startersBench = (stat, players) => {
    const fromStat = { startersPts: intOrNull(stat?.startersPts), benchPts: intOrNull(stat?.benchPts) };
    if (fromStat.startersPts !== null || fromStat.benchPts !== null) return fromStat;
    const starters = players.filter((p) => p.starter === true);
    if (starters.length !== 5) return { startersPts: null, benchPts: null };
    const sum = (arr) => arr.reduce((a, p) => a + (p.pts ?? 0), 0);
    return { startersPts: sum(starters), benchPts: sum(players.filter((p) => p.starter !== true)) };
  };

  const activePlayers = (players) =>
    players
      .filter((p) => (p.seconds ?? 0) > 0 || (p.pts ?? 0) > 0)
      .sort((a, b) => (b.pts ?? 0) - (a.pts ?? 0))
      .map(playerForPrompt);

  const usSplit = startersBench(usStat, usPlayers);
  const themSplit = startersBench(themStat, themPlayers);

  const quartersInfo = Array.isArray(info?.quarters) && info.quarters.length ? info.quarters : null;
  const quarters = quartersInfo
    ? quartersInfo.map((q, idx) => ({ label: q.label || `Q${idx + 1}`, ...bySide(q, usSide) }))
    : (game.quarters || []).map((q, idx) => ({
        label: q.label || `Q${idx + 1}`,
        bekapaka: intOrNull(q.home),
        opponent: intOrNull(q.away)
      }));

  const flow5 = Array.isArray(info?.flow5) && info.flow5.length
    ? info.flow5.map((row) => ({ minute: intOrNull(row.minute), ...bySide(row, usSide) }))
    : null;

  const mvp = info?.mvp
    ? {
        name: info.mvp.name ?? null,
        number: intOrNull(info.mvp.number),
        eval: intOrNull(info.mvp.eval)
      }
    : null;

  const pbpEvents = Array.isArray(extras.pbpEvents) ? extras.pbpEvents : [];
  const playByPlay = pbpEvents.length
    ? computePbpInsights(pbpEvents, {
        labels: usSide === 'home'
          ? { home: TEAM_LABELS.bekapaka, away: TEAM_LABELS.opponent }
          : { home: TEAM_LABELS.opponent, away: TEAM_LABELS.bekapaka }
      })
    : { available: false, note: 'Brak akcji po akcji dla tego meczu — nie opisuj runów ani końcówki.' };

  const bekFF = bekapakaTeam?.fourFactors || null;
  const ruleInsights = bekFF
    ? generateGameInsights(game, bekFF, opponentTeam, {
        pointsSources: usSources,
        benchPts: usSplit.benchPts,
        team: bekapakaTeam
      })
    : (game.insights || []);

  return {
    meta: {
      date: isoDate(game.date),
      opponent: game.opponent || opponentTeam?.name || null,
      result: game.result ?? null,
      scoreUs: intOrNull(game.scoreUs),
      scoreThem: intOrNull(game.scoreThem),
      phase: km?.stageLabel ?? null,
      round: km?.roundLabel ?? km?.roundCode ?? game.roundCode ?? null,
      overtimes: intOrNull(km?.overtimes) ?? 0,
      venue: 'KOSiR Koszalin',
      mvp
    },
    quarters,
    flow5,
    teams: {
      bekapaka: {
        name: bekapakaTeam?.name ?? 'BeKaPaKa',
        totals: withPercentages(usTotals),
        fourFactors: fourFactorsFromTotals(usTotals, themTotals),
        ...usSplit,
        pointsSources: usSources,
        players: activePlayers(usPlayers)
      },
      opponent: {
        name: opponentTeam?.name ?? game.opponent ?? null,
        totals: withPercentages(themTotals),
        fourFactors: fourFactorsFromTotals(themTotals, usTotals),
        ...themSplit,
        pointsSources: themSources,
        players: activePlayers(themPlayers)
      }
    },
    playByPlay,
    headToHead: Array.isArray(extras.headToHead) ? extras.headToHead : [],
    ruleInsights,
    ...(extras.leagueContext ? { leagueContext: extras.leagueContext } : {})
  };
}

/**
 * Hash analizy meczu: dane meczu + wersja promptu. Tabela ligowa (leagueContext) jest pomijana,
 * żeby analiza starego meczu nie stawała się „nieaktualna” po każdej kolejce.
 * @param {Record<string, any>} payload
 */
export function hashMatchPayload(payload) {
  const { leagueContext: _ctx, ...rest } = payload || {};
  return hashAiPayload('match', sanitizeAiPayload(rest));
}

/**
 * Synchroniczny hash dla widoku meczu (getGameById). Dla meczów KALK zwraca null —
 * pełny hash wymaga danych z bazy (KalkTeamGameStat, PBP, H2H); aktualność liczy
 * `getMatchAiStaleness` (asynchronicznie: GET /api/games/:id, katalog, audyt).
 * @param {object} game
 * @returns {string | null}
 */
export function hashGameForAi(game) {
  if (!game || game.isFromKalkMatch || game.dataSource === 'kalk') return null;
  const teams = game.teams || game.teamStats || [];
  const bekapaka = (Array.isArray(teams) ? teams : []).find((t) => t?.isBekapaka) || teams[0];
  const hasBoxScore = bekapaka?.players?.length > 0 || game.playerStats?.length > 0;
  if (!hasBoxScore) return null;
  return hashMatchPayload(sanitizeAiPayload(buildMatchPayloadFromGame(game, {})));
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
 * @param {Record<string, any> | null | undefined} team
 * @param {number | null} rank
 */
function tableRow(team, rank) {
  if (!team) return null;
  const matches = team.matches || 0;
  return {
    name: team.name,
    position: team.position ?? rank ?? null,
    record: `${team.wins ?? 0}-${team.losses ?? 0}`,
    ppg: matches > 0 ? roundOrNull(team.pointsFor / matches, 1) : null,
    oppg: matches > 0 ? roundOrNull(team.pointsAgainst / matches, 1) : null
  };
}

/**
 * @param {string | null | undefined} name
 */
function opponentQueryName(name) {
  const simple = String(name || '').split('-')[0].trim();
  return simple || '__brak__';
}

const BEKAPAKA_KALK_OR = [
  { homeTeamName: { contains: 'BeKaPaKa', mode: 'insensitive' } },
  { guestTeamName: { contains: 'BeKaPaKa', mode: 'insensitive' } },
  { homeTeamName: { contains: 'BOBOLICE', mode: 'insensitive' } },
  { guestTeamName: { contains: 'BOBOLICE', mode: 'insensitive' } }
];

/**
 * Poprzednie mecze BeKaPaKa z rywalem (wszystkie sezony, przed datą).
 * @param {{ opponentName: string, opponentKalkId?: string | null, before?: Date | null, take?: number }} input
 */
export async function loadHeadToHead({ opponentName, opponentKalkId, before, take = 5 }) {
  const name = opponentQueryName(opponentName);
  const rows = await safe(
    () =>
      prisma.kalkMatch.findMany({
        where: {
          isFinished: true,
          ...(before ? { date: { lt: before } } : {}),
          AND: [
            { OR: BEKAPAKA_KALK_OR },
            {
              OR: [
                ...(opponentKalkId ? [{ homeTeamId: opponentKalkId }, { guestTeamId: opponentKalkId }] : []),
                { homeTeamName: { contains: name, mode: 'insensitive' } },
                { guestTeamName: { contains: name, mode: 'insensitive' } }
              ]
            }
          ]
        },
        orderBy: { date: 'desc' },
        take,
        select: {
          id: true,
          seasonId: true,
          date: true,
          homeTeamName: true,
          guestTeamName: true,
          scoreHome: true,
          scoreAway: true
        }
      }),
    []
  );

  return rows.map((m) => {
    const home = isBekapakaTeamName(m.homeTeamName);
    const us = home ? m.scoreHome : m.scoreAway;
    const them = home ? m.scoreAway : m.scoreHome;
    const known = us !== null && us !== undefined && them !== null && them !== undefined;
    return {
      date: isoDate(m.date),
      seasonId: m.seasonId,
      score: known ? `${us}:${them}` : null,
      result: known ? (us > them ? 'W' : us < them ? 'L' : null) : null
    };
  });
}

/**
 * Dane dodatkowe z bazy dla meczu KALK (typowane sumy, PBP, H2H, tabela).
 * @param {object} game
 * @param {{ includeLeagueContext?: boolean }} [options]
 */
export async function loadMatchExtras(game, options = {}) {
  const includeLeagueContext = options.includeLeagueContext !== false;
  const isKalk = game?.isFromKalkMatch || game?.dataSource === 'kalk';
  const seasonId = game?.seasonId;
  const matchId = String(game?.kalkMatchId || game?.id || '');
  if (!isKalk || !seasonId || !matchId) return {};

  const km = await safe(
    () =>
      prisma.kalkMatch.findUnique({
        where: { seasonId_id: { seasonId, id: matchId } },
        select: {
          id: true,
          date: true,
          homeTeamName: true,
          guestTeamName: true,
          homeTeamId: true,
          guestTeamId: true,
          roundCode: true,
          stageLabel: true,
          roundLabel: true,
          overtimes: true,
          info: true
        }
      }),
    null
  );
  if (!km) return {};

  const usHome = isBekapakaTeamName(km.homeTeamName);
  const opponentName = usHome ? km.guestTeamName : km.homeTeamName;
  const opponentKalkId = usHome ? km.guestTeamId : km.homeTeamId;

  const [teamGameStats, pbpEvents, headToHead] = await Promise.all([
    safe(() => prisma.kalkTeamGameStat.findMany({ where: { seasonId, kalkMatchId: matchId } }), []),
    safe(
      () =>
        prisma.kalkPlayByPlayEvent.findMany({
          where: { seasonId, kalkMatchId: matchId },
          orderBy: { seq: 'asc' },
          select: {
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
    ),
    loadHeadToHead({ opponentName, opponentKalkId, before: km.date })
  ]);

  let leagueContext = null;
  if (includeLeagueContext) {
    const table = await safe(
      () =>
        prisma.leagueTeam.findMany({
          where: { seasonId, phase: 'regular' },
          orderBy: LEAGUE_TABLE_ORDER_BY
        }),
      []
    );
    if (table.length) {
      const us = resolveLeagueTeamFromList(table, usHome ? km.homeTeamName : km.guestTeamName);
      const them = resolveLeagueTeamFromList(table, opponentName);
      leagueContext = {
        note: 'Aktualna tabela sezonu (nie stan z dnia meczu).',
        bekapaka: tableRow(us.team, us.rank),
        opponent: tableRow(them.team, them.rank)
      };
    }
  }

  return { km, teamGameStats, pbpEvents, headToHead, leagueContext };
}

/**
 * @param {string} gameId
 * @param {{ seasonId?: string | null, includeLeagueContext?: boolean }} [options]
 */
export async function buildMatchContext(gameId, options = {}) {
  const game = await getGameById(gameId, options.seasonId || undefined);
  if (!game) {
    throw new AiValidationError('Mecz nie znaleziony');
  }

  const teamsRaw = game.teams || game.teamStats || [];
  const teams = Array.isArray(teamsRaw) ? teamsRaw : [];
  const bekapaka = teams.find((t) => t?.isBekapaka) || teams[0];

  const hasBoxScore = bekapaka?.players?.length > 0 || game.playerStats?.length > 0;
  if (!hasBoxScore) {
    throw new AiValidationError(
      'Brak pełnego box score — uruchom synchronizację KALK w panelu Admin'
    );
  }

  const extras = await loadMatchExtras(game, options);
  const payload = sanitizeAiPayload(buildMatchPayloadFromGame(game, extras));

  return {
    gameId: String(gameId),
    kalkMatchId: game.isFromKalkMatch || game.dataSource === 'kalk' ? String(game.kalkMatchId || game.id) : null,
    seasonId: game.seasonId ?? null,
    hash: hashMatchPayload(payload),
    payload,
    ruleInsights: payload.ruleInsights || []
  };
}

/**
 * Aktualność zapisanej analizy meczu (hash z bieżących danych + wersji promptu).
 * @param {{ gameId: string, seasonId?: string | null, aiSummary?: string | null, aiSummaryHash?: string | null }} input
 * @returns {Promise<{ stale: boolean, reason: string | null, currentHash: string | null }>}
 */
export async function getMatchAiStaleness({ gameId, seasonId, aiSummary, aiSummaryHash }) {
  if (!aiSummary) return { stale: false, reason: null, currentHash: null };
  if (!hasCompleteMatchAnalysisMarkdown(aiSummary)) {
    return { stale: true, reason: 'incomplete', currentHash: null };
  }
  try {
    const ctx = await buildMatchContext(gameId, { seasonId, includeLeagueContext: false });
    if (!aiSummaryHash) return { stale: true, reason: 'no-hash', currentHash: ctx.hash };
    const changed = ctx.hash !== aiSummaryHash;
    return { stale: changed, reason: changed ? 'hash-changed' : null, currentHash: ctx.hash };
  } catch {
    return { stale: false, reason: 'unavailable', currentHash: null };
  }
}
