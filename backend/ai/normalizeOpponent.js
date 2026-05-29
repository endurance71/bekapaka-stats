/**
 * Normalized key for scouting cache (stable across minor name variants).
 * @param {string} name
 * @returns {string}
 */
export function normalizeOpponentKey(name) {
  if (!name) return '';
  const simplified = name.split('-')[0].trim();
  return simplified
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
