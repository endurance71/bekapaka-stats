import Link from 'next/link'

export function ClubLogo({
  compact = false,
  logoUrl = '/logo.png',
  onNavigate
}: {
  compact?: boolean
  logoUrl?: string
  onNavigate?: () => void
}) {
  return (
    <Link
      href='/'
      className='club-logo'
      aria-label='Strona glowna BeKaPaKa Bobolice'
      onClick={onNavigate}
    >
      <span className='club-logo__mark' aria-hidden='true'>
        <img src={logoUrl} alt='' />
      </span>
      {!compact ? (
        <span className='club-logo__text'>
          <strong>BeKaPaKa Bobolice</strong>
        </span>
      ) : null}
    </Link>
  )
}
