/**
 * Kontrola faktów tekstu AI względem payloadu wejściowego (heurystyka, bez LLM):
 * każda liczba i każde nazwisko z tekstu powinno występować w payloadzie.
 * Wynik to lista „podejrzanych” pozycji do ręcznej weryfikacji — nie dowód błędu.
 */

/** Słowa zawsze dozwolone (nazwy własne ligi / hali / zespołu, nagłówki). */
const KNOWN_WORDS = [
  'bekapaka', 'bobolice', 'kosir', 'koszalin', 'kalk', 'dywizja', 'liga', 'trener', 'gemini',
  'mvp', 'eval', 'efg', 'ts', 'tov', 'orb', 'drb', 'ppg', 'rpg', 'apg', 'ortg', 'drtg', 'ft', 'fg',
  'klucz', 'uwaga', 'brak', 'danych', 'kwarta', 'kwarty', 'dogrywka', 'pick', 'roll', 'and',
  'man', 'to', 'catch', 'shoot', 'pace', 'net', 'rating', 'four', 'factors', 'faza', 'play', 'off', 'out'
];

/**
 * @param {string} s
 */
function normalizeWord(s) {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'l')
    .toLowerCase();
}

const NUMBER_RE = /\d+(?:[.,]\d+)?/g;
const WORD_RE = /[\p{L}]{3,}/gu;

/**
 * Wszystkie liczby i słowa (tokeny nazw) z payloadu — także z wartości tekstowych ("4/5", "23:52").
 * @param {unknown} payload
 * @returns {{ numbers: number[], words: Set<string> }}
 */
export function collectPayloadFacts(payload) {
  /** @type {number[]} */
  const numbers = [];
  /** @type {Set<string>} */
  const words = new Set(KNOWN_WORDS);

  const walk = (value) => {
    if (value === null || value === undefined) return;
    if (typeof value === 'number') {
      if (Number.isFinite(value)) numbers.push(Math.abs(value));
      return;
    }
    if (typeof value === 'string') {
      for (const m of value.matchAll(NUMBER_RE)) numbers.push(Number(m[0].replace(',', '.')));
      for (const m of value.matchAll(WORD_RE)) words.add(normalizeWord(m[0]));
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) {
        // klucze typu "Q1" / "OT1" to też fakty (np. faule w Q3)
        for (const m of key.matchAll(NUMBER_RE)) numbers.push(Number(m[0]));
        walk(item);
      }
    }
  };
  walk(payload);
  return { numbers, words };
}

/**
 * Czy liczba z tekstu da się wyprowadzić z payloadu (wartość, zaokrąglenie, ułamek → %, %).
 * @param {number} n
 * @param {number[]} values
 */
export function numberIsSupported(n, values) {
  for (const v of values) {
    if (Math.abs(v - n) < 0.051) return true;
    if (Math.round(v) === n) return true;
    if (Math.abs(Math.round(v * 10) / 10 - n) < 0.001) return true;
    if (v <= 1.5) {
      const pct = v * 100;
      if (Math.abs(pct - n) < 0.051 || Math.round(pct) === n || Math.abs(Math.round(pct * 10) / 10 - n) < 0.001) {
        return true;
      }
    }
  }
  return false;
}

/**
 * @param {string} word
 * @param {Set<string>} words
 */
function wordIsKnown(word, words) {
  const w = normalizeWord(word);
  if (words.has(w)) return true;
  // Odmiana polska: „Kowalskiego” ↔ „Kowalski” — wspólny rdzeń ≥ 5 znaków (lub całe krótsze słowo).
  const stemLen = Math.max(4, Math.min(w.length - 2, 6));
  const stem = w.slice(0, stemLen);
  for (const k of words) {
    if (k.length >= 4 && (k.startsWith(stem) || (w.startsWith(k) && k.length >= 5))) return true;
  }
  return false;
}

/**
 * Usuwa sekcje Markdown (## Tytuł) z listy pomijanych — np. cele treningowe z liczbami docelowymi.
 * @param {string} text
 * @param {string[]} skipSections
 */
function stripSections(text, skipSections) {
  if (!skipSections.length) return text;
  const lines = text.split('\n');
  const out = [];
  let skipping = false;
  for (const line of lines) {
    const heading = line.match(/^#{1,3}\s+(.+?)\s*$/);
    if (heading) {
      skipping = skipSections.some((s) => heading[1].toLowerCase().startsWith(s.toLowerCase()));
      continue;
    }
    if (!skipping) out.push(line);
  }
  return out.join('\n');
}

/**
 * @param {string} text
 * @param {number} index
 */
function contextAround(text, index) {
  return text.slice(Math.max(0, index - 30), Math.min(text.length, index + 30)).replace(/\s+/g, ' ').trim();
}

/**
 * @param {string | null | undefined} text — Markdown / tekst analizy
 * @param {unknown} payload — payload wysłany do Gemini
 * @param {{ skipSections?: string[], ignoreSmallIntegers?: number, extraNumbers?: number[] }} [options]
 * @returns {{
 *   checkedNumbers: number,
 *   checkedNames: number,
 *   suspiciousNumbers: Array<{ value: number, context: string }>,
 *   suspiciousNames: Array<{ name: string, context: string }>,
 *   suspicious: boolean
 * }}
 */
export function factCheckText(text, payload, options = {}) {
  const ignoreSmall = options.ignoreSmallIntegers ?? 10;
  const facts = collectPayloadFacts(payload);
  const values = [...facts.numbers, ...(options.extraNumbers || []).map((v) => Math.abs(v))];

  const body = stripSections(String(text || ''), options.skipSections || [])
    // nagłówki i daty nie są „faktami” do sprawdzenia
    .replace(/^#{1,6}\s.*$/gm, '')
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, ' ')
    .replace(/\b\d{1,2}\.\d{1,2}\.\d{2,4}\b/g, ' ');

  /** @type {Array<{ value: number, context: string }>} */
  const suspiciousNumbers = [];
  const seenNumbers = new Set();
  let checkedNumbers = 0;
  for (const m of body.matchAll(NUMBER_RE)) {
    const raw = m[0];
    const n = Number(raw.replace(',', '.'));
    if (!Number.isFinite(n)) continue;
    if (Number.isInteger(n) && n <= ignoreSmall) continue;
    if (Number.isInteger(n) && n >= 1990 && n <= 2100) continue;
    checkedNumbers += 1;
    if (numberIsSupported(n, values)) continue;
    if (seenNumbers.has(n)) continue;
    seenNumbers.add(n);
    suspiciousNumbers.push({ value: n, context: contextAround(body, m.index ?? 0) });
  }

  // Kandydaci na nazwiska: „Imię Nazwisko”, „I. Nazwisko”, „Nazwisko (#7)”.
  const NAME_RE = /(?:\b(\p{Lu}\.)\s?(\p{Lu}[\p{Ll}]{2,}(?:-\p{Lu}[\p{Ll}]+)?))|(?:\b(\p{Lu}[\p{Ll}]{2,})\s+(\p{Lu}[\p{Ll}]{2,}(?:-\p{Lu}[\p{Ll}]+)?))|(?:\b(\p{Lu}[\p{Ll}]{2,})\s*\(#\d+\))/gu;
  /** @type {Array<{ name: string, context: string }>} */
  const suspiciousNames = [];
  const seenNames = new Set();
  let checkedNames = 0;
  for (const m of body.matchAll(NAME_RE)) {
    const parts = [m[2], m[3], m[4], m[5]].filter(Boolean);
    if (!parts.length) continue;
    const name = parts.join(' ');
    checkedNames += 1;
    const known = parts.some((p) => wordIsKnown(p, facts.words));
    if (known) continue;
    // Pierwsze słowo zdania + kolejne z wielkiej litery bywa zwykłym tekstem — wymagaj, by oba słowa były nieznane.
    const key = normalizeWord(name);
    if (seenNames.has(key)) continue;
    seenNames.add(key);
    suspiciousNames.push({ name, context: contextAround(body, m.index ?? 0) });
  }

  return {
    checkedNumbers,
    checkedNames,
    suspiciousNumbers,
    suspiciousNames,
    suspicious: suspiciousNumbers.length > 0 || suspiciousNames.length > 0
  };
}

/** Sekcje z liczbami docelowymi (cele, ćwiczenia) — nie muszą występować w danych. */
export const FACT_CHECK_SKIP_SECTIONS = {
  match: ['Rekomendacja na trening'],
  player: ['Propozycje treningowe', 'Fokus na najbliższy trening', 'Cele sezonu'],
  scouting: [],
  briefing: [],
  pregame: []
};

/**
 * Liczby pochodne meczu dozwolone w tekście (różnice wyniku, kwart, sum drużyn).
 * @param {Record<string, any>} matchPayload
 * @returns {number[]}
 */
export function matchDerivedNumbers(matchPayload) {
  const out = [];
  const m = matchPayload?.meta;
  if (Number.isFinite(m?.scoreUs) && Number.isFinite(m?.scoreThem)) out.push(Math.abs(m.scoreUs - m.scoreThem));
  for (const q of matchPayload?.quarters || []) {
    if (Number.isFinite(q.bekapaka) && Number.isFinite(q.opponent)) {
      out.push(Math.abs(q.bekapaka - q.opponent), q.bekapaka + q.opponent);
    }
  }
  const us = matchPayload?.teams?.bekapaka?.totals || {};
  const them = matchPayload?.teams?.opponent?.totals || {};
  for (const key of Object.keys(us)) {
    if (Number.isFinite(us[key]) && Number.isFinite(them[key])) {
      out.push(Math.abs(us[key] - them[key]));
      out.push(Math.round(Math.abs(us[key] - them[key]) * 10) / 10);
    }
  }
  return out;
}
