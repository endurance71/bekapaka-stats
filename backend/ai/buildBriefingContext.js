import { getNextOpponentScouting, getTeamTrends, getTrainingPriorities, listGames } from '../dataStore.js';
import { buildMatchContext } from './buildMatchContext.js';
import { hashAiPayload } from './hash.js';
import { roundOrNull, sanitizeAiPayload } from './payloadUtils.js';

/**
 * @param {number | null | undefined} value
 * @param {number} [digits=1]
 * @returns {number | null}
 */
function roundStat(value, digits = 1) {
  return roundOrNull(value, digits);
}

/**
 * Ułamek (0–1) → procent z 1 miejscem po przecinku.
 * @param {unknown} value
 */
function fractionToPct(value) {
  return typeof value === 'number' && Number.isFinite(value) ? roundOrNull(value * 100, 1) : null;
}

/**
 * Liczby z box score ostatniego meczu (z payloadu analizy meczu).
 * @param {Record<string, any>} matchPayload
 */
export function lastGameBoxSummary(matchPayload) {
  const us = matchPayload?.teams?.bekapaka;
  const them = matchPayload?.teams?.opponent;
  if (!us) return null;
  const t = us.totals || {};
  const topScorers = (us.players || []).slice(0, 3).map((p) => ({
    name: p.name,
    number: p.number,
    pts: p.pts,
    reb: p.reb,
    ast: p.ast,
    tov: p.tov,
    eval: p.eval
  }));
  const oppTop = (them?.players || [])[0];
  return {
    totals: {
      pts: t.pts,
      fg: t.fga !== null && t.fga !== undefined ? `${t.fgm ?? 0}/${t.fga}` : null,
      fgPct: t.fgPct,
      threePt: t.threePa !== null && t.threePa !== undefined ? `${t.threePm ?? 0}/${t.threePa}` : null,
      threePct: t.threePct,
      ftPct: t.ftPct,
      reb: t.reb,
      orb: t.orb,
      ast: t.ast,
      stl: t.stl,
      tov: t.tov,
      blk: t.blk
    },
    fourFactors: us.fourFactors || null,
    opponentFourFactors: them?.fourFactors || null,
    benchPts: us.benchPts ?? null,
    pointsSources: us.pointsSources ?? null,
    topScorers,
    opponentTopScorer: oppTop ? { name: oppTop.name, number: oppTop.number, pts: oppTop.pts } : null,
    playByPlay: matchPayload?.playByPlay?.available
      ? {
          largestRun: matchPayload.playByPlay.largestRun,
          leadChanges: matchPayload.playByPlay.leadChanges,
          clutch: matchPayload.playByPlay.clutch
        }
      : null
  };
}

/**
 * Aggregated context for dashboard weekly briefing.
 * @param {string | null | undefined} [seasonIdParam]
 */
export async function buildBriefingContext(seasonIdParam = undefined) {
  const [games, trends, priorities, nextOpponentRaw] = await Promise.all([
    listGames({}, seasonIdParam),
    getTeamTrends(seasonIdParam),
    getTrainingPriorities(seasonIdParam),
    getNextOpponentScouting(seasonIdParam)
  ]);

  /** Tylko faktyczny mecz z terminarza — bez fallbacku na ostatniego rywala (scouting). */
  const nextOpponent =
    nextOpponentRaw?.scoutingMode === 'upcoming'
      ? {
          opponent: nextOpponentRaw.opponent,
          rank: nextOpponentRaw.rank,
          record: `${nextOpponentRaw.wins}-${nextOpponentRaw.losses}`,
          ppg: roundStat(nextOpponentRaw.ppg),
          oppg: roundStat(nextOpponentRaw.oppg),
          form: nextOpponentRaw.form,
          keyPlayers: (nextOpponentRaw.keyPlayers || []).map((player) => ({
            ...player,
            ppg: roundStat(player.ppg)
          })),
          matchDate: nextOpponentRaw.matchDate ?? null
        }
      : null;

  const played = (games || []).filter((g) => g.result);
  let lastGameSummary = null;
  if (played.length > 0) {
    const last = played[0];
    /** @type {Record<string, any> | null} */
    let matchPayload = null;
    try {
      const ctx = await buildMatchContext(String(last.id), {
        seasonId: last.seasonId || seasonIdParam,
        includeLeagueContext: false
      });
      matchPayload = ctx.payload;
    } catch {
      matchPayload = null;
    }
    lastGameSummary = {
      id: last.id,
      date: last.date ? String(last.date).split('T')[0] : null,
      opponent: last.opponent,
      result: last.result,
      score: `${last.scoreUs}:${last.scoreThem}`,
      boxScore: matchPayload ? lastGameBoxSummary(matchPayload) : null,
      insights: (matchPayload?.ruleInsights || []).slice(0, 5)
    };
  }

  const recentTrends = (trends || []).filter(Boolean).slice(-5).map((t) => ({
    date: t.date,
    opponent: t.opponent,
    efgPct: fractionToPct(t.efg),
    tovPct: fractionToPct(t.tovPct),
    orbPct: fractionToPct(t.orbPct),
    ftRate: fractionToPct(t.ftRate),
    offRtg: roundStat(t.offRtg),
    scoreUs: t.scoreUs,
    scoreThem: t.scoreThem
  }));

  const payload = sanitizeAiPayload({
    lastGame: lastGameSummary,
    recentTrends,
    trainingPriorities: {
      team: priorities.team,
      leagueProxy: priorities.league
    },
    nextOpponent,
    hasUpcomingMatch: Boolean(nextOpponent),
    seasonRecord: {
      played: played.length,
      wins: played.filter((g) => g.result === 'W').length,
      losses: played.filter((g) => g.result === 'L').length
    }
  });

  return {
    hash: hashAiPayload('briefing', payload),
    payload
  };
}
