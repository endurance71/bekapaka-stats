const cmsApiUrl = process.env.SITE_CMS_API_URL || 'http://localhost:1337'
const backendApiUrl = process.env.SITE_BACKEND_API_URL || 'http://localhost:4001'
const cmsToken = process.env.SITE_CMS_TOKEN

export const siteBaseUrl = process.env.SITE_BASE_URL || 'https://bekapaka.pl'

export function toAbsoluteCmsUrl(rawValue?: string): string {
  if (!rawValue) return ''
  if (rawValue.startsWith('http://') || rawValue.startsWith('https://')) return rawValue
  if (rawValue.startsWith('/')) return `${cmsApiUrl}${rawValue}`
  return rawValue
}

export async function fetchJson<T>(
  url: string,
  options?: { headers?: HeadersInit; revalidate?: number }
): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: options?.headers,
      next: { revalidate: options?.revalidate ?? 300 }
    })
    if (!response.ok) return null
    return (await response.json()) as T
  } catch {
    return null
  }
}

export async function fetchJsonState<T>(
  url: string,
  options?: { headers?: HeadersInit; revalidate?: number }
): Promise<{ status: 'ok'; payload: T } | { status: 'error'; message: string }> {
  try {
    const response = await fetch(url, {
      headers: options?.headers,
      next: { revalidate: options?.revalidate ?? 300 }
    })
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
