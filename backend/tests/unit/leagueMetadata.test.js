import { describe, expect, it } from 'vitest'
import { leagueMetadata } from '../../leagueMetadata.js'
describe('league source metadata', () => {
  it('uses persisted timestamps and season fields', () => {
    expect(leagueMetadata({ id: 's', label: 'Sezon testowy', slug: 'test', divisionPath: 'dywizja-2,4.html' }, [{ updatedAt: '2026-10-01T10:00:00Z' }, { updatedAt: '2026-10-02T10:00:00Z' }])).toEqual({ season: { id: 's', label: 'Sezon testowy', slug: 'test' }, division: 'Dywizja 2', updatedAt: '2026-10-02T10:00:00.000Z' })
  })
  it('does not replace unavailable metadata with current time', () => {
    expect(leagueMetadata(null, [])).toEqual({ season: null, division: null, updatedAt: null })
    expect(leagueMetadata(null, [{ updatedAt: null }, { updatedAt: undefined }, { updatedAt: 'invalid' }]).updatedAt).toBeNull()
  })
})
