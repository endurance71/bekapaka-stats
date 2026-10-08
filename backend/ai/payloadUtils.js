/**
 * Narzędzia do budowy payloadów AI: brak NaN/undefined, zaokrąglenia, procenty.
 * Zasada: brak danych = null (prompt każe wtedy pisać „brak danych”), nigdy 0 udające liczbę.
 */

/**
 * @param {unknown} value
 * @returns {value is number}
 */
export function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * @param {unknown} value
 * @param {number} [digits=1]
 * @returns {number | null}
 */
export function roundOrNull(value, digits = 1) {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (!isFiniteNumber(n)) return null;
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
}

/**
 * Procent (0–100, 1 miejsce po przecinku) lub null gdy brak prób.
 * @param {number | null | undefined} made
 * @param {number | null | undefined} att
 */
export function pctOrNull(made, att) {
  if (!isFiniteNumber(made) || !isFiniteNumber(att) || att <= 0) return null;
  return roundOrNull((made / att) * 100, 1);
}

/**
 * Liczba całkowita z danych lub null.
 * @param {unknown} value
 */
export function intOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/**
 * Głęboka kopia payloadu bez NaN/Infinity/undefined (NaN → null, undefined pola usuwane,
 * undefined w tablicach → null, Date → ISO). Wynik jest stabilny dla JSON i hasha.
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function sanitizeAiPayload(value) {
  if (value === undefined) return /** @type {T} */ (/** @type {unknown} */ (null));
  if (value === null) return value;
  if (typeof value === 'number') {
    return /** @type {T} */ (/** @type {unknown} */ (Number.isFinite(value) ? value : null));
  }
  if (value instanceof Date) {
    return /** @type {T} */ (/** @type {unknown} */ (
      Number.isNaN(value.getTime()) ? null : value.toISOString()
    ));
  }
  if (Array.isArray(value)) {
    return /** @type {T} */ (/** @type {unknown} */ (value.map((item) => sanitizeAiPayload(item))));
  }
  if (typeof value === 'object') {
    /** @type {Record<string, unknown>} */
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      if (item === undefined || typeof item === 'function') continue;
      out[key] = sanitizeAiPayload(item);
    }
    return /** @type {T} */ (/** @type {unknown} */ (out));
  }
  return value;
}

/**
 * Ścieżki z wartościami NaN / Infinity / undefined (do testów i audytu).
 * @param {unknown} value
 * @param {string} [path]
 * @returns {string[]}
 */
export function findInvalidAiValues(value, path = '$') {
  if (value === undefined) return [path];
  if (typeof value === 'number') return Number.isFinite(value) ? [] : [path];
  if (value === null || typeof value !== 'object') return [];
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? [path] : [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findInvalidAiValues(item, `${path}[${index}]`));
  }
  return Object.entries(value).flatMap(([key, item]) => findInvalidAiValues(item, `${path}.${key}`));
}

/**
 * Nazwa drużyny uproszczona do porównań (bez sufiksu po „-”, bez diakrytyków).
 * @param {string | null | undefined} name
 */
export function simplifyTeamName(name) {
  return String(name || '')
    .split('-')[0]
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * Czy nazwa drużyny z bazy pasuje do szukanego rywala (luźne dopasowanie po uproszczonej nazwie).
 * @param {string | null | undefined} teamName
 * @param {string | null | undefined} opponentName
 */
export function teamNameMatches(teamName, opponentName) {
  const a = simplifyTeamName(teamName);
  const b = simplifyTeamName(opponentName);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

/**
 * Sekundy → "mm:ss".
 * @param {number | null | undefined} seconds
 */
export function secondsToClock(seconds) {
  if (!isFiniteNumber(seconds) || seconds < 0) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * "mm:ss" / liczba minut → sekundy.
 * @param {unknown} value
 * @returns {number | null}
 */
export function clockToSeconds(value) {
  if (isFiniteNumber(value)) return value * 60;
  if (typeof value !== 'string' || !value.trim()) return null;
  const parts = value.trim().split(':');
  if (parts.length === 2) {
    const m = Number(parts[0]);
    const s = Number(parts[1]);
    if (Number.isFinite(m) && Number.isFinite(s)) return m * 60 + s;
    return null;
  }
  const n = Number(value.replace(',', '.'));
  return Number.isFinite(n) ? n * 60 : null;
}
