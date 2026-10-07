'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navItems } from '../../../lib/navigation'

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function MainNav({ onLinkClick, variant = 'inline' }: { onLinkClick?: () => void; variant?: 'inline' | 'fullscreen' }) {
  const pathname = usePathname()
  const fullscreen = variant === 'fullscreen'
  const items = fullscreen ? [{ href: '/', label: 'Start' }, ...navItems] : navItems

  return (
    <nav aria-label="Nawigacja główna" className={fullscreen ? 'nav nav--fullscreen' : 'nav'}>
      <ul className="nav__list" role="list">
        {items.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <li key={item.href}>
              <Link href={item.href} onClick={onLinkClick} aria-current={active ? 'page' : undefined} className={active ? 'is-active' : undefined}>
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
