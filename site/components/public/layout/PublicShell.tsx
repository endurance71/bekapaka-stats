"use client"

import { useEffect, useRef, useState } from 'react'
import { ClubLogo } from '../shared/ClubLogo'
import { MainNav } from './MainNav'
import { SiteFooter } from './SiteFooter'

export function PublicShell({
  children,
  logoUrl
}: {
  children: React.ReactNode
  logoUrl?: string
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const toggleButtonRef = useRef<HTMLButtonElement | null>(null)
  const drawerRef = useRef<HTMLDivElement | null>(null)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const closeMenu = () => setIsMenuOpen(false)

  useEffect(() => {
    if (!isMenuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const firstFocusable = drawerRef.current?.querySelector<HTMLElement>('a, button, [tabindex]:not([tabindex="-1"])')
    firstFocusable?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMenu()
        return
      }

      if (event.key !== 'Tab' || !drawerRef.current) return
      const focusableElements = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>('a, button, [tabindex]:not([tabindex="-1"])')
      ).filter((element) => !element.hasAttribute('disabled'))

      if (focusableElements.length === 0) return
      const first = focusableElements[0]
      const last = focusableElements[focusableElements.length - 1]
      const current = document.activeElement as HTMLElement | null

      if (event.shiftKey && current === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && current === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

  useEffect(() => {
    if (!isMenuOpen) {
      toggleButtonRef.current?.focus()
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
            <button className='ticket-cta' type='button' onClick={() => window.open('https://panel.bekapaka.pl', '_blank')}>
              Panel Klubu
            </button>
          </div>

          <button
            ref={toggleButtonRef}
            className={`menu-toggle-btn ${isMenuOpen ? 'is-open' : ''}`} 
            type='button' 
            onClick={toggleMenu}
            aria-label={isMenuOpen ? 'Zamknij menu' : 'Otwórz menu'}
            aria-expanded={isMenuOpen}
            aria-controls='mobile-menu-drawer'
          >
            <span className='hamburger-line'></span>
            <span className='hamburger-line'></span>
            <span className='hamburger-line'></span>
          </button>
        </div>
      </header>

      <div
        id='mobile-menu-drawer'
        className={`mobile-menu-drawer ${isMenuOpen ? 'is-open' : ''}`}
        aria-hidden={!isMenuOpen}
      >
        <button className='mobile-menu-drawer__backdrop' aria-label='Zamknij menu' onClick={closeMenu} />
        <div
          className='mobile-menu-drawer__content'
          role='dialog'
          aria-modal='true'
          aria-label='Menu mobilne'
          ref={drawerRef}
        >
          <div className='mobile-nav'>
            <MainNav onLinkClick={closeMenu} />
          </div>
          <div className='mobile-menu-cta'>
            <button
              className='button button--primary'
              type='button'
              onClick={() => {
                closeMenu()
                window.open('https://panel.bekapaka.pl', '_blank')
              }}
            >
              Zaloguj do Panelu
            </button>
          </div>
        </div>
      </div>

      <main id='content' className='container'>
        {children}
        <div className='page-bottom-safe-spacer' aria-hidden='true' />
      </main>
      <SiteFooter />
    </>
  )
}
