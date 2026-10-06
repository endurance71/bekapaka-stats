import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PlayerProfile } from '../components/public/shared/PlayerProfile'
import type { RosterPlayer } from '../lib/data'

const player: RosterPlayer = {
  id: 'test', firstName: 'Jan', lastName: 'Zawodnik', number: '12', position: 'SG'
}

describe('Player profile statistics', () => {
  it('keeps missing shooting data distinct from a recorded zero', () => {
    const html = renderToStaticMarkup(
      <PlayerProfile player={{ ...player, gamesPlayed: 1, fgPercentage: 0, fgm: 0, fga: 3 }} standalone />
    )
    expect(html).toContain('0.0%')
    expect(html).not.toContain('—%')
    expect(html).not.toContain('NaN')
  })

  it('hides stale shooting values and bars before the first appearance', () => {
    const html = renderToStaticMarkup(
      <PlayerProfile player={{ ...player, gamesPlayed: 0, fgPercentage: 75, threePercentage: 50, ftPercentage: 100 }} />
    )
    expect(html).not.toContain('75.0%')
    expect(html).not.toContain('50.0%')
    expect(html).not.toContain('100.0%')
    expect(html.match(/style="width:0%"/g)).toHaveLength(3)
  })

  it('names the history table and keeps the opponent and readable date together', () => {
    const html = renderToStaticMarkup(
      <PlayerProfile player={{ ...player, gamesPlayed: 1, games: [{ date: '2026-10-04T10:00:00Z', opponent: 'Rywal', pts: 0, reb: 0, ast: 0 }] }} />
    )
    expect(html).toContain('Historia występów zawodnika Jan Zawodnik')
    expect(html).toContain('<th scope="row"><strong>Rywal</strong>')
    expect(html).toContain('4 paź 2026')
  })
})
