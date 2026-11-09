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
