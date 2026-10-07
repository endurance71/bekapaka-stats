export type CompareRow = {
  label: string
  /** Wartości do wyświetlenia (np. „38/66”, „57,6%”). */
  us: string
  them: string
  /** Liczby do proporcji paska i wyboru lepszej strony. */
  usValue: number
  themValue: number
  /** Dla strat i punktów straconych lepsza jest niższa wartość. */
  lowerIsBetter?: boolean
}

/**
 * Porównanie dwóch drużyn paskami: BeKaPaKa zawsze po lewej, rywal po prawej; lepsza wartość pogrubiona w kolorze marki.
 * Wspólne dla meczu zakończonego (box score) i zapowiedzi (średnie sezonu).
 */
export function CompareBars({ usLabel = 'BeKaPaKa', themLabel, rows }: { usLabel?: string; themLabel: string; rows: CompareRow[] }) {
  if (!rows.length) return null
  return (
    <>
      <div className="compare__head" aria-hidden="true">
        <span>{usLabel}</span>
        <span>{themLabel}</span>
      </div>
      <div className="compare">
        {rows.map((row) => {
          const total = row.usValue + row.themValue
          const usPct = total > 0 ? (row.usValue / total) * 100 : 50
          const better = row.usValue === row.themValue ? null : (row.usValue > row.themValue) !== Boolean(row.lowerIsBetter) ? 'us' : 'them'
          return (
            <div key={row.label} className="compare__item">
              <div className="compare__labels">
                <span className={`compare__home${better === 'us' ? ' is-better' : ''}`}>{row.us}</span>
                <span className="compare__name">{row.label}</span>
                <span className={`compare__away${better === 'them' ? ' is-better' : ''}`}>{row.them}</span>
              </div>
              <div className="compare__track" aria-hidden="true">
                <div className="compare__fill-home" style={{ width: `${usPct}%` }} />
                <div className="compare__fill-away" style={{ width: `${100 - usPct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
