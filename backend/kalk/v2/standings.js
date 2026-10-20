/**
 * Tabela sezonu zasadniczego zgodna z wynikami. KALK potrafi nie wliczyć zakończonych meczów do swojej tabeli
 * (np. 1. kolejka 2026/27 bez przypisanej hali), więc drużyny, których wiersz nie zgadza się z wynikami terminarza,
 * dostają liczby przeliczone z wyników (2 pkt za zwycięstwo, 1 za porażkę), a tabela jest wtedy sortowana od nowa
 * według kryteriów KALK (FIBA): punkty → mecze bezpośrednie zainteresowanych zespołów → bilans → punkty zdobyte.
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

const diff = (row) => row.pointsFor - row.pointsAgainst;

/** Kolejność po wyczerpaniu meczów bezpośrednich: bilans całego sezonu, punkty zdobyte, kolejność KALK. */
function overallOrder(a, b) {
  return diff(b) - diff(a) || b.pointsFor - a.pointsFor || (a.position ?? 99) - (b.position ?? 99);
}

/** Dzieli wiersze (posortowane malejąco wg `value`) na grupy z równą wartością. */
function splitBy(rows, value) {
  const groups = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && value(last[0]) === value(row)) last.push(row);
    else groups.push([row]);
  }
  return groups;
}

/**
 * Drużyny z równą liczbą punktów — kryteria FIBA D.1 w kolejności KALK: mała tabela z meczów między nimi
 * (punkty, bilans, punkty zdobyte), potem bilans i punkty zdobyte w całym sezonie. Gdy któreś kryterium podzieli
 * grupę, dla drużyn wciąż remisujących procedura zaczyna się od nowa (mała tabela tylko z ich meczów).
 */
function rankGroup(group, matches) {
  if (group.length < 2) return group;
  const names = new Set(group.map((row) => normalizeTeamNameForMatch(row.name)));
  const mini = recomputeStandings(
    matches.filter(
      (m) => names.has(normalizeTeamNameForMatch(m.homeTeam)) && names.has(normalizeTeamNameForMatch(m.guestTeam))
    )
  );
  const stat = (row) => mini.get(normalizeTeamNameForMatch(row.name)) || { points: 0, pointsFor: 0, pointsAgainst: 0 };
  for (const value of [(row) => stat(row).points, (row) => diff(stat(row)), (row) => stat(row).pointsFor]) {
    const groups = splitBy([...group].sort((a, b) => value(b) - value(a)), value);
    if (groups.length > 1) return groups.flatMap((g) => rankGroup(g, matches));
  }
  return [...group].sort(overallOrder);
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

  const ordered = splitBy(
    [...rows].sort((a, b) => b.points - a.points),
    (row) => row.points
  ).flatMap((group) => rankGroup(group, finished));
  ordered.forEach((row, i) => {
    row.position = i + 1;
  });
  return { rows: ordered, corrected };
}
