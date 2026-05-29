import { getGameById, getNextOpponentScouting, getTeamTrends, getTrainingPriorities, listGames } from '../dataStore.js';
import { hashPayload } from './hash.js';

/**
 * Aggregated context for dashboard weekly briefing.
 */
export async function buildBriefingContext() {
  const [games, trends, priorities, nextOpponent] = await Promise.all([
    listGames(),
    getTeamTrends(),
    getTrainingPriorities(),
    getNextOpponentScouting()
  ]);

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
    nextOpponent: nextOpponent
      ? {
          opponent: nextOpponent.opponent,
          rank: nextOpponent.rank,
          record: `${nextOpponent.wins}-${nextOpponent.losses}`,
          ppg: nextOpponent.ppg,
          form: nextOpponent.form,
          keyPlayers: nextOpponent.keyPlayers
        }
      : null,
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
