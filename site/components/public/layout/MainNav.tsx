import Link from 'next/link'

const navItems = [
  { href: '/aktualnosci', label: 'Aktualnosci' },
  { href: '/mecze', label: 'Mecze' },
  { href: '/tabela', label: 'Tabela' },
  { href: '/sklad', label: 'Sklad' },
  { href: '/sponsorzy', label: 'Sponsorzy' },
  { href: '/dokumenty', label: 'Dokumenty' },
  { href: '/klub', label: 'Klub' }
]

export function MainNav({ onLinkClick }: { onLinkClick?: () => void }) {
  return (
    <nav aria-label='Nawigacja glowna'>
      <ul className='main-nav'>
        {navItems.map((item) => (
          <li key={item.href}>
            <Link href={item.href} onClick={onLinkClick}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
