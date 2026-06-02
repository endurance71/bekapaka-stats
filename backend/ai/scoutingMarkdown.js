/**
 * Normalizacja, walidacja i markdown raportu scoutingu (Gemini + UI).
 */

const MIN_SECTION_CHARS = 40;

/**
 * @typedef {Object} ScoutingPersonnel
 * @property {string} [keyPlayers]
 * @property {string} [threats]
 * @property {string} [matchups]
 * @property {string} [bench]
 */

/**
 * @typedef {Object} ScoutingAnalysis
 * @property {string} summary
 * @property {string} offense
 * @property {string} defense
 * @property {string} verdict
 * @property {ScoutingPersonnel} [personnel]
 * @property {string[]} [lockerRoom]
 */

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
 * @param {unknown} parsed
 * @returns {ScoutingAnalysis}
 */
/**
 * Czasem Gemini / stary zapis trzyma cały JSON w polu summary.
 * @param {string} text
 * @returns {ScoutingAnalysis | null}
 */
/**
 * Wyciąga pola z obciętego / niepoprawnego JSON (np. cały raport w polu summary).
 * @param {string} text
 * @returns {ScoutingAnalysis | null}
 */
function salvagePartialJson(text) {
  const pick = (key) => {
    const re = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)`, 's');
    const match = text.match(re);
    if (!match?.[1]) return '';
    return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
  };

  const summary = pick('summary');
  const offense = pick('offense');
  const defense = pick('defense');
  const verdict = pick('verdict');
  if (!summary && !offense && !defense && !verdict) return null;

  return { summary, offense, defense, verdict, lockerRoom: [] };
}

function unwrapEmbeddedJson(text) {
  const trimmed = text.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    const inner = JSON.parse(trimmed);
    const normalized = normalizeScoutingAnalysis(inner);
    if (normalized.summary || normalized.offense || normalized.defense) {
      return normalized;
    }
  } catch {
    const salvaged = salvagePartialJson(trimmed);
    if (salvaged?.summary || salvaged?.offense) return salvaged;
  }
  return null;
}

export function normalizeScoutingAnalysis(parsed) {
  if (typeof parsed === 'string') {
    const trimmed = parsed.trim();
    const unwrapped = unwrapEmbeddedJson(trimmed);
    if (unwrapped) return unwrapped;
    if (trimmed.startsWith('{')) {
      try {
        return normalizeScoutingAnalysis(JSON.parse(trimmed));
      } catch {
        return { summary: trimmed.slice(0, 800), offense: '', defense: '', verdict: '' };
      }
    }
    return { summary: trimmed.slice(0, 800), offense: '', defense: '', verdict: '' };
  }

  const obj = parsed && typeof parsed === 'object' ? /** @type {Record<string, unknown>} */ (parsed) : {};

  const summaryRaw = asString(obj.summary ?? obj.overview ?? obj.podsumowanie);
  const unwrappedSummary = unwrapEmbeddedJson(summaryRaw);
  if (unwrappedSummary) {
    return {
      ...unwrappedSummary,
      personnel: unwrappedSummary.personnel?.keyPlayers
        ? unwrappedSummary.personnel
        : {
            keyPlayers: asString(obj.personnel && typeof obj.personnel === 'object'
              ? /** @type {Record<string, unknown>} */ (obj.personnel).keyPlayers
              : ''),
            threats: '',
            matchups: '',
            bench: ''
          },
      lockerRoom: unwrappedSummary.lockerRoom?.length
        ? unwrappedSummary.lockerRoom
        : (Array.isArray(obj.lockerRoom) ? obj.lockerRoom.map((item) => asString(item)).filter(Boolean) : [])
    };
  }

  let personnel = obj.personnel;
  if (personnel && typeof personnel !== 'object') personnel = undefined;

  const p = personnel && typeof personnel === 'object'
    ? /** @type {Record<string, unknown>} */ (personnel)
    : {};

  const lockerRaw = obj.lockerRoom ?? obj.locker_room ?? obj.checklist;
  const lockerRoom = Array.isArray(lockerRaw)
    ? lockerRaw.map((item) => asString(item)).filter(Boolean)
    : [];

  return {
    summary: summaryRaw,
    offense: asString(obj.offense ?? obj.offensive ?? obj.ofensywa),
    defense: asString(obj.defense ?? obj.defensive ?? obj.defensywa),
    verdict: asString(obj.verdict ?? obj.key ?? obj.keyPoints ?? obj.klucz),
    personnel: {
      keyPlayers: asString(p.keyPlayers ?? p.key_players),
      threats: asString(p.threats ?? p.zagrozenia),
      matchups: asString(p.matchups ?? p.pary),
      bench: asString(p.bench ?? p.lawka)
    },
    lockerRoom
  };
}

/**
 * @param {ScoutingAnalysis} analysis
 */
export function isScoutingAnalysisSparse(analysis) {
  if (analysis.summary?.trim().startsWith('{')) return true;
  const sections = [analysis.summary, analysis.offense, analysis.defense, analysis.verdict];
  const substantial = sections.filter((s) => s && s.length >= MIN_SECTION_CHARS);
  return substantial.length < 3;
}

/**
 * Uzupełnia puste pola analizy Gemini szablonem z danych ligi.
 * @param {ScoutingAnalysis} primary
 * @param {ScoutingAnalysis} fallback
 * @returns {ScoutingAnalysis}
 */
export function mergeScoutingAnalysis(primary, fallback) {
  const pick = (a, b) => (a && a.length >= MIN_SECTION_CHARS ? a : b);
  return {
    summary: pick(primary.summary, fallback.summary),
    offense: pick(primary.offense, fallback.offense),
    defense: pick(primary.defense, fallback.defense),
    verdict: pick(primary.verdict, fallback.verdict),
    personnel: {
      keyPlayers: pick(primary.personnel?.keyPlayers ?? '', fallback.personnel?.keyPlayers ?? ''),
      threats: pick(primary.personnel?.threats ?? '', fallback.personnel?.threats ?? ''),
      matchups: pick(primary.personnel?.matchups ?? '', fallback.personnel?.matchups ?? ''),
      bench: pick(primary.personnel?.bench ?? '', fallback.personnel?.bench ?? '')
    },
    lockerRoom: primary.lockerRoom?.length ? primary.lockerRoom : fallback.lockerRoom
  };
}

/**
 * @param {string} raw
 * @returns {ScoutingAnalysis}
 */
export function parseScoutingJson(raw) {
  const text = (raw || '').trim();
  if (!text) {
    return { summary: '', offense: '', defense: '', verdict: '' };
  }

  try {
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    const normalized = normalizeScoutingAnalysis(parsed);
    if (normalized.summary || normalized.offense || normalized.defense || normalized.verdict) {
      return normalized;
    }
  } catch {
    // fall through
  }

  return {
    summary: text.slice(0, 800),
    offense: '',
    defense: '',
    verdict: 'Zobacz pełny raport — wygeneruj ponownie z wymuszeniem (admin).',
    lockerRoom: []
  };
}

/**
 * @param {ScoutingAnalysis | null | undefined} analysis
 * @returns {string | null}
 */
export function buildScoutingSummaryMd(analysis) {
  if (!analysis) return null;

  const parts = [];
  if (analysis.summary) parts.push(`## Podsumowanie\n\n${analysis.summary}`);
  if (analysis.offense) parts.push(`## Ofensywa\n\n${analysis.offense}`);
  if (analysis.defense) parts.push(`## Defensywa\n\n${analysis.defense}`);
  if (analysis.verdict) parts.push(`## Klucz\n\n${analysis.verdict}`);
  if (analysis.lockerRoom?.length) {
    parts.push(
      `## Szatnia\n\n${analysis.lockerRoom.map((line) => `- ${line}`).join('\n')}`
    );
  }

  return parts.length ? parts.join('\n\n') : null;
}

/**
 * Gdy w DB zapisano surowy JSON zamiast markdown — wykrywa i normalizuje.
 * @param {string | null | undefined} summaryMd
 * @returns {ScoutingAnalysis | null}
 */
export function analysisFromSummaryMdField(summaryMd) {
  if (!summaryMd?.trim()) return null;
  const trimmed = summaryMd.trim();
  if (!trimmed.startsWith('{') && !/"summary"\s*:/.test(trimmed)) return null;
  return normalizeScoutingAnalysis(trimmed);
}
