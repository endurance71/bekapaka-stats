'use client'

import { OnlineNotice } from '../shared/OnlineNotice'
import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ClubLogo } from '../shared/ClubLogo'
import { MainNav } from './MainNav'
import { focusWithoutScroll } from '@bekapaka/safari-overlay'
import { MenuIcon, MobileFullScreenMenu } from './MobileFullScreenMenu'

export function PublicShell({
  children,
  logoUrl,
  footer
}: {
  children: React.ReactNode
  logoUrl?: string
  footer: React.ReactNode
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement | null>(null)
  const pathname = usePathname()

  const openMenu = useCallback(() => setIsMenuOpen(true), [])
  const closeMenu = useCallback(() => setIsMenuOpen(false), [])
  const returnFocus = useCallback(() => {
    if (menuButtonRef.current) focusWithoutScroll(menuButtonRef.current)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  return (
    <div className="site-shell" inert={isMenuOpen}>
      <a href="#content" className="skip-link">
        Przejdź do treści
      </a>
      <header className="site-header">
        <div className="container site-header__inner">
          <button
            ref={menuButtonRef}
            className="mobile-menu-open-btn"
            type="button"
            onClick={openMenu}
            aria-label="Otwórz menu nawigacji"
            aria-expanded={isMenuOpen}
          >
            <MenuIcon />
          </button>

          <ClubLogo logoUrl={logoUrl} />

          <div className="desktop-nav-wrapper">
            <MainNav />
          </div>

          <div className="header-actions-wrapper">
            <a className="btn btn--secondary btn--sm" href="https://panel.bekapaka.pl">
              Panel klubu
            </a>
          </div>
        </div>
      </header>

      <MobileFullScreenMenu
        onAfterClose={returnFocus}
        isOpen={isMenuOpen}
        onClose={closeMenu}
        logoUrl={logoUrl}
      />

      <OnlineNotice />
      <main id="content" tabIndex={-1}>
        {children}
      </main>
      {footer}
      <div className="page-bottom-safe-spacer" aria-hidden="true" />
    </div>
  )
}
