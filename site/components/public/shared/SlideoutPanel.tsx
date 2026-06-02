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

    const scrollY = window.scrollY
    document.body.classList.add('is-scroll-locked')
    document.body.style.top = `-${scrollY}px`

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
      document.body.classList.remove('is-scroll-locked')
      document.body.style.top = ''
      window.scrollTo(0, scrollY)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  return (
    <div className={`stats-drawer ${isOpen ? 'is-open' : ''}`} aria-hidden={!isOpen}>
      <button className='stats-drawer__backdrop' onClick={onClose} aria-label='Zamknij panel' />
      <div className='stats-drawer__panel' role='dialog' aria-modal='true' aria-label={title} ref={panelRef}>
        <div className='stats-drawer__panel-header'>
          <span className='stats-drawer__handle' aria-hidden='true' />
          <button className='stats-drawer__close' onClick={onClose} aria-label='Zamknij panel szczegółów' type='button'>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
