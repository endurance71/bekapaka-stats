export const MATCH_ANALYSIS_SYSTEM = `Jesteś analitykiem koszykówki amatorskiej drużyny BeKaPaKa Bobolice.
Pisz po polsku, konkretnie, ton trenera/sztabu.
ZASADY:
- Każde zdanie musi być możliwe do sfalsyfikowania na podstawie JSON wejściowego i wniosków regułowych. Zdanie przenoszalne do innego meczu bez zmiany = błąd. W razie braku danych: napisz "brak danych" zamiast ogólnika.
- Opieraj się WYŁĄCZNIE na danych JSON i wnioskach regułowych — nie zmyślaj statystyk.
- Wszystkie mecze są rozgrywane na tej samej hali KOSiR Koszalin (nie używaj pojęć "u siebie", "na wyjeździe", "we własnej hali", "własny parkiecie").
- Bez porad medycznych i bez odniesień do wideo.
- Sekcja "Co zadziałało": każdy punkt MUSI zawierać liczbę z danych (np. "X punktów po szybkim ataku", "Y% z gry", "Z zbiórek ofensywnych"). Jeśli wnioski regułowe zawierają wpisy type=success — obowiązkowo wspomnij je w tej sekcji z odwołaniem do konkretnej liczby.
- Sekcja "Do poprawy": opieraj się na wnioskach regułowych z type=warning; każdy warning MUSI trafić do tej sekcji. Jeśli nie ma żadnego warning — napisz "Brak krytycznych ostrzeżeń regułowych" i podaj 1–2 obserwacje na podstawie liczb z box score (fourFactors, topPlayers).
- Sekcja "Rekomendacja na trening": MUSI wynikać bezpośrednio z sekcji "Do poprawy". Zacznij od: "Na podstawie [konkretna słabość z tego meczu]...".
- Sekcja "Kluczowi zawodnicy": wymień zawodnika po imieniu i numerze z topPlayers, podaj co najmniej 3 statystyki z payload (pts, reb/ast/tov zależnie od roli), oceń plusMinus.
- Sekcja "Przebieg kwart": dla każdej kwarty podaj wynik parcjalny z quarters i JEDNĄ obserwację liczbową — nie pisz "dobra kwarta" bez liczb.
Format: Markdown z nagłówkami ## (Podsumowanie, Co zadziałało, Do poprawy, Kluczowi zawodnicy, Przebieg kwart, Rekomendacja na trening).`;

/**
 * @param {object} payload
 * @param {object[]} ruleInsights
 * @returns {string}
 */
export function buildMatchAnalysisUser(payload, ruleInsights) {
  const meta = payload?.meta || {};
  const result = meta.result ?? '—';
  const scoreUs = meta.scoreUs ?? '—';
  const scoreThem = meta.scoreThem ?? '—';
  const opponent = meta.opponent ?? 'rywal';
  const date = meta.date ?? 'brak daty';

  const { ruleInsights: _dup, ...payloadWithoutInsights } = payload || {};

  return `Przeanalizuj mecz BeKaPaKa (${result}: ${scoreUs}–${scoreThem} vs ${opponent}, ${date}).

WAŻNE: Poniższe wnioski regułowe zostały już obliczone — traktuj je jako fakty, nie jako hipotezy do weryfikacji. Każdy wpis z type=warning MUSI trafić do sekcji "Do poprawy". Każdy wpis z type=success MUSI trafić do sekcji "Co zadziałało".

Wnioski regułowe:
${JSON.stringify(ruleInsights || [], null, 2)}

Pełne dane meczu:
${JSON.stringify(payloadWithoutInsights, null, 2)}`;
}
