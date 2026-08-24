/**
 * Generator promptu odprawy przedmeczowej (Pre-Game Matchday Card) dla Gemini AI.
 */

export function buildPreGameCardSystemInstruction() {
  return `Jesteś głównym trenerem BeKaPaKa Bobolice (liga koszykówki KALK).
Tworzysz zwięzłą, motywującą i wysoce precyzyjną odprawę przedmeczową dla zawodników przed nadchodzącym spotkaniem.

Zwracaj WYŁĄCZNIE poprawny JSON (bez znaczników markdown):
{
  "tacticalKeys": [
    {
      "number": 1,
      "title": "Kluczowe założenie 1 (np. Zastawianie tablicy)",
      "description": "Konkretna instrukcja wykonawcza (np. Po rzucie natychmiastowy kontakt z rywalem, odcinamy Cieślaka od dobitki).",
      "focus": "defense | offense | transition"
    },
    {
      "number": 2,
      "title": "Kluczowe założenie 2 (np. Atak na słabą stronę)",
      "description": "Instrukcja taktyczna dla ataku.",
      "focus": "defense | offense | transition"
    },
    {
      "number": 3,
      "title": "Kluczowe założenie 3 (np. Kontrola tempa i powrót)",
      "description": "Instrukcja przejścia ataku do obrony.",
      "focus": "defense | offense | transition"
    }
  ],
  "startingFive": [
    { "position": "PG", "playerId": "id1", "name": "Imię Nazwisko", "number": 10, "assignment": "Kryje rozgrywającego rywala, nacisk na koźle" },
    { "position": "SG", "playerId": "id2", "name": "Imię Nazwisko", "number": 7, "assignment": "Pilnuje strzelca rywala na obwodzie, nie odpuszcza w rogu" },
    { "position": "SF", "playerId": "id3", "name": "Imię Nazwisko", "number": 24, "assignment": "Zabezpiecza deski i wyprowadza szybki atak" },
    { "position": "PF", "playerId": "id4", "name": "Imię Nazwisko", "number": 15, "assignment": "Rotacja w obronie ze słabej strony i pomoc pod koszem" },
    { "position": "C", "playerId": "id5", "name": "Imię Nazwisko", "number": 33, "assignment": "Kontrola strefy podkoszowej, bez łatwych punktów z pomalowanego" }
  ],
  "benchKeys": "Zadania dla rezerwowych: Utrzymanie tempa i agresywności w obronie, wykorzystanie przewag rzutowych po wejściu.",
  "motivationalMotto": "Krótkie, mocne hasło motywacyjne na mecz (1 zdanie)"
}`;
}

export function buildPreGameCardUserPrompt({ opponentName, scoutingReport, roster, nextMatch, standings }) {
  const rosterStr = Array.isArray(roster)
    ? roster.map(p => `#${p.number || 'X'} ${p.firstName} ${p.lastName} (${p.position || 'G'}) - starter: ${p.starter ? 'TAK' : 'NIE'}`).join('\n')
    : 'Brak danych o kadrze';

  const opponentInfo = scoutingReport
    ? `Dane o rywalu (${opponentName}):\n${scoutingReport.summaryMd || JSON.stringify(scoutingReport.analysisJson || {})}`
    : `Rywal: ${opponentName}`;

  return `Przygotuj kartę odprawy przedmeczowej BeKaPaKa Bobolice na mecz przeciwko ${opponentName}:

${opponentInfo}

Informacje o meczu:
- Data i godzina: ${nextMatch?.date || 'Najbliższa kolejka'}
- Miejsce: ${nextMatch?.venue || 'Hala KALK'}

Kadra BeKaPaKa:
${rosterStr}

Wybierz najbardziej optymalną pierwszą piątkę (preferuj graczy ze statusem starter: TAK) i dopasuj im zadania obronne/atakujące pod kątem rywala ${opponentName}.`;
}
