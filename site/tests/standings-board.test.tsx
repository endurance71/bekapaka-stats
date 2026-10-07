import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { StandingsBoard } from '../components/public/shared/StandingsBoard'
import type { TeamStanding } from '../lib/data'

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
    logoUrl: 'https://www.kalk-koszalin.com/demo/team-placeholder.svg'
  },
  {
    name: 'Fasolki',
    position: 2,
    matches: 1,
    wins: 0,
    losses: 1,
    pointsFor: 65,
    pointsAgainst: 70,
    pointsDiff: -5,
    points: 1,
    form: ['L'],
    streak: 'L1',
    logoUrl: 'https://www.kalk-koszalin.com/storage/legacy/teams/135.jpg'
  },
  {
    name: 'BeKaPaKa Bobolice',
    position: 3,
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

describe('StandingsBoard 11-column component', () => {
  it('renders all 11 required columns in table header', () => {
    const html = renderToStaticMarkup(<StandingsBoard table={testStandings} />)

    expect(html).toContain('col-pos">#</th>')
    expect(html).toContain('col-team">Drużyna</th>')
    expect(html).toContain('<abbr title="Mecze">M</abbr>')
    expect(html).toContain('<abbr title="Wygrane">W</abbr>')
    expect(html).toContain('<abbr title="Porażki">P</abbr>')
    expect(html).toContain('<abbr title="Punkty zdobyte">+</abbr>')
    expect(html).toContain('<abbr title="Punkty stracone">−</abbr>')
    expect(html).toContain('<abbr title="Bilans punktów">+/−</abbr>')
    expect(html).toContain('<abbr title="Punkty ligowe">Pkt</abbr>')
    expect(html).toContain('col-form col-mid">Forma</th>')
    expect(html).toContain('col-streak col-wide">Seria</th>')

    // No column toggle: key columns are always visible, extras are revealed by width (col-mid / col-wide)
    expect(html).not.toContain('Więcej kolumn')
    expect(html).toContain('col-for col-wide')
    expect(html).toContain('col-form col-mid')
  })

  it('renders stats, differential with + sign, and badges properly', () => {
    const html = renderToStaticMarkup(<StandingsBoard table={testStandings} />)

    // BrdCrew checks
    expect(html).toContain('BrdCrew')
    expect(html).toContain('+18')
    expect(html).toContain('is-positive')
    expect(html).toContain('standings-badge--win')
    expect(html).toContain('W1')

    // Fasolki checks
    expect(html).toContain('Fasolki')
    expect(html).toContain('-5')
    expect(html).toContain('is-negative')
    expect(html).toContain('standings-badge--loss')
    expect(html).toContain('L1')
    expect(html).toContain('https://www.kalk-koszalin.com/storage/legacy/teams/135.jpg')

    // Zero diff / empty form & streak checks
    expect(html).toContain('is-zero')
    expect(html).toContain('—')
  })

  it('highlights BeKaPaKa Bobolice with is-bkp class and club logo', () => {
    const html = renderToStaticMarkup(<StandingsBoard table={testStandings} />)

    expect(html).toContain('is-bkp')
    expect(html).toContain('standings-team-logo--bkp')
    expect(html).toContain('src="/brand/sygnet2-kolor-ciasny.svg"')
  })

  it('renders fallback shield icon for teams with placeholder logo', () => {
    const html = renderToStaticMarkup(<StandingsBoard table={testStandings} />)

    // BrdCrew has team-placeholder.svg, so it should render the shield initial 'B'
    expect(html).toContain('shield-svg')
    expect(html).toContain('shield-initial">B</span>')
  })

  it('keeps league points visible as an emphasised column without horizontal scrolling', () => {
    const html = renderToStaticMarkup(<StandingsBoard table={testStandings} />)

    expect(html).toContain('class="col-stat col-pts"')
    expect(html).not.toContain('standings__scroll')
  })
})
