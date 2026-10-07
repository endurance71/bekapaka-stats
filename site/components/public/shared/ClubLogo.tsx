import Link from 'next/link'

/** Nagłówek WWW: Sygnet 2.0 + wordmark (Znak 2.0 Mini dopiero od 90 px — tom WWW s. 14). */
export function ClubLogo({ onNavigate }: { logoUrl?: string; onNavigate?: () => void }) {
  return (
    <Link href="/" className="club-logo" aria-label="BeKaPaKa Bobolice — strona główna" onClick={onNavigate}>
      <img className="club-logo__mark" src="/brand/sygnet2-kolor-ciasny.svg" alt="" width={40} height={40} />
      <img className="club-logo__word" src="/brand/wordmark-negatyw.svg" alt="" width={150} height={22} />
    </Link>
  )
}
