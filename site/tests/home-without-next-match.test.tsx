import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HomeTemplate } from '../components/public/templates/HomeTemplate'
import type { GameSummary, TeamStanding } from '../lib/data'

vi.mock('../components/public/shared/LiveMatchCard', () => ({
  LiveMatchCard: ({ game, kicker, awaitingResult }: { game: GameSummary; kicker?: string; awaitingResult?: boolean }) => (
    <div data-hero={game.id} data-kicker={kicker} data-awaiting={String(Boolean(awaitingResult))} />
  )
}))

const table: TeamStanding[] = [
  { name: 'BeKaPaKa Bobolice', position: 4, matches: 1, wins: 1, losses: 0, pointsDiff: 66, points: 2 } as TeamStanding
]
const kosz = { id: '4124', date: '2026-10-04T10:00:00.000Z', opponent: 'Kosz-All-In', result: 'W', scoreUs: 86, scoreThem: 20, status: 'FINAL' } as GameSummary
const gmvt = { id: '4144', date: '2026-10-18T12:40:00.000Z', opponent: 'GMVT TEAM', scoreUs: null, scoreThem: null } as GameSummary

function render(games: GameSummary[]) {
  const recentGames = games.filter((game) => game.scoreUs != null)
  return renderToStaticMarkup(
    <HomeTemplate news={[]} recentGames={recentGames} allGames={games} nearestEvent={null} table={table} roster={[]} sponsors={[]} />
  )
}

describe('Home without a next match', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-18T14:45:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('keeps the played game in the hero as finished while KALK has no result, and the previous result below', () => {
    const html = render([kosz, gmvt])
    expect(html).toContain('data-hero="4144"')
    expect(html).toContain('data-awaiting="true"')
    expect(html).toContain('data-kicker="Ostatni mecz"')
    expect(html).toContain('Ostatni wynik')
    expect(html).not.toContain('Wyniki pojawią się po pierwszym meczu sezonu')
  })

  it('does not claim the season has not started when the only result is already in the hero', () => {
    const html = render([kosz])
    expect(html).toContain('data-hero="4124"')
    expect(html).not.toContain('Ostatni wynik')
    expect(html).not.toContain('Wyniki pojawią się po pierwszym meczu sezonu')
    expect(html).toContain('4. miejsce')
    // Pozycja w tabeli pokazana raz — w lewej kolumnie zamiast pustego miejsca.
    expect(html.match(/4\. miejsce/g)).toHaveLength(1)
  })

  it('still announces the first match before any game is played', () => {
    vi.setSystemTime(new Date('2026-10-01T10:00:00Z'))
    const html = render([{ ...kosz, status: 'SCHEDULED', result: null, scoreUs: null, scoreThem: null } as GameSummary])
    expect(html).toContain('Wyniki pojawią się po pierwszym meczu sezonu')
  })
})
