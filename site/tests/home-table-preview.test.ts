import { describe, it, expect, vi } from 'vitest'
import type { TeamStanding } from '../lib/data'

function computeTablePreview(table: TeamStanding[]) {
  type TablePreviewItem =
    | { type: 'row'; data: TeamStanding }
    | { type: 'separator'; key: string }

  const bkpIndex = table.findIndex((row) =>
    row.name.toLowerCase().includes('bekapaka') || row.name.toLowerCase().includes('bobolice')
  )

  let tablePreviewItems: TablePreviewItem[] = []
  if (table.length <= 5) {
    tablePreviewItems = table.map((row) => ({ type: 'row', data: row }))
  } else if (bkpIndex === -1) {
    console.warn('[MegaHomeTemplate] BeKaPaKa team not found in standings table')
    tablePreviewItems = table.slice(0, 5).map((row) => ({ type: 'row', data: row }))
  } else if (bkpIndex < 5) {
    tablePreviewItems = table.slice(0, 5).map((row) => ({ type: 'row', data: row }))
  } else {
    tablePreviewItems = [
      ...table.slice(0, 4).map((row) => ({ type: 'row' as const, data: row })),
      { type: 'separator', key: 'standings-table-separator' },
      { type: 'row', data: table[bkpIndex] }
    ]
  }

  return tablePreviewItems
}

const mock10Teams: TeamStanding[] = [
  { name: 'Atomówki', position: 1, wins: 1, losses: 0, points: 2, pointsFor: 70, pointsAgainst: 65 },
  { name: 'BrdCrew', position: 2, wins: 1, losses: 0, points: 2, pointsFor: 64, pointsAgainst: 46 },
  { name: 'Fasolki', position: 3, wins: 0, losses: 1, points: 1, pointsFor: 65, pointsAgainst: 70 },
  { name: 'Pantery', position: 4, wins: 0, losses: 1, points: 1, pointsFor: 46, pointsAgainst: 64 },
  { name: 'Max BAU', position: 5, wins: 0, losses: 0, points: 0, pointsFor: 0, pointsAgainst: 0 },
  { name: 'Tartak Sekwoja', position: 6, wins: 0, losses: 0, points: 0, pointsFor: 0, pointsAgainst: 0 },
  { name: 'Koszalin 3x3', position: 7, wins: 0, losses: 0, points: 0, pointsFor: 0, pointsAgainst: 0 },
  { name: 'Przetwórcy', position: 8, wins: 0, losses: 0, points: 0, pointsFor: 0, pointsAgainst: 0 },
  { name: 'Wściekłe Pięści', position: 9, wins: 0, losses: 0, points: 0, pointsFor: 0, pointsAgainst: 0 },
  { name: 'BeKaPaKa Bobolice', position: 10, wins: 0, losses: 0, points: 0, pointsFor: 0, pointsAgainst: 0 }
]

describe('P0: Homepage Table Preview Logic', () => {
  it('Test 3: BeKaPaKa at #10 (outside TOP 5) shows TOP 4 + separator + BeKaPaKa #10', () => {
    const preview = computeTablePreview(mock10Teams)

    expect(preview).toHaveLength(6)
    expect(preview[0]).toEqual({ type: 'row', data: mock10Teams[0] })
    expect(preview[1]).toEqual({ type: 'row', data: mock10Teams[1] })
    expect(preview[2]).toEqual({ type: 'row', data: mock10Teams[2] })
    expect(preview[3]).toEqual({ type: 'row', data: mock10Teams[3] })
    expect(preview[4]).toEqual({ type: 'separator', key: 'standings-table-separator' })
    expect(preview[5]).toEqual({ type: 'row', data: mock10Teams[9] })
    expect((preview[5] as { data: TeamStanding }).data.name).toBe('BeKaPaKa Bobolice')
    expect((preview[5] as { data: TeamStanding }).data.position).toBe(10)
  })

  it('Test 4: BeKaPaKa in TOP 5 (e.g. at #3) shows standard TOP 5 without duplicate or separator', () => {
    const top5Teams: TeamStanding[] = [
      { name: 'Atomówki', position: 1, wins: 1, losses: 0, points: 2, pointsFor: 70, pointsAgainst: 65 },
      { name: 'BrdCrew', position: 2, wins: 1, losses: 0, points: 2, pointsFor: 64, pointsAgainst: 46 },
      { name: 'BeKaPaKa Bobolice', position: 3, wins: 1, losses: 0, points: 2, pointsFor: 60, pointsAgainst: 50 },
      { name: 'Fasolki', position: 4, wins: 0, losses: 1, points: 1, pointsFor: 65, pointsAgainst: 70 },
      { name: 'Pantery', position: 5, wins: 0, losses: 1, points: 1, pointsFor: 46, pointsAgainst: 64 },
      { name: 'Max BAU', position: 6, wins: 0, losses: 0, points: 0, pointsFor: 0, pointsAgainst: 0 }
    ]

    const preview = computeTablePreview(top5Teams)

    expect(preview).toHaveLength(5)
    expect(preview.some((p) => p.type === 'separator')).toBe(false)
    const names = preview.map((p) => (p as { data: TeamStanding }).data.name)
    expect(names).toEqual(['Atomówki', 'BrdCrew', 'BeKaPaKa Bobolice', 'Fasolki', 'Pantery'])
  })

  it('Edge case: Small table with <= 5 teams shows all teams directly', () => {
    const smallTable = mock10Teams.slice(0, 3)
    const preview = computeTablePreview(smallTable)
    expect(preview).toHaveLength(3)
    expect(preview.every((p) => p.type === 'row')).toBe(true)
  })

  it('Edge case: BeKaPaKa not found does not crash and logs warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const tableWithoutBkp = mock10Teams.slice(0, 9)
    const preview = computeTablePreview(tableWithoutBkp)

    expect(preview).toHaveLength(5)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('BeKaPaKa team not found'))
    warnSpy.mockRestore()
  })
})
