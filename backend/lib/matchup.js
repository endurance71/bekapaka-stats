/**
 * Zapowiedź meczu: BeKaPaKa i rywal w bieżącym sezonie — tabela, średnie drużyn z box score z miejscem w lidze,
 * pojedynki liderów (zawodnicy z box score) i mecze bezpośrednie. Czyste funkcje — dane pobiera `getMatchup` w dataStore.js.
 */
import { resolveLeagueTeamFromList } from './leagueTeamResolve.js';
import { normalizeTeamNameForMatch, teamNamesMatchForLink } from './kalkTeamNames.js';

const COUNTING = ['reb', 'orb', 'drb', 'ast', 'stl', 'blk', 'tov'];
const SUMMED = [...COUNTING, 'fgm', 'fga', 'three_pm', 'three_pa', 'ftm', 'fta'];
/** Statystyki, w których lepsza jest niższa wartość. */
export const LOWER_IS_BETTER = new Set(['opp', 'tov']);
/** Kategorie pojedynków liderów: klucz w box score zawodnika. */
export const LEADER_CATEGORIES = ['pts', 'reb', 'ast', 'stl', 'blk', 'eval'];

const isUs = (name) => normalizeTeamNameForMatch(name) === 'bekapaka';
const round1 = (value) => Math.round(value * 10) / 10;
const sameTeam = (candidate, teamName) => (isUs(teamName) ? isUs(candidate) : !isUs(candidate) && teamNamesMatchForLink(candidate, teamName));

/** Strona drużyny i rywala w meczu (`kalkMatchToGameDetail`), albo null. */
function sides(match, teamName) {
  const teams = match.teams || [];
  if (teams.length < 2) return null;
  const index = teams.findIndex((team) => sameTeam(team.name, teamName));
  return index < 0 ? null : { team: teams[index], opponent: teams[1 - index] };
}

/**
 * Średnie drużyny na mecz w sezonie; skuteczność z sum celnych/oddanych (2 pkt = z gry − za 3).
 * @param {string} teamName
 * @param {{ teams?: object[] }[]} matches Zakończone mecze sezonu w postaci `kalkMatchToGameDetail`.
 */
export function seasonAverages(teamName, matches) {
  const totals = { games: 0, pts: 0, opp: 0 };
  for (const key of SUMMED) totals[key] = 0;
  for (const match of matches) {
    const pair = sides(match, teamName);
    if (!pair) continue;
    totals.games += 1;
    totals.pts += Number(pair.team.pts) || 0;
    totals.opp += Number(pair.opponent.pts) || 0;
    for (const key of SUMMED) totals[key] += Number(pair.team[key]) || 0;
  }
  if (!totals.games) return { boxScoreGames: 0, perGame: null, pct: null };
  const perGame = { pts: round1(totals.pts / totals.games), opp: round1(totals.opp / totals.games) };
  for (const key of COUNTING) perGame[key] = round1(totals[key] / totals.games);
  const ratio = (made, attempted) => (attempted > 0 ? round1((made / attempted) * 100) : null);
  const pct = {
    fg: ratio(totals.fgm, totals.fga),
    two: ratio(totals.fgm - totals.three_pm, totals.fga - totals.three_pa),
    three: ratio(totals.three_pm, totals.three_pa),
    ft: ratio(totals.ftm, totals.fta)
  };
  return { boxScoreGames: totals.games, perGame, pct };
}

/**
 * Miejsce drużyny w lidze dla każdej statystyki (1 = najlepsza; przy remisie to samo miejsce).
 * @param {Record<string, ReturnType<typeof seasonAverages>>} averagesByTeam
 */
export function leagueRanks(teamName, averagesByTeam) {
  const own = averagesByTeam[teamName];
  if (!own?.perGame) return null;
  const others = Object.values(averagesByTeam).filter((avg) => avg?.perGame);
  const ranks = {};
  const rank = (key, read) => {
    const value = read(own);
    if (value == null) return;
    const lower = LOWER_IS_BETTER.has(key);
    ranks[key] = 1 + others.filter((avg) => read(avg) != null && (lower ? read(avg) < value : read(avg) > value)).length;
  };
  for (const key of Object.keys(own.perGame)) rank(key, (avg) => avg.perGame[key]);
  for (const key of Object.keys(own.pct)) rank(`${key}Pct`, (avg) => avg.pct[key]);
  return { ranks, teams: others.length };
}

/**
 * Średnie zawodników drużyny z box score sezonu; pełne nazwisko z KALK po linku do profilu.
 * @param {Map<string, string>} fullNames profileUrl → imię i nazwisko
 */
export function playerAverages(teamName, matches, fullNames = new Map()) {
  const players = new Map();
  for (const match of matches) {
    const pair = sides(match, teamName);
    if (!pair) continue;
    for (const player of pair.team.players || []) {
      const key = player.profile_url || player.name;
      if (!key) continue;
      const entry = players.get(key) || { name: fullNames.get(player.profile_url) || player.name, number: player.number ?? null, games: 0, totals: {} };
      entry.games += 1;
      for (const category of LEADER_CATEGORIES) entry.totals[category] = (entry.totals[category] || 0) + (Number(player[category]) || 0);
      players.set(key, entry);
    }
  }
  return [...players.values()].map((entry) => ({
    name: entry.name,
    number: entry.number,
    games: entry.games,
    perGame: Object.fromEntries(LEADER_CATEGORIES.map((category) => [category, round1(entry.totals[category] / entry.games)]))
  }));
}

/** Najlepszy zawodnik każdej drużyny w każdej kategorii. */
export function leaderDuels(usPlayers, themPlayers) {
  const best = (players, category) => {
    const top = [...players].sort((a, b) => b.perGame[category] - a.perGame[category] || b.games - a.games)[0];
    return top && top.perGame[category] > 0 ? { name: top.name, number: top.number, value: top.perGame[category], games: top.games } : null;
  };
  return LEADER_CATEGORIES.map((category) => ({ category, us: best(usPlayers, category), them: best(themPlayers, category) })).filter(
    (duel) => duel.us || duel.them
  );
}

function tableSummary(row, fallbackName) {
  return {
    name: row?.name || fallbackName,
    logoUrl: row?.logoUrl || null,
    position: row?.position ?? null,
    matches: row?.matches ?? 0,
    wins: row?.wins ?? 0,
    losses: row?.losses ?? 0,
    pointsFor: row?.pointsFor ?? 0,
    pointsAgainst: row?.pointsAgainst ?? 0,
    form: Array.isArray(row?.form) ? row.form : [],
    streak: row?.streak || null
  };
}

/**
 * Mecze BeKaPaKa z rywalem (wszystkie sezony), najnowsze pierwsze, wynik z perspektywy BeKaPaKa.
 * @param {{ id: string, date: Date|string, seasonId: string, homeTeamName: string, guestTeamName: string, scoreHome: number|null, scoreAway: number|null }[]} matches
 */
export function headToHead(opponentName, matches, seasonLabels = {}, limit = 5) {
  return matches
    .filter((match) => {
      const homeUs = isUs(match.homeTeamName);
      const guestUs = isUs(match.guestTeamName);
      if (homeUs === guestUs) return false;
      return teamNamesMatchForLink(homeUs ? match.guestTeamName : match.homeTeamName, opponentName);
    })
    .filter((match) => match.scoreHome != null && match.scoreAway != null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)
    .map((match) => {
      const home = isUs(match.homeTeamName);
      return {
        gameId: String(match.id),
        date: new Date(match.date).toISOString(),
        seasonId: match.seasonId,
        seasonLabel: seasonLabels[match.seasonId] || null,
        scoreUs: home ? match.scoreHome : match.scoreAway,
        scoreThem: home ? match.scoreAway : match.scoreHome
      };
    });
}

/**
 * @param {{ opponent: string, season: { id: string, label: string } | null, table: object[], seasonMatches: object[],
 *           allMatches: object[], players?: { name: string, profileUrl?: string | null }[], seasonLabels?: Record<string, string> }} input
 * @returns {object | null} null, gdy rywala nie ma w tabeli ligi.
 */
export function buildMatchup({ opponent, season, table, seasonMatches, allMatches, players = [], seasonLabels = {} }) {
  const usRow = table.find((row) => isUs(row.name)) || null;
  const themRow = resolveLeagueTeamFromList(table.filter((row) => !isUs(row.name)), opponent).team;
  if (!themRow) return null;
  const usName = usRow?.name || 'BeKaPaKa Bobolice';

  const averagesByTeam = Object.fromEntries(table.map((row) => [row.name, seasonAverages(row.name, seasonMatches)]));
  averagesByTeam[usName] ||= seasonAverages(usName, seasonMatches);
  const side = (row, name) => {
    const league = leagueRanks(name, averagesByTeam);
    return { ...tableSummary(row, name), ...averagesByTeam[name], ranks: league?.ranks || null, leagueTeams: league?.teams || 0 };
  };

  const fullNames = new Map(players.filter((player) => player.profileUrl).map((player) => [player.profileUrl, player.name]));
  const usPlayers = playerAverages(usName, seasonMatches, fullNames);
  const themPlayers = playerAverages(themRow.name, seasonMatches, fullNames);
  const topScorers = (list) =>
    [...list].sort((a, b) => b.perGame.pts - a.perGame.pts).slice(0, 3).map((player) => ({ name: player.name, pointsAverage: player.perGame.pts, matchesPlayed: player.games }));

  return {
    season: season ? { id: season.id, label: season.label } : null,
    teams: { us: side(usRow, usName), them: side(themRow, themRow.name) },
    leaders: leaderDuels(usPlayers, themPlayers),
    scorers: { us: topScorers(usPlayers), them: topScorers(themPlayers) },
    headToHead: headToHead(themRow.name, allMatches, seasonLabels)
  };
}
