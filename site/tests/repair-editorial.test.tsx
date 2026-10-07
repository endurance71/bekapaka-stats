import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { newsImageFit, isArchivedEvent } from '../lib/news-presentation'
import { ArticleMarkdown } from '../components/public/shared/ArticleMarkdown'
import { ArticleImageCarousel } from '../components/public/shared/ArticleImageCarousel'

describe('Editorial corrections', () => {
  it('uses explicit fit and does not classify a tournament report as a poster', () => {
    expect(newsImageFit({ slug: '3-turniej-koszykowki-o-puchar-burmistrza-bobolic-26-wrzesnia-2026' })).toBe('cover')
    expect(newsImageFit({ slug: 'iii-turniej-koszykowki-o-puchar-burmistrza-bobolic-26-wrzesnia-2026' })).toBe('contain')
    expect(newsImageFit({ slug: 'iii-turniej-koszykowki-o-puchar-burmistrza-bobolic-26-wrzesnia-2026', imageFit: 'cover' })).toBe('cover')
  })
  it('archives using a verified event date, never publication age', () => {
    expect(isArchivedEvent({ slug: 'szukamy-druzyny-otwarty-trening-2026' }, Date.parse('2026-10-06'))).toBe(true)
    expect(isArchivedEvent({ slug: 'old-report' }, Date.parse('2026-10-06'))).toBe(false)
    expect(isArchivedEvent({ slug: 'event', eventDate: '2026-11-01' }, Date.parse('2026-10-06'))).toBe(false)
    expect(isArchivedEvent({ slug: 'event', eventDate: 'invalid' })).toBe(false)
  })
  it('creates unique working anchors for repeated headings, excluding code fences', () => {
    const html = renderToStaticMarkup(<ArticleMarkdown content={'## Wyniki\n\nOpis\n\n## Wyniki\n\nOpis\n\n```\n## Nie jest nagłówkiem\n```\n\n## Galeria\n\nOpis'} />)
    const links = [...html.matchAll(/href="#([^"]+)"/g)].map(match => match[1])
    expect(links).toHaveLength(3)
    expect(new Set(links).size).toBe(3)
    for (const id of links) expect(html).toContain(`id="${id}"`)
    expect(html).not.toContain('>Nie jest nagłówkiem</a>')
  })
  it('uses actual media metadata and retains the publication gate', () => {
    const content = '![Zdjęcie 1](https://cms.example/a.jpg)\n\n![Zdjęcie 2](https://cms.example/b.jpg)'
    const html = renderToStaticMarkup(<ArticleMarkdown content={content} mediaRecords={[{ url: 'https://cms.example/a.jpg', alt: 'Drużyna podczas meczu', author: 'Autor testowy', caption: 'Podpis testowy', consentStatus: 'granted' }, { url: 'https://cms.example/b.jpg', alt: 'Niepublikowane', author: 'Autor', consentStatus: 'revoked' }]} />)
    expect(html).toContain('Autor testowy')
    expect(html).toContain('Drużyna podczas meczu')
    expect(html).not.toContain('Niepublikowane')
  })
  it('marks local-only gallery metadata gaps and gives cover a zoom control', () => {
    const html = renderToStaticMarkup(<ArticleImageCarousel variant="cover" images={[{ src: '/poster.png', alt: 'Plakat turnieju', metadataMissing: true }]} />)
    expect(html).toContain('Powiększ okładkę: Plakat turnieju')
    expect(html).toContain('article-gallery__zoom')
    expect(html).not.toContain('>Powiększ okładkę<')
    expect(html).toContain('opis i autor wymagają uzupełnienia')
  })
})
