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
  it.each([
    { pointsDiff: 66, expected: '+66' },
    { pointsDiff: -12, expected: '-12' },
    { pointsDiff: 0, expected: '0' },
    { pointsFor: 86, pointsAgainst: 20, expected: '+66' },
    { pointsFor: 86, expected: '—' }
  ])('shows the point balance in the position tile: $expected', ({ expected, ...balance }) => {
    const standing = { ...testStandings[6], pointsDiff: undefined, pointsFor: undefined, pointsAgainst: undefined, ...balance }
    const html = renderToStaticMarkup(
      <MegaHomeTemplate news={[]} recentGames={[]} nearestEvent={null}
        table={[standing]} roster={[]} sponsors={[]} />
    )
    expect(html).toContain(`aria-label="Bilans punktów: ${expected}">+/− ${expected}</span>`)
  })

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
    expect(html).toContain('col-stat col-matches">M</th>')
    expect(html).toContain('col-stat col-wins">W</th>')
    expect(html).toContain('col-stat col-losses">P</th>')
    expect(html).toContain('col-stat col-for">+</th>')
    expect(html).toContain('col-stat col-against">-</th>')
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

    expect(html).toContain('Max BAU')
    expect(html).toContain('Tartak Sekwoja')
  })
})
