'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { focusWithoutScroll, usePageScrollLock, useVisualViewportOverlay } from '@bekapaka/safari-overlay'
import { CloseIcon } from './PublicIcons'

const DRAWER_TRANSITION_MS = 320

export function SlideoutPanel({
  isOpen,
  title,
  headerMeta,
  onClose,
  children,
  size = 'default'
}: {
  isOpen: boolean
  title: string
  /** Meta pod tytułem w nagłówku panelu (np. data i miejsce meczu). */
  headerMeta?: React.ReactNode
  onClose: () => void
  children: React.ReactNode
  /** `wide` — szerszy panel na desktop (np. tabela historii występów w składzie) */
  size?: 'default' | 'wide'
}) {
  const drawerRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  /** Panel w DOM (także podczas animacji zamykania). */
  const [isPresent, setIsPresent] = useState(false)
  /** Klasa `.is-open` — osobno, żeby odtworzyć wejście od dołu. */
  const [isShown, setIsShown] = useState(false)

  const overlayActive = isOpen || isPresent

  usePageScrollLock(overlayActive, { htmlClass: 'is-overlay-open' })
  useVisualViewportOverlay(drawerRef, isShown)

  useLayoutEffect(() => {
    if (isOpen) {
      setIsPresent(true)
      setIsShown(false)
      return
    }
    setIsShown(false)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !isPresent) return

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsShown(true))
    })
    return () => cancelAnimationFrame(frame)
  }, [isOpen, isPresent])

  useEffect(() => {
    if (isOpen || !isPresent) return

    const panel = panelRef.current
    let done = false

    const finish = () => {
      if (done) return
      done = true
      setIsPresent(false)
    }

    const timeoutId = window.setTimeout(finish, DRAWER_TRANSITION_MS + 80)

    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== panel) return
      if (event.propertyName !== 'transform') return
      window.clearTimeout(timeoutId)
      finish()
    }

    panel?.addEventListener('transitionend', handleTransitionEnd)

    return () => {
      window.clearTimeout(timeoutId)
      panel?.removeEventListener('transitionend', handleTransitionEnd)
    }
  }, [isOpen, isPresent])

  useEffect(() => {
    if (!isShown) return

    previousFocusRef.current = document.activeElement as HTMLElement

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }

    document.addEventListener('keydown', handleEsc)

    return () => {
      document.removeEventListener('keydown', handleEsc)

      if (previousFocusRef.current) {
        focusWithoutScroll(previousFocusRef.current)
      }
      previousFocusRef.current = null
    }
  }, [isShown])

  useEffect(() => {
    if (!isShown) return

    const frame = requestAnimationFrame(() => {
      const panel = panelRef.current
      if (!panel) return

      const closeButton = panel.querySelector<HTMLElement>('.stats-drawer__close')
      if (closeButton) {
        closeButton.focus()
        return
      }

      panel.focus()
    })

    return () => cancelAnimationFrame(frame)
  }, [isShown])

  useEffect(() => {
    if (!isShown) return

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !panelRef.current) return

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [isShown])

  if (typeof document === 'undefined' || !isPresent) return null

  return createPortal(
    <div
      ref={drawerRef}
      className={`stats-drawer ${size === 'wide' ? 'stats-drawer--wide' : ''} ${isShown ? 'is-open' : ''}`}
      aria-hidden={!isShown}
    >
      <button
        type="button"
        className="stats-drawer__backdrop"
        onClick={() => onCloseRef.current()}
        aria-label="Zamknij panel"
        tabIndex={isShown ? 0 : -1}
      />
      <div
        className="stats-drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={panelRef}
      >
        <div className="stats-drawer__panel-header">
          <div className="stats-drawer__header-main">
            <h2 className="stats-drawer__title">{title}</h2>
            {headerMeta ? <div className="stats-drawer__header-meta">{headerMeta}</div> : null}
          </div>
          <button
            className="stats-drawer__close"
            onClick={() => onCloseRef.current()}
            aria-label="Zamknij panel szczegółów"
            type="button"
          >
            <CloseIcon size={20} />
          </button>
        </div>
        <div className="stats-drawer__panel-body">{children}</div>
      </div>
    </div>,
    document.body
  )
}
