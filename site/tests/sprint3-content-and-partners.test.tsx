import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RosterList } from '../app/sklad/RosterList'
import { PartnersGrid } from '../components/public/sponsors/PartnersGrid'
import type { RosterPlayer, SponsorItem } from '../lib/data/schemas'

describe('Sprint 3: Content, Roster Context and Partners', () => {
  it('renders verified jersey numbers in the roster list', () => {
    const players: RosterPlayer[] = [
      { id: '1', firstName: 'Dawid', lastName: 'Olearczyk', position: 'Obrońca', number: '1' },
      { id: '2', firstName: 'Łukasz', lastName: 'Mras', position: 'Obrońca', number: '13' },
      { id: '3', firstName: 'Maciej', lastName: 'Tymiński', position: 'Skrzydłowy', number: '29' },
      { id: '4', firstName: 'Piotr', lastName: 'Sosiński', position: 'Środkowy', number: '8' }
    ]
    const html = renderToStaticMarkup(<RosterList roster={players} />)

    expect(html).toContain('Olearczyk')
    expect(html).toContain('Dawid · #1')
    expect(html).toContain('Mras')
    expect(html).toContain('Łukasz · #13')
    expect(html).toContain('Tymiński')
    expect(html).toContain('Maciej · #29')
    expect(html).toContain('Sosiński')
    expect(html).toContain('Piotr · #8')
  })

  it('renders balanced sponsors grid with equal plaques for partners', () => {
    const sponsors: SponsorItem[] = [
      { id: 's1', name: 'Sponsor A', slug: 'sponsor-a', websiteUrl: '', order: 1 },
      { id: 's2', name: 'Sponsor B', slug: 'sponsor-b', websiteUrl: 'https://example.com', order: 2 }
    ]
    const html = renderToStaticMarkup(<PartnersGrid sponsors={sponsors} />)

    expect(html).toContain('Sponsor A')
    expect(html).toContain('Sponsor B')
    expect(html).toContain('href="https://example.com"')
  })
})
