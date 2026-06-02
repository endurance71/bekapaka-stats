import { getGameById } from '../dataStore.js';
import { hashPayload } from './hash.js';
import { AiValidationError } from './errors.js';

function summarizePlayers(players, limit = 5) {
  return (players || [])
    .slice()
    .sort((a, b) => (b.pts || 0) - (a.pts || 0))
    .slice(0, limit)
    .map((p) => ({
      name: p.name,
      number: p.number,
      min: p.min,
      pts: p.pts,
      reb: p.reb ?? (p.orb || 0) + (p.drb || 0),
      ast: p.ast,
      tov: p.tov,
      fg: `${p.fgm || 0}/${p.fga || 0}`,
      three: `${p.three_pm || 0}/${p.three_pa || 0}`,
      ft: `${p.ftm || 0}/${p.fta || 0}`,
      plusMinus: p.plusMinus,
      eval: p.eval
    }));
}

/**
 * @param {object} game
 */
export function buildMatchPayloadFromGame(game) {
  const teams = game.teams || game.teamStats || [];
  const bekapaka = teams.find((t) => t.isBekapaka) || teams[0];
  const opponent = teams.find((t) => !t.isBekapaka) || teams[1];

  return {
    meta: {
      date: game.date,
      opponent: game.opponent || opponent?.name,
      result: game.result,
      scoreUs: game.scoreUs,
      scoreThem: game.scoreThem,
      homeAway: game.homeAway
    },
    quarters: game.quarters || game.data?.quarters || [],
    teamComparison: {
      bekapaka: {
        name: bekapaka?.name,
        fourFactors: bekapaka?.fourFactors,
        pts: bekapaka?.pts ?? game.scoreUs
      },
      opponent: {
        name: opponent?.name,
        fourFactors: opponent?.fourFactors,
        pts: opponent?.pts ?? game.scoreThem
      }
    },
    topPlayers: {
      bekapaka: summarizePlayers(bekapaka?.players),
      opponent: summarizePlayers(opponent?.players, 3)
    },
    ruleInsights: game.insights || []
  };
}

/**
 * @param {object} game — wzbogacony obiekt z getGameById (insights, fourFactors)
 * @returns {string | null}
 */
export function hashGameForAi(game) {
  const teams = game.teams || game.teamStats || [];
  const bekapaka = teams.find((t) => t.isBekapaka) || teams[0];
  const hasBoxScore = bekapaka?.players?.length > 0 || game.playerStats?.length > 0;
  if (!hasBoxScore) return null;
  return hashPayload(buildMatchPayloadFromGame(game));
}

/**
 * @param {string} gameId
 */
export async function buildMatchContext(gameId) {
  const game = await getGameById(gameId);
  if (!game) {
    throw new AiValidationError('Mecz nie znaleziony');
  }

  const teams = game.teams || game.teamStats || [];
  const bekapaka = teams.find((t) => t.isBekapaka) || teams[0];

  const hasBoxScore = bekapaka?.players?.length > 0 || game.playerStats?.length > 0;
  if (!hasBoxScore) {
    throw new AiValidationError(
      'Brak pełnych statystyk — zaimportuj protokół meczu (to nie jest mecz z box score)'
    );
  }

  const payload = buildMatchPayloadFromGame(game);

  return {
    gameId,
    hash: hashPayload(payload),
    payload,
    ruleInsights: game.insights || []
  };
}
