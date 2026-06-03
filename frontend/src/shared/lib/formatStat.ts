/** Bezpieczne formatowanie liczb ze statystyk KALK (null/undefined → 0). */
export function formatStatFixed(
  value: number | null | undefined,
  digits = 1
): string {
  const n = value ?? 0
  return Number.isFinite(n) ? n.toFixed(digits) : (0).toFixed(digits)
}
