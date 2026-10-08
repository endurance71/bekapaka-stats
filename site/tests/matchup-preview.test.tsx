import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CompareBars } from '../components/public/match/CompareBars'
import { MatchupPreview, gamesLabel } from '../components/public/match/MatchupPreview'
import { MatchDrawerContent } from '../app/mecze/MatchDrawerContent'
import type { Matchup } from '../lib/data/schemas'

const side = (name: string, extra: Partial<Matchup['teams']['us']> = {}): Matchup['teams']['us'] => ({
  name,
  logoUrl: null,
  position: 1,
  matches: 1,
  wins: 1,
  losses: 0,
  form: ['W'],
  streak: 'W1',
  boxScoreGames: 1,
  perGame: { pts: 86, opp: 20, reb: 42, orb: 13, drb: 29, ast: 26, stl: 16, blk: 1, tov: 15 },
  pct: { fg: 57.6, two: 67.3, three: 9.1, ft: 45 },
  ranks: { pts: 1, opp: 1, tov: 3, threePct: 10 },
  leagueTeams: 10,
  ...extra
})

const matchup: Matchup = {
  season: { id: 's26', label: 'Sezon 2026/2027' },
  teams: {
    us: side('BeKaPaKa Bobolice'),
    them: side('GMVT TEAM', {
      position: 5,
      wins: 0,
      losses: 1,
      form: ['L'],
      perGame: { pts: 55, opp: 78, reb: 37, orb: 10, drb: 27, ast: 17, stl: 11, blk: 3, tov: 23 },
      pct: { fg: 34.9, two: 38.1, three: 28.6, ft: 50 },
      ranks: { pts: 7, opp: 9, tov: 9, threePct: 2 }
    })
  },
  leaders: [
    { category: 'pts', us: { name: 'Filip Karpiński', number: 69, value: 28, games: 1 }, them: { name: 'Adrian Lisiecki', number: 7, value: 12, games: 1 } },
    { category: 'blk', us: { name: 'Piotr Sosiński', number: 10, value: 1, games: 1 }, them: { name: 'Adrian Lisiecki', number: 7, value: 3, games: 1 } }
  ],
  scorers: { us: [], them: [] },
  headToHead: [{ gameId: '4847', date: '2026-05-24T08:00:00.000Z', seasonId: 's25', seasonLabel: 'Sezon 2025/2026', scoreUs: 61, scoreThem: 53 }]
}

describe('Zapowiedź meczu', () => {
  it('shows the team pair, three stat groups with league rank, leader duels and head-to-head', () => {
    const html = renderToStaticMarkup(<MatchupPreview matchup={matchup} />)
    expect(html).toContain('Sezon 2026/2027: kto ma przewagę?')
    for (const group of ['Atak', 'Zbiórki', 'Obrona', 'Liderzy · na mecz', 'Mecze bezpośrednie']) expect(html).toContain(group)
    for (const label of ['W ataku', 'W obronie', 'Za 2 punkty', 'Punkty stracone']) expect(html).toContain(label)
    expect(html).toContain('57,6%')
    expect(html).toContain('1. w lidze')
    expect(html).toContain('Filip Karpiński')
    expect(html).toContain('href="/mecze/kalk-4847"')
    expect(html).toContain('2025/2026')
  })

  it('marks the better side — lower wins for points allowed and turnovers', () => {
    const html = renderToStaticMarkup(<MatchupPreview matchup={matchup} />)
    const row = (label: string) => html.slice(html.lastIndexOf('<div class="duel"', html.indexOf(`>${label}<`)), html.indexOf(`>${label}<`))
    expect(row('Punkty stracone')).toContain('data-winner="us"')
    expect(row('Straty')).toContain('data-winner="us"')
    expect(row('Za 3 punkty')).toContain('data-winner="them"')
    expect(row('Bloki')).toContain('data-winner="them"')
  })

  it('explains a team without games instead of showing empty comparisons', () => {
    const html = renderToStaticMarkup(
      <MatchupPreview matchup={{ ...matchup, leaders: [], teams: { ...matchup.teams, them: side('Fasolki', { boxScoreGames: 0, perGame: null, pct: null, ranks: null }) } }} />
    )
    expect(html).not.toContain('class="matchup__group"')
    expect(html).toContain('Fasolki nie ma jeszcze w tym sezonie meczu ze statystykami.')
  })

  it('declines “mecz” in Polish', () => {
    expect([1, 2, 4, 5, 12, 22, 25].map(gamesLabel)).toEqual(['1 mecz', '2 mecze', '4 mecze', '5 meczów', '12 meczów', '22 mecze', '25 meczów'])
  })

  it('CompareBars marks the lower value as better for turnovers', () => {
    const html = renderToStaticMarkup(
      <CompareBars themLabel="Rywal" rows={[{ label: 'Straty', us: '15', them: '23', usValue: 15, themValue: 23, lowerIsBetter: true }, { label: 'Zbiórki', us: '30', them: '40', usValue: 30, themValue: 40 }]} />
    )
    expect(html).toMatch(/compare__home is-better">15</)
    expect(html).toMatch(/compare__away is-better">40</)
  })

  it('keeps BeKaPaKa values on the left in the finished-match comparison, also in away games', () => {
    const team = (name: string, isBekapaka: boolean, reb: number) => ({ name, isBekapaka, pts: 0, reb, ast: 1, players: [{ name: 'Gracz', pts: 0 }] })
    const html = renderToStaticMarkup(
      <MatchDrawerContent
        hideScoreHeader
        game={{ id: '1', date: '2026-10-04T12:00:00Z', opponent: 'Rywal', status: 'FINAL', scoreUs: 80, scoreThem: 70, homeAway: 'away', teams: [team('Rywal', false, 19), team('BeKaPaKa Bobolice', true, 42)] }}
      />
    )
    expect(html).toMatch(/compare__home is-better">42<\/span><span class="compare__name">Zbiórki łącznie \(REB\)/)
  })
})
