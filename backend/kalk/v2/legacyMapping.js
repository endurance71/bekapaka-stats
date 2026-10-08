/** Mapowanie meczów ze starej strony KALK (legacy) na mecze KALK v2 — zamiana sezonu 2025/2026. */

export const norm = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/gi, 'l')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
export const isBkpk = (name) => norm(name).includes('bekapaka');
const dayDiff = (a, b) => Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86_400_000;

/** Najlepsze dopasowanie starego meczu do wiersza terminarza v2. */
export function matchLegacyToV2(legacy, schedule) {
  const candidates = schedule.filter((g) => g.isFinished && g.startsAtUtc && dayDiff(g.startsAtUtc, legacy.date) <= 1.1);
  let best = null;
  for (const g of candidates) {
    const sameOrientation = g.scoreHome === legacy.scoreHome && g.scoreAway === legacy.scoreAway;
    const swapped = g.scoreHome === legacy.scoreAway && g.scoreAway === legacy.scoreHome;
    if (!sameOrientation && !swapped) continue;
    let score = 10;
    const names = [norm(g.homeTeam), norm(g.guestTeam)];
    if (names.includes(norm(legacy.homeTeamName))) score += 3;
    if (names.includes(norm(legacy.guestTeamName))) score += 3;
    if (isBkpk(legacy.homeTeamName) || isBkpk(legacy.guestTeamName)) {
      if (isBkpk(g.homeTeam) || isBkpk(g.guestTeam)) score += 5;
      else continue;
    }
    if (sameOrientation) score += 1;
    score -= dayDiff(g.startsAtUtc, legacy.date);
    if (!best || score > best.score) best = { game: g, score };
  }
  return best?.game ?? null;
}
