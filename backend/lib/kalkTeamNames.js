/**
 * Normalizacja nazw drużyn KALK do łączenia terminarza z box score.
 */

const BEKAPAKA_ALIASES = ['bekapaka', 'bobolice', 'be ka paka'];

/**
 * @param {string | null | undefined} name
 */
export function normalizeTeamNameForMatch(name) {
  if (!name || typeof name !== 'string') return '';
  let n = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  n = n.replace(/\s+/g, ' ');
  for (const alias of BEKAPAKA_ALIASES) {
    if (n.includes(alias)) return 'bekapaka';
  }
  return n;
}

/**
 * @param {string} a
 * @param {string} b
 */
export function teamNamesMatchForLink(a, b) {
  const na = normalizeTeamNameForMatch(a);
  const nb = normalizeTeamNameForMatch(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  return na.includes(nb) || nb.includes(na);
}

/**
 * Klucz pary drużyn (kolejność nieistotna) + dzień meczu.
 * @param {string} home
 * @param {string} guest
 * @param {Date} date
 */
export function matchPairDayKey(home, guest, date) {
  const d = date instanceof Date ? date : new Date(date);
  const day = d.toISOString().split('T')[0];
  const teams = [normalizeTeamNameForMatch(home), normalizeTeamNameForMatch(guest)].sort();
  return `${day}|${teams[0]}|${teams[1]}`;
}

/**
 * @param {{ homeTeam?: string, guestTeam?: string, homeTeamName?: string, guestTeamName?: string, date: Date }} a
 * @param {{ homeTeam?: string, guestTeam?: string, homeTeamName?: string, guestTeamName?: string, date: Date }} b
 */
export function leagueRowsReferSameMatch(a, b) {
  const homeA = a.homeTeam || a.homeTeamName || '';
  const guestA = a.guestTeam || a.guestTeamName || '';
  const homeB = b.homeTeam || b.homeTeamName || '';
  const guestB = b.guestTeam || b.guestTeamName || '';
  const keyA = matchPairDayKey(homeA, guestA, a.date);
  const keyB = matchPairDayKey(homeB, guestB, b.date);
  return keyA === keyB;
}
