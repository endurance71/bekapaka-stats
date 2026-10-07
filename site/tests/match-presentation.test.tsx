import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  MATCH_STATUSES,
  resolvePresentation,
  selectHeroGame,
  validatePresentation
} from '../../packages/match-presentation'
import { mapApiGameToSummary, mapApiGameToSummarySafe } from '../lib/data/map-game'
import { MatchHero } from '../components/public/match/MatchHero'
import { FixtureRow } from '../components/public/match/FixtureRow'
const game = {
  id: '42',
  date: '2030-06-01T12:00:00Z',
  opponent: 'Rywal',
  scoreUs: null,
  scoreThem: null
}
describe('Match presentation', () => {
  it.each(MATCH_STATUSES)('keeps explicit %s throughout adapter and card', (status) => {
    const mapped = mapApiGameToSummary({ ...game, presentation: { status } })
    expect(mapped.status).toBe(status)
    const html = renderToStaticMarkup(<MatchHero game={mapped} />)
    expect(html).toContain(`data-status="${status.toLowerCase()}"`)
    expect(html.indexOf('BeKaPaKa')).toBeLessThan(html.indexOf('Rywal'))
  })
  it.each(MATCH_STATUSES)('preserves %s in compact fixtures', (status) => {
    const html = renderToStaticMarkup(
      <FixtureRow game={{ ...game, status, scoreUs: 0, scoreThem: 0 }} />
    )
    expect(html).toContain(`data-status="${status.toLowerCase()}"`)
    if (status === 'POSTPONED') expect(html).toContain('Przełożony')
    if (['FINAL', 'LIVE', 'BREAK'].includes(status)) expect(html).toContain('aria-label="BeKaPaKa 0, Rywal 0"')
    if (status === 'CANCELLED') expect(html).not.toContain('BeKaPaKa 0, Rywal 0')
  })
  it('rejects malformed details without fabricating a score', () =>
    expect(
      mapApiGameToSummarySafe({ ...game, scoreUs: 'invalid', competition: { bad: true } })
    ).toBeNull())
  it('does not create FINAL or LIVE from scores or a past date', () => {
    expect(
      resolvePresentation({ ...game, date: '2000-01-01', scoreUs: 0, scoreThem: 0 }).status
    ).toBe('SCHEDULED')
  })
  it('distinguishes null, malformed scores and real zero', () => {
    expect(mapApiGameToSummary({ ...game, scoreUs: 'invalid' }).scoreUs).toBeNull()
    expect(
      mapApiGameToSummary({ ...game, scoreUs: 0, scoreThem: 0, isFinished: true }).scoreUs
    ).toBe(0)
  })
  it('never renders a synthetic 0:0', () =>
    expect(renderToStaticMarkup(<MatchHero game={{ ...game, status: 'FINAL' }} />)).not.toContain(
      'BeKaPaKa 0'
    ))
  it('postponement without new date asks for the next term', () =>
    expect(renderToStaticMarkup(<MatchHero game={{ ...game, status: 'POSTPONED' }} />)).toContain(
      'Czekamy na nowy termin'
    ))
  it('prioritizes active games, then next planned, then last final', () => {
    const final = { ...game, id: 'final', status: 'FINAL' as const, date: '2020-01-01' }
    const scheduled = { ...game, id: 'next' }
    const live = { ...game, id: 'live', status: 'BREAK' as const }
    expect(selectHeroGame([final, scheduled, live])?.id).toBe('live')
    expect(selectHeroGame([final, scheduled])?.id).toBe('next')
    expect(selectHeroGame([final])?.id).toBe('final')
    expect(selectHeroGame([{ ...game, status: 'CANCELLED' }])).toBeNull()
  })
  it('validates score ranges, status, dates and unknown fields', () => {
    for (const bad of [
      { status: 'FAKE' },
      { scoreUs: -1 },
      { scoreThem: 1.5 },
      { newDate: 'tomorrow' },
      { secret: 'x' }
    ])
      expect(() => validatePresentation(bad)).toThrow()
    expect(validatePresentation(null)).toBeNull()
    expect(validatePresentation({ status: 'LIVE', scoreUs: 0 })).toEqual({
      status: 'LIVE',
      scoreUs: 0
    })
  })
})

it('keeps presentation stable when a mapped game is rendered again', () => {
  const once = resolvePresentation({
    ...game,
    presentation: { round: '2. kolejka', status: 'POSTPONED', newDate: null }
  })
  expect(resolvePresentation(once).round).toBe('2. kolejka')
  expect(resolvePresentation(once).status).toBe('POSTPONED')
})
