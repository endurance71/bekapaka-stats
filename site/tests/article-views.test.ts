import { describe, expect, it } from 'vitest'
import { newsPostSchema } from '../lib/data/schemas'

function formatViewsCount(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (count === 1) return '1 wyświetlenie'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return `${count} wyświetlenia`
  }
  return `${count} wyświetleń`
}

describe('Article Views feature', () => {
  it('newsPostSchema parses valid views field', () => {
    const validPost = {
      id: 'post-1',
      title: 'Mecz ligowy',
      slug: 'mecz-ligowy',
      excerpt: 'Krótki opis',
      content: 'Treść artykułu',
      publishedAt: '2026-05-01T12:00:00Z',
      views: 42,
      attachments: []
    }

    const parsed = newsPostSchema.safeParse(validPost)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.views).toBe(42)
    }
  })

  it('newsPostSchema works when views is undefined', () => {
    const postWithoutViews = {
      id: 'post-2',
      title: 'Drugi wpis',
      slug: 'drugi-wpis',
      excerpt: 'Opis',
      content: 'Treść',
      publishedAt: '2026-05-01T12:00:00Z',
      attachments: []
    }

    const parsed = newsPostSchema.safeParse(postWithoutViews)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.views).toBeUndefined()
    }
  })

  it('correctly pluralizes Polish view count strings', () => {
    expect(formatViewsCount(1)).toBe('1 wyświetlenie')
    expect(formatViewsCount(2)).toBe('2 wyświetlenia')
    expect(formatViewsCount(4)).toBe('4 wyświetlenia')
    expect(formatViewsCount(5)).toBe('5 wyświetleń')
    expect(formatViewsCount(10)).toBe('10 wyświetleń')
    expect(formatViewsCount(12)).toBe('12 wyświetleń')
    expect(formatViewsCount(21)).toBe('21 wyświetleń')
    expect(formatViewsCount(22)).toBe('22 wyświetlenia')
    expect(formatViewsCount(24)).toBe('24 wyświetlenia')
    expect(formatViewsCount(25)).toBe('25 wyświetleń')
    expect(formatViewsCount(104)).toBe('104 wyświetlenia')
    expect(formatViewsCount(112)).toBe('112 wyświetleń')
  })
})
