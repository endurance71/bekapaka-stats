/** Wymagane sekcje raportu meczu (zgodnie z promptem). */
export const MATCH_ANALYSIS_SECTIONS = [
  '## Podsumowanie',
  '## Co zadziałało',
  '## Do poprawy',
  '## Kluczowi zawodnicy',
  '## Przebieg kwart',
  '## Rekomendacja na trening'
];

const MIN_MATCH_ANALYSIS_LENGTH = 800;

/**
 * @param {string | null | undefined} text
 * @returns {boolean}
 */
export function hasCompleteMatchAnalysisMarkdown(text) {
  if (!text?.trim()) return false;

  const sectionCount = MATCH_ANALYSIS_SECTIONS.reduce(
    (acc, section) => acc + (text.includes(section) ? 1 : 0),
    0
  );
  const endsCleanly = /[.!?)\]]\s*$/.test(text.trim());

  return sectionCount >= MATCH_ANALYSIS_SECTIONS.length && text.length >= MIN_MATCH_ANALYSIS_LENGTH && endsCleanly;
}

/**
 * @param {string | null | undefined} text
 * @returns {{ complete: boolean; sectionCount: number; length: number; endsCleanly: boolean }}
 */
export function auditMatchAnalysisMarkdown(text) {
  const trimmed = text?.trim() ?? '';
  const sectionCount = MATCH_ANALYSIS_SECTIONS.reduce(
    (acc, section) => acc + (trimmed.includes(section) ? 1 : 0),
    0
  );
  const endsCleanly = trimmed ? /[.!?)\]]\s*$/.test(trimmed) : false;

  return {
    complete: hasCompleteMatchAnalysisMarkdown(trimmed),
    sectionCount,
    length: trimmed.length,
    endsCleanly
  };
}
