import { FallbackImage } from '../shared/FallbackImage'

/** Znak drużyny: BeKaPaKa — Znak 2.0 Mini; rywal — jego logo z ligi albo neutralna tarcza ze skrótem. */
export function TeamMark({
  own = false,
  name,
  logoUrl,
  size = 'md'
}: {
  own?: boolean
  name: string
  logoUrl?: string | null
  size?: 'lg' | 'md' | 'sm'
}) {
  if (own)
    return (
      <span className={`team-mark team-mark--${size} team-mark--own`}>
        <img src="/brand/herb2-mini-kolor-ciasny.svg" width={168} height={168} alt="" />
      </span>
    )
  const shield = <RivalShield name={name} />
  return (
    <span className={`team-mark team-mark--${size}`}>
      {logoUrl ? (
        <FallbackImage src={logoUrl} width={168} height={168} sizes="168px" alt="" fallback={shield} />
      ) : (
        shield
      )}
    </span>
  )
}

function RivalShield({ name }: { name: string }) {
  const short = (name.match(/[\p{L}\p{N}]+/gu) ?? ['—'])[0].slice(0, 4).toLocaleUpperCase('pl-PL')
  return (
    <span className="team-mark__shield" aria-hidden="true">
      <span>{short}</span>
    </span>
  )
}

/** V stroju A (24°/66°) jako znak „kontra” między drużynami. */
export function VersusMark({ className = '' }: { className?: string }) {
  return (
    <svg className={`versus-mark ${className}`.trim()} viewBox="0 0 48 54" width="48" height="54" aria-hidden="true">
      <polygon points="0,0 14,0 24,22.5 34,0 48,0 24,54" fill="currentColor" />
      <polygon points="14,0 24,22.5 34,0 31,0 24,15.8 17,0" fill="var(--brand-deep)" />
    </svg>
  )
}
