import { describe, expect, it } from 'vitest'
import { approvedMedia } from '../lib/data/media-review'
describe('Media publication gate', () => {
  it.each(['unknown', 'revoked'] as const)('rejects %s photos', (consentStatus) =>
    expect(
      approvedMedia(
        [{ url: 'https://cms.bekapaka.pl/a.jpg', alt: 'Opis', author: 'Autor', consentStatus }],
        'https://cms.bekapaka.pl/a.jpg'
      )
    ).toBeUndefined()
  )
  it('requires individual alt and author', () => {
    expect(
      approvedMedia(
        [{ url: '/a.jpg', alt: '', author: 'Autor', consentStatus: 'granted' }],
        '/a.jpg'
      )
    ).toBeUndefined()
    expect(
      approvedMedia(
        [{ url: '/a.jpg', alt: 'Opis', author: '', consentStatus: 'granted' }],
        '/a.jpg'
      )
    ).toBeUndefined()
  })
  it('accepts a reviewed record', () =>
    expect(
      approvedMedia(
        [{ url: '/a.jpg', alt: 'Opis', author: 'Autor', consentStatus: 'granted' }],
        '/a.jpg'
      )?.alt
    ).toBe('Opis'))
})

import { hasPlayerPhoto, resolvePlayerPhoto } from '../lib/data/utils'
describe('Existing local portraits', () => {
  it('resolves a known portrait when the source reverses name order', () => {
    const player = { firstName: 'Samusionek', lastName: 'Paweł' }
    expect(hasPlayerPhoto(player)).toBe(true)
    expect(resolvePlayerPhoto(player)).toBe('/photos/pawel-samusionek.png')
  })
  it('does not invent a portrait for a player without an existing asset', () =>
    expect(hasPlayerPhoto({ firstName: 'Nieznany', lastName: 'Zawodnik' })).toBe(false))
})
