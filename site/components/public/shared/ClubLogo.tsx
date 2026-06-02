import Link from 'next/link'

export function ClubLogo({
  compact = false,
  logoUrl = '/favicon.ico'
}: {
  compact?: boolean
  logoUrl?: string
}) {
  return (
    <Link href='/' className='club-logo' aria-label='Strona glowna BeKaPaKa Bobolice'>
      <span className='club-logo__mark' aria-hidden='true'>
        <img src={logoUrl} alt='' />
      </span>
      {!compact ? (
        <span className='club-logo__text'>
          <strong>BeKaPaKa Bobolice</strong>
          <small>Koszykowka amatorska</small>
        </span>
      ) : null}
    </Link>
  )
}
