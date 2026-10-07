import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MatchHero } from '../components/public/match/MatchHero'
import { NearestEventCalendarActions } from '../components/public/home/NearestEventCalendarActions'
import type { NearestHighlight } from '../lib/data'

const mockKalkHighlight: Extract<NearestHighlight, { source: 'kalk' }> = {
  source: 'kalk',
  at: '2026-10-04T10:00:00.000Z',
  game: {
    id: 'game-123',
    date: '2026-10-04T10:00:00.000Z',
    opponent: 'Kosz-All-In',
    scoreUs: null,
    scoreThem: null,
    venue: 'KOSiR Koszalin'
  }
}

describe('MatchHero for the nearest game', () => {
  it('renders status kicker, venue facts, countdown and calendar action', () => {
    const html = renderToStaticMarkup(
      <MatchHero game={mockKalkHighlight.game} actions={<NearestEventCalendarActions primary highlight={mockKalkHighlight} />} />
    )

    expect(html).toContain('match-hero')
    expect(html).toContain('Najbliższy mecz')
    expect(html).toContain('match-countdown')
    expect(html).toContain('KOSiR Koszalin')
    expect(html).toContain('Wstęp')
    expect(html).toContain('/api/calendar?')
    expect(html).toContain('Dodaj do kalendarza')
  })

  it('keeps BeKaPaKa first and puts the rival in the same heading', () => {
    const html = renderToStaticMarkup(<MatchHero game={mockKalkHighlight.game} heading="h1" />)
    expect(html).toMatch(/<h1 class="match-hero__teams">.*BeKaPaKa.*Kosz-All-In.*<\/h1>/s)
  })
})
