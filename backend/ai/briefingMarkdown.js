/** Sekcje obowiązkowe briefingu. */
export const BRIEFING_CORE_SECTIONS = [
  '## Ostatni mecz',
  '## Forma i trendy',
  '## Priorytety treningowe',
  '## Na co uważać'
];

export const BRIEFING_UPCOMING_OPPONENT_SECTION = '## Nadchodzący rywal';

/** @deprecated Użyj BRIEFING_CORE_SECTIONS + opcjonalnie BRIEFING_UPCOMING_OPPONENT_SECTION */
export const BRIEFING_SECTIONS = [...BRIEFING_CORE_SECTIONS.slice(0, 3), BRIEFING_UPCOMING_OPPONENT_SECTION, BRIEFING_CORE_SECTIONS[3]];

const MIN_BRIEFING_LENGTH = 800;

/**
 * @param {string | null | undefined} text
 * @param {{ requireUpcomingOpponent?: boolean }} [options]
 * @returns {boolean}
 */
export function hasCompleteBriefingMarkdown(text, options = {}) {
  if (!text?.trim()) return false;

  const trimmed = text.trim();
  const requiredSections = options.requireUpcomingOpponent
    ? [...BRIEFING_CORE_SECTIONS.slice(0, 3), BRIEFING_UPCOMING_OPPONENT_SECTION, BRIEFING_CORE_SECTIONS[3]]
    : BRIEFING_CORE_SECTIONS;

  const sectionCount = requiredSections.reduce(
    (acc, section) => acc + (trimmed.includes(section) ? 1 : 0),
    0
  );
  const endsCleanly = /[.!?)\]]\s*$/.test(trimmed);

  return (
    sectionCount >= requiredSections.length &&
    trimmed.length >= MIN_BRIEFING_LENGTH &&
    endsCleanly &&
    (!options.requireUpcomingOpponent || !trimmed.includes('brak zaplanowanego meczu'))
  );
}

/**
 * @param {string | null | undefined} text
 * @param {{ requireUpcomingOpponent?: boolean }} [options]
 * @returns {{ complete: boolean; sectionCount: number; length: number; endsCleanly: boolean }}
 */
export function auditBriefingMarkdown(text, options = {}) {
  const trimmed = text?.trim() ?? '';
  const requiredSections = options.requireUpcomingOpponent
    ? [...BRIEFING_CORE_SECTIONS.slice(0, 3), BRIEFING_UPCOMING_OPPONENT_SECTION, BRIEFING_CORE_SECTIONS[3]]
    : BRIEFING_CORE_SECTIONS;

  const sectionCount = requiredSections.reduce(
    (acc, section) => acc + (trimmed.includes(section) ? 1 : 0),
    0
  );
  const endsCleanly = trimmed ? /[.!?)\]]\s*$/.test(trimmed) : false;

  return {
    complete: hasCompleteBriefingMarkdown(trimmed, options),
    sectionCount,
    length: trimmed.length,
    endsCleanly
  };
}
