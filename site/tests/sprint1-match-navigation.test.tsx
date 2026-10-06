import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { GameSummary } from '../lib/data'
import { MatchesList } from '../app/mecze/MatchesList'
import { MatchDrawerContent } from '../app/mecze/MatchDrawerContent'

const mockFinishedGame: GameSummary = {
  id: '4124',
  date: '2026-09-26T18:00:00.000Z',
  opponent: 'Kosz-All-In Koszalin',
  status: 'FINAL',
  scoreUs: 86,
  scoreThem: 20,
  venue: 'KOSiR Koszalin',
  teams: [
    {
      name: 'BeKaPaKa Bobolice',
      isBekapaka: true,
      players: [
        { name: 'Jan Kowalski', number: '24', min: '25', pts: 18, ast: 4, plusMinus: 12 }
      ]
    },
    { name: 'Kosz-All-In Koszalin' }
  ]
}

const mockScheduledGame: GameSummary = {
  id: '4125',
  date: '2026-10-15T19:00:00.000Z',
  opponent: 'UKS Basket',
  status: 'SCHEDULED',
  venue: 'KOSiR Koszalin',
  teams: [
    { name: 'BeKaPaKa Bobolice', isBekapaka: true, players: [] },
    { name: 'UKS Basket' }
  ]
}

describe('Sprint 1 - Match Navigation & Presentation (UI-01, UI-02, UI-03, UI-04)', () => {
  it('MatchesList renders direct link to match page without drawer', () => {
    const html = renderToStaticMarkup(<MatchesList games={[mockFinishedGame]} />)
    expect(html).toContain('href="/mecze/kalk-4124"')
    expect(html).toContain('Szczegóły meczu')
    // No SlideoutPanel rendered
    expect(html).not.toContain('class="slideout-panel"')
  })

  it('MatchDrawerContent hides duplicate scoreboard when hideScoreHeader is true (UI-03)', () => {
    const withHeader = renderToStaticMarkup(<MatchDrawerContent game={mockFinishedGame} />)
    expect(withHeader).toContain('class="drawer-match-scoreboard"')

    const withoutHeader = renderToStaticMarkup(
      <MatchDrawerContent game={mockFinishedGame} hideScoreHeader />
    )
    expect(withoutHeader).not.toContain('class="drawer-match-scoreboard"')
  })

  it('MatchDrawerContent eliminates admin sync instructions from public view (UI-02)', () => {
    const html = renderToStaticMarkup(<MatchDrawerContent game={mockScheduledGame} />)
    expect(html).not.toContain('sync KALK')
    expect(html).not.toContain('panelu administracyjnym')
    expect(html).toContain('Szczegóły i statystyki meczowe będą dostępne po rozegraniu spotkania.')
  })

  it('MatchDrawerContent provides appropriate notice for final match without player stats', () => {
    const finalEmptyGame: GameSummary = {
      ...mockFinishedGame,
      teams: [{ name: 'BeKaPaKa Bobolice', isBekapaka: true, players: [] }]
    }
    const html = renderToStaticMarkup(<MatchDrawerContent game={finalEmptyGame} />)
    expect(html).not.toContain('sync KALK')
    expect(html).toContain('Szczegółowe statystyki zawodników nie zostały jeszcze opublikowane przez ligę.')
  })

  it('Box Score renders sticky player column and proper table shell for mobile (UI-04)', () => {
    const html = renderToStaticMarkup(<MatchDrawerContent game={mockFinishedGame} />)
    expect(html).toContain('class="table-shell-v2 boxscore-scroll-shell"')
    expect(html).toContain('class="data-table-v2 boxscore-table text-sm"')
    expect(html).toContain('class="boxscore-col-player"')
    expect(html).toContain('Jan Kowalski')
    expect(html).toContain('#24')
  })
})
