/**
 * iOS PWA + viewport-fit=cover: env(safe-area-inset-bottom) can stack with
 * system layout — expose a single --safe-area-bottom token for modals/footer.
 */
const ROOT = () => document.documentElement

const isIos = (): boolean =>
  typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)

const isStandalonePwa = (): boolean => {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    nav.standalone === true
  )
}

const readEnvSafeAreaBottom = (): number => {
  const probe = document.createElement('div')
  probe.style.cssText =
    'position:fixed;bottom:0;left:0;visibility:hidden;pointer-events:none;padding-bottom:env(safe-area-inset-bottom,0px);'
  document.body.appendChild(probe)
  const inset = parseFloat(getComputedStyle(probe).paddingBottom) || 0
  probe.remove()
  return inset
}

export const syncPwaSafeArea = (): void => {
  if (typeof window === 'undefined') return

  const inset = isIos() && isStandalonePwa() ? 0 : readEnvSafeAreaBottom()
  ROOT().style.setProperty('--safe-area-bottom', `${inset}px`)
  ROOT().classList.toggle('pwa-standalone', isStandalonePwa())
}

export const initPwaSafeArea = (): void => {
  syncPwaSafeArea()

  // Pomiar wymusza przeliczenie układu — najwyżej raz na klatkę i tylko przy zmianie rozmiaru (nie przy przewijaniu)
  let frame = 0
  const schedule = () => {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      syncPwaSafeArea()
    })
  }
  window.addEventListener('resize', schedule)
  window.addEventListener('orientationchange', schedule)
  window.visualViewport?.addEventListener('resize', schedule)
}
