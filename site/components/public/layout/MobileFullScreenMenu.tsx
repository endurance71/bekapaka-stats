'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { usePageScrollLock } from '@bekapaka/safari-overlay'
import { ClubLogo } from '../shared/ClubLogo'
import { CloseIcon } from '../shared/PublicIcons'
import { MainNav } from './MainNav'

/** Must match `--mobile-menu-duration` in base.css */
const MENU_ANIMATION_MS = 300

interface MobileFullScreenMenuProps {
  isOpen: boolean
  onClose: () => void
  logoUrl?: string
}

function MenuIcon() {
  return (
    <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' aria-hidden>
      <path d='M4 6h16M4 12h16M4 18h16' strokeLinecap='round' />
    </svg>
  )
}

export function MobileFullScreenMenu({ isOpen, onClose, logoUrl = '/logo.png' }: MobileFullScreenMenuProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const isClosingRef = useRef(false)
  const closeCleanupRef = useRef<(() => void) | null>(null)

  usePageScrollLock(isMounted, { htmlClass: 'is-overlay-open' })

  const finishUnmount = useCallback(() => {
    closeCleanupRef.current?.()
    closeCleanupRef.current = null
    isClosingRef.current = false
    setIsMounted(false)
    setIsVisible(false)
  }, [])

  const startCloseAnimation = useCallback(() => {
    if (isClosingRef.current) return
    isClosingRef.current = true

    closeCleanupRef.current?.()

    setIsVisible(false)

    const panel = panelRef.current
    let completed = false

    const complete = () => {
      if (completed) return
      completed = true
      closeCleanupRef.current?.()
      closeCleanupRef.current = null
      finishUnmount()
    }

    const handleTransitionEnd = (event: TransitionEvent) => {
      if (!panel || event.target !== panel || event.propertyName !== 'transform') return
      complete()
    }

    panel?.addEventListener('transitionend', handleTransitionEnd)
    const fallbackId = window.setTimeout(complete, MENU_ANIMATION_MS + 80)

    closeCleanupRef.current = () => {
      panel?.removeEventListener('transitionend', handleTransitionEnd)
      window.clearTimeout(fallbackId)
    }
  }, [finishUnmount])

  const handleRequestClose = useCallback(() => {
    if (!isMounted || isClosingRef.current) return
    onClose()
    startCloseAnimation()
  }, [isMounted, onClose, startCloseAnimation])

  useEffect(() => {
    if (!isOpen) return

    isClosingRef.current = false
    setIsMounted(true)

    let openFrame1 = 0
    let openFrame2 = 0
    openFrame1 = requestAnimationFrame(() => {
      openFrame2 = requestAnimationFrame(() => {
        setIsVisible(true)
      })
    })

    return () => {
      cancelAnimationFrame(openFrame1)
      cancelAnimationFrame(openFrame2)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen || !isMounted) return
    startCloseAnimation()
  }, [isOpen, isMounted, startCloseAnimation])

  useEffect(() => {
    return () => {
      closeCleanupRef.current?.()
    }
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
      'button, a, [tabindex]:not([tabindex="-1"])'
    )
    firstFocusable?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleRequestClose()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button, a, [tabindex]:not([tabindex="-1"])'
        )
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
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMounted, handleRequestClose])

  if (typeof document === 'undefined' || !isMounted) {
    return null
  }

  return createPortal(
    <div
      ref={dialogRef}
      role='dialog'
      aria-modal='true'
      aria-label='Menu nawigacji'
      className={`mobile-fullscreen-menu ${isVisible ? 'is-visible' : ''}`}
    >
      <div ref={panelRef} className='mobile-fullscreen-menu__panel'>
        <header className='mobile-fullscreen-menu__header'>
          <button
            type='button'
            onClick={handleRequestClose}
            className='mobile-fullscreen-menu__close'
            aria-label='Zamknij menu'
          >
            <CloseIcon />
          </button>

          <div className='mobile-fullscreen-menu__title'>
            <Link
              href='/'
              className='mobile-fullscreen-menu__brand'
              onClick={handleRequestClose}
              aria-label='Strona główna'
            >
              BeKaPaKa
            </Link>
          </div>

          <ClubLogo logoUrl={logoUrl} onNavigate={handleRequestClose} />
        </header>

        <div className='mobile-fullscreen-menu__nav'>
          <MainNav
            onLinkClick={handleRequestClose}
            onPanelClick={() => {
              handleRequestClose()
              window.setTimeout(() => {
                window.open('https://panel.bekapaka.pl', '_blank', 'noopener,noreferrer')
              }, MENU_ANIMATION_MS)
            }}
            variant='fullscreen'
          />
        </div>
      </div>
    </div>,
    document.body
  )
}

export { MenuIcon }
