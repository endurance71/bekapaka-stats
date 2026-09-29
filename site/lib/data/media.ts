/**
 * Utilities for responsive Strapi media optimization on the frontend.
 */

export interface ResponsiveMediaProps {
  src: string
  srcSet?: string
  sizes?: string
  width?: number
  height?: number
  loading?: 'lazy' | 'eager'
  decoding?: 'async' | 'sync' | 'auto'
}

export interface ResponsiveMediaSource {
  src: string
  width: number
  height?: number
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
    sources?: ResponsiveMediaSource[]
    width?: number
    height?: number
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
  const validSources = (options?.sources || [])
    .filter((source) => source.src && Number.isFinite(source.width) && source.width > 0)
    .map((source) => ({ ...source, src: source.src.trim() }))
    .filter((source, index, sources) => sources.findIndex((candidate) => candidate.src === source.src) === index)
    .sort((a, b) => a.width - b.width)
  const srcSet = validSources.length > 0
    ? validSources.map((source) => `${source.src} ${source.width}w`).join(', ')
    : undefined
  const sourceWidth = options?.width || validSources[validSources.length - 1]?.width
  const sourceHeight = options?.height || validSources[validSources.length - 1]?.height

  // If used inside full-screen lightbox, prefer high quality original with eager loading
  if (isLightbox) {
    return {
      src: originalUrl,
      ...(sourceWidth ? { width: sourceWidth } : {}),
      ...(sourceHeight ? { height: sourceHeight } : {}),
      loading: 'eager',
      decoding: 'async'
    }
  }

  const defaultSizes = isCover
    ? '(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px'
    : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'

  return {
    src: originalUrl,
    ...(srcSet ? { srcSet } : {}),
    sizes: options?.sizes || defaultSizes,
    ...(sourceWidth ? { width: sourceWidth } : {}),
    ...(sourceHeight ? { height: sourceHeight } : {}),
    loading: isCover ? 'eager' : 'lazy',
    decoding: 'async'
  }
}
