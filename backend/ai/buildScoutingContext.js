import { getDetailedScouting } from '../dataStore.js';
import { hashAiPayload } from './hash.js';
import { AiValidationError } from './errors.js';
import { sanitizeAiPayload } from './payloadUtils.js';
import { scoutingReportKey } from './scoutingData.js';

/**
 * Kontekst raportu scoutingu dla sezonu. Payload budowany w getDetailedScouting
 * (ten sam builder co kontrola aktualności na stronie scoutingu).
 * @param {string | undefined} opponentName
 * @param {string | null | undefined} [seasonId]
 */
export async function buildScoutingContext(opponentName, seasonId = undefined) {
  const data = await getDetailedScouting(opponentName, seasonId || undefined, { includeAiPayload: true });
  if (!data?.teamInfo?.opponent?.name) {
    throw new AiValidationError('Brak danych o rywalu (terminarz / liga)');
  }

  const payload = sanitizeAiPayload(data.aiPayload);
  const name = data.teamInfo.opponent.name;
  const resolvedSeasonId = data.seasonId ?? seasonId ?? null;

  return {
    opponentKey: scoutingReportKey(name, resolvedSeasonId),
    opponentName: name,
    seasonId: resolvedSeasonId,
    hash: data.aiPayloadHash || hashAiPayload('scouting', payload),
    payload
  };
}
