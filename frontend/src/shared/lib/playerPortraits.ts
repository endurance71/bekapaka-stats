import { normalizePolishChars } from './playerUtils';

/**
 * Portrety marki (wycięte z tła) — te same co na bekapaka.pl (`site/lib/data/local-player-portraits.ts`).
 * Panel dopasowuje je po imieniu, nazwisku i numerze; nieznany zawodnik lub zmieniony numer → brak portretu.
 */
const portraitFiles = import.meta.glob('../../assets/portraits/*.webp', {
    eager: true,
    query: '?url',
    import: 'default',
}) as Record<string, string>;

const PORTRAIT_NUMBERS: Readonly<Record<string, number>> = {
    'pawel-samusionek': 3,
    'pablo-iriarte': 4,
    'patryk-szczesniak': 7,
    'miroslaw-malina': 11,
    'tomasz-kaszubowski': 12,
    'przemyslaw-klimek': 16,
    'robert-kulik': 21,
    'emil-klos': 23,
    'damian-motylinski': 24,
    'filip-karpinski': 69,
};

export function resolvePlayerPortrait(firstName?: string, lastName?: string, number?: number | null): string | undefined {
    if (!firstName || !lastName) return undefined;
    const slug = `${normalizePolishChars(firstName)}-${normalizePolishChars(lastName)}`;
    const expected = PORTRAIT_NUMBERS[slug];
    if (expected === undefined || (number != null && number !== 0 && number !== expected)) return undefined;
    return portraitFiles[`../../assets/portraits/${slug}.webp`];
}
