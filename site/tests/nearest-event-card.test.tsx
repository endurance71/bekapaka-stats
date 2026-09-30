import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { NearestEventCard } from '../components/public/home/NearestEventCard'
import type { NearestHighlight } from '../lib/data'

const mockKalkHighlight: NearestHighlight = {
  source: 'kalk',
  at: '2026-10-04T10:00:00.000Z',
  game: {
    id: 'game-123',
    date: '2026-10-04T10:00:00.000Z',
    opponent: 'Kosz-All-In',
    scoreUs: null,
    scoreThem: null,
    data: {
      venue: 'KOSiR Koszalin'
    }
  }
}

describe('NearestEventCard mobile layout', () => {
  it('renders header with kicker and mobile countdown in flow', () => {
    const html = renderToStaticMarkup(<NearestEventCard highlight={mockKalkHighlight} />)

    expect(html).toContain('next-event-hero__header')
    expect(html).toContain('next-event-hero__kicker')
    expect(html).toContain('Najbliższe wydarzenie')
    expect(html).toContain('next-event-hero__countdown--mobile')
    expect(html).toContain('Do startu')
    expect(html).toContain('sr-only')
    expect(html).toContain('BEKAPAKA')
    expect(html).toContain('KOSZ-ALL-IN')
  })
})
