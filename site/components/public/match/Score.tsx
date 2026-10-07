/**
 * Wynik meczu — jeden komponent w całym serwisie.
 * BeKaPaKa zawsze po lewej; prowadzący pełny, drugi konturem (Brandbook 2.0, s. 36 i WWW s. 18).
 */
export function Score({
  us,
  them,
  opponent,
  size = 'lg',
  cut = true,
  className = ''
}: {
  us: number
  them: number
  opponent: string
  size?: 'xl' | 'lg' | 'md' | 'sm'
  cut?: boolean
  className?: string
}) {
  const leader = us === them ? 'none' : us > them ? 'us' : 'them'
  return (
    <span
      className={`score score--${size} ${className}`.trim()}
      role="img"
      aria-label={`BeKaPaKa ${us}, ${opponent} ${them}`}
    >
      <span className={`score__value${cut ? ' cut' : ''}${leader === 'them' ? ' outline' : ''}`}>{us}</span>
      <span className="score__sep" aria-hidden="true">:</span>
      <span className={`score__value${cut ? ' cut' : ''}${leader === 'us' ? ' outline' : ''}`}>{them}</span>
    </span>
  )
}

export function resultLabel(us: number, them: number) {
  if (us > them) return 'Wygrana'
  if (us < them) return 'Porażka'
  return 'Remis'
}
