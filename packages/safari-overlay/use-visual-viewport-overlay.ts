import { useLayoutEffect, type RefObject } from 'react'

const MOBILE_OVERLAY_MQ = '(max-width: 899px)'

const clearOverlayBounds = (el: HTMLElement) => {
  el.style.top = ''
  el.style.left = ''
  el.style.right = ''
  el.style.width = ''
  el.style.height = ''
  el.style.bottom = ''
}

/**
 * Sizes a fixed overlay to the current visual viewport (iOS Safari address bar).
 */
export function useVisualViewportOverlay(
  targetRef: RefObject<HTMLElement | null>,
  isActive: boolean
): void {
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return

    const el = targetRef.current
    if (!el) return

    if (!isActive) {
      clearOverlayBounds(el)
      return
    }

    const mq = window.matchMedia(MOBILE_OVERLAY_MQ)
    const vv = window.visualViewport

    const apply = () => {
      if (!mq.matches || !vv) {
        clearOverlayBounds(el)
        return
      }

      el.style.top = `${vv.offsetTop}px`
      el.style.left = '0'
      el.style.right = '0'
      el.style.width = '100%'
      el.style.height = `${vv.height}px`
      el.style.bottom = 'auto'
    }

    apply()
    vv?.addEventListener('resize', apply)
    vv?.addEventListener('scroll', apply)
    window.addEventListener('resize', apply)
    mq.addEventListener('change', apply)

    return () => {
      vv?.removeEventListener('resize', apply)
      vv?.removeEventListener('scroll', apply)
      window.removeEventListener('resize', apply)
      mq.removeEventListener('change', apply)
      clearOverlayBounds(el)
    }
  }, [isActive, targetRef])
}
