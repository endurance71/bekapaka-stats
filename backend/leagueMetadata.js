/** Metadata describes persisted rows, never the time of this request. */
export function leagueMetadata(season, rows) {
  const dates = rows.filter(row => row.updatedAt != null).map(row => new Date(row.updatedAt).getTime()).filter(Number.isFinite)
  const division = season?.divisionPath?.match(/dywizja-(\d+)/)?.[1]
  return {
    season: season ? { id: season.id, label: season.label, slug: season.slug } : null,
    division: division ? `Dywizja ${division}` : null,
    updatedAt: dates.length ? new Date(Math.max(...dates)).toISOString() : null
  }
}
