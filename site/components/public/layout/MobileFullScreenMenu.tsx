'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MainNav } from './MainNav'

interface MobileFullScreenMenuProps {
  isOpen: boolean
  onClose: () => void
}

function MenuIcon() {
  return (
    <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' aria-hidden>
      <path d='M4 6h16M4 12h16M4 18h16' strokeLinecap='round' />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' aria-hidden>
      <path d='M18 6L6 18M6 6l12 12' strokeLinecap='round' />
    </svg>
  )
}

export function MobileFullScreenMenu({ isOpen, onClose }: MobileFullScreenMenuProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const dialogRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true)
      const frame = requestAnimationFrame(() => setIsVisible(true))
      return () => cancelAnimationFrame(frame)
    }

    setIsVisible(false)
    const timeout = window.setTimeout(() => setIsMounted(false), 280)
    return () => window.clearTimeout(timeout)
  }, [isOpen])

  useEffect(() => {
    if (!isMounted) return

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
      'button, a, [tabindex]:not([tabindex="-1"])'
    )
    firstFocusable?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>('button, a, [tabindex]:not([tabindex="-1"])')
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
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMounted, onClose])

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
      <header className='mobile-fullscreen-menu__header'>
        <div>
          <div className='mobile-fullscreen-menu__brand'>BeKaPaKa</div>
          <div className='mobile-fullscreen-menu__subtitle'>Nawigacja</div>
        </div>
        <button
          type='button'
          onClick={onClose}
          className='mobile-fullscreen-menu__close'
          aria-label='Zamknij menu'
        >
          <CloseIcon />
        </button>
      </header>

      <nav className='mobile-fullscreen-menu__nav' aria-label='Sekcje strony'>
        <MainNav onLinkClick={onClose} variant='fullscreen' />
      </nav>

      <div className='mobile-fullscreen-menu__footer'>
        <button
          className='button button--primary mobile-fullscreen-menu__cta'
          type='button'
          onClick={() => {
            onClose()
            window.open('https://panel.bekapaka.pl', '_blank', 'noopener,noreferrer')
          }}
        >
          Zaloguj do Panelu
        </button>
      </div>
    </div>,
    document.body
  )
}

export { MenuIcon }
