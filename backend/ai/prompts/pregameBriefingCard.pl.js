import { POLISH_STYLE } from './polishStyle.pl.js';
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
- Liczby naszych zawodników bierz WYŁĄCZNIE z sekcji „Statystyki zawodników BeKaPaKa w sezonie” (JSON). Zawodnik z listy withoutGames nie ma meczów w sezonie — nie podawaj dla niego liczb.
- Wszystkie mecze ligi rozgrywane są w hali ${DEFAULT_PREGAME_VENUE} — nie używaj pojęć „u siebie”, „na wyjeździe”, „we własnej hali”.

PORÓWNANIA (OBOWIĄZKOWE):
- assignment każdego zawodnika pierwszej piątki zaczyna się od tego, kogo kryje („Kryje Nowaka.”), a potem zawiera porównanie: 1–2 liczby naszego zawodnika i 1–2 liczby kryjącego go rywala, dobrane do zadania (zbiórki przeciw zbieraczowi, przechwyty przeciw stratom, skuteczność za 2 przeciw faulom rywala itp.), oraz wniosek, co z tego wynika na boisku.
- Porównuj także wtedy, gdy zawodnik (nasz albo rywala) zagrał tylko 1 lub 2 mecze — przy takiej liczbie dopisz próbę w nawiasie, np. „(1 mecz)”, „(2 mecze)”. Mała próba nie jest powodem, żeby pominąć porównanie.
- Dobieraj pary tak, żeby każdy z kluczowych zawodników rywala (keyPlayers) miał swojego obrońcę w piątce albo w benchKeys.
- benchKeys: dla każdego rezerwowego, któremu dajesz zadanie, podaj 1–2 jego liczby z sezonu (z próbą przy 1–2 meczach) i wskaż, na kogo z rywali wchodzi.
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
    { "position": "PG", "playerId": "id z kadry", "name": "Imię Nazwisko z kadry", "number": 10, "assignment": "Kryje rozgrywającego rywala, nacisk na koźle" },
    { "position": "SG", "playerId": "id z kadry", "name": "Imię Nazwisko z kadry", "number": 7, "assignment": "Pilnuje strzelca rywala na obwodzie" },
    { "position": "SF", "playerId": "id z kadry", "name": "Imię Nazwisko z kadry", "number": 24, "assignment": "Zabezpiecza deski i wyprowadza szybki atak" },
    { "position": "PF", "playerId": "id z kadry", "name": "Imię Nazwisko z kadry", "number": 15, "assignment": "Rotacja w obronie ze słabej strony" },
    { "position": "C", "playerId": "id z kadry", "name": "Imię Nazwisko z kadry", "number": 33, "assignment": "Kontrola strefy podkoszowej" }
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
export function buildPreGameCardUserPrompt({ opponentName, scoutingReport, opponentStats, ownStats, roster, nextMatch }) {
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

Kadra BeKaPaKa:
${rosterStr}

${ownBlock}

Wybierz najbardziej optymalną pierwszą piątkę (preferuj graczy ze statusem starter: TAK, a gdy nikt go nie ma — tych z najwięcej starts) i dopasuj im zadania obronne/atakujące pod kątem rywala ${opponentName}. Każde zadanie zawiera porównanie naszego zawodnika z rywalem, którego kryje — także przy próbie 1–2 meczów.`;
}
