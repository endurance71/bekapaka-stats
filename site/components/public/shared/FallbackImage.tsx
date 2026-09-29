'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { ResponsiveMediaProps } from '../../../lib/data/media'

type FallbackImageProps = ResponsiveMediaProps & {
  alt: string
  className?: string
  fallbackSrc?: string
  fallback?: ReactNode
  fetchPriority?: 'high' | 'low' | 'auto'
}

/**
 * Keeps a broken Strapi derivative from leaving an empty card. The first error
 * removes srcset so the browser retries the original upload URL directly.
 */
export function FallbackImage({ fallbackSrc, fallback, srcSet, alt, ...props }: FallbackImageProps) {
  const [useFallback, setUseFallback] = useState(false)
  const [failed, setFailed] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const originalSrc = fallbackSrc || props.src

  useEffect(() => {
    setHydrated(true)
  }, [])

  if (failed) return fallback ? <>{fallback}</> : null

  return (
    <img
      {...props}
      alt={alt}
      src={useFallback ? originalSrc : props.src}
      srcSet={hydrated && !useFallback ? srcSet : undefined}
      onError={() => {
        if (useFallback) setFailed(true)
        else setUseFallback(true)
      }}
    />
  )
}
