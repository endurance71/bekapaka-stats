/**
 * Sezony ligowe KALK — identyfikatory, zakresy dat i rozwiązywanie kontekstu API.
 */

export const DEFAULT_SEASON_SLUG = '2025-2026';

const SEASON_ID_PREFIX = 'season_';

/** Id rekordu KalkSeason w DB (stabilne, niezależne od slug). */
export function seasonRowId(slug) {
  return `${SEASON_ID_PREFIX}${slug}`;
}

/** Id zawodnika w DB: `{slug}__{kalkExternalId}`. */
export function buildKalkPlayerDbId(seasonSlug, kalkExternalId) {
  if (!kalkExternalId) return null;
  if (kalkExternalId.includes('__')) return kalkExternalId;
  return `${seasonSlug}__${kalkExternalId}`;
}

/** Zewnętrzne id KALK z id w bazie (bez prefiksu sezonu). */
export function parseKalkExternalId(dbId) {
  if (!dbId) return null;
  const idx = dbId.indexOf('__');
  if (idx === -1) return dbId;
  return dbId.slice(idx + 2);
}

/**
 * Czy data mieści się w sezonie (włącznie z granicami dnia).
 * @param {Date} date
 * @param {{ startsAt: Date | null, endsAt: Date | null }} season
 */
export function isDateInSeason(date, season) {
  if (!season) return true;
  const t = date.getTime();
  if (season.startsAt && t < startOfDay(season.startsAt).getTime()) return false;
  if (season.endsAt && t > endOfDay(season.endsAt).getTime()) return false;
  return true;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/**
 * Przypisz seasonId do meczu na podstawie daty (pierwszy pasujący sezon).
 * @param {Date} date
 * @param {Array<{ id: string, startsAt: Date | null, endsAt: Date | null }>} seasons
 */
export function resolveSeasonIdForDate(date, seasons) {
  const ordered = [...seasons].sort((a, b) => {
    const ta = a.startsAt ? a.startsAt.getTime() : 0;
    const tb = b.startsAt ? b.startsAt.getTime() : 0;
    return tb - ta;
  });
  for (const s of ordered) {
    if (isDateInSeason(date, s)) return s.id;
  }
  const active = seasons.find((s) => s.isActive);
  return active?.id ?? seasons[0]?.id ?? null;
}
