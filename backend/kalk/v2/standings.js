/**
 * Tabela sezonu zasadniczego zgodna z wynikami. KALK potrafi nie wliczyć zakończonych meczów do swojej tabeli
 * (np. 1. kolejka 2026/27 bez przypisanej hali), więc drużyny, których wiersz nie zgadza się z wynikami terminarza,
 * dostają liczby przeliczone z wyników (2 pkt za zwycięstwo, 1 za porażkę), a tabela jest wtedy sortowana od nowa.
 * Wiersze zgodne z wynikami zostają dokładnie takie, jak podał KALK.
 */
import { normalizeTeamNameForMatch } from '../../lib/kalkTeamNames.js';
import { isRegularSeasonPhase, recomputeStandings } from './audit.js';

const RESULT_FIELDS = ['matches', 'wins', 'losses', 'pointsFor', 'pointsAgainst'];
const FORM_LENGTH = 5;

/** Forma i seria z wyników drużyny (od najstarszego do najnowszego, jak w KALK: „W,L”, „L2”). */
function formAndStreak(name, matches) {
  const key = normalizeTeamNameForMatch(name);
  const results = matches
    .filter((m) => normalizeTeamNameForMatch(m.homeTeam) === key || normalizeTeamNameForMatch(m.guestTeam) === key)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((m) => {
      const home = normalizeTeamNameForMatch(m.homeTeam) === key;
      const own = home ? m.scoreHome : m.scoreAway;
      const other = home ? m.scoreAway : m.scoreHome;
      return own > other ? 'W' : own < other ? 'L' : null;
    })
    .filter(Boolean);
  if (!results.length) return { form: null, streak: null };
  const last = results[results.length - 1];
  let run = 0;
  for (let i = results.length - 1; i >= 0 && results[i] === last; i -= 1) run += 1;
  return { form: results.slice(-FORM_LENGTH).join(','), streak: `${last}${run}` };
}

/**
 * @param {Array<{ name: string, position: number|null, matches: number, wins: number, losses: number, pointsFor: number, pointsAgainst: number, points: number, form?: string|null, streak?: string|null }>} teams — LeagueTeam (faza zasadnicza)
 * @param {Array<{ homeTeam: string, guestTeam: string, scoreHome: number|null, scoreAway: number|null, isFinished: boolean, phaseLabel?: string|null, date: Date|string }>} leagueMatches — terminarz sezonu
 * @returns {{ rows: typeof teams, corrected: string[] }}
 */
export function reconcileStandings(teams, leagueMatches) {
  const finished = (leagueMatches || []).filter(
    (m) => m.isFinished && m.scoreHome != null && m.scoreAway != null && isRegularSeasonPhase(m.phaseLabel)
  );
  const recomputed = recomputeStandings(finished);
  const corrected = [];
  const rows = (teams || []).map((team) => {
    const r = recomputed.get(normalizeTeamNameForMatch(team.name));
    if (!r || RESULT_FIELDS.every((k) => r[k] === team[k])) return { ...team };
    corrected.push(team.name);
    return {
      ...team,
      ...Object.fromEntries(RESULT_FIELDS.map((k) => [k, r[k]])),
      points: r.points,
      ...formAndStreak(team.name, finished)
    };
  });
  if (!corrected.length) return { rows, corrected };

  const ordered = [...rows].sort(
    (a, b) =>
      b.points - a.points ||
      b.pointsFor - b.pointsAgainst - (a.pointsFor - a.pointsAgainst) ||
      (a.position ?? 99) - (b.position ?? 99)
  );
  ordered.forEach((row, i) => {
    row.position = i + 1;
  });
  return { rows: ordered, corrected };
}
