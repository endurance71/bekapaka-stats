// Layout variants per publication family. Isomorphic (shared with the browser), no imports.
// A variant is one composition of a family drawn in one of the family's visual styles. Variants 1..k are the
// layouts that existed before variants (one per style); a project without `designVariant` keeps that layout.
// New variants share the brand skeleton (mini header or ribbon, footer, stripes, Barlow, palette, safe zones)
// and differ in hero, grid, material or leading motif. They start as drafts awaiting the owner's visual review.
export const VARIANTS_VERSION = '1.0.0';
export const MAX_VARIANTS = 10;

const v = (n, style, name, description, extra = {}) => ({ n, style, name, description, ...extra });

export const familyVariants = {
  announcement: [
    v(1, 'sport', 'Wstęga i tarcze', 'Wstęga, para znaków, godzina w panelu 24°.', { legacy: true }),
    v(2, 'editorial', 'Typograficzna', 'Herb, data w obrysie i pas z drużynami.', { legacy: true }),
    v(3, 'jersey', 'Koszulka matchday', 'Koszulka z numerem i nazwiskiem.', { legacy: true, types: ['matchday'] }),
    v(4, 'sport', 'Nazwa rywala', 'Cięty nagłówek z nazwą rywala w kolumnie, skrzydła i godzina.'),
    v(5, 'sport', 'Wielka godzina', 'Godzina meczu jako bohater na pasie 24°, drużyny nad nią.'),
    v(6, 'sport', 'Skrzydła V', 'Para znaków w ramionach V, data i hala pod klinem.'),
    v(7, 'sport', 'Podział 24°', 'Plansza cięta pod kątem 24°: nasza połowa w kolorze, rywal na płycie.'),
    v(8, 'sport', 'Rama stopniowana', 'Para znaków w złotej ramie ze stopniami, godzina pod ramą.'),
    v(9, 'editorial', 'Data w obrysie', 'Papier, dzień miesiąca w wielkim obrysie i paski stroju.'),
    v(10, 'editorial', 'Karta meczu', 'Papier, pola z danymi meczu jak karta zawodów.'),
  ],
  result: [
    v(1, 'sport', 'Tablica wyniku', 'Wstęga, para znaków i wynik pod znakami.', { legacy: true }),
    v(2, 'photo', 'Zawodnik i wynik', 'Wynik pionowo, zdjęcie zawodnika z prawej.', { legacy: true }),
    v(3, 'poster', 'Plakat', 'Wielki napis, wynik i tło hali.', { legacy: true }),
    v(4, 'sport', 'Wynik w pionie', 'Wyniki jeden pod drugim w kolumnie z nazwami drużyn.'),
    v(5, 'sport', 'Pas wyniku', 'Wynik na szerokim pasie 24°, skrzydła nad pasem.'),
    v(6, 'sport', 'Podział 24°', 'Plansza cięta pod kątem 24°, wynik każdej drużyny na swojej połowie.'),
    v(7, 'photo', 'Pełne zdjęcie', 'Zdjęcie na całą planszę, wynik w dolnym pasie.'),
    v(8, 'photo', 'Zdjęcie w ramie', 'Zdjęcie w ramie ze stopniami, wynik obok.'),
    v(9, 'poster', 'Plakat pionowy', 'Wynik ułożony pionowo na tle hali.'),
    v(10, 'sport', 'Wynik i liczby', 'Wynik z liczbami meczu (kwarty lub liczby z faktów), gdy są.'),
  ],
};

// Non-match families share archetypes (renderer/variants/kit.py, families.py): the same composition looks the same
// in every family. `surface` is the material the layout sets (paper or the dark board).
const L = (n, style, name, description, surface, extra = {}) => v(n, style, name, description, { surface, ...extra });
const listSet = (style, types) => [
  L(2, style, 'Lista na papierze', 'Wiersze na białych i kremowych pasach 24°, liczba w kolorze.', 'paper', { types }),
  L(3, style, 'Lista na płycie', 'Ciemna płyta, wiersze rozdzielone linią, tytuł z paskami.', 'dark', { types }),
  L(4, style, 'Karty', 'Karty w dwóch kolumnach z belką w kolorze i dużą liczbą.', 'paper', { types }),
  L(5, style, 'Pasy stroju', 'Wiersze jako pasy na całą szerokość, naprzemiennie w kolorze i na płycie.', 'dark', { types }),
  L(6, style, 'Podział 24°', 'Blok w kolorze z tytułem, cięty pod kątem 24°, wiersze pod nim.', 'dark', { types }),
  L(7, style, 'Typografia', 'Nazwy jako cięte liternictwo, jedna pod drugą.', 'paper', { types }),
  L(8, style, 'Rama stopniowana', 'Wiersze w złotej ramie ze stopniami, wstęga na krawędzi.', 'dark', { types }),
  L(9, style, 'Skrzydła V', 'Klin V z etykietą u góry, tytuł i wiersze pod nim.', 'dark', { types }),
  L(10, style, 'Kolumny', 'Pozycje obok siebie: duża liczba, nazwa pod nią.', 'paper', { types }),
];
const statsSet = [
  L(2, 'editorial', 'Lista na płycie', 'Ciemna płyta, liczby w kolorze, wiersze rozdzielone linią.', 'dark'),
  L(3, 'editorial', 'Karty', 'Karty liczb w dwóch kolumnach na papierze.', 'paper'),
  L(4, 'editorial', 'Pasy stroju', 'Wiersze jako pasy na całą szerokość.', 'dark'),
  L(5, 'editorial', 'Podział 24°', 'Blok w kolorze z tytułem, wiersze pod nim.', 'dark'),
  L(6, 'editorial', 'Typografia', 'Etykiety jako cięte liternictwo z liczbą przed nimi.', 'paper'),
  L(7, 'editorial', 'Rama stopniowana', 'Liczby w złotej ramie ze stopniami.', 'dark'),
  L(8, 'editorial', 'Skrzydła V', 'Klin V z etykietą, tytuł i liczby pod nim.', 'dark'),
  L(9, 'editorial', 'Kolumny liczb', 'Liczby obok siebie, etykieta pod każdą.', 'paper'),
  L(10, 'editorial', 'Karty na płycie', 'Karty liczb na ciemnej płycie.', 'dark'),
];
const hero = {
  'photo-full': ['Pełne zdjęcie', 'Zdjęcie na całą planszę, tekst na przyciemnionym dole.', 'dark'],
  'photo-frame': ['Zdjęcie w ramie', 'Zdjęcie w ramie ze stopniami, tekst pod nim.', 'dark'],
  side: ['Zdjęcie z boku', 'Wąskie zdjęcie w ramie z lewej, tekst w kolumnie obok.', 'dark'],
  'side-paper': ['Ramka z boku', 'Papier, ramka ze stopniami z lewej, tekst obok.', 'paper'],
  number: ['Wielka liczba', 'Wielka liczba konturem w tle, tytuł na płycie.', 'dark'],
  split: ['Podział 24°', 'Blok w kolorze z tytułem, cięty pod kątem 24°.', 'dark'],
  paper: ['Papier redakcyjny', 'Papier, tytuł z paskami i tekst.', 'paper'],
  V: ['Skrzydła V', 'Klin V z etykietą u góry, tytuł pod nim.', 'dark'],
  band: ['Pas z tytułem', 'Tytuł na pasie w kolorze przez całą szerokość.', 'dark'],
  card: ['Karta w ramie', 'Papier, całość w ramie ze stopniami pod wstęgą.', 'paper'],
  poster: ['Plakat', 'Pierwsze słowo bardzo duże, reszta w kolorze.', 'dark'],
};
const heroSet = (map, styleOf, types) =>
  Object.entries(map).map(([n, k]) => L(Number(n), styleOf(k), hero[k][0], hero[k][1], hero[k][2], types ? { types } : {}));
const photoFirst = (k) => (['photo-full', 'photo-frame', 'side'].includes(k) ? 'photo' : 'sport');

Object.assign(familyVariants, {
  lineup: [v(1, 'editorial', 'Koszulki na papierze', 'Pięć koszulek z numerami na papierze.', { legacy: true }), ...listSet('editorial')],
  statistics: [v(1, 'editorial', 'Tabela liczb', 'Karty liczb na papierze.', { legacy: true }), ...statsSet],
  schedule: [
    v(1, 'editorial', 'Papier · paski stroju', 'Mecze na pasach 24° na papierze.', { legacy: true }),
    ...listSet('editorial', ['schedule']),
    ...heroSet({ 2: 'paper', 3: 'number', 4: 'photo-frame', 5: 'band', 6: 'split', 7: 'poster', 8: 'card', 9: 'V', 10: 'side-paper' }, () => 'editorial', ['notice', 'news']),
  ],
  player: [
    v(1, 'photo', 'Portret w ramie', 'Zdjęcie w ramie ze stopniami, numer w tle.', { legacy: true }),
    v(2, 'sport', 'Koszulka', 'Koszulka z numerem zamiast portretu.', { legacy: true }),
    ...heroSet({ 3: 'photo-full', 4: 'photo-frame', 5: 'side', 6: 'number', 7: 'split', 8: 'V', 9: 'band', 10: 'card' }, photoFirst),
  ],
  tournament: [
    v(1, 'photo', 'Hero · fotografia', 'Zdjęcie z prawej, tytuł i liczby z lewej.', { legacy: true }),
    v(2, 'sport', 'Typograficzny · parametry', 'Tytuł, szewron i liczby turnieju.', { legacy: true }),
    ...heroSet({ 3: 'photo-full', 4: 'photo-frame', 5: 'side', 6: 'number', 7: 'split', 8: 'V', 9: 'band', 10: 'poster' }, photoFirst),
  ],
  report: [
    v(1, 'editorial', 'Zdjęcie w ramie', 'Zdjęcie w ramie, wstęga i tytuł na papierze.', { legacy: true }),
    ...heroSet({ 2: 'photo-full', 3: 'side', 4: 'split', 5: 'band', 6: 'paper', 7: 'V', 8: 'poster', 9: 'card', 10: 'number' }, () => 'editorial'),
  ],
  club: [
    v(1, 'editorial', 'Informacja na papierze', 'Tytuł i treść na papierze.', { legacy: true }),
    v(2, 'photo', 'Fotografia i treść', 'Zdjęcie u góry, treść pod nim.', { legacy: true }),
    ...heroSet({ 3: 'photo-full', 4: 'photo-frame', 5: 'side', 6: 'paper', 7: 'split', 8: 'V', 9: 'poster', 10: 'card' }, (k) => (['photo-full', 'photo-frame', 'side'].includes(k) ? 'photo' : 'editorial')),
  ],
  partners: [
    v(1, 'editorial', 'Równa ekspozycja', 'Logo na białych taflach, dwie kolumny na papierze.', { legacy: true }),
    L(2, 'editorial', 'Płyta, dwie kolumny', 'Białe tafle logo na ciemnej płycie.', 'dark'),
    L(3, 'editorial', 'Papier, trzy kolumny', 'Mniejsze tafle w trzech kolumnach.', 'paper'),
    L(4, 'editorial', 'Podział 24°', 'Blok w kolorze z tytułem, tafle pod nim.', 'dark'),
    L(5, 'editorial', 'Skrzydła V', 'Klin V z etykietą, tafle w trzech kolumnach.', 'dark'),
    L(6, 'editorial', 'Rama na papierze', 'Tafle w ramie ze stopniami pod wstęgą.', 'paper'),
    L(7, 'editorial', 'Lista na płycie', 'Tafle jedna pod drugą na ciemnej płycie.', 'dark'),
    L(8, 'editorial', 'Lista na papierze', 'Tafle jedna pod drugą, duży tytuł.', 'paper'),
    L(9, 'editorial', 'Rama na płycie', 'Tafle w złotej ramie na ciemnej płycie.', 'dark'),
    L(10, 'editorial', 'Wstęga, trzy kolumny', 'Wstęga u góry, tytuł i tafle w trzech kolumnach.', 'paper'),
  ],
});

/** Variants of a family available for a post type, optionally only in one style. */
export function variantsFor(type, style) {
  const all = familyVariants[type?.family];
  if (!all) return (type?.styles || []).map((s, i) => v(i + 1, s, '', '', { legacy: true })).filter((x) => !style || x.style === style);
  return all.filter((x) => type.styles.includes(x.style) && (!x.types || x.types.includes(type.id)) && (!style || x.style === style));
}
/** The variant that existed before variants for this style. */
export function legacyVariant(type, style) {
  return variantsFor(type, style).find((x) => x.legacy) || null;
}
/** The variant a project is drawn with: its `designVariant`, else the legacy layout of its style. */
export function projectVariant(type, project) {
  const n = project?.designVariant;
  if (n === undefined || n === null) return legacyVariant(type, project?.visualStyle);
  return variantsFor(type).find((x) => x.n === n) || null;
}
/** Suffix that keeps legacy design keys unchanged and separates new layouts. */
export function variantKey(type, project) {
  const x = projectVariant(type, project);
  return x && !x.legacy ? `:layout-${x.n}` : '';
}
