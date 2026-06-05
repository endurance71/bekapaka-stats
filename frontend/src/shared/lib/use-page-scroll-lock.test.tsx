import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { usePageScrollLock } from '@bekapaka/safari-overlay'

describe('usePageScrollLock', () => {
  afterEach(() => {
    document.documentElement.classList.remove('is-scroll-locked', 'is-overlay-open')
    document.body.classList.remove('is-scroll-locked')
    document.body.style.top = ''
    document.body.style.width = ''
  })

  it('adds scroll lock classes on html and body when active', () => {
    renderHook(() => usePageScrollLock(true, { htmlClass: 'is-overlay-open' }))

    expect(document.documentElement.classList.contains('is-scroll-locked')).toBe(true)
    expect(document.documentElement.classList.contains('is-overlay-open')).toBe(true)
    expect(document.body.classList.contains('is-scroll-locked')).toBe(true)
    expect(document.body.style.top).toBeTruthy()
    expect(document.body.style.width).toBe('100%')
  })

  it('removes scroll lock classes when inactive', () => {
    const { rerender } = renderHook(
      ({ active }: { active: boolean }) => usePageScrollLock(active, { htmlClass: 'is-overlay-open' }),
      { initialProps: { active: true } }
    )

    rerender({ active: false })

    expect(document.documentElement.classList.contains('is-scroll-locked')).toBe(false)
    expect(document.documentElement.classList.contains('is-overlay-open')).toBe(false)
    expect(document.body.classList.contains('is-scroll-locked')).toBe(false)
  })
})
