import Link from 'next/link'
export function ClubLogo({ compact = false, onNavigate }: { compact?: boolean; logoUrl?: string; onNavigate?: () => void }) {
 return <Link href='/' className='club-logo' aria-label='Strona główna BeKaPaKa Bobolice' onClick={onNavigate}>
  <img className='club-logo__mark' src='/brand/sygnet2-kolor-ciasny.svg' alt='' width={40} height={40} />
  {!compact && <img className='club-logo__word' src='/brand/wordmark-negatyw.svg' alt='' width={150} height={22} />}
 </Link>
}
