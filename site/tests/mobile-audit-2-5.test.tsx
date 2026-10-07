import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MatchHero } from '../components/public/match/MatchHero'
import { EditorialDetailTemplate } from '../components/public/templates/EditorialDetailTemplate'
import { storyImageFit } from '../lib/news-presentation'

const card = (width: number, height: number, extra = {}) => ({ slug: 'post', coverImageWidth: width, coverImageHeight: height, ...extra })

describe('Audyt mobilny 2.5', () => {
  it('crops photos close to the card ratio and shows posters of other ratios in full', () => {
    expect(storyImageFit(card(1200, 800))).toBe('cover') // 3:2
    expect(storyImageFit(card(1600, 1200))).toBe('cover') // 4:3
    expect(storyImageFit(card(1920, 1080))).toBe('contain') // 16:9 poster
    expect(storyImageFit(card(1080, 1080))).toBe('contain') // square
    expect(storyImageFit(card(1080, 1350))).toBe('contain') // portrait poster
    expect(storyImageFit({ slug: 'post' })).toBe('cover') // unknown size
    expect(storyImageFit(card(1920, 1080, { imageFit: 'cover' }))).toBe('cover') // CMS decides
  })

  it('pairs team names with the score in the match hero once there is a result', () => {
    const final = { id: '7', date: '2026-10-04T12:00:00Z', opponent: 'Kosz-All-In', status: 'FINAL' as const, scoreUs: 86, scoreThem: 20 }
    const html = renderToStaticMarkup(<MatchHero game={final} />)
    expect(html).toContain('class="match-hero__scoreline"')
    expect(html).toContain('aria-label="BeKaPaKa 86, Kosz-All-In 20"')
    const upcoming = renderToStaticMarkup(<MatchHero game={{ ...final, status: 'SCHEDULED', scoreUs: null, scoreThem: null }} />)
    expect(upcoming).not.toContain('match-hero__scoreline')
  })

  it('marks the article body when a "read next" band follows, so the duplicate side list can hide on phones', () => {
    const withMore = renderToStaticMarkup(
      <EditorialDetailTemplate sectionLabel="Aktualności" title="T" parentHref="/aktualnosci" sidebar={<p>lista</p>} more={<section />} content={<p>Treść</p>} />
    )
    expect(withMore).toContain('art-body--more')
    const plain = renderToStaticMarkup(<EditorialDetailTemplate sectionLabel="Dokumenty" title="T" parentHref="/dokumenty" content={<p>Treść</p>} />)
    expect(plain).not.toContain('art-body--more')
  })
})
