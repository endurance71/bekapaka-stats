import { describe, expect, it } from 'vitest'
import { normalizePlayerIdentity } from '../lib/data/player-identity'
describe('Imported roster identity', () => {
  it('corrects only a reversed pair confirmed in the approved roster', () => {
    expect(normalizePlayerIdentity({ firstName: 'Samusionek', lastName: 'Paweł', id: '3' })).toEqual({ firstName: 'Paweł', lastName: 'Samusionek', id: '3' })
  })
  it('preserves correct and unrecognized names without guessing', () => {
    const correct = { firstName: 'Pablo', lastName: 'Iriarte' }
    const unknown = { firstName: 'Nowak', lastName: 'Jan' }
    expect(normalizePlayerIdentity(correct)).toBe(correct)
    expect(normalizePlayerIdentity(unknown)).toBe(unknown)
  })
  it('uses an exact modern source identity while preserving legacy name ordering', () => {
    const modern = { firstName: 'Olearczyk', lastName: 'Dawid', kalkPlayer: { id: '2026-2027__dawid-olearczyk-vkro', name: 'Dawid Olearczyk' } }
    expect(normalizePlayerIdentity(modern)).toMatchObject({ firstName: 'Dawid', lastName: 'Olearczyk' })
    const legacy = { firstName: 'Jan', lastName: 'Nowak', kalkPlayer: { id: '2025-2026__zawodnik123.html', name: 'Nowak Jan' } }
    expect(normalizePlayerIdentity(legacy)).toBe(legacy)
  })
})
