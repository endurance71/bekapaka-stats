import { prisma } from '../lib/prisma.js';
import { getPlayerStats, getTrainingPriorities } from '../dataStore.js';
import { hashPayload } from './hash.js';
import { computePlayerSignals } from './playerSignals.js';
import { AiValidationError } from './errors.js';


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
 * @param {string} playerId
 */
export async function buildPlayerContext(playerId) {
  const stats = await getPlayerStats(playerId);
  if (!stats) {
    throw new AiValidationError('Zawodnik nie znaleziony');
  }
  if (!stats.gameLog || stats.gameLog.length < 3) {
    throw new AiValidationError('Za mało meczów w bazie (minimum 3 — synchronizacja KALK, log zawodnika tab 3)');
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

  const derived = buildDerivedMetrics({
    averages: stats.averages,
    gameLog: stats.gameLog
  });

  const payload = {
    player: stats.player,
    positionProfile: getPositionProfile(stats.player?.position),
    averages: stats.averages,
    derived,
    goals: roster?.goals || null,
    gameLog: stats.gameLog.slice(0, 15),
    signals,
    leagueKalk: stats.leagueKalk || null
  };

  return {
    playerId,
    hash: hashPayload(payload),
    payload
  };
}
