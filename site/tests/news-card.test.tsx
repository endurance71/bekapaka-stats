import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Story } from '../components/public/news/Story'
import type { NewsPost } from '../lib/data'

const basePost: NewsPost = {
  id: 'news-1',
  title: 'Zapowiedź turnieju',
  slug: 'zapowiedz-turnieju',
  excerpt: 'Najważniejsze informacje dla kibiców.',
  content: 'Treść artykułu.',
  publishedAt: '2026-09-29T12:00:00Z',
  coverImageUrl: 'https://cms.bekapaka.pl/uploads/Zapowiedz.jpg',
  coverImageSources: [
    { src: 'https://cms.bekapaka.pl/uploads/small_Zapowiedz.jpg', width: 500, height: 333 },
    { src: 'https://cms.bekapaka.pl/uploads/Zapowiedz.jpg', width: 1200, height: 800 }
  ],
  coverImageWidth: 1200,
  coverImageHeight: 800,
  attachments: []
}

describe('Story media states', () => {
  it('marks the featured image as high priority and keeps responsive variants', () => {
    const html = renderToStaticMarkup(<Story item={basePost} variant="lead" priority />)

    expect(html).toContain('fetchPriority="high"')
    expect(html).toContain('loading="eager"')
    expect(html).not.toContain('medium_Zapowiedz.jpg')
    expect(html).toContain('class="story story--lead story--image-cover"')
  })

  it('renders a stable placeholder when a post has no cover image', () => {
    const html = renderToStaticMarkup(<Story item={{ ...basePost, coverImageUrl: undefined }} />)

    expect(html).toContain('class="story__placeholder"')
    expect(html).toContain('>BeKaPaKa</span>')
  })

  it('supports an explicit photographic cover fit', () => {
    const html = renderToStaticMarkup(<Story item={{ ...basePost, imageFit: 'cover' }} />)

    expect(html).toContain('story--image-cover')
  })

  it('keeps one-letter words with the next word in titles and excerpts', () => {
    const html = renderToStaticMarkup(<Story item={{ ...basePost, title: 'Mecz o Puchar', excerpt: 'Wygrała z MAXBAU i awansowała.' }} />)

    expect(html).toContain('Mecz o\u00a0Puchar')
    expect(html).toContain('z\u00a0MAXBAU i\u00a0awansowała')
  })
})
