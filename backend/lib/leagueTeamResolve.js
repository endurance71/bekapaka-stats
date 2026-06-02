/** @typedef {import('@prisma/client').LeagueTeam} LeagueTeam */

export const LEAGUE_TABLE_ORDER_BY = [
  { points: 'desc' },
  { wins: 'desc' },
  { matches: 'asc' },
  { pointsFor: 'desc' }
];

/**
 * Dopasowuje nazwę rywala do wiersza tabeli ligowej (bez luźnego `includes` na krótkich fragmentach).
 * @param {LeagueTeam[]} teams Posortowana tabela (jak w getLeagueTable).
 * @param {string} opponentName
 * @returns {{ team: LeagueTeam | null, rank: number | null }}
 */
export function resolveLeagueTeamFromList(teams, opponentName) {
  const needle = (opponentName || '').trim().toLowerCase();
  if (!needle || !teams?.length) {
    return { team: null, rank: null };
  }

  /** @type {{ team: LeagueTeam, index: number, score: number }[]} */
  const candidates = [];

  for (let index = 0; index < teams.length; index++) {
    const team = teams[index];
    const tableName = (team.name || '').trim().toLowerCase();
    if (!tableName) continue;

    let score = 0;
    if (tableName === needle) {
      score = 1000;
    } else if (needle.includes(tableName) || tableName.includes(needle)) {
      // Preferuj najdłuższą nazwę (unika np. „Crew” → BrdCrew przy pełnym „GMVT TEAM”).
      score = 100 + tableName.length;
    }

    if (score > 0) {
      candidates.push({ team, index, score });
    }
  }

  if (!candidates.length) {
    return { team: null, rank: null };
  }

  candidates.sort((a, b) => b.score - a.score || a.index - b.index);
  const best = candidates[0];
  return { team: best.team, rank: best.index + 1 };
}
