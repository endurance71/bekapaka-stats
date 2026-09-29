import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ArticleImageCarousel } from '../components/public/shared/ArticleImageCarousel'

function images(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    src: `https://cms.bekapaka.pl/uploads/photo_${index}.jpg`,
    alt: `Zdjęcie ${index + 1}`
  }))
}

function occurrences(html: string, value: string) {
  return html.split(value).length - 1
}

describe('ArticleImageCarousel server markup', () => {
  it.each([1, 2, 8, 20])('renders exactly one unified carousel tree for %i image(s)', (count) => {
    const html = renderToStaticMarkup(<ArticleImageCarousel images={images(count)} />)
    expect(occurrences(html, 'class="article-gallery__track"')).toBe(1)
    expect(occurrences(html, 'class="article-gallery__slide"')).toBe(count)
    expect(html).not.toContain('article-gallery-grid')
  })

  it('omits navigation for a single image', () => {
    const html = renderToStaticMarkup(<ArticleImageCarousel images={images(1)} />)
    expect(html).not.toContain('article-gallery__arrow')
    expect(html).not.toContain('article-gallery__counter')
  })

  it.each([2, 8])('renders compact dots and a counter for %i images', (count) => {
    const html = renderToStaticMarkup(<ArticleImageCarousel images={images(count)} />)
    expect(occurrences(html, 'aria-label="Przejdź do zdjęcia')).toBe(count)
    expect(html).toContain(`1 / ${count}`)
  })

  it('uses a progress bar instead of twenty dots for a large gallery', () => {
    const html = renderToStaticMarkup(<ArticleImageCarousel images={images(20)} />)
    expect(html).toContain('article-gallery__progress')
    expect(html).not.toContain('aria-label="Przejdź do zdjęcia')
    expect(html).toContain('1 / 20')
  })
})
