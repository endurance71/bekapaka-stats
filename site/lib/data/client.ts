const cmsApiUrl = process.env.SITE_CMS_API_URL || 'http://localhost:1337'
/** Public URL for media in HTML (browser cannot reach Docker-internal hostnames). */
const cmsPublicUrl =
  process.env.SITE_CMS_PUBLIC_URL ||
  process.env.NEXT_PUBLIC_SITE_CMS_PUBLIC_URL ||
  cmsApiUrl
const backendApiUrl = process.env.SITE_BACKEND_API_URL || 'http://localhost:4001'
const cmsToken = process.env.SITE_CMS_TOKEN

export const siteBaseUrl = process.env.SITE_BASE_URL || 'https://bekapaka.pl'

export function toAbsoluteCmsUrl(rawValue?: string): string {
  if (!rawValue) return ''
  if (rawValue.startsWith('http://') || rawValue.startsWith('https://')) {
    return rewriteCmsHostForPublic(rawValue)
  }
  if (rawValue.startsWith('/')) return `${cmsPublicUrl}${rawValue}`
  return rawValue
}

/** Replace internal CMS API host with the public CMS origin when Strapi returns absolute URLs. */
function rewriteCmsHostForPublic(absoluteUrl: string): string {
  try {
    const parsed = new URL(absoluteUrl)
    const internal = new URL(cmsApiUrl)
    const pub = new URL(cmsPublicUrl)
    if (parsed.hostname === internal.hostname) {
      parsed.protocol = pub.protocol
      parsed.host = pub.host
      return parsed.toString()
    }
  } catch {
    return absoluteUrl
  }
  return absoluteUrl
}

type FetchCacheOptions = {
  headers?: HeadersInit
  revalidate?: number
  tags?: string[]
}

function fetchInit(options?: FetchCacheOptions): RequestInit {
  const revalidate = options?.revalidate ?? 300
  const tags = options?.tags
  if (revalidate === 0) {
    return { headers: options?.headers, cache: 'no-store' }
  }
  return {
    headers: options?.headers,
    next: {
      revalidate,
      ...(tags && tags.length > 0 ? { tags } : {})
    }
  }
}

export async function fetchJson<T>(
  url: string,
  options?: FetchCacheOptions
): Promise<T | null> {
  try {
    const response = await fetch(url, fetchInit(options))
    if (!response.ok) return null
    return (await response.json()) as T
  } catch {
    return null
  }
}

export async function fetchJsonState<T>(
  url: string,
  options?: FetchCacheOptions
): Promise<{ status: 'ok'; payload: T } | { status: 'error'; message: string }> {
  try {
    const response = await fetch(url, fetchInit(options))
    if (!response.ok) {
      return { status: 'error', message: `HTTP_${response.status}` }
    }
    return { status: 'ok', payload: (await response.json()) as T }
  } catch {
    return { status: 'error', message: 'NETWORK_ERROR' }
  }
}

export function cmsPath(path: string): string {
  return `${cmsApiUrl}${path}`
}

export function backendPath(path: string): string {
  return `${backendApiUrl}${path}`
}

export function hasCmsToken(): boolean {
  return Boolean(cmsToken?.trim())
}

export function cmsHeaders(): HeadersInit {
  if (!hasCmsToken()) return {}
  return { Authorization: `Bearer ${cmsToken}` }
}
