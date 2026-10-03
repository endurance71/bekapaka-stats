export type Season = { id: string; label: string; isActive: boolean; startsAt: string | null };

export function initialSeason(seasons: Season[], savedSeasonId = '') {
  if (seasons.some(s => s.id === savedSeasonId)) return savedSeasonId;
  return seasons.find(s => s.isActive)?.id || [...seasons].sort((a, b) =>
    (Date.parse(b.startsAt || '') || 0) - (Date.parse(a.startsAt || '') || 0)
  )[0]?.id || '';
}
