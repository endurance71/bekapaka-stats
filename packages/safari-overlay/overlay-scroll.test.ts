import { afterEach, describe, expect, it, vi } from 'vitest'
import { focusWithoutScroll, restoreScrollPosition } from './overlay-scroll'

describe('restoreScrollPosition', () => {
  afterEach(() => {
    document.documentElement.style.scrollBehavior = ''
    vi.restoreAllMocks()
  })

  it('scrolls instantly and resets scroll-behavior on html', () => {
    document.documentElement.style.scrollBehavior = 'smooth'
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})

    restoreScrollPosition(420)

    expect(scrollTo).toHaveBeenCalledWith({ top: 420, left: 0, behavior: 'instant' })
    expect(document.documentElement.style.scrollBehavior).toBe('smooth')
  })
})

describe('focusWithoutScroll', () => {
  it('calls focus with preventScroll when supported', () => {
    const button = document.createElement('button')
    const focus = vi.spyOn(button, 'focus').mockImplementation(() => {})

    focusWithoutScroll(button)

    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
  })
})
