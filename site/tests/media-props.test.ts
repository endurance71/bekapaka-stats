import { describe, expect, it } from 'vitest'
import { getStrapiMediaProps } from '../lib/data/media'

describe('getStrapiMediaProps', () => {
  it('handles empty or non-string input safely', () => {
    expect(getStrapiMediaProps(null)).toEqual({ src: '' })
    expect(getStrapiMediaProps(undefined)).toEqual({ src: '' })
    expect(getStrapiMediaProps('')).toEqual({ src: '' })
    expect(getStrapiMediaProps(123 as unknown as string)).toEqual({ src: '' })
  })

  it('does not invent responsive variants when CMS did not provide them', () => {
    const url = 'https://cms.bekapaka.pl/uploads/IMG_1768_6637d1a45d.jpg'
    const props = getStrapiMediaProps(url)

    expect(props.src).toBe(url)
    expect(props.loading).toBe('lazy')
    expect(props.decoding).toBe('async')
    expect(props.srcSet).toBeUndefined()
    expect(props.sizes).toBeDefined()
  })

  it('uses only real media formats returned by CMS', () => {
    const url = 'https://cms.bekapaka.pl/uploads/IMG_1768_6637d1a45d.jpg'
    const props = getStrapiMediaProps(url, {
      sources: [
        { src: 'https://cms.bekapaka.pl/uploads/small_IMG_1768_6637d1a45d.jpg', width: 500, height: 333 },
        { src: 'https://cms.bekapaka.pl/uploads/large_IMG_1768_6637d1a45d.jpg', width: 1000, height: 667 }
      ],
      width: 2400,
      height: 1600
    })

    expect(props.srcSet).toBe('https://cms.bekapaka.pl/uploads/small_IMG_1768_6637d1a45d.jpg 500w, https://cms.bekapaka.pl/uploads/large_IMG_1768_6637d1a45d.jpg 1000w')
    expect(props.width).toBe(2400)
    expect(props.height).toBe(1600)
  })

  it('handles already-variant Strapi URLs by extracting base filename', () => {
    const variantUrl = 'https://cms.bekapaka.pl/uploads/large_IMG_1768_6637d1a45d.jpg'
    const props = getStrapiMediaProps(variantUrl)

    expect(props.src).toBe('https://cms.bekapaka.pl/uploads/IMG_1768_6637d1a45d.jpg')
    expect(props.srcSet).toBeUndefined()
  })

  it('configures eager loading and cover sizes when isCover is true', () => {
    const url = '/uploads/IMG_1134_abc.jpg'
    const props = getStrapiMediaProps(url, { isCover: true })

    expect(props.loading).toBe('eager')
    expect(props.sizes).toContain('100vw')
  })

  it('configures eager loading and un-shrunk original for lightbox modal', () => {
    const url = 'https://cms.bekapaka.pl/uploads/IMG_1768_6637d1a45d.jpg'
    const props = getStrapiMediaProps(url, { isLightbox: true })

    expect(props.src).toBe(url)
    expect(props.loading).toBe('eager')
    expect(props.srcSet).toBeUndefined()
  })

  it('falls back gracefully for external non-Strapi URLs', () => {
    const external = 'https://images.unsplash.com/photo-1234?auto=format'
    const props = getStrapiMediaProps(external)

    expect(props.src).toBe(external)
    expect(props.srcSet).toBeUndefined()
    expect(props.loading).toBe('lazy')
  })
})
