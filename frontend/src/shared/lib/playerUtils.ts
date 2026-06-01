/**
 * Shared player utilities — extracted from Shell, SidebarProfile, PlayerCard
 * to eliminate code duplication.
 */

/** Normalize Polish characters for URL-safe file paths */
export function normalizePolishChars(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/\s+/g, '-');
}

/** Build a local photo URL from player's first/last name */
export function getPhotoUrl(firstName?: string, lastName?: string): string {
  if (!firstName || !lastName) return '/photos/default.png';
  return `/photos/${normalizePolishChars(firstName)}-${normalizePolishChars(lastName)}.png`;
}

/** Map position abbreviation to Polish label */
const POSITION_MAP: Record<string, string> = {
  G: 'Obrońca',
  F: 'Skrzydłowy',
  C: 'Środkowy',
  PG: 'Rozgrywający',
  SG: 'Rzucający Obrońca',
  SF: 'Niski Skrzydłowy',
  PF: 'Silny Skrzydłowy',
};

export function getPositionLabel(position?: string): string {
  if (!position) return 'Zawodnik';
  return POSITION_MAP[position] || position;
}
