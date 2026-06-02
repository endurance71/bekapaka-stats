import { PrismaClient } from '@prisma/client';
import { getPlayerStats, getTrainingPriorities } from '../dataStore.js';
import { hashPayload } from './hash.js';
import { computePlayerSignals } from './playerSignals.js';
import { AiValidationError } from './errors.js';

const prisma = new PrismaClient();

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
    positionProfile: getPositionProfile(stats.player?.position),
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
