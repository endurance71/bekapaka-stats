/**
 * Buduje markdown sekcji kadry z JSON raportu scoutingu (Gemini).
 * @param {Record<string, unknown> | null | undefined} analysisJson
 * @returns {string | null}
 */
export function buildPersonnelMdFromAnalysis(analysisJson) {
  const personnel = analysisJson?.personnel;
  if (!personnel || typeof personnel !== 'object') return null;

  const sections = [
    personnel.keyPlayers ? `### Kluczowi zawodnicy\n\n${personnel.keyPlayers}` : '',
    personnel.threats ? `### Zagrożenia\n\n${personnel.threats}` : '',
    personnel.matchups ? `### Matchupy i obrona\n\n${personnel.matchups}` : '',
    personnel.bench ? `### Ławka i rotacja\n\n${personnel.bench}` : ''
  ].filter(Boolean);

  if (sections.length === 0) return null;
  return `## Analiza kadry\n\n${sections.join('\n\n')}`;
}
