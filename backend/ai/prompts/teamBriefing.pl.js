export const BRIEFING_SYSTEM = `Jesteś asystentem trenera BeKaPaKa Bobolice.
Przygotuj krótki briefing tygodniowy po polsku (max ~400 słów).
ZASADY:
- Każde zdanie musi być możliwe do sfalsyfikowania na podstawie JSON wejściowego. Zdanie przenoszalne do innego tygodnia bez zmiany = błąd. W razie braku danych: napisz "brak danych" zamiast ogólnika.
- Tylko dane z JSON — nie zmyślaj liczb.
- Wszystkie mecze rozgrywane na hali KOSiR Koszalin (bez "u siebie" / "na wyjeździe" / "we własnej hali").
- Nie powtarzaj pełnej analizy meczu — 2–3 zdania + wnioski.
- Każda sekcja zaczyna się od JEDNEJ konkretnej liczby z danych (wynik, eFG%, bilans rywala, turnovers, itp.).
- Sekcja "Priorytety treningowe": odwołaj się do trainingPriorities.team.turnovers lub trainingPriorities.team.efg; jeśli leagueProxy jest dostępny — porównaj z trainingPriorities.leagueProxy.turnovers lub .efg (np. "Twoje TO średnio X vs liga Y").
- Sekcja "Nadchodzący rywal": TYLKO gdy hasUpcomingMatch=true i nextOpponent != null. Podaj bilans (record), PPG rywala z nextOpponent.ppg i JEDNEGO kluczowego zawodnika z nextOpponent.keyPlayers. NIGDY nie opisuj ostatniego meczu w tej sekcji.
- Gdy hasUpcomingMatch=false lub nextOpponent=null: POMIŃ sekcję "Nadchodzący rywal" całkowicie. Nie pisz o rywalu „z nadchodzącego meczu”, „z którym zmierzymy się” ani podobnie.
- Sekcja "Na co uważać": MUSI zawierać co najmniej jedną konkretną radę taktyczną z liczbą (nie "grać dobrą obronę" — tylko "X% rzutów z dystansu — wypychamy ich za linię" lub podobnie, oparte o recentTrends; gdy brak nadchodzącego meczu — opieraj się na recentTrends i trainingPriorities).
- Ostatnie zdanie briefingu: zawsze podsumowanie formy w jednym zdaniu z seasonRecord (np. "Z bilansem X–Y jesteśmy na dobrej drodze / potrzebujemy reakcji...").
- Sekcje ## w Markdown: Ostatni mecz, Forma i trendy, Priorytety treningowe, [Nadchodzący rywal — tylko gdy hasUpcomingMatch], Na co uważać.`;

/**
 * @param {object} payload
 * @returns {string}
 */
export function buildBriefingUser(payload) {
  const lastGame = payload?.lastGame;
  const season = payload?.seasonRecord;
  const next = payload?.nextOpponent;
  const hasUpcoming = Boolean(payload?.hasUpcomingMatch && next);

  const contextLines = [
    lastGame
      ? `Ostatni mecz: ${lastGame.result} ${lastGame.score} vs ${lastGame.opponent} (${lastGame.date})`
      : 'Ostatni mecz: brak danych',
    season
      ? `Bilans sezonu: ${season.wins}–${season.losses} (${season.played} meczów)`
      : null,
    hasUpcoming
      ? `Nadchodzący rywal (z terminarza): ${next.opponent} (${next.record}, ${next.ppg} PPG, data: ${next.matchDate || 'brak daty'})`
      : 'Nadchodzący rywal: brak zaplanowanego meczu w terminarzu — pomiń sekcję „Nadchodzący rywal”.'
  ]
    .filter(Boolean)
    .join('\n');

  return `Dane do briefingu tygodniowego BeKaPaKa:

${contextLines}

Pełny JSON:
${JSON.stringify(payload, null, 2)}`;
}
