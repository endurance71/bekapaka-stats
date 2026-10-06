import { describe, expect, it } from 'vitest'
import { formatTeamShortName } from '../lib/format'

describe('mobile team identifiers', () => {
  it.each([
    ['BeKaPaKa Bobolice', 'BKP'],
    ['Młode Wilki', 'MW'],
    ['GMVT TEAM', 'GMVT'],
    ['Kosz-All-In', 'KAI'],
    ['Maxbau Okna Dako PSP', 'MODP'],
    ['BrdCrew', 'BRD'],
    ['Atomówki', 'ATO'],
    ['  Łabędzie  ', 'ŁAB'],
    [' ', '—']
  ])('recognizes %s as %s', (name, expected) => {
    expect(formatTeamShortName(name)).toBe(expected)
  })
})
