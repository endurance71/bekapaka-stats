'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CloseIcon } from './PublicIcons'

export function SlideoutPanel({
  isOpen,
  title,
  onClose,
  children
}: {
  isOpen: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!isOpen) return

    const scrollY = window.scrollY
    const root = document.documentElement
    root.classList.add('is-scroll-locked')
    document.body.classList.add('is-scroll-locked')
    document.body.style.top = `-${scrollY}px`

    previousFocusRef.current = document.activeElement as HTMLElement

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }

    document.addEventListener('keydown', handleEsc)

    return () => {
      document.documentElement.classList.remove('is-scroll-locked')
      document.body.classList.remove('is-scroll-locked')
      document.body.style.top = ''
      window.scrollTo(0, scrollY)
      document.removeEventListener('keydown', handleEsc)

      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus()
      }
      previousFocusRef.current = null
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

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
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

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
  }, [isOpen])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className={`stats-drawer ${isOpen ? 'is-open' : ''}`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        className="stats-drawer__backdrop"
        onClick={() => onCloseRef.current()}
        aria-label="Zamknij panel"
        tabIndex={isOpen ? 0 : -1}
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
          <span className="stats-drawer__handle" aria-hidden="true" />
          <button
            className="stats-drawer__close"
            onClick={() => onCloseRef.current()}
            aria-label="Zamknij panel szczegółów"
            type="button"
          >
            <CloseIcon size={18} />
          </button>
        </div>
        <div className="stats-drawer__panel-body">{children}</div>
      </div>
    </div>,
    document.body
  )
}
