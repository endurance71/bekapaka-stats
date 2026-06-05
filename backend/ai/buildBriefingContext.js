import { getGameById, getNextOpponentScouting, getTeamTrends, getTrainingPriorities, listGames } from '../dataStore.js';
import { hashPayload } from './hash.js';

/**
 * @param {number | null | undefined} value
 * @param {number} [digits=1]
 * @returns {number | null}
 */
function roundStat(value, digits = 1) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/**
 * Aggregated context for dashboard weekly briefing.
 */
export async function buildBriefingContext() {
  const [games, trends, priorities, nextOpponentRaw] = await Promise.all([
    listGames(),
    getTeamTrends(),
    getTrainingPriorities(),
    getNextOpponentScouting()
  ]);

  /** Tylko faktyczny mecz z terminarza — bez fallbacku na ostatniego rywala (scouting). */
  const nextOpponent =
    nextOpponentRaw?.scoutingMode === 'upcoming'
      ? {
          opponent: nextOpponentRaw.opponent,
          rank: nextOpponentRaw.rank,
          record: `${nextOpponentRaw.wins}-${nextOpponentRaw.losses}`,
          ppg: roundStat(nextOpponentRaw.ppg),
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
    const full = await getGameById(last.id);
    lastGameSummary = {
      id: last.id,
      date: last.date,
      opponent: last.opponent,
      result: last.result,
      score: `${last.scoreUs}:${last.scoreThem}`,
      insights: (full?.insights || []).slice(0, 5)
    };
  }

  const recentTrends = (trends || []).filter(Boolean).slice(-5).map((t) => ({
    date: t.date,
    opponent: t.opponent,
    efg: t.efg,
    tovPct: t.tovPct,
    scoreUs: t.scoreUs,
    scoreThem: t.scoreThem
  }));

  const payload = {
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
  };

  return {
    hash: hashPayload(payload),
    payload
  };
}
