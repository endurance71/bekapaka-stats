export const MATCH_STATUSES = ['SCHEDULED', 'LIVE', 'BREAK', 'FINAL', 'POSTPONED', 'CANCELLED']
const textFields = ['competition', 'round', 'venue', 'kit', 'quarter', 'statusMessage']
const dateFields = ['previousDate', 'newDate']
/** Strict, shared validation for administrator overrides. null restores the source. */
export function validatePresentation(value) {
  if (value === null) return null
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Nieprawidłowe dane prezentacji')
  const allowed = ['status', ...textFields, ...dateFields, 'scoreUs', 'scoreThem']
  if (Object.keys(value).some((key) => !allowed.includes(key)))
    throw new Error('Nieznane pole prezentacji')
  const output = {}
  for (const [key, entry] of Object.entries(value)) {
    if (entry === undefined) continue
    if (key === 'status') {
      if (!MATCH_STATUSES.includes(entry)) throw new Error('Nieprawidłowy status meczu')
    } else if (key === 'scoreUs' || key === 'scoreThem') {
      if (entry !== null && (!Number.isInteger(entry) || entry < 0 || entry > 999))
        throw new Error('Wynik musi być liczbą 0–999 lub null')
    } else if (dateFields.includes(key)) {
      if (
        entry !== null &&
        (typeof entry !== 'string' ||
          !/^\d{4}-\d{2}-\d{2}T/.test(entry) ||
          !Number.isFinite(Date.parse(entry)))
      )
        throw new Error('Termin wymaga daty ISO z godziną')
    } else if (typeof entry !== 'string' || entry.length > 500)
      throw new Error('Nieprawidłowy tekst')
    output[key] = entry
  }
  return output
}
export function normalizeRoundName(round) {
  if (!round) return ''
  const trimmed = String(round).trim()
  const m = trimmed.match(/^(?:kolejka|rz)[\s\-_]*(\d+)$/i)
  if (m) return `${m[1]}. kolejka`
  return trimmed
}

/** Never infer LIVE from the clock or FINAL merely from a numeric score. */
export function resolvePresentation(game) {
  const manual = game.presentation || {}
  const status =
    manual.status ||
    (MATCH_STATUSES.includes(game.status) ? game.status : null) ||
    (game.isFinished === true ||
    game.result === 'W' ||
    game.result === 'L' ||
    game.status === 'FINAL'
      ? 'FINAL'
      : 'SCHEDULED')
  return {
    ...game,
    ...manual,
    status,
    date: manual.newDate || game.newDate || game.date,
    venue:
      manual.venue ||
      game.venue ||
      game.data?.venue ||
      (['kalk', 'league'].includes(game.dataSource) || game.isFromKalkMatch
        ? 'KOSiR Koszalin'
        : ''),
    competition: manual.competition || game.competition || 'KALK',
    round: normalizeRoundName(manual.round || game.round || game.roundCode || ''),
    previousDate: manual.previousDate || game.previousDate || (manual.newDate ? game.date : null),
    updatedAt: game.presentationUpdatedAt || game.updatedAt || null,
    scoreUs: Object.hasOwn(manual, 'scoreUs') ? manual.scoreUs : (game.scoreUs ?? null),
    scoreThem: Object.hasOwn(manual, 'scoreThem') ? manual.scoreThem : (game.scoreThem ?? null)
  }
}
export function selectHeroGame(games, now = Date.now()) {
  const resolved = games.map(resolvePresentation)
  return (
    resolved.find((game) => ['LIVE', 'BREAK'].includes(game.status)) ||
    resolved
      .filter((game) => game.status === 'SCHEDULED' && Date.parse(game.date) >= now)
      .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))[0] ||
    resolved
      .filter((game) => game.status === 'FINAL')
      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))[0] ||
    null
  )
}
