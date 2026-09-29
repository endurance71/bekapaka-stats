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
