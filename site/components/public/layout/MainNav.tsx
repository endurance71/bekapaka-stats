'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentType } from 'react'
import {
  BuildingIcon,
  CalendarIcon,
  HandshakeIcon,
  NewspaperIcon,
  TrophyIcon,
  UsersIcon,
  type PublicIconProps
} from '../shared/PublicIcons'

type NavIcon = ComponentType<PublicIconProps>

const navItems: { href: string; label: string; Icon: NavIcon }[] = [
  { href: '/aktualnosci', label: 'Aktualności', Icon: NewspaperIcon },
  { href: '/mecze', label: 'Mecze', Icon: CalendarIcon },
  { href: '/tabela', label: 'Tabela', Icon: TrophyIcon },
  { href: '/sklad', label: 'Skład', Icon: UsersIcon },
  { href: '/sponsorzy', label: 'Sponsorzy', Icon: HandshakeIcon },
  { href: '/klub', label: 'Klub', Icon: BuildingIcon }
]

export function MainNav({
  onLinkClick,
  variant = 'inline'
}: {
  onLinkClick?: () => void
  variant?: 'inline' | 'fullscreen'
}) {
  const pathname = usePathname()
  const isFullscreen = variant === 'fullscreen'

  return (
    <nav aria-label='Nawigacja glowna' className={isFullscreen ? 'main-nav--fullscreen' : undefined}>
      <ul className='main-nav'>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.Icon

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onLinkClick}
                aria-current={isActive ? 'page' : undefined}
                className={isActive ? 'is-active' : undefined}
              >
                {isFullscreen ? (
                  <>
                    <span className='main-nav__icon' aria-hidden>
                      <Icon size={18} />
                    </span>
                    <span className='main-nav__label'>{item.label}</span>
                    {isActive ? <span className='main-nav__active-bar' aria-hidden /> : null}
                  </>
                ) : (
                  item.label
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
