import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { MegaHomeTemplate } from '../components/public/templates/MegaHomeTemplate'
import type { TeamStanding } from '../lib/data'

vi.mock('../components/public/support/FsmmSupportSection', () => ({
  FsmmSupportSection: () => null
}))

const testStandings: TeamStanding[] = [
  {
    name: 'BrdCrew',
    position: 1,
    matches: 1,
    wins: 1,
    losses: 0,
    pointsFor: 64,
    pointsAgainst: 46,
    pointsDiff: 18,
    points: 2,
    form: ['W'],
    streak: 'W1',
    logoUrl: 'https://www.kalk-koszalin.com/storage/legacy/teams/1.jpg'
  },
  {
    name: 'Atomówki',
    position: 2,
    matches: 1,
    wins: 1,
    losses: 0,
    pointsFor: 70,
    pointsAgainst: 65,
    pointsDiff: 5,
    points: 2,
    form: ['W'],
    streak: 'W1',
    logoUrl: null
  },
  {
    name: 'Fasolki',
    position: 3,
    matches: 1,
    wins: 0,
    losses: 1,
    pointsFor: 65,
    pointsAgainst: 70,
    pointsDiff: -5,
    points: 1,
    form: ['L'],
    streak: 'L1',
    logoUrl: null
  },
  {
    name: 'Pantery',
    position: 4,
    matches: 1,
    wins: 0,
    losses: 1,
    pointsFor: 46,
    pointsAgainst: 64,
    pointsDiff: -18,
    points: 1,
    form: ['L'],
    streak: 'L1',
    logoUrl: null
  },
  {
    name: 'Max BAU',
    position: 5,
    matches: 0,
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    pointsDiff: 0,
    points: 0,
    form: [],
    streak: null,
    logoUrl: null
  },
  {
    name: 'Tartak Sekwoja',
    position: 6,
    matches: 0,
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    pointsDiff: 0,
    points: 0,
    form: [],
    streak: null,
    logoUrl: null
  },
  {
    name: 'BeKaPaKa Bobolice',
    position: 10,
    matches: 0,
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    pointsDiff: 0,
    points: 0,
    form: [],
    streak: null,
    logoUrl: null
  }
]

describe('MegaHomeTemplate Standings Table', () => {
  it('renders all 11 columns in the homepage preview table', () => {
    const html = renderToStaticMarkup(
      <MegaHomeTemplate
        news={[]}
        recentGames={[]}
        nearestEvent={null}
        table={testStandings}
        roster={[]}
        sponsors={[]}
      />
    )

    expect(html).toContain('col-pos">#</th>')
    expect(html).toContain('col-team">Drużyna</th>')
    expect(html).toContain('col-stat">M</th>')
    expect(html).toContain('col-stat">W</th>')
    expect(html).toContain('col-stat">P</th>')
    expect(html).toContain('col-stat">+</th>')
    expect(html).toContain('col-stat">-</th>')
    expect(html).toContain('col-stat col-diff">+/-</th>')
    expect(html).toContain('col-stat col-pts">PKT</th>')
    expect(html).toContain('col-stat col-form">Forma</th>')
    expect(html).toContain('col-stat col-streak">Seria</th>')

    // Team logo and identity
    expect(html).toContain('standings-team-identity')
    expect(html).toContain('src="https://www.kalk-koszalin.com/storage/legacy/teams/1.jpg"')

    // BeKaPaKa highlight row
    expect(html).toContain('standings-row-v2 is-bkp')
    expect(html).toContain('BeKaPaKa Bobolice')

    // Separator between top 4 and BeKaPaKa #10
    expect(html).toContain('tr-separator')
    expect(html).toContain('colSpan="11"')
  })
})
