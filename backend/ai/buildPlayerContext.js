import { PrismaClient } from '@prisma/client';
import { getPlayerStats, getTrainingPriorities } from '../dataStore.js';
import { hashPayload } from './hash.js';
import { computePlayerSignals } from './playerSignals.js';
import { AiValidationError } from './errors.js';

const prisma = new PrismaClient();

/**
 * @param {string} playerId
 */
export async function buildPlayerContext(playerId) {
  const stats = await getPlayerStats(playerId);
  if (!stats) {
    throw new AiValidationError('Zawodnik nie znaleziony');
  }
  if (!stats.gameLog || stats.gameLog.length < 3) {
    throw new AiValidationError('Za mało meczów w bazie (minimum 3 z protokołami)');
  }

  const roster = await prisma.rosterPlayer.findUnique({
    where: { id: playerId },
    select: { goals: true }
  });

  const priorities = await getTrainingPriorities();
  const teamAverages = {
    turnoversPerGame: priorities.team?.turnovers,
    ppg: null
  };

  const signals = computePlayerSignals({
    averages: {
      ...stats.averages,
      ftm: stats.gameLog.reduce((s, g) => s + (g.ftm || 0), 0) / stats.gameLog.length,
      fta: stats.gameLog.reduce((s, g) => s + (g.fta || 0), 0) / stats.gameLog.length
    },
    gameLog: stats.gameLog,
    teamAverages
  });

  const payload = {
    player: stats.player,
    averages: stats.averages,
    goals: roster?.goals || null,
    gameLog: stats.gameLog.slice(0, 15),
    signals
  };

  return {
    playerId,
    hash: hashPayload(payload),
    payload
  };
}
