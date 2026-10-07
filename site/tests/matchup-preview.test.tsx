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
  perGame: { pts: 86, opp: 20, reb: 42, ast: 26, stl: 16, blk: 1, tov: 15 },
  pct: { fg: 57.6, three: 9.1, ft: 45 },
  ...extra
})

const matchup: Matchup = {
  season: { id: 's26', label: 'Sezon 2026/2027' },
  teams: {
    us: side('BeKaPaKa Bobolice'),
    them: side('GMVT TEAM', { position: 5, wins: 0, losses: 1, form: ['L'], perGame: { pts: 55, opp: 78, reb: 37, ast: 17, stl: 11, blk: 3, tov: 23 }, pct: { fg: 34.9, three: 28.6, ft: 50 } })
  },
  scorers: { us: [{ name: 'Filip Karpiński', pointsAverage: 28, matchesPlayed: 1 }], them: [] },
  headToHead: [{ gameId: '4847', date: '2026-05-24T08:00:00.000Z', seasonId: 's25', seasonLabel: 'Sezon 2025/2026', scoreUs: 61, scoreThem: 53 }]
}

describe('Zapowiedź meczu', () => {
  it('compares both teams per game with Polish number format and the season label', () => {
    const html = renderToStaticMarkup(<MatchupPreview matchup={matchup} />)
    expect(html).toContain('Jak wypadamy w sezonie 2026/2027')
    expect(html).toContain('57,6%')
    expect(html).toContain('5. miejsce')
    expect(html).toContain('href="/mecze/kalk-4847"')
    expect(html).toContain('Filip Karpiński')
    expect(html).toContain('Brak danych w tym sezonie.')
    expect(html).toContain('1 mecz')
  })

  it('marks the lower value as better for points allowed and turnovers', () => {
    const html = renderToStaticMarkup(
      <CompareBars themLabel="Rywal" rows={[{ label: 'Straty', us: '15', them: '23', usValue: 15, themValue: 23, lowerIsBetter: true }, { label: 'Zbiórki', us: '30', them: '40', usValue: 30, themValue: 40 }]} />
    )
    expect(html).toMatch(/compare__home is-better">15</)
    expect(html).toMatch(/compare__away is-better">40</)
  })

  it('explains a team without games instead of showing empty bars', () => {
    const html = renderToStaticMarkup(
      <MatchupPreview matchup={{ ...matchup, teams: { ...matchup.teams, them: side('Fasolki', { boxScoreGames: 0, perGame: null, pct: null }) } }} />
    )
    expect(html).not.toContain('Średnio na mecz')
    expect(html).toContain('Fasolki nie ma jeszcze w tym sezonie meczu ze statystykami.')
  })

  it('declines “mecz” in Polish', () => {
    expect([1, 2, 4, 5, 12, 22, 25].map(gamesLabel)).toEqual(['1 mecz', '2 mecze', '4 mecze', '5 meczów', '12 meczów', '22 mecze', '25 meczów'])
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
