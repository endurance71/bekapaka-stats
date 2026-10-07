import { describe, expect, it } from 'vitest'
import { resolveLocalPlayerPortrait } from '../lib/data/local-player-portraits'

const player = { id: '08a918a8-2643-436d-9812-f6ffe7d90b52', number: '3' }

describe('Local portrait variants', () => {
  it('requires explicit local preview enablement', () => {
    expect(resolveLocalPlayerPortrait(player)).toBeUndefined()
    expect(resolveLocalPlayerPortrait(player, false)).toBeUndefined()
  })
  it('uses the matching identity and number in the enabled preview', () => {
    expect(resolveLocalPlayerPortrait(player, true)).toBe('/brand/photography/pawel-samusionek-portret-v1.png')
  })
  it('keeps the source portrait when the jersey number changes or disappears', () => {
    expect(resolveLocalPlayerPortrait({ ...player, number: '4' }, true)).toBeUndefined()
    expect(resolveLocalPlayerPortrait({ ...player, number: null }, true)).toBeUndefined()
  })
  it('does not invent a portrait or assign another player with the same number', () => {
    expect(resolveLocalPlayerPortrait({ id: 'missing-photo', number: '3' }, true)).toBeUndefined()
  })
})
