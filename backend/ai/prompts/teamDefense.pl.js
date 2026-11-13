/**
 * Obrona BeKaPaKa: strefa 2-3. Nazwy pozycji D1–D5 jak w przewodniku strefy w panelu (ZoneDefenseGuideModal).
 * Wspólne dla promptów (odprawa, scouting) i druku raportu o rywalu.
 */
export const TEAM_DEFENSE = 'strefa 2-3';

export const ZONE_SPOTS = Object.freeze([
  { id: 'D1', label: 'Lewy górny', line: 'top', duty: 'Nacisk na piłkę na obwodzie, zamyka wjazd środkiem, doskok do strzelca na lewym skrzydle.' },
  { id: 'D2', label: 'Prawy górny', line: 'top', duty: 'Pilnuje linii rzutów wolnych, przejmuje piłkę po prawej, doskok do strzelca na prawym skrzydle.' },
  { id: 'D3', label: 'Lewe dolne skrzydło', line: 'low', duty: 'Nisko po lewej stronie kosza; wyjście do rogu i na skrzydło, zastawianie po rzucie z drugiej strony.' },
  { id: 'D4', label: 'Prawe dolne skrzydło', line: 'low', duty: 'Nisko po prawej stronie kosza; wyjście do rogu i na skrzydło, zastawianie po rzucie z drugiej strony.' },
  { id: 'D5', label: 'Środek', line: 'low', duty: 'Kotwica pod koszem: pole trzech sekund, linia rzutów wolnych, pierwszy do zastawienia najlepszego zbierającego.' }
]);

/** Domyślne ustawienie, gdy karta odprawy ma pozycje koszykarskie zamiast D1–D5. */
export const POSITION_TO_SPOT = Object.freeze({ PG: 'D1', SG: 'D2', G: 'D2', SF: 'D3', F: 'D4', PF: 'D4', C: 'D5' });

export const TEAM_DEFENSE_RULES = `
NASZA OBRONA (OBOWIĄZKOWE):
- BeKaPaKa broni strefą 2-3. NIE przydzielaj krycia 1 na 1 i nie pisz „Kryje X” — każdy nasz zawodnik broni obszaru, nie rywala.
- Pozycje w strefie: D1 lewy górny i D2 prawy górny (górna linia: nacisk na piłkę, doskok do strzelców na obwodzie, zamknięcie środka), D3 lewe i D4 prawe dolne skrzydło (nisko przy koszu: wyjście do rogu i na skrzydło, zastawianie), D5 środek (kotwica pod koszem: pole trzech sekund, linia rzutów wolnych, zbiórka).
- Słabe miejsca strefy, które trzeba odnieść do liczb rywala: rzuty za 3 z obwodu i z rogów (threePct, threePmPg), piłka na linii rzutów wolnych, zbiórki w ataku (orbPg, fourFactors.orb), przerzut piłki na drugą stronę.
- W opisie obrony NIE używaj nazwisk naszych zawodników — pisz wyłącznie o miejscach strefy: „górna linia (D1, D2)”, „dolne skrzydła (D3, D4)”, „środek (D5)”, „dolna trójka (D3–D5)”. Zawodnicy zmieniają się na miejscach, zadanie należy do miejsca. Nazwiska naszych zawodników tylko w polu name, przy zmianach w benchKeys i w zadaniach w ataku.
- Rywali opisuj przez to, gdzie i jak atakują strefę: strzelcy z dystansu → doskok górnej linii albo skrzydła; zbierający i gracze spod kosza → zastawianie przez D3–D5; zawodnicy z dużą liczbą strat → pułapka (podwojenie) w rogu albo przy linii bocznej.
`;
