import { getDetailedScouting } from '../dataStore.js';
import { hashPayload } from './hash.js';
import { normalizeOpponentKey } from './normalizeOpponent.js';
import { AiValidationError } from './errors.js';

/**
 * @param {string | undefined} opponentName
 */
export async function buildScoutingContext(opponentName) {
  const data = await getDetailedScouting(opponentName);
  if (!data?.teamInfo?.opponent?.name) {
    throw new AiValidationError('Brak danych o rywalu (terminarz / liga)');
  }

  const { aiAnalysis, ...rest } = data;
  const payload = {
    teamInfo: rest.teamInfo,
    keyPlayers: rest.keyPlayers,
    form: rest.form,
    advancedStats: rest.advancedStats,
    bekapakaAdvancedStats: rest.bekapakaAdvancedStats
  };

  const name = data.teamInfo.opponent.name;
  const opponentKey = normalizeOpponentKey(name);

  return {
    opponentKey,
    opponentName: name,
    hash: hashPayload(payload),
    payload
  };
}
