/** Liczby w panelu po polsku: przecinek dziesiętny („8,5”), brak wartości = „–”. */

const comma = (s: string) => s.replace('.', ',');

/** Bezpieczne formatowanie liczb ze statystyk KALK (null/undefined → 0), np. „8,5”. */
export function formatStatFixed(
  value: number | null | undefined,
  digits = 1
): string {
  const n = value ?? 0
  return comma((Number.isFinite(n) ? n : 0).toFixed(digits))
}

/** „8,5”; brak wartości → „–”. */
export function fmt1(value: number | null | undefined, digits = 1): string {
  return value == null || !Number.isFinite(value) ? '–' : comma(value.toFixed(digits))
}

/** „45,5%”; brak wartości → „–”. */
export function fmtPct(value: number | null | undefined, digits = 1): string {
  return value == null || !Number.isFinite(value) ? '–' : `${comma(value.toFixed(digits))}%`
}

/** Procent z trafionych/oddanych („40,0%”); bez prób → „–”. */
export function fmtShotPct(made: number | null | undefined, attempted: number | null | undefined, digits = 1): string {
  return attempted ? fmtPct(((made ?? 0) / attempted) * 100, digits) : '–'
}
