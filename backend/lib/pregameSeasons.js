/** Czyste pomocnicze dla raportu o rywalu: wybór sezonu bieżącego i poprzedniego z kariery KALK. */

export const seasonLabel = (slug) => (slug ? String(slug).replace(/^(\d{4})-\d{2}(\d{2})$/, '$1/$2') : null);
export const normTeam = (v) =>
  String(v || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/ł/g, 'l')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Wiersz kariery → zwięzły sezon do druku. */
function seasonLine(row) {
  if (!row) return null;
  return {
    seasonLabel: seasonLabel(row.seasonSlug),
    teamName: row.teamName || null,
    competition: row.competition || null,
    games: row.games || 0,
    perGame: row.perGame,
    pct: row.pct,
    plusMinusTotal: row.totals?.plusMinus ?? null
  };
}

/** Bieżący wiersz (ta drużyna, bieżący sezon) i poprzedni sezon (najwięcej meczów, dowolna drużyna). */
export function pickSeasons(career, { seasonSlug, prevSlug, teamName }) {
  const rows = career?.seasons || [];
  const team = normTeam(teamName);
  const current = rows
    .filter((r) => r.seasonSlug === seasonSlug)
    .sort((a, b) => Number(normTeam(b.teamName) === team) - Number(normTeam(a.teamName) === team) || b.games - a.games)[0] || null;
  const previous = prevSlug
    ? rows.filter((r) => r.seasonSlug === prevSlug && r.games > 0).sort((a, b) => b.games - a.games)
    : [];
  return { current: seasonLine(current), previous: previous.map(seasonLine) };
}
