/**
 * Walidacja struktury pliku KALK v2 (kontrakt `version: 3`, docs/kalk-v2-contract.md).
 * Błędy strukturalne blokują import; inwarianty danych sprawdza audyt.
 */

export const SUPPORTED_BUNDLE_VERSION = 3;

/**
 * @param {unknown} bundle
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
export function validateKalkV2Bundle(bundle) {
  const errors = [];
  const warnings = [];
  if (!bundle || typeof bundle !== 'object') {
    return { ok: false, errors: ['Plik nie jest obiektem JSON'], warnings };
  }
  if (bundle.version !== SUPPORTED_BUNDLE_VERSION) {
    errors.push(`Nieobsługiwana wersja kontraktu: ${bundle.version} (oczekiwano ${SUPPORTED_BUNDLE_VERSION})`);
  }
  const m = bundle.manifest;
  if (!m || typeof m !== 'object') {
    errors.push('Brak manifest');
  } else {
    if (!/^\d{4}-\d{4}$/.test(String(m.seasonSlug || ''))) errors.push(`manifest.seasonSlug niepoprawny: ${m.seasonSlug}`);
    if (!Number.isInteger(m.kalkNumber)) errors.push('manifest.kalkNumber musi być liczbą całkowitą');
    if (m.sourceSite && m.sourceSite !== 'v2') errors.push(`manifest.sourceSite = ${m.sourceSite} (oczekiwano v2)`);
    if (m.league && m.league !== 'dywizja-ii') errors.push(`manifest.league = ${m.league} (import obsługuje tylko dywizja-ii)`);
    if (m.mode && !['full', 'incremental'].includes(m.mode)) errors.push(`manifest.mode = ${m.mode}`);
    if (!m.runId) warnings.push('manifest.runId pusty');
    if (m.truncated) warnings.push('manifest.truncated = true (budżet zapytań wyczerpany — dane niepełne)');
    if (Array.isArray(m.failures) && m.failures.length) warnings.push(`manifest.failures: ${m.failures.length}`);
  }

  for (const key of ['standings', 'teams', 'schedule', 'matches', 'players', 'profiles', 'teamProfiles']) {
    if (bundle[key] != null && !Array.isArray(bundle[key])) errors.push(`${key} musi być tablicą`);
  }

  const scheduleIds = new Set();
  for (const s of Array.isArray(bundle.schedule) ? bundle.schedule : []) {
    if (!s?.kalkMatchId) {
      errors.push('schedule: wpis bez kalkMatchId');
      continue;
    }
    const id = String(s.kalkMatchId);
    if (scheduleIds.has(id)) errors.push(`schedule: duplikat kalkMatchId ${id}`);
    scheduleIds.add(id);
    if (!s.homeTeam || !s.guestTeam) errors.push(`schedule ${id}: brak nazw drużyn`);
    if (s.startsAtUtc && Number.isNaN(new Date(s.startsAtUtc).getTime())) errors.push(`schedule ${id}: niepoprawna data`);
  }

  const matchIds = new Set();
  for (const match of Array.isArray(bundle.matches) ? bundle.matches : []) {
    const id = match?.kalkMatchId != null ? String(match.kalkMatchId) : null;
    if (!id) {
      errors.push('matches: wpis bez kalkMatchId');
      continue;
    }
    if (matchIds.has(id)) errors.push(`matches: duplikat ${id}`);
    matchIds.add(id);
    if (scheduleIds.size && !scheduleIds.has(id)) {
      warnings.push(`matches ${id}: brak w terminarzu pliku (użyję danych z bazy)`);
    }
    const teams = match?.box?.teams;
    if (!Array.isArray(teams) || teams.length !== 2) {
      errors.push(`matches ${id}: box.teams musi mieć dokładnie 2 elementy`);
    } else {
      const sides = teams.map((t) => t?.side).sort().join(',');
      if (sides !== 'away,home') errors.push(`matches ${id}: box.teams[].side musi być home i away`);
      for (const t of teams) {
        if (!Array.isArray(t?.players)) errors.push(`matches ${id}: box.teams[${t?.side}].players nie jest tablicą`);
      }
    }
    if (match.pbp != null && !Array.isArray(match.pbp.events)) errors.push(`matches ${id}: pbp.events nie jest tablicą`);
    if (Array.isArray(match.pbp?.events)) {
      const seqs = match.pbp.events.map((e) => e?.seq);
      if (seqs.some((q) => !Number.isInteger(q))) errors.push(`matches ${id}: pbp.events[].seq musi być liczbą całkowitą`);
      else if (new Set(seqs).size !== seqs.length) errors.push(`matches ${id}: duplikaty pbp.events[].seq`);
    }
  }

  const slugs = new Set();
  for (const p of Array.isArray(bundle.players) ? bundle.players : []) {
    if (!p?.slug) {
      errors.push('players: wpis bez slug');
      continue;
    }
    if (slugs.has(p.slug)) warnings.push(`players: duplikat slug ${p.slug}`);
    slugs.add(p.slug);
  }
  for (const p of Array.isArray(bundle.profiles) ? bundle.profiles : []) {
    if (!p?.slug) errors.push('profiles: wpis bez slug');
    if (p?.birthDate) errors.push(`profiles ${p.slug}: pełna data urodzenia niedozwolona (tylko birthYear)`);
  }
  for (const t of Array.isArray(bundle.teams) ? bundle.teams : []) {
    if (!t?.id) errors.push('teams: wpis bez id');
  }

  return { ok: errors.length === 0, errors, warnings };
}
