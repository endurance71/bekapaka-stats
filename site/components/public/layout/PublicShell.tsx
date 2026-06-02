"use client"

import { useState } from 'react'
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

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const closeMenu = () => setIsMenuOpen(false)

  return (
    <>
      <a href='#content' className='skip-link'>
        Przejdz do tresci
      </a>
      <header className='site-header'>
        <div className='container site-header__inner'>
          <ClubLogo logoUrl={logoUrl} />
          
          {/* Desktop Navigation */}
          <div className='desktop-nav-wrapper'>
            <MainNav />
          </div>

          <div className='header-actions-wrapper'>
            <button className='ticket-cta' type='button' onClick={() => window.open('https://panel.bekapaka.pl', '_blank')}>
              Panel
            </button>
          </div>

          {/* Hamburger Menu Button */}
          <button 
            className={`menu-toggle-btn ${isMenuOpen ? 'is-open' : ''}`} 
            type='button' 
            onClick={toggleMenu}
            aria-label='Toggle menu'
            aria-expanded={isMenuOpen}
          >
            <span className='hamburger-line'></span>
            <span className='hamburger-line'></span>
            <span className='hamburger-line'></span>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <div className={`mobile-menu-drawer ${isMenuOpen ? 'is-open' : ''}`}>
        <div className='mobile-menu-drawer__content'>
          <nav aria-label='Nawigacja mobilna' className='mobile-nav'>
            <MainNav onLinkClick={closeMenu} />
          </nav>
          <div style={{ marginTop: '40px', padding: '0 20px', textAlign: 'center' }}>
            <button 
              className='button button--primary' 
              type='button'
              onClick={() => {
                closeMenu()
                window.open('https://panel.bekapaka.pl', '_blank')
              }}
              style={{ width: '100%', maxWidth: '240px' }}
            >
              Zaloguj do Panelu
            </button>
          </div>
        </div>
        <div className='mobile-menu-drawer__backdrop' onClick={closeMenu} />
      </div>

      <main id='content' className='container'>
        {children}
      </main>
      <SiteFooter />
    </>
  )
}
