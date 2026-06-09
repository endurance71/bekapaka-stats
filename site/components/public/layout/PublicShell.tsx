'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClubLogo } from '../shared/ClubLogo'
import { MainNav } from './MainNav'
import { SiteFooter } from './SiteFooter'
import { focusWithoutScroll } from '@bekapaka/safari-overlay'
import { MenuIcon, MobileFullScreenMenu } from './MobileFullScreenMenu'

export function PublicShell({
  children,
  logoUrl
}: {
  children: React.ReactNode
  logoUrl?: string
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement | null>(null)
  const pathname = usePathname()

  const openMenu = () => setIsMenuOpen(true)
  const closeMenu = () => setIsMenuOpen(false)

  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isMenuOpen) {
      if (menuButtonRef.current) {
        focusWithoutScroll(menuButtonRef.current)
      }
    }
  }, [isMenuOpen])

  return (
    <div className='site-shell'>
      <a href='#content' className='skip-link'>
        Przejdz do tresci
      </a>
      <header className='site-header'>
        <div className='container site-header__inner'>
          <button
            ref={menuButtonRef}
            className='mobile-menu-open-btn'
            type='button'
            onClick={openMenu}
            aria-label='Otwórz menu nawigacji'
            aria-expanded={isMenuOpen}
          >
            <MenuIcon />
          </button>

          <Link href='/' className='site-header__mobile-brand' aria-label='Strona główna'>
            BeKaPaKa
          </Link>

          <ClubLogo logoUrl={logoUrl} />

          <div className='desktop-nav-wrapper'>
            <MainNav />
          </div>

          <div className='header-actions-wrapper'>
            <button className='ticket-cta' type='button' onClick={() => window.open('https://panel.bekapaka.pl', '_blank', 'noopener,noreferrer')}>
              Panel Klubu
            </button>
          </div>
        </div>
      </header>

      <MobileFullScreenMenu isOpen={isMenuOpen} onClose={closeMenu} logoUrl={logoUrl} />

      <main id='content' className='container'>
        {children}
      </main>
      <SiteFooter />
      <div className='page-bottom-safe-spacer' aria-hidden='true' />
    </div>
  )
}
