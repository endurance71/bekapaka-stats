'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/aktualnosci', label: 'Aktualności' },
  { href: '/mecze', label: 'Mecze' },
  { href: '/tabela', label: 'Tabela' },
  { href: '/sklad', label: 'Skład' },
  { href: '/sponsorzy', label: 'Sponsorzy' },
  { href: '/klub', label: 'Klub' }
]

export function MainNav({
  onLinkClick,
  variant = 'inline'
}: {
  onLinkClick?: () => void
  variant?: 'inline' | 'fullscreen'
}) {
  const pathname = usePathname()

  return (
    <nav aria-label='Nawigacja glowna' className={variant === 'fullscreen' ? 'main-nav--fullscreen' : undefined}>
      <ul className='main-nav'>
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onLinkClick}
              aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? 'page' : undefined}
              className={pathname === item.href || pathname.startsWith(`${item.href}/`) ? 'is-active' : undefined}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
