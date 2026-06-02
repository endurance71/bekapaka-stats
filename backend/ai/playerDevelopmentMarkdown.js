/**
 * Parsowanie JSON planu rozwoju zawodnika (Gemini) i konwersja do Markdown (UI / DB).
 */

const REQUIRED_KEYS = [
  'profile',
  'positionPriorities',
  'strengths',
  'improvements',
  'trainingProposals',
  'trend',
  'sessionFocus',
  'seasonGoals'
];

const SECTION_TITLES = {
  profile: 'Profil',
  positionPriorities: 'Priorytety pozycyjne',
  strengths: 'Mocne strony',
  improvements: 'Do poprawy',
  trainingProposals: 'Propozycje treningowe',
  trend: 'Trend',
  sessionFocus: 'Fokus na najbliższy trening',
  seasonGoals: 'Cele sezonu'
};

/**
 * @param {unknown} value
 * @returns {string}
 */
function asString(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

/**
 * @param {string} raw
 * @returns {string | null}
 */
function extractJsonCandidate(raw) {
  const trimmed = raw.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]?.trim()) return fence[1].trim();
  if (trimmed.startsWith('{')) return trimmed;
  const embedded = trimmed.match(/\{[\s\S]*"profile"[\s\S]*\}/);
  return embedded?.[0] ?? null;
}

/**
 * @param {Record<string, unknown>} parsed
 * @returns {Record<string, string>}
 */
function normalizePlayerDevelopment(parsed) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const key of REQUIRED_KEYS) {
    out[key] = asString(parsed[key]);
  }
  return out;
}

/**
 * @param {string} raw
 * @returns {Record<string, string>}
 */
export function parsePlayerDevelopmentJson(raw) {
  const candidate = extractJsonCandidate(raw);
  if (!candidate) {
    throw new Error('Brak poprawnego JSON w odpowiedzi modelu (plan rozwoju)');
  }

  let parsed;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    throw new Error('Nie udało się sparsować JSON planu rozwoju');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Plan rozwoju: oczekiwany obiekt JSON');
  }

  const normalized = normalizePlayerDevelopment(/** @type {Record<string, unknown>} */ (parsed));
  const filled = REQUIRED_KEYS.filter((key) => normalized[key].length > 0);
  if (filled.length < 6) {
    throw new Error(`Plan rozwoju: za mało sekcji (${filled.length}/${REQUIRED_KEYS.length})`);
  }

  return normalized;
}

/**
 * @param {Record<string, string>} sections
 * @returns {string}
 */
export function buildPlayerDevelopmentMarkdown(sections) {
  const parts = [];
  for (const key of REQUIRED_KEYS) {
    const body = sections[key];
    if (!body) continue;
    const title = SECTION_TITLES[key];
    const content = body.startsWith('##') ? body : body;
    parts.push(`## ${title}\n\n${content.replace(/^##\s+[^\n]+\n+/i, '').trim()}`);
  }
  return parts.join('\n\n');
}

/**
 * @param {string} text
 * @returns {boolean}
 */
export function hasDetailedPlayerPlanMarkdown(text) {
  if (!text) return false;
  const sections = Object.values(SECTION_TITLES).map((title) => `## ${title}`);
  const sectionCount = sections.reduce((acc, section) => acc + (text.includes(section) ? 1 : 0), 0);
  const endsCleanly = /[.!?)\]]\s*$/.test(text.trim());
  return sectionCount === sections.length && text.length >= 1600 && endsCleanly;
}
