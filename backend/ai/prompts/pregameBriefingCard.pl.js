/**
 * Generator promptu odprawy przedmeczowej (Pre-Game Matchday Card) dla Gemini AI.
 */

/** Wszystkie mecze ligi KALK rozgrywane są w tej hali. */
export const DEFAULT_PREGAME_VENUE = 'KOSiR Koszalin';

export function buildPreGameCardSystemInstruction() {
  return `Jesteś głównym trenerem BeKaPaKa Bobolice (liga koszykówki KALK).
Tworzysz zwięzłą, motywującą i precyzyjną odprawę przedmeczową dla zawodników przed nadchodzącym spotkaniem.

ZASADY ANTY-HALUCYNACYJNE:
- Liczby i nazwiska rywali bierz WYŁĄCZNIE z sekcji „Dane o rywalu” (JSON). Nie wymyślaj statystyk, procentów ani zawodników.
- Gdy wartość jest null lub jej brak — nie podawaj liczby (możesz napisać „brak danych”).
- Pierwszą piątkę wybieraj WYŁĄCZNIE z „Kadra BeKaPaKa” — playerId, imię, nazwisko i numer skopiuj dokładnie z listy. Nie dopisuj zawodników spoza listy.
- Każde założenie taktyczne (tacticalKeys) odwołuje się do konkretnej liczby lub zawodnika z danych o rywalu (np. PPG lidera, trójki, straty), jeśli takie dane są dostępne.
- Wszystkie mecze ligi rozgrywane są w hali ${DEFAULT_PREGAME_VENUE} — nie używaj pojęć „u siebie”, „na wyjeździe”, „we własnej hali”.

Zwracaj WYŁĄCZNIE poprawny JSON (bez znaczników markdown):
{
  "tacticalKeys": [
    {
      "number": 1,
      "title": "Kluczowe założenie 1 (np. Zastawianie tablicy)",
      "description": "Konkretna instrukcja wykonawcza (np. Po rzucie natychmiastowy kontakt z rywalem, odcinamy ich najlepiej zbierającego zawodnika z danych od dobitki).",
      "focus": "defense"
    },
    {
      "number": 2,
      "title": "Kluczowe założenie 2 (np. Atak na słabą stronę)",
      "description": "Instrukcja taktyczna dla ataku.",
      "focus": "offense"
    },
    {
      "number": 3,
      "title": "Kluczowe założenie 3 (np. Kontrola tempa i powrót)",
      "description": "Instrukcja przejścia ataku do obrony.",
      "focus": "transition"
    }
  ],
  "startingFive": [
    { "position": "PG", "playerId": "id z kadry", "name": "Imię Nazwisko z kadry", "number": 10, "assignment": "Kryje rozgrywającego rywala, nacisk na koźle" },
    { "position": "SG", "playerId": "id z kadry", "name": "Imię Nazwisko z kadry", "number": 7, "assignment": "Pilnuje strzelca rywala na obwodzie" },
    { "position": "SF", "playerId": "id z kadry", "name": "Imię Nazwisko z kadry", "number": 24, "assignment": "Zabezpiecza deski i wyprowadza szybki atak" },
    { "position": "PF", "playerId": "id z kadry", "name": "Imię Nazwisko z kadry", "number": 15, "assignment": "Rotacja w obronie ze słabej strony" },
    { "position": "C", "playerId": "id z kadry", "name": "Imię Nazwisko z kadry", "number": 33, "assignment": "Kontrola strefy podkoszowej" }
  ],
  "benchKeys": "Zadania dla rezerwowych (konkretne, powiązane z danymi o rywalu).",
  "motivationalMotto": "Krótkie, mocne hasło motywacyjne na mecz (1 zdanie)"
}
Pole focus przyjmuje jedną z wartości: defense, offense, transition.`;
}

/**
 * @param {{
 *   opponentName: string,
 *   scoutingReport?: { summaryMd?: string | null, analysisJson?: unknown } | null,
 *   opponentStats?: Record<string, unknown> | null,
 *   roster?: Array<Record<string, any>>,
 *   nextMatch?: { date?: Date | string | null, venue?: string | null } | null
 * }} input
 */
export function buildPreGameCardUserPrompt({ opponentName, scoutingReport, opponentStats, roster, nextMatch }) {
  const rosterStr = Array.isArray(roster) && roster.length
    ? roster
        .map(
          (p) =>
            `- playerId: ${p.id} | #${p.number ?? 'brak'} ${p.firstName} ${p.lastName} (${p.position || 'brak pozycji'}) - starter: ${p.starter ? 'TAK' : 'NIE'}`
        )
        .join('\n')
    : 'Brak danych o kadrze';

  const statsBlock = opponentStats
    ? `Dane o rywalu (${opponentName}) — JSON:\n${JSON.stringify(opponentStats, null, 2)}`
    : `Dane o rywalu (${opponentName}): brak danych liczbowych.`;

  const reportBlock = scoutingReport?.summaryMd
    ? `\nRaport scoutingowy (tekst, pomocniczo — liczby weryfikuj z JSON powyżej):\n${scoutingReport.summaryMd}`
    : '';

  const date = nextMatch?.date
    ? new Date(nextMatch.date).toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
    : 'brak daty w terminarzu';

  return `Przygotuj kartę odprawy przedmeczowej BeKaPaKa Bobolice na mecz przeciwko ${opponentName}.

${statsBlock}
${reportBlock}

Informacje o meczu:
- Data i godzina: ${date}
- Hala: ${nextMatch?.venue || DEFAULT_PREGAME_VENUE}

Kadra BeKaPaKa:
${rosterStr}

Wybierz najbardziej optymalną pierwszą piątkę (preferuj graczy ze statusem starter: TAK) i dopasuj im zadania obronne/atakujące pod kątem rywala ${opponentName}.`;
}
