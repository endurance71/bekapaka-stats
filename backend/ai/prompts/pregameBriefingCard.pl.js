import { POLISH_STYLE } from './polishStyle.pl.js';
import { TEAM_DEFENSE_RULES } from './teamDefense.pl.js';
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
- Każde założenie taktyczne (tacticalKeys) odwołuje się do konkretnej liczby lub zawodnika z danych o rywalu (np. PPG lidera, trójki, straty), jeśli takie dane są dostępne. Założenie obronne dotyczy gry strefą 2-3 przeciw temu rywalowi i mówi o miejscach strefy (górna linia D1–D2, dolne skrzydła D3–D4, środek D5), nie o naszych nazwiskach.
- Liczby naszych zawodników bierz WYŁĄCZNIE z sekcji „Statystyki zawodników BeKaPaKa w sezonie” (JSON). Zawodnik z listy withoutGames nie ma meczów w sezonie — nie podawaj dla niego liczb.
- Wszystkie mecze ligi rozgrywane są w hali ${DEFAULT_PREGAME_VENUE} — nie używaj pojęć „u siebie”, „na wyjeździe”, „we własnej hali”.

${TEAM_DEFENSE_RULES}
PORÓWNANIA (OBOWIĄZKOWE):
- position każdego zawodnika pierwszej piątki to jego miejsce w strefie: D1, D2, D3, D4 albo D5 (każde dokładnie raz). Na górną linię (D1, D2) wybieraj szybszych obrońców z przechwytami, na D5 najlepiej zbierającego.
- assignment zaczyna się od miejsca w strefie („D5 — środek strefy.”), część obronną pisze o miejscu (np. „D5 zastawia Dolika”), bez nazwiska naszego zawodnika, potem mówi, którzy rywale z keyPlayers atakują jego obszar i jak (rzut z dystansu, wejście, zbiórka w ataku, kozłowanie ze stratami), zawiera porównanie: 1–2 liczby naszego zawodnika i 1–2 liczby tych rywali dobrane do zadania (zbiórki przeciw zbieraczowi, przechwyty przeciw stratom, doskok przeciw trójkom), oraz wniosek, co robi na boisku. W ataku może dodać jedno zdanie o swoim zadaniu.
- Porównuj także wtedy, gdy zawodnik (nasz albo rywala) zagrał tylko 1 lub 2 mecze — przy takiej liczbie dopisz próbę w nawiasie, np. „(1 mecz)”, „(2 mecze)”. Mała próba nie jest powodem, żeby pominąć porównanie.
- Każdy z kluczowych zawodników rywala (keyPlayers) musi pojawić się w zadaniu przynajmniej jednego miejsca strefy (w piątce albo w benchKeys).
- benchKeys: dla każdego rezerwowego, któremu dajesz zadanie, podaj 1–2 jego liczby z sezonu (z próbą przy 1–2 meczach) i wskaż, za kogo i na które miejsce strefy (D1–D5) wchodzi.
- Przy wyborze piątki: gdy nikt w kadrze nie ma statusu starter: TAK, kieruj się polem starts (ile razy zawodnik zaczynał mecz w tym sezonie), a potem games i minutami.

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
    { "position": "D1", "playerId": "id z kadry", "name": "Imię Nazwisko z kadry", "number": 10, "assignment": "D1 — lewy górny. Nacisk na rozgrywającego rywala przy wyprowadzeniu, doskok do strzelca na lewym skrzydle…" },
    { "position": "D2", "playerId": "id z kadry", "name": "Imię Nazwisko z kadry", "number": 7, "assignment": "D2 — prawy górny. Pilnuje linii rzutów wolnych…" },
    { "position": "D3", "playerId": "id z kadry", "name": "Imię Nazwisko z kadry", "number": 24, "assignment": "D3 — lewe dolne skrzydło. Wyjście do rogu na strzelca, zastawianie…" },
    { "position": "D4", "playerId": "id z kadry", "name": "Imię Nazwisko z kadry", "number": 15, "assignment": "D4 — prawe dolne skrzydło…" },
    { "position": "D5", "playerId": "id z kadry", "name": "Imię Nazwisko z kadry", "number": 33, "assignment": "D5 — środek. Kotwica pod koszem, zastawia najlepszego zbierającego rywala…" }
  ],
  "benchKeys": "Zadania dla rezerwowych (konkretne, powiązane z danymi o rywalu).",
  "motivationalMotto": "Krótkie, mocne hasło motywacyjne na mecz (1 zdanie)"
}
Pole focus przyjmuje jedną z wartości: defense, offense, transition.${POLISH_STYLE}`;
}

/**
 * @param {{
 *   opponentName: string,
 *   scoutingReport?: { summaryMd?: string | null, analysisJson?: unknown } | null,
 *   opponentStats?: Record<string, unknown> | null,
 *   ownStats?: { players: Array<Record<string, unknown>>, withoutGames: string[] } | null,
 *   roster?: Array<Record<string, any>>,
 *   nextMatch?: { date?: Date | string | null, venue?: string | null } | null
 * }} input
 */
export function buildPreGameCardUserPrompt({ opponentName, scoutingReport, opponentStats, ownStats, roster, unavailable = [], nextMatch }) {
  const absentStr = unavailable.length
    ? `\nNiedostępni na ten mecz — nie wybieraj ich do piątki i nie dawaj im zadań: ${unavailable
        .map((u) => `${u.player.firstName} ${u.player.lastName} (${u.reason})`)
        .join(', ')}.\n`
    : '';
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

  const ownBlock = ownStats?.players?.length
    ? `Statystyki zawodników BeKaPaKa w sezonie (box score KALK, średnie na mecz od 1. meczu; games = próba, starts = mecze w pierwszej piątce, twoPt/threePt/ft = celne/oddane i %, plusMinusTotal = suma +/- z plusMinusGames meczów, w których protokół ma +/-; null = brak +/-) — JSON:\n${JSON.stringify(ownStats, null, 2)}`
    : 'Statystyki zawodników BeKaPaKa w sezonie: brak meczów w bazie — porównuj tylko tam, gdzie są liczby rywala, bez liczb naszych zawodników.';

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

Kadra BeKaPaKa${unavailable.length ? ' dostępna na ten mecz' : ''}:
${rosterStr}
${absentStr}
${ownBlock}

Wybierz najbardziej optymalną pierwszą piątkę (preferuj graczy ze statusem starter: TAK, a gdy nikt go nie ma — tych z najwięcej starts) ustaw ją w strefie 2-3 (D1–D5) i dopasuj zadania pod kątem rywala ${opponentName}. Każde zadanie zawiera porównanie naszego zawodnika z rywalami, którzy atakują jego obszar strefy — także przy próbie 1–2 meczów.`;
}
