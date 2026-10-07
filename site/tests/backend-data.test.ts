import { afterEach, describe, expect, it, vi } from 'vitest'
import { getLeagueTableState } from '../lib/data/backend'

describe('public league table data', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('preserves the official KALK position and refreshes shortly after an import', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([{
      name: 'BeKaPaKa Bobolice',
      position: 7,
      points: 0,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0
    }]), { status: 200, headers: { 'content-type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)

    const state = await getLeagueTableState()

    expect(state.status).toBe('ok')
    expect(state.data[0]).toMatchObject({ name: 'BeKaPaKa Bobolice', position: 7 })
    const options = fetchMock.mock.calls[0][1] as { next?: { revalidate?: number } }
    expect(options.next?.revalidate).toBeLessThanOrEqual(60)
  })
})

// Exercise the actual API mapper, including the separate CMS media request.
describe('optional public roster statistics', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('retains missing measurements, recorded zeros, season metadata and numeric jersey provenance', async () => {
    const { getRosterState } = await import('../lib/data/backend')
    vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(JSON.stringify(
      url.includes('/api/roster') ? [{
        id: 'test', firstName: 'Jan', lastName: 'Testowy', number: 12,
        seasonId: '2026', seasonLabel: '2026/2027',
        ppg: null, rpg: 0, apg: '0', eval: 'brak', gamesPlayed: null,
        fgPercentage: '', fgm: '0', fga: '3', threePa: '3 rzuty',
        ftm: null, fta: 0, heightCm: null
      }] : { data: [] }
    ), { status: 200 })))
    const state = await getRosterState()
    expect(state.status).toBe('ok')
    expect(state.data).toHaveLength(1)
    expect(state.data[0]).toMatchObject({
      seasonId: '2026', seasonLabel: '2026/2027', number: '12', numberSource: 'source',
      rpg: 0, apg: 0, fgm: 0, fga: 3, fta: 0, eval: null, heightCm: null
    })
    for (const key of ['ppg', 'gamesPlayed', 'fgPercentage', 'threePa', 'ftm'] as const) {
      expect(state.data[0][key]).toBeUndefined()
    }
  })

  it('marks an unknown jersey as unknown rather than claiming a club source', async () => {
    const { getRosterState } = await import('../lib/data/backend')
    vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(JSON.stringify(
      url.includes('/api/roster') ? [{ id: 'test', firstName: 'Jan', lastName: 'Testowy', number: '-' }] : { data: [] }
    ), { status: 200 })))
    const state = await getRosterState()
    expect(state.data[0].numberSource).toBe('unknown')
  })
})
