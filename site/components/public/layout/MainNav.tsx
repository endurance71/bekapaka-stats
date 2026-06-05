'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentType } from 'react'
import {
  BuildingIcon,
  CalendarIcon,
  HandshakeIcon,
  HomeIcon,
  MonitorIcon,
  NewspaperIcon,
  TrophyIcon,
  UsersIcon,
  type PublicIconProps
} from '../shared/PublicIcons'

type NavIcon = ComponentType<PublicIconProps>

const homeNavItem = { href: '/', label: 'Strona główna', Icon: HomeIcon }

const navItems: { href: string; label: string; Icon: NavIcon }[] = [
  { href: '/aktualnosci', label: 'Aktualności', Icon: NewspaperIcon },
  { href: '/mecze', label: 'Mecze', Icon: CalendarIcon },
  { href: '/tabela', label: 'Tabela', Icon: TrophyIcon },
  { href: '/sklad', label: 'Skład', Icon: UsersIcon },
  { href: '/sponsorzy', label: 'Sponsorzy', Icon: HandshakeIcon },
  { href: '/klub', label: 'Klub', Icon: BuildingIcon }
]

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/'
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function MainNav({
  onLinkClick,
  onPanelClick,
  variant = 'inline'
}: {
  onLinkClick?: () => void
  onPanelClick?: () => void
  variant?: 'inline' | 'fullscreen'
}) {
  const pathname = usePathname()
  const isFullscreen = variant === 'fullscreen'
  const items = isFullscreen ? [homeNavItem, ...navItems] : navItems

  return (
    <nav aria-label='Nawigacja glowna' className={isFullscreen ? 'main-nav--fullscreen' : undefined}>
      <ul className='main-nav'>
        {items.map((item) => {
          const isActive = isNavItemActive(pathname, item.href)
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
                    {isActive ? (
                      <span className='main-nav__active-bar' aria-hidden />
                    ) : (
                      <span className='main-nav__active-bar main-nav__active-bar--placeholder' aria-hidden />
                    )}
                  </>
                ) : (
                  item.label
                )}
              </Link>
            </li>
          )
        })}
        {isFullscreen && onPanelClick ? (
          <li className='main-nav__panel-item'>
            <a
              href='https://panel.bekapaka.pl'
              target='_blank'
              rel='noopener noreferrer'
              onClick={(event) => {
                event.preventDefault()
                onPanelClick()
              }}
            >
              <span className='main-nav__icon' aria-hidden>
                <MonitorIcon size={18} />
              </span>
              <span className='main-nav__label'>Zaloguj do Panelu</span>
              <span className='main-nav__active-bar main-nav__active-bar--placeholder' aria-hidden />
            </a>
          </li>
        ) : null}
      </ul>
    </nav>
  )
}
