'use client'

import { useEffect, useRef } from 'react'

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

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const firstFocusable = panelRef.current?.querySelector<HTMLElement>('button, a, [tabindex]:not([tabindex="-1"])')
    firstFocusable?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  return (
    <div className={`stats-drawer ${isOpen ? 'is-open' : ''}`} aria-hidden={!isOpen}>
      <button className='stats-drawer__backdrop' onClick={onClose} aria-label='Zamknij panel' />
      <div className='stats-drawer__panel' role='dialog' aria-modal='true' aria-label={title} ref={panelRef}>
        <button className='stats-drawer__close' onClick={onClose} aria-label='Zamknij panel szczegółów'>
          ✕
        </button>
        {children}
      </div>
    </div>
  )
}
