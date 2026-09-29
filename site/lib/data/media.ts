/**
 * Utilities for responsive Strapi media optimization on the frontend.
 */

export interface ResponsiveMediaProps {
  src: string
  srcSet?: string
  sizes?: string
  loading?: 'lazy' | 'eager'
  decoding?: 'async' | 'sync' | 'auto'
}

/**
 * Builds responsive srcset and sizing attributes for Strapi uploads.
 * If the image is not a standard Strapi upload, returns base props with sensible loading defaults.
 */
export function getStrapiMediaProps(
  src: unknown,
  options?: {
    isCover?: boolean
    sizes?: string
    isLightbox?: boolean
  }
): ResponsiveMediaProps {
  if (!src || typeof src !== 'string') {
    return { src: '' }
  }

  const isCover = Boolean(options?.isCover)
  const isLightbox = Boolean(options?.isLightbox)

  // Match Strapi upload path: .../uploads/(optional-prefix_)filename.ext
  const match = src.match(/^(.*\/uploads\/)(?:(thumbnail|small|medium|large)_)?([^/?#]+)(\?.*)?$/)

  if (!match) {
    return {
      src,
      loading: isCover || isLightbox ? 'eager' : 'lazy',
      decoding: 'async'
    }
  }

  const [, basePath, , filename, query = ''] = match
  const originalUrl = `${basePath}${filename}${query}`
  const smallUrl = `${basePath}small_${filename}${query}`
  const mediumUrl = `${basePath}medium_${filename}${query}`
  const largeUrl = `${basePath}large_${filename}${query}`

  // If used inside full-screen lightbox, prefer high quality original with eager loading
  if (isLightbox) {
    return {
      src: originalUrl,
      loading: 'eager',
      decoding: 'async'
    }
  }

  const defaultSizes = isCover
    ? '(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px'
    : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'

  return {
    src: originalUrl,
    srcSet: `${smallUrl} 500w, ${mediumUrl} 750w, ${largeUrl} 1000w, ${originalUrl} 2400w`,
    sizes: options?.sizes || defaultSizes,
    loading: isCover ? 'eager' : 'lazy',
    decoding: 'async'
  }
}
