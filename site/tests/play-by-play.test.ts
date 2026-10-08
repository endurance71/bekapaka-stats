import { describe, expect, it } from 'vitest'
import { mapBackendPlayByPlay } from '../lib/data/play-by-play'

const ev = (over: Record<string, unknown>) => ({
  period: 1,
  clockSec: 600,
  side: null,
  playerName: null,
  actionRaw: null,
  actionType: null,
  reboundType: null,
  scoreHome: 0,
  scoreAway: 0,
  isScoring: false,
  ...over
})

describe('akcja po akcji z backendu', () => {
  it('grupuje po okresach, formatuje zegar i wynik tylko przy punktach', () => {
    const data = mapBackendPlayByPlay({
      available: true,
      home: { name: 'Kosz-All-In', isBekapaka: false },
      away: { name: 'BeKaPaKa Bobolice', isBekapaka: true },
      events: [
        ev({ actionRaw: 'Początek okresu', actionType: 'period_start' }),
        ev({ clockSec: 585, side: 'away', playerName: 'Filip Karpiński', actionRaw: 'Celny rzut za 2', actionType: 'shot_made', scoreAway: 2, isScoring: true }),
        ev({ clockSec: 61, side: 'home', actionRaw: 'Zbiórka', actionType: 'rebound', reboundType: 'O', scoreAway: 2 }),
        ev({ period: 5, clockSec: 300, side: 'home', playerName: 'Adam Nowak', actionRaw: 'Faul', actionType: 'foul', scoreAway: 2 })
      ]
    })

    expect(data?.home).toEqual({ name: 'Kosz-All-In', isBekapaka: false })
    expect(data?.away.isBekapaka).toBe(true)
    expect(data?.periods.map((p) => p.title)).toEqual(['Kwarta 1', 'Dogrywka 1'])
    expect(data?.periods[0].events).toEqual([
      { time: '10:00', side: 'neutral', player: null, action: 'Początek okresu', score: null },
      { time: '09:45', side: 'away', player: 'Filip Karpiński', action: 'Celny rzut za 2', score: '0:2' },
      { time: '01:01', side: 'home', player: null, action: 'Zbiórka w ataku', score: null }
    ])
  })

  it('brak zapisu (historia przed 2026/27) → null', () => {
    expect(mapBackendPlayByPlay({ available: false, events: [] })).toBeNull()
    expect(mapBackendPlayByPlay(null)).toBeNull()
  })
})
