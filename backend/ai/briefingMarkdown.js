const MIN_BRIEFING_LENGTH = 400;

/**
 * @param {string | null | undefined} text
 * @returns {boolean}
 */
export function hasCompleteBriefingMarkdown(text) {
  if (!text?.trim()) return false;
  const trimmed = text.trim();
  const endsCleanly = /[.!?)\]]\s*$/.test(trimmed);
  return trimmed.length >= MIN_BRIEFING_LENGTH && endsCleanly;
}

/**
 * @param {string | null | undefined} text
 * @returns {{ complete: boolean; length: number; endsCleanly: boolean }}
 */
export function auditBriefingMarkdown(text) {
  const trimmed = text?.trim() ?? '';
  const endsCleanly = trimmed ? /[.!?)\]]\s*$/.test(trimmed) : false;
  return {
    complete: hasCompleteBriefingMarkdown(trimmed),
    length: trimmed.length,
    endsCleanly
  };
}
