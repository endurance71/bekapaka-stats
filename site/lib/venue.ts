/** Domyślna hala — wszystkie mecze KALK rozgrywane w Koszalinie. */
export const DEFAULT_VENUE = 'KOSiR Koszalin'

export function formatVenue(venue?: string | null): string {
  const trimmed = venue?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_VENUE
}
