import { prisma } from '../lib/prisma.js';
import { getPlayerStats, getTrainingPriorities } from '../dataStore.js';
import { isBekapakaTeamName } from '../kalk/parseMatchBoxScore.js';
import { resolveSeasonId } from '../seasonService.js';
import { hashAiPayload } from './hash.js';
import { computePlayerSignals } from './playerSignals.js';
import { AiValidationError } from './errors.js';
import { intOrNull, pctOrNull, roundOrNull, sanitizeAiPayload } from './payloadUtils.js';
import { seasonStatToKeyPlayer } from './scoutingData.js';
import { computePlayerPbpProfile } from './pbpInsights.js';


function getPositionProfile(positionRaw) {
  const position = (positionRaw || '').toUpperCase().trim();

  const profiles = {
    PG: {
      roleName: 'rozgrywający',
      priorities: [
        'kontrola tempa i decyzji w pick and rollu',
        'ograniczenie strat przy presji na piłkę',
        'kreowanie sytuacji dla partnerów'
      ],
      keyMetrics: ['AST', 'TOV', 'AST/TOV', 'eFG po koźle']
    },
    SG: {
      roleName: 'rzucający obrońca',
      priorities: [
        'stabilność rzutu po koźle i po zasłonie',
        'decyzje 0.5 sekundy po złapaniu piłki',
        'obrona obwodowa na pierwszym kroku'
      ],
      keyMetrics: ['3PT%', 'eFG', 'PPG', 'straty']
    },
    SF: {
      roleName: 'niski skrzydłowy',
      priorities: [
        'gra 1 na 1 z półdystansu i wejścia',
        'wszechstronność po obu stronach boiska',
        'zbiórki i doskok z pomocy'
      ],
      keyMetrics: ['PPG', 'RPG', 'eFG', 'plusMinus']
    },
    PF: {
      roleName: 'silny skrzydłowy',
      priorities: [
        'fizyczność pod koszem i zastawienie',
        'finishing spod kosza i po short rollu',
        'obrona pick and rolla i rotacje'
      ],
      keyMetrics: ['RPG', 'ORB', 'TS%', 'PF']
    },
    C: {
      roleName: 'center',
      priorities: [
        'ochrona obręczy i timing bloku',
        'zbiórka defensywna i ograniczenie drugich szans',
        'skuteczne wykończenie pod koszem'
      ],
      keyMetrics: ['RPG', 'BLK', 'TS%', 'plusMinus']
    }
  };

  return profiles[position] || {
    roleName: 'uniwersalny zawodnik',
    priorities: [
      'stabilność decyzji pod presją',
      'selekcja rzutowa i skuteczność',
      'wpływ po obu stronach boiska'
    ],
    keyMetrics: ['PPG', 'RPG', 'APG', 'eFG']
  };
}

/**
 * Metryki pochodne dla promptu AI (bez LLM).
 * @param {{ averages: object, gameLog: object[] }} input
 */
function buildDerivedMetrics({ averages, gameLog }) {
  const games = gameLog?.length || 0;
  let totalFtm = 0;
  let totalFta = 0;
  let totalTov = 0;
  let totalAst = 0;
  let totalThreePm = 0;
  let totalThreePa = 0;
  let totalBlk = 0;

  for (const g of gameLog || []) {
    totalFtm += g.ftm || 0;
    totalFta += g.fta || 0;
    totalTov += g.tov || 0;
    totalAst += g.ast || 0;
    totalThreePm += g.three_pm || 0;
    totalThreePa += g.three_pa || 0;
    totalBlk += g.blk || 0;
  }

  const mpg = games > 0 ? (averages.minutesPlayed || 0) / games : 0;
  const scale36 = mpg > 0 ? 36 / mpg : null;

  const ftPct = totalFta > 0 ? (totalFtm / totalFta) * 100 : null;
  const threePtPct = totalThreePa > 0 ? (totalThreePm / totalThreePa) * 100 : null;
  const astToTov = totalTov > 0 ? totalAst / totalTov : totalAst > 0 ? totalAst : null;
  const tovPerGame = games > 0 ? totalTov / games : 0;
  const bpg = games > 0 ? totalBlk / games : 0;

  return {
    ftPct: ftPct != null ? Number(ftPct.toFixed(1)) : null,
    threePtPct: threePtPct != null ? Number(threePtPct.toFixed(1)) : null,
    astToTov: astToTov != null ? Number(astToTov.toFixed(2)) : null,
    tovPerGame: Number(tovPerGame.toFixed(1)),
    bpg: Number(bpg.toFixed(1)),
    efgPct: averages.efg != null ? Number((averages.efg * 100).toFixed(1)) : null,
    tsPct: averages.ts != null ? Number((averages.ts * 100).toFixed(1)) : null,
    mpg: Number(mpg.toFixed(1)),
    per36: scale36
      ? {
          ppg: Number((averages.ppg * scale36).toFixed(1)),
          rpg: Number((averages.rpg * scale36).toFixed(1)),
          apg: Number((averages.apg * scale36).toFixed(1))
        }
      : null
  };
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
 * Średnie odniesienia dla sygnałów: PPG i straty na mecz przeciętnego zawodnika BeKaPaKa w sezonie
 * (zawodnicy z ≥3 meczami). Z KalkPlayerGameLog (typowane kolumny lub legacy `stats`).
 * @param {Array<{ kalkPlayerId: string, pts?: number | null, tov?: number | null, stats?: any }>} rows
 * @returns {{ ppg: number | null, turnoversPerGame: number | null, playersCounted: number }}
 */
export function computeTeamPlayerAverages(rows) {
  /** @type {Map<string, { games: number, pts: number, tov: number }>} */
  const byPlayer = new Map();
  for (const r of rows || []) {
    const stats = r.stats && typeof r.stats === 'object' ? r.stats : {};
    const pts = intOrNull(r.pts) ?? intOrNull(stats.pts);
    const tov = intOrNull(r.tov) ?? intOrNull(stats.tov);
    if (pts === null) continue;
    const cur = byPlayer.get(r.kalkPlayerId) || { games: 0, pts: 0, tov: 0 };
    cur.games += 1;
    cur.pts += pts;
    cur.tov += tov ?? 0;
    byPlayer.set(r.kalkPlayerId, cur);
  }
  const regulars = [...byPlayer.values()].filter((p) => p.games >= 3);
  if (regulars.length === 0) return { ppg: null, turnoversPerGame: null, playersCounted: 0 };
  const ppg = regulars.reduce((a, p) => a + p.pts / p.games, 0) / regulars.length;
  const tov = regulars.reduce((a, p) => a + p.tov / p.games, 0) / regulars.length;
  return {
    ppg: roundOrNull(ppg, 1),
    turnoversPerGame: roundOrNull(tov, 1),
    playersCounted: regulars.length
  };
}

/**
 * Wiersz logu meczu do promptu (z W/P i wynikiem).
 * @param {Record<string, any>} g
 * @param {{ result: string | null, score: string | null, round: string | null } | undefined} match
 */
function gameLogForPrompt(g, match) {
  return {
    date: g.date ?? null,
    opponent: g.opponent ?? null,
    result: match?.result ?? null,
    score: match?.score ?? null,
    round: match?.round ?? null,
    min: g.min ?? null,
    pts: intOrNull(g.pts),
    reb: intOrNull(g.reb),
    ast: intOrNull(g.ast),
    stl: intOrNull(g.stl),
    blk: intOrNull(g.blk),
    tov: intOrNull(g.tov),
    pf: intOrNull(g.pf),
    fgm: intOrNull(g.fgm),
    fga: intOrNull(g.fga),
    three_pm: intOrNull(g.three_pm),
    three_pa: intOrNull(g.three_pa),
    ftm: intOrNull(g.ftm),
    fta: intOrNull(g.fta),
    efgPct: intOrNull(g.fga) ? roundOrNull((g.efg ?? 0) * 100, 1) : null,
    plusMinus: intOrNull(g.plusMinus)
  };
}

/**
 * @param {string} playerId
 * @param {{ seasonId?: string | null }} [options]
 */
export async function buildPlayerContext(playerId, options = {}) {
  const seasonId = await resolveSeasonId(options.seasonId || undefined);
  const stats = await getPlayerStats(playerId, seasonId);
  if (!stats) {
    throw new AiValidationError('Zawodnik nie znaleziony');
  }
  if (!stats.gameLog || stats.gameLog.length < 3) {
    throw new AiValidationError('Za mało meczów w bazie (minimum 3 — synchronizacja KALK)');
  }

  const roster = await prisma.rosterPlayer.findUnique({
    where: { id: playerId },
    select: { goals: true, kalkSlug: true, heightCm: true, position: true }
  });
  const slug = roster?.kalkSlug || stats.player?.kalkPlayer?.slug || null;
  const statsSeasonId = stats.season?.id || seasonId;

  const matchIds = stats.gameLog.map((g) => g.gameId).filter(Boolean).map(String);

  const [priorities, teamLogRows, matchRows, careerRows, profile, seasons, pbpEvents] = await Promise.all([
    getTrainingPriorities(statsSeasonId),
    safe(
      () =>
        prisma.kalkPlayerGameLog.findMany({
          where: {
            seasonId: statsSeasonId,
            OR: [
              { teamName: { contains: 'BeKaPaKa', mode: 'insensitive' } },
              { teamName: { contains: 'BOBOLICE', mode: 'insensitive' } }
            ]
          },
          select: { kalkPlayerId: true, pts: true, tov: true, stats: true }
        }),
      []
    ),
    matchIds.length
      ? safe(
          () =>
            prisma.kalkMatch.findMany({
              where: { seasonId: statsSeasonId, id: { in: matchIds } },
              select: { id: true, homeTeamName: true, scoreHome: true, scoreAway: true, roundLabel: true, roundCode: true }
            }),
          []
        )
      : [],
    slug ? safe(() => prisma.kalkPlayerSeasonStat.findMany({ where: { playerSlug: slug } }), []) : [],
    slug ? safe(() => prisma.kalkPlayerProfile.findUnique({ where: { slug } }), null) : null,
    safe(() => prisma.kalkSeason.findMany({ select: { id: true, label: true, slug: true } }), []),
    slug
      ? safe(
          () =>
            prisma.kalkPlayByPlayEvent.findMany({
              where: { seasonId: statsSeasonId, playerSlug: slug },
              select: { kalkMatchId: true, period: true, clockSec: true, actionType: true, shotValue: true }
            }),
          []
        )
      : []
  ]);

  /** @type {Map<string, { result: string | null, score: string | null, round: string | null }>} */
  const matchById = new Map(
    matchRows.map((m) => {
      const home = isBekapakaTeamName(m.homeTeamName);
      const us = home ? m.scoreHome : m.scoreAway;
      const them = home ? m.scoreAway : m.scoreHome;
      const known = us !== null && us !== undefined && them !== null && them !== undefined;
      return [
        String(m.id),
        {
          result: known ? (us > them ? 'W' : us < them ? 'L' : null) : null,
          score: known ? `${us}:${them}` : null,
          round: m.roundLabel ?? m.roundCode ?? null
        }
      ];
    })
  );

  const teamAverages = computeTeamPlayerAverages(teamLogRows);

  const signals = computePlayerSignals({
    averages: {
      ...stats.averages,
      ftm: stats.gameLog.reduce((s, g) => s + (g.ftm || 0), 0) / stats.gameLog.length,
      fta: stats.gameLog.reduce((s, g) => s + (g.fta || 0), 0) / stats.gameLog.length
    },
    gameLog: stats.gameLog,
    teamAverages
  });

  const derived = buildDerivedMetrics({
    averages: stats.averages,
    gameLog: stats.gameLog
  });

  const seasonLabel = new Map(seasons.map((s) => [s.id, s.label || s.slug]));
  const career = careerRows
    .map((row) => ({
      season: seasonLabel.get(row.seasonId) || row.seasonId,
      seasonId: row.seasonId,
      competition: row.competition,
      team: row.teamName,
      ...seasonStatToKeyPlayer(row),
      name: undefined
    }))
    .sort((a, b) => String(a.seasonId).localeCompare(String(b.seasonId)));
  const currentSeasonStats = career.filter((c) => c.seasonId === statsSeasonId);

  const position = stats.player?.position || roster?.position || profile?.position || null;
  const avg = stats.averages || {};

  const payload = sanitizeAiPayload({
    season: stats.season ? { id: stats.season.id, label: stats.season.label } : { id: statsSeasonId },
    player: {
      firstName: stats.player?.firstName ?? null,
      lastName: stats.player?.lastName ?? null,
      number: stats.player?.number ?? null,
      position,
      heightCm: roster?.heightCm ?? profile?.heightCm ?? null
    },
    positionProfile: getPositionProfile(position),
    averages: {
      ppg: roundOrNull(avg.ppg, 1),
      rpg: roundOrNull(avg.rpg, 1),
      apg: roundOrNull(avg.apg, 1),
      efg: roundOrNull(avg.efg, 3),
      ts: roundOrNull(avg.ts, 3),
      plusMinusAvg: roundOrNull(avg.plusMinusAvg, 1),
      gamesPlayed: intOrNull(avg.gamesPlayed),
      minutesPlayed: intOrNull(avg.minutesPlayed)
    },
    derived,
    seasonStats: currentSeasonStats.length ? currentSeasonStats : null,
    career: career.length ? career : null,
    playByPlay: computePlayerPbpProfile(pbpEvents),
    teamAverages,
    goals: roster?.goals || null,
    gameLog: stats.gameLog.slice(0, 15).map((g) => gameLogForPrompt(g, matchById.get(String(g.gameId)))),
    record: {
      wins: [...matchById.values()].filter((m) => m.result === 'W').length,
      losses: [...matchById.values()].filter((m) => m.result === 'L').length
    },
    signals,
    leagueKalk: stats.leagueKalk
      ? Object.fromEntries(
          Object.entries(stats.leagueKalk).map(([k, v]) => [k, typeof v === 'number' ? roundOrNull(v, 1) : v ?? null])
        )
      : null,
    teamContext: {
      turnoversPerGame: priorities?.team?.turnovers ?? null,
      efgPercentage: priorities?.team?.efgPercentage ?? null,
      ftPercentage: priorities?.team?.ftPercentage ?? null
    },
    shootingSplits: {
      ftPct: derived.ftPct,
      threePct: derived.threePtPct,
      fgPct: pctOrNull(
        stats.gameLog.reduce((s, g) => s + (g.fgm || 0), 0),
        stats.gameLog.reduce((s, g) => s + (g.fga || 0), 0)
      )
    }
  });

  return {
    playerId,
    seasonId: statsSeasonId,
    hash: hashAiPayload('player', payload),
    payload
  };
}
