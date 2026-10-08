// Polish plural forms: 1 kompozycja, 2–4 kompozycje, 5+ kompozycji (12–14 always "many").
export function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return `${n} ${one}`;
  const tens = n % 100;
  const units = n % 10;
  return `${n} ${units >= 2 && units <= 4 && (tens < 12 || tens > 14) ? few : many}`;
}
