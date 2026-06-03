import { useEffect } from 'react'

export type PageScrollLockOptions = {
  /** Extra class on documentElement (e.g. is-overlay-open for transparent Safari chrome). */
  htmlClass?: string
}

/**
 * Locks page scroll while an overlay is open (html + body, Safari-safe).
 */
export function usePageScrollLock(isActive: boolean, options?: PageScrollLockOptions): void {
  const htmlClass = options?.htmlClass

  useEffect(() => {
    if (!isActive || typeof window === 'undefined') return

    const scrollY = window.scrollY
    const root = document.documentElement

    root.classList.add('is-scroll-locked')
    document.body.classList.add('is-scroll-locked')
    if (htmlClass) {
      root.classList.add(htmlClass)
    }
    document.body.style.top = `-${scrollY}px`

    return () => {
      root.classList.remove('is-scroll-locked')
      document.body.classList.remove('is-scroll-locked')
      if (htmlClass) {
        root.classList.remove(htmlClass)
      }
      document.body.style.top = ''
      window.scrollTo(0, scrollY)
    }
  }, [isActive, htmlClass])
}
