/**
 * Przywraca pozycję scrolla bez widocznej animacji (omija `scroll-behavior: smooth` na html).
 */
export function restoreScrollPosition(scrollY: number): void {
  if (typeof window === 'undefined') return

  const root = document.documentElement
  const previousBehavior = root.style.scrollBehavior
  root.style.scrollBehavior = 'auto'

  try {
    window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' as ScrollBehavior })
  } catch {
    window.scrollTo(0, scrollY)
  }

  root.style.scrollBehavior = previousBehavior
}

/**
 * Ustawia fokus bez przewijania strony (np. po zamknięciu modala lub panelu).
 */
export function focusWithoutScroll(element: HTMLElement): void {
  try {
    element.focus({ preventScroll: true })
  } catch {
    element.focus()
  }
}
