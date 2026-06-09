import { useEffect } from 'react'
import { restoreScrollPosition } from './overlay-scroll'

export type PageScrollLockOptions = {
  /** Extra class on documentElement (e.g. is-overlay-open for transparent Safari chrome). */
  htmlClass?: string
}

/**
 * Locks page scroll while an overlay is open (html + body, Safari-safe).
 * Nie ustawia height na body — przy scrollY > 0 skrócony body + top offset
 * zostawia czarną lukę i prześwieca stronę pod modalem.
 */
export function usePageScrollLock(isActive: boolean, options?: PageScrollLockOptions): void {
  const htmlClass = options?.htmlClass

  useEffect(() => {
    if (!isActive || typeof window === 'undefined') return

    const scrollY = window.scrollY
    const root = document.documentElement
    const body = document.body

    root.classList.add('is-scroll-locked')
    body.classList.add('is-scroll-locked')
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    if (htmlClass) {
      root.classList.add(htmlClass)
    }

    return () => {
      root.classList.remove('is-scroll-locked')
      body.classList.remove('is-scroll-locked')
      body.style.top = ''
      body.style.width = ''
      if (htmlClass) {
        root.classList.remove(htmlClass)
      }
      restoreScrollPosition(scrollY)
    }
  }, [isActive, htmlClass])
}
