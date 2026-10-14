/**
 * Korekty statystyk z oficjalnych protokołów meczowych — pola, których KALK nie publikuje (podaje 0):
 * +/- oraz faule wymuszone. Dane: `protocolCorrections.json` (źródło i kontrole sum przy każdym meczu).
 *
 * Nakładane przy ingeście meczu (kolejne synchronizacje nie przywracają zer z KALK) oraz jednorazowo na istniejące
 * wiersze skryptem `scripts/kalk-apply-protocol-corrections.js`. Zawodnik = numer w drużynie (nazwiska w KALK bywają
 * zapisane inaczej niż w protokole, np. Stachowski / Stanowski).
 */
import fs from 'node:fs';
import { isBekapakaTeamName } from '../parseMatchBoxScore.js';
import { toInt } from './util.js';

export const PROTOCOL_FIELDS = ['plusMinus', 'pfDrawn'];
/** Pola sumowane do `totals` drużyny (+/- drużyny nie jest sumą zawodników). */
const TOTAL_FIELDS = ['pfDrawn'];

let cached = null;

/** @returns {Array<{ seasonId: string, kalkMatchId: string, teams: Array<{ bekapaka: boolean, players: Record<string, Record<string, unknown>> }> }>} */
export function loadProtocolCorrections() {
  if (!cached) cached = JSON.parse(fs.readFileSync(new URL('./protocolCorrections.json', import.meta.url), 'utf8'));
  return cached;
}

export function correctionFor(seasonId, kalkMatchId, list = loadProtocolCorrections()) {
  return list.find((c) => c.seasonId === seasonId && String(c.kalkMatchId) === String(kalkMatchId)) || null;
}

/**
 * Nakłada korektę na drużyny box score — działa na kształcie z kontraktu skrapera (`match.box.teams`) i na zapisanym
 * `KalkMatch.boxScore.teams` (oba mają name, players[].number i opcjonalne totals). Mutuje `teams`.
 * @returns {{ players: number, warnings: string[] }}
 */
export function correctBoxTeams(teams, correction) {
  const out = { players: 0, warnings: [] };
  for (const tc of correction?.teams || []) {
    const team = (teams || []).find((t) => isBekapakaTeamName(t?.name) === Boolean(tc.bekapaka));
    if (!team) {
      out.warnings.push(`mecz ${correction.kalkMatchId}: brak drużyny ${tc.bekapaka ? 'BeKaPaKa' : 'rywala'} w box score`);
      continue;
    }
    const players = Array.isArray(team.players) ? team.players : [];
    for (const [number, fix] of Object.entries(tc.players || {})) {
      const player = players.find((p) => toInt(p?.number) === toInt(number));
      if (!player) {
        out.warnings.push(`mecz ${correction.kalkMatchId}: ${team.name} nie ma zawodnika #${number} (${fix.name || '?'})`);
        continue;
      }
      for (const field of PROTOCOL_FIELDS) {
        if (fix[field] != null) player[field] = fix[field];
      }
      out.players += 1;
    }
    if (team.totals && typeof team.totals === 'object') {
      for (const field of TOTAL_FIELDS) {
        team.totals[field] = players.reduce((sum, p) => sum + (toInt(p?.[field]) ?? 0), 0);
      }
    }
  }
  return out;
}

/**
 * Korekty dla meczów z paczki skrapera (przed budową box score i logów).
 * @returns {{ matches: number, players: number, warnings: string[] }}
 */
export function applyProtocolCorrections(seasonId, matches, list = loadProtocolCorrections()) {
  const out = { matches: 0, players: 0, warnings: [] };
  for (const match of matches || []) {
    const correction = correctionFor(seasonId, match?.kalkMatchId, list);
    if (!correction || !Array.isArray(match?.box?.teams)) continue;
    const res = correctBoxTeams(match.box.teams, correction);
    out.matches += 1;
    out.players += res.players;
    out.warnings.push(...res.warnings);
  }
  return out;
}
