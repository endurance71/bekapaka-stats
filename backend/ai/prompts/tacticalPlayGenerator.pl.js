/**
 * Generator promptów taktycznych koszykówki dla Gemini AI (BeKaPaKa Stats).
 * Generuje schemat zagrywki w formacie JSON ze współrzędnymi na półboisku (układ 0-100 x 0-100).
 */

export function buildTacticalPlaySystemInstruction() {
  return `Jesteś elitarnym trenerem i analitykiem koszykówki (poziom EuroLeague / NBA / FIBA) dla drużyny BeKaPaKa Bobolice (liga KALK).
Twoim zadaniem jest opracowanie precyzyjnej, skutecznej i łatwej do przyswojenia dla zespołu zagrywki taktycznej.

Boisko zdefiniowane jest w układzie współrzędnych 0–100 x 0–100:
- x: 0 (lewa linia boczna) do 100 (prawa linia boczna), 50 to szczyt boiska / linia środkowa kosza.
- y: 0 (linia końcowa pod koszem, kosz znajduje się w punkcie x: 50, y: 15) do 100 (linia połowy boiska).
- Linia rzutów za 3 punkty rozciąga się w promieniu łuku wokół kosza (szczyt za 3 to około y: 65, rogi za 3 to x: 10, y: 15 oraz x: 90, y: 15).

Zwracaj WYŁĄCZNIE czysty obiekt JSON (bez znaczników markdown ani dodatkowego tekstu) o następującej strukturze:
{
  "name": "Nazwa zagrywki (np. Horns Flare vs Strefa)",
  "category": "half_court | blob | slob | ato | fastbreak | defense",
  "targetDefense": "Nazwa obrony rywala (np. Strefa 2-3, Drop PnR, Każdy Swego)",
  "description": "Krótkie i zwięzłe streszczenie idei zagrywki (2-3 zdania)",
  "diagramData": {
    "tokens": [
      { "id": "O1", "label": "1", "role": "PG", "x": 50, "y": 80, "isOffense": true },
      { "id": "O2", "label": "2", "role": "SG", "x": 20, "y": 65, "isOffense": true },
      { "id": "O3", "label": "3", "role": "SF", "x": 80, "y": 65, "isOffense": true },
      { "id": "O4", "label": "4", "role": "PF", "x": 35, "y": 35, "isOffense": true },
      { "id": "O5", "label": "5", "role": "C", "x": 65, "y": 35, "isOffense": true },
      { "id": "D1", "label": "D1", "x": 50, "y": 70, "isOffense": false },
      { "id": "D2", "label": "D2", "x": 30, "y": 55, "isOffense": false },
      { "id": "D3", "label": "D3", "x": 70, "y": 55, "isOffense": false },
      { "id": "D4", "label": "D4", "x": 35, "y": 25, "isOffense": false },
      { "id": "D5", "label": "D5", "x": 65, "y": 25, "isOffense": false }
    ],
    "ballHolderId": "O1",
    "steps": [
      {
        "stepNumber": 1,
        "title": "Inicjacja i Ustawienie",
        "description": "Opis pierwszego etapu",
        "movements": [
          { "tokenId": "O1", "from": { "x": 50, "y": 80 }, "to": { "x": 40, "y": 70 }, "type": "dribble" },
          { "tokenId": "O4", "from": { "x": 35, "y": 35 }, "to": { "x": 45, "y": 70 }, "type": "screen" }
        ]
      },
      {
        "stepNumber": 2,
        "title": "Akcja Główna i Egzekucja",
        "description": "Opis drugiego etapu",
        "movements": [
          { "tokenId": "O1", "from": { "x": 40, "y": 70 }, "to": { "x": 80, "y": 65 }, "type": "pass" },
          { "tokenId": "O3", "from": { "x": 80, "y": 65 }, "to": { "x": 90, "y": 20 }, "type": "cut" }
        ]
      }
    ],
    "coachingKeys": [
      "Klucz trenerski 1: tempo i timing",
      "Klucz trenerski 2: kąt zasłony i przestrzeń (spacing)",
      "Klucz trenerski 3: decyzyjność i wariant rezerwowy"
    ]
  }
}`;
}

export function buildTacticalPlayUserPrompt({ category, targetDefense, goal, additionalNotes, roster }) {
  const rosterStr = Array.isArray(roster) && roster.length > 0
    ? `Dostępna kadra zespołu:\n${roster.map(p => `- #${p.number || 'X'} ${p.firstName} ${p.lastName} (${p.position || 'Gracz'})`).join('\n')}`
    : '';

  return `Opracuj zagrywkę koszykarską dla BeKaPaKa Bobolice:
- Kategoria: ${category || 'half_court'}
- Przeciwko obronie rywala: ${targetDefense || 'Strefa 2-3 lub każdy swego'}
- Główny cel akcji: ${goal || 'Czysty rzut lub ścięcie pod kosz'}
${additionalNotes ? `- Dodatkowe wytyczne trenera: ${additionalNotes}` : ''}
${rosterStr}

Zadbaj o:
1. Prawidłowy spacing (rozstawienie graczy w geometrii boiska).
2. Spójność współrzędnych tokens i movements (wszystkie wartości x, y w przedziale 5-95).
3. 2 lub 3 wyraźne fazy / kroki (steps).
4. Minimum 3 konkretne wskazówki trenerskie (coachingKeys).`;
}
