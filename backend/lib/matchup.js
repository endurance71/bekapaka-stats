/**
 * Zapowiedź meczu: BeKaPaKa i rywal w bieżącym sezonie (tabela + średnie z box score) oraz mecze bezpośrednie.
 * Czyste funkcje — dane pobiera `getMatchup` w dataStore.js.
 */
import { resolveLeagueTeamFromList } from './leagueTeamResolve.js';
import { normalizeTeamNameForMatch, teamNamesMatchForLink } from './kalkTeamNames.js';

const COUNTING = ['reb', 'ast', 'stl', 'blk', 'tov'];
const SHOTS = { fg: ['fgm', 'fga'], three: ['three_pm', 'three_pa'], ft: ['ftm', 'fta'] };

const isUs = (name) => normalizeTeamNameForMatch(name) === 'bekapaka';
const round1 = (value) => Math.round(value * 10) / 10;

/**
 * Sumy drużyny z meczów sezonu (strona drużyny w każdym meczu) → średnie na mecz i skuteczność z sum.
 * @param {string} teamName
 * @param {{ teams?: object[] }[]} matches Zakończone mecze sezonu w postaci `kalkMatchToGameDetail` (teams z sumami).
 */
export function seasonAverages(teamName, matches) {
  const totals = { games: 0, pts: 0, opp: 0, fgm: 0, fga: 0, three_pm: 0, three_pa: 0, ftm: 0, fta: 0 };
  for (const key of COUNTING) totals[key] = 0;

  for (const match of matches) {
    const teams = match.teams || [];
    if (teams.length < 2) continue;
    const index = teams.findIndex((team) => (isUs(teamName) ? isUs(team.name) : !isUs(team.name) && teamNamesMatchForLink(team.name, teamName)));
    if (index < 0) continue;
    const team = teams[index];
    const opponent = teams[1 - index];
    totals.games += 1;
    totals.pts += Number(team.pts) || 0;
    totals.opp += Number(opponent.pts) || 0;
    for (const key of [...COUNTING, 'fgm', 'fga', 'three_pm', 'three_pa', 'ftm', 'fta']) totals[key] += Number(team[key]) || 0;
  }

  if (!totals.games) return { boxScoreGames: 0, perGame: null, pct: null };
  const perGame = { pts: round1(totals.pts / totals.games), opp: round1(totals.opp / totals.games) };
  for (const key of COUNTING) perGame[key] = round1(totals[key] / totals.games);
  const pct = {};
  for (const [name, [made, attempted]] of Object.entries(SHOTS)) pct[name] = totals[attempted] ? round1((totals[made] / totals[attempted]) * 100) : null;
  return { boxScoreGames: totals.games, perGame, pct };
}

function tableSummary(row) {
  if (!row) return null;
  return {
    name: row.name,
    logoUrl: row.logoUrl || null,
    position: row.position ?? null,
    matches: row.matches ?? 0,
    wins: row.wins ?? 0,
    losses: row.losses ?? 0,
    pointsFor: row.pointsFor ?? 0,
    pointsAgainst: row.pointsAgainst ?? 0,
    form: Array.isArray(row.form) ? row.form : [],
    streak: row.streak || null
  };
}

function topScorers(players, teamName, limit = 3) {
  return players
    .filter((player) => (isUs(teamName) ? isUs(player.team) : !isUs(player.team) && teamNamesMatchForLink(player.team, teamName)))
    .filter((player) => (player.matchesPlayed ?? 0) > 0 && player.pointsAverage != null)
    .sort((a, b) => (b.pointsAverage ?? 0) - (a.pointsAverage ?? 0))
    .slice(0, limit)
    .map((player) => ({ name: player.name, pointsAverage: round1(player.pointsAverage), matchesPlayed: player.matchesPlayed ?? 0 }));
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
 *           allMatches: object[], players: object[], seasonLabels?: Record<string, string> }} input
 * @returns {object | null} null, gdy rywala nie ma w tabeli ligi.
 */
export function buildMatchup({ opponent, season, table, seasonMatches, allMatches, players, seasonLabels = {} }) {
  const usRow = table.find((row) => isUs(row.name)) || null;
  const themRow = resolveLeagueTeamFromList(table.filter((row) => !isUs(row.name)), opponent).team;
  if (!themRow) return null;

  const side = (row, fallbackName) => {
    const name = row?.name || fallbackName;
    return { ...(tableSummary(row) || { name, logoUrl: null, position: null, matches: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, form: [], streak: null }), ...seasonAverages(name, seasonMatches) };
  };

  return {
    season: season ? { id: season.id, label: season.label } : null,
    teams: { us: side(usRow, 'BeKaPaKa Bobolice'), them: side(themRow, opponent) },
    scorers: { us: topScorers(players, usRow?.name || 'BeKaPaKa'), them: topScorers(players, themRow.name) },
    headToHead: headToHead(themRow.name, allMatches, seasonLabels)
  };
}
