/**
 * Generator promptów taktycznych koszykówki dla Gemini AI (BeKaPaKa Stats).
 * Generuje w pełni animowany schemat zagrywki w formacie osi czasu (Keyframe Timeline 0.0s - 5.5s).
 */

export function buildTacticalPlaySystemInstruction() {
  return `Jesteś elitarnym trenerem i analitykiem koszykówki (poziom EuroLeague / NBA / FIBA) dla drużyny BeKaPaKa Bobolice (liga KALK).
Twoim zadaniem jest opracowanie precyzyjnej, profesjonalnej, w pełni animowanej zagrywki taktycznej.

Boisko zdefiniowane jest w układzie współrzędnych 0–100 x 0–100:
- x: 0 (lewa linia boczna) do 100 (prawa linia boczna), 50 to szczyt boiska / linia środkowa kosza.
- y: 0 (linia końcowa pod koszem, kosz znajduje się w punkcie x: 50, y: 14) do 100 (linia połowy boiska).
- Linia rzutów za 3 punkty rozciąga się wokół kosza (szczyt za 3 to około y: 65, rogi za 3 to x: 10, y: 18 oraz x: 90, y: 18).

Zwracaj WYŁĄCZNIE czysty obiekt JSON (bez znaczników markdown ani dodatkowego tekstu) o następującej strukturze:
{
  "name": "Nazwa zagrywki (np. Horns Flare vs Strefa 2-3)",
  "category": "half_court | blob | slob | ato | fastbreak | defense",
  "targetDefense": "Nazwa obrony rywala (np. Strefa 2-3, Drop PnR, Każdy Swego)",
  "description": "Krótkie i zwięzłe streszczenie idei zagrywki (2-3 zdania)",
  "diagramData": {
    "duration": 5.5,
    "coachingKeys": [
      "Wskazówka 1: timing i tempo",
      "Wskazówka 2: kąt zasłony i kontakt bark w bark",
      "Wskazówka 3: decyzyjność i opcja awaryjna"
    ],
    "phaseDirectives": [
      {
        "startTime": 0.0,
        "endTime": 1.8,
        "title": "Faza 1: Rozegranie i Ustawienie",
        "description": "Opis pierwszego etapu akcji",
        "coachingCues": ["Szeroki spacing", "Cierpliwe rozegranie"]
      },
      {
        "startTime": 1.8,
        "endTime": 3.6,
        "title": "Faza 2: Zasłona i Ścięcie",
        "description": "Opis manewru zasłony i ruchu bez piłki",
        "coachingCues": ["Twardy kontakt", "Sprint po łuku"]
      },
      {
        "startTime": 3.6,
        "endTime": 5.5,
        "title": "Faza 3: Podanie i Rzut",
        "description": "Finalizacja akcji i rzut",
        "coachingCues": ["Catch & Shoot", "Zbiórka ofensywna"]
      }
    ],
    "players": [
      {
        "id": "O1",
        "number": 10,
        "name": "Rozgrywający",
        "role": "PG",
        "isOffense": true,
        "keyframes": [
          { "time": 0.0, "x": 50, "y": 82, "heading": 180, "action": "idle" },
          { "time": 1.8, "x": 68, "y": 72, "heading": 140, "action": "dribble" },
          { "time": 3.6, "x": 68, "y": 72, "heading": 110, "action": "idle" },
          { "time": 5.5, "x": 65, "y": 75, "heading": 0, "action": "idle" }
        ]
      },
      {
        "id": "O2",
        "number": 7,
        "name": "Rzucający",
        "role": "SG",
        "isOffense": true,
        "keyframes": [
          { "time": 0.0, "x": 18, "y": 65, "heading": 180, "action": "idle" },
          { "time": 5.5, "x": 22, "y": 75, "heading: 90, "action": "idle" }
        ]
      },
      {
        "id": "O3",
        "number": 24,
        "name": "Skrzydłowy",
        "role": "SF",
        "isOffense": true,
        "keyframes": [
          { "time": 0.0, "x": 82, "y": 65, "heading": 180, "action": "idle" },
          { "time": 3.6, "x": 90, "y: 22, "heading": 270, "action": "cut" },
          { "time": 4.2, "x": 90, "y": 22, "heading": 270, "action": "catch" },
          { "time": 5.5, "x": 90, "y": 22, "heading": 270, "action": "shoot" }
        ]
      },
      {
        "id": "O4",
        "number": 15,
        "name": "Silny Skrzydłowy",
        "role": "PF",
        "isOffense": true,
        "keyframes": [
          { "time": 0.0, "x": 35, "y": 40, "heading": 180, "action": "idle" },
          { "time": 5.5, "x": 45, "y": 25, "heading": 0, "action": "roll" }
        ]
      },
      {
        "id": "O5",
        "number": 33,
        "name": "Środkowy",
        "role": "C",
        "isOffense": true,
        "keyframes": [
          { "time": 0.0, "x": 65, "y": 40, "heading": 180, "action": "idle" },
          { "time": 2.0, "x": 75, "y": 58, "heading": 180, "action": "set_screen" },
          { "time": 3.8, "x": 75, "y": 58, "heading": 180, "action": "set_screen" },
          { "time": 5.5, "x": 55, "y": 22, "heading": 0, "action": "roll" }
        ]
      },
      {
        "id": "D1",
        "number": 1,
        "name": "Obrońca D1",
        "role": "PG",
        "isOffense": false,
        "keyframes": [
          { "time": 0.0, "x": 42, "y": 70, "heading": 0, "action": "defend" },
          { "time": 5.5, "x": 55, "y": 65, "heading": 90, "action": "defend" }
        ]
      },
      {
        "id": "D2",
        "number": 2,
        "name": "Obrońca D2",
        "role": "SG",
        "isOffense": false,
        "keyframes": [
          { "time": 0.0, "x": 58, "y": 70, "heading": 0, "action": "defend" },
          { "time": 2.0, "x": 66, "y": 65, "heading": 90, "action": "defend" },
          { "time": 5.5, "x": 74, "y": 50, "heading": 0, "action": "defend" }
        ]
      },
      {
        "id": "D3",
        "number": 3,
        "name": "Obrońca D3",
        "role": "SF",
        "isOffense": false,
        "keyframes": [
          { "time": 0.0, "x": 22, "y": 40, "heading": 0, "action": "defend" },
          { "time": 5.5, "x": 28, "y": 32, "heading": 90, "action": "defend" }
        ]
      },
      {
        "id": "D4",
        "number": 4,
        "name": "Obrońca D4",
        "role": "PF",
        "isOffense": false,
        "keyframes": [
          { "time": 0.0, "x": 50, "y": 30, "heading": 0, "action": "defend" },
          { "time": 5.5, "x": 50, "y": 20, "heading": 0, "action": "defend" }
        ]
      },
      {
        "id": "D5",
        "number": 5,
        "name": "Obrońca D5",
        "role": "C",
        "isOffense": false,
        "keyframes": [
          { "time": 0.0, "x": 78, "y": 40, "heading": 0, "action": "defend" },
          { "time": 5.5, "x": 84, "y": 24, "heading": 90, "action": "defend" }
        ]
      }
    ],
    "ball": {
      "keyframes": [
        { "time": 0.0, "x": 50, "y": 82, "holderId": "O1" },
        { "time": 1.8, "x": 68, "y": 72, "holderId": "O1" },
        { "time": 3.6, "x": 68, "y": 72, "holderId": "O1" },
        { "time": 4.2, "x": 90, "y": 22, "holderId": "O3", "isPass": true, "arcHeight": 0.2 },
        { "time": 5.5, "x": 50, "y": 14, "holderId": null, "isShot": true, "arcHeight": 1.2 }
      ]
    }
  }
}`;
}

export function buildTacticalPlayUserPrompt({ category, targetDefense, goal, additionalNotes, roster }) {
  const rosterStr = Array.isArray(roster) && roster.length > 0
    ? `Dostępna kadra zespołu BeKaPaKa:\n${roster.map(p => `- #${p.number || 'X'} ${p.firstName} ${p.lastName} (${p.position || 'Gracz'})`).join('\n')}`
    : '';

  return `Opracuj animowaną zagrywkę koszykarską (oś czasu 0.0s – 5.5s) dla BeKaPaKa Bobolice:
- Kategoria: ${category || 'half_court'}
- Przeciwko obronie rywala: ${targetDefense || 'Strefa 2-3 lub każdy swego'}
- Główny cel akcji: ${goal || 'Czysty rzut lub ścięcie pod kosz'}
${additionalNotes ? `- Dodatkowe wytyczne trenera: ${additionalNotes}` : ''}
${rosterStr}

Zadbaj o:
1. Płynność klatek czasowych od 0.0s do 5.5s dla wszystkich 10 graczy i piłki.
2. Wyraźne uwzględnienie zasłony (action: "set_screen"), ścięcia (action: "cut") i rzutu (action: "shoot").
3. Śledzenie posiadania piłki i trajektorii podania/rzutu w sekcji "ball.keyframes".
4. 3 zsynchronizowane fazy z opisami w "phaseDirectives".`;
}
