import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { addStats, completeSum, shotLabel, percentageLabel, totalMinutes } from '../lib/basketball-stats'
import { MatchDrawerContent } from '../app/mecze/MatchDrawerContent'
import { PlayerProfile } from '../components/public/shared/PlayerProfile'
import type { GameSummary } from '../lib/data'

const game: GameSummary = { id: 'test', date: '2026-10-06T12:00:00Z', opponent: 'Rywal', teams: [{ name: 'BeKaPaKa' }, { name: 'Rywal' }] }
describe('Recorded statistics and missing values', () => {
  it('sums only complete samples, preserving zero', () => {
    expect(completeSum([])).toBeUndefined()
    expect(completeSum([0, 0])).toBe(0)
    expect(completeSum([3, undefined])).toBeUndefined()
    expect(completeSum([NaN, 1])).toBeUndefined()
    expect(addStats(0, 2)).toBe(2)
    expect(addStats(2, undefined)).toBeUndefined()
  })
  it('does not invent a shot numerator or denominator', () => {
    expect(shotLabel(undefined, 4)).toBe('—')
    expect(shotLabel(0, 4)).toBe('0/4')
    expect(percentageLabel(0, 0)).toBe('—')
    expect(percentageLabel(undefined, 4)).toBe('—')
    expect(percentageLabel(0, 4)).toBe('0%')
  })
  it('uses actual minutes, including overtime, and rejects incomplete data', () => {
    expect(totalMinutes(['45:00', '45', '45', '45', '45'])).toBe('225:00')
    expect(totalMinutes(['1:59', '0:01'])).toBe('2:00')
    expect(totalMinutes(['12:00', undefined])).toBe('—')
    expect(totalMinutes(['DNP', '10'])).toBe('—')
    expect(totalMinutes(['2:90'])).toBe('—')
  })
  it.each(['SCHEDULED', 'LIVE', 'BREAK', 'FINAL', 'POSTPONED', 'CANCELLED'] as const)('renders an honest empty state for %s', status => {
    const html = renderToStaticMarkup(<MatchDrawerContent game={{ ...game, status }} hideScoreHeader />)
    expect(html).not.toContain('Porównanie zespołowe')
    expect(html).not.toContain('200:00')
    expect(html).not.toContain('NaN')
    expect(html).toContain('drawer-match-loading')
  })
  it('does not publish stale statistics for a scheduled game', () => {
    const html = renderToStaticMarkup(<MatchDrawerContent game={{ ...game, status: 'SCHEDULED', teams: [{ name: 'BeKaPaKa', reb: 20, players: [{ name: 'Jan', pts: 12 }] }, { name: 'Rywal', reb: 0 }] }} />)
    expect(html).not.toContain('Porównanie zespołowe')
    expect(html).not.toContain('boxscore-table')
  })
  it('retains recorded zero in a finished game and labels the player row', () => {
    const html = renderToStaticMarkup(<MatchDrawerContent game={{ ...game, status: 'FINAL', teams: [{ name: 'BeKaPaKa', reb: 0, players: [{ name: 'Jan', pts: 0, ast: 0, min: '00:00' }] }, { name: 'Rywal', reb: 0 }] }} />)
    expect(html).toContain('Porównanie zespołowe')
    expect(html).toContain('<th scope="row" class="boxscore-col-player">')
    expect(html).toContain('data-view="basic"')
    expect(html).toContain('Pełne statystyki')
  })
  it('does not show 0% as shooting accuracy when no attempts exist', () => {
    const html = renderToStaticMarkup(<PlayerProfile player={{ id: 'jan', firstName: 'Jan', lastName: 'Test', number: '1', position: 'PG', gamesPlayed: 1, seasonLabel: 'Sezon testowy', fgm: 0, fga: 0, fgPercentage: 0 }} />)
    expect(html).not.toContain('0.0%')
    expect(html).toContain('0/0 celne/próby')
    expect(html).toContain('Sezon testowy')
  })
})
