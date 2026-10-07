import { describe, expect, it } from 'vitest'
import { resolveLocalPlayerPortrait } from '../lib/data/local-player-portraits'

const player = { id: '08a918a8-2643-436d-9812-f6ffe7d90b52', number: '3' }

describe('Brand portraits', () => {
  it('uses the matching identity and number on every environment', () => {
    expect(resolveLocalPlayerPortrait(player)).toBe('/brand/photography/pawel-samusionek-portret-v1.png')
  })
  it('keeps the source portrait when the jersey number changes or disappears', () => {
    expect(resolveLocalPlayerPortrait({ ...player, number: '4' })).toBeUndefined()
    expect(resolveLocalPlayerPortrait({ ...player, number: null })).toBeUndefined()
  })
  it('does not invent a portrait or assign another player with the same number', () => {
    expect(resolveLocalPlayerPortrait({ id: 'missing-photo', number: '3' })).toBeUndefined()
  })
})
