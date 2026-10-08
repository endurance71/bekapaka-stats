/**
 * Wersje promptów per typ analizy AI. Zmiana wersji zmienia hash cache,
 * więc zapisane analizy oznaczą się jako nieaktualne (bez auto-regeneracji).
 * Podbij wersję przy każdej zmianie promptu systemowego / struktury payloadu.
 */
export const AI_PROMPT_VERSIONS = Object.freeze({
  match: 'match-2026.10-v2',
  player: 'player-2026.10-v3',
  scouting: 'scouting-2026.10-v2',
  briefing: 'briefing-2026.10-v2',
  pregame: 'pregame-2026.10-v2',
  play: 'play-2026.10-v2'
});

/**
 * @param {keyof typeof AI_PROMPT_VERSIONS | string} type
 * @returns {string}
 */
export function getPromptVersion(type) {
  return AI_PROMPT_VERSIONS[type] ?? 'unversioned';
}
