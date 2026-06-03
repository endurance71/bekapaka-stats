import { useEffect } from 'react'

/**
 * Syncs `--overlay-vh` on documentElement while an overlay is open.
 * Reduces Safari iOS jump when the address bar shows or hides.
 */
export function useOverlayViewportHeight(isOpen: boolean): void {
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return

    const root = document.documentElement
    const vv = window.visualViewport

    const apply = () => {
      const height = vv?.height ?? window.innerHeight
      const top = vv?.offsetTop ?? 0
      root.style.setProperty('--overlay-vh', `${height}px`)
      root.style.setProperty('--overlay-vt', `${top}px`)
    }

    apply()
    vv?.addEventListener('resize', apply)
    vv?.addEventListener('scroll', apply)
    window.addEventListener('resize', apply)

    return () => {
      vv?.removeEventListener('resize', apply)
      vv?.removeEventListener('scroll', apply)
      window.removeEventListener('resize', apply)
      root.style.removeProperty('--overlay-vh')
      root.style.removeProperty('--overlay-vt')
    }
  }, [isOpen])
}
