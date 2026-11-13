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
- NIE wybieraj pierwszej piątki — trener ustala ją na meczu. Nie przypisuj naszych zawodników do miejsc strefy.
- Każde założenie taktyczne (tacticalKeys) odwołuje się do konkretnej liczby lub zawodnika z danych o rywalu (np. PPG lidera, trójki, straty), jeśli takie dane są dostępne. Założenie obronne dotyczy gry strefą 2-3 przeciw temu rywalowi i mówi o miejscach strefy (górna linia D1–D2, dolne skrzydła D3–D4, środek D5), nie o naszych nazwiskach.
- Liczby naszych zawodników bierz WYŁĄCZNIE z sekcji „Statystyki zawodników BeKaPaKa w sezonie” (JSON). Zawodnik z listy withoutGames nie ma meczów w sezonie — nie podawaj dla niego liczb.
- Wszystkie mecze ligi rozgrywane są w hali ${DEFAULT_PREGAME_VENUE} — nie używaj pojęć „u siebie”, „na wyjeździe”, „we własnej hali”.

${TEAM_DEFENSE_RULES}
ZADANIA MIEJSC STREFY (OBOWIĄZKOWE):
- startingFive to 5 miejsc strefy, nie zawodnicy: position = D1, D2, D3, D4, D5 (każde dokładnie raz, w tej kolejności), assignment = zadanie dla tego miejsca przeciw temu rywalowi. Nie podawaj name, playerId ani number.
- assignment zaczyna się od miejsca („D5 — środek.”), potem mówi, którzy rywale z keyPlayers atakują ten obszar i jak (rzut z dystansu, wejście, zbiórka w ataku, kozłowanie ze stratami), podaje 1–2 liczby tych rywali dobrane do zadania (trójki → doskok, zbiórki w ataku → zastawianie, straty → pułapka) i kończy się tym, co robi zawodnik na tym miejscu. Bez nazwisk naszych zawodników.
- Przy liczbach rywala z 1 lub 2 meczów dopisz próbę w nawiasie, np. „(1 mecz)”, „(2 mecze)”. Mała próba nie jest powodem, żeby pominąć liczbę.
- Każdy z kluczowych zawodników rywala (keyPlayers) musi pojawić się w zadaniu przynajmniej jednego miejsca strefy.
- benchKeys: pusty tekst ("") — skład i zmiany trener ustala na meczu.
- Nasze nazwiska i liczby (z „Statystyki zawodników BeKaPaKa”, tylko dostępni na mecz) wolno użyć wyłącznie w założeniu ofensywnym (tacticalKeys z focus offense).

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
    { "position": "D1", "assignment": "D1 — lewy górny. Nacisk na rozgrywającego rywala przy wyprowadzeniu, doskok do strzelca na lewym skrzydle…" },
    { "position": "D2", "assignment": "D2 — prawy górny. Pilnuje linii rzutów wolnych…" },
    { "position": "D3", "assignment": "D3 — lewe dolne skrzydło. Wyjście do rogu na strzelca, zastawianie…" },
    { "position": "D4", "assignment": "D4 — prawe dolne skrzydło…" },
    { "position": "D5", "assignment": "D5 — środek. Kotwica pod koszem, zastawia najlepszego zbierającego rywala…" }
  ],
  "benchKeys": "",
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

Rozpisz zadania pięciu miejsc strefy 2-3 (D1–D5) pod kątem rywala ${opponentName} — bez przypisywania zawodników, piątkę trener ustala na meczu. Każde zadanie opiera się na liczbach rywali, którzy atakują dany obszar — także przy próbie 1–2 meczów.`;
}
