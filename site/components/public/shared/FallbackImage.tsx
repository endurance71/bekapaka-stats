'use client'
import Image from 'next/image'
import { useState, type ReactNode } from 'react'
import type { ResponsiveMediaProps } from '../../../lib/data/media'
type Props = ResponsiveMediaProps & {
  alt: string
  className?: string
  fallbackSrc?: string
  fallback?: ReactNode
  fetchPriority?: 'high' | 'low' | 'auto'
  preload?: boolean
}
export function FallbackImage({
  fallbackSrc,
  fallback,
  srcSet: _srcSet,
  src,
  alt,
  width,
  height,
  loading,
  decoding: _decoding,
  ...props
}: Props) {
  void _srcSet
  void _decoding
  const [failed, setFailed] = useState(false)
  const [original, setOriginal] = useState(false)
  if (!src || failed) return fallback || null
  return (
    <Image
      {...props}
      src={original ? fallbackSrc || src : src}
      alt={alt}
      width={width || 1200}
      height={height || 800}
      loading={loading || 'lazy'}
      unoptimized={original}
      onError={() => (original ? setFailed(true) : setOriginal(true))}
    />
  )
}
