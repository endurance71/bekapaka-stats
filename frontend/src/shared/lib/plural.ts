/** Polska odmiana liczebnika: 1 mecz, 2–4 mecze, 5+ meczów (12–14 → many). */
export function pluralPl(n: number, one: string, few: string, many: string): string {
    const abs = Math.abs(n);
    if (abs === 1) return one;
    const mod10 = abs % 10;
    const mod100 = abs % 100;
    if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return few;
    return many;
}
