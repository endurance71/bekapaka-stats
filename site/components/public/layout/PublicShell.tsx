'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ClubLogo } from '../shared/ClubLogo'
import { MainNav } from './MainNav'
import { SiteFooter } from './SiteFooter'
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
      menuButtonRef.current?.focus()
    }
  }, [isMenuOpen])

  return (
    <>
      <a href='#content' className='skip-link'>
        Przejdz do tresci
      </a>
      <header className='site-header'>
        <div className='container site-header__inner'>
          <ClubLogo logoUrl={logoUrl} />

          <div className='desktop-nav-wrapper'>
            <MainNav />
          </div>

          <div className='header-actions-wrapper'>
            <button className='ticket-cta' type='button' onClick={() => window.open('https://panel.bekapaka.pl', '_blank', 'noopener,noreferrer')}>
              Panel Klubu
            </button>
          </div>

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
        </div>
      </header>

      <MobileFullScreenMenu isOpen={isMenuOpen} onClose={closeMenu} />

      <main id='content' className='container'>
        {children}
        <div className='page-bottom-safe-spacer' aria-hidden='true' />
      </main>
      <SiteFooter />
    </>
  )
}
