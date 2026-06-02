type CmsItem = Record<string, unknown> & {
  id?: number | string
  title?: string
  name?: string
  description?: string
  excerpt?: string
  websiteUrl?: string
  startAt?: string
  effectiveDate?: string
  fileUrl?: string
}

const cmsApiUrl = process.env.SITE_CMS_API_URL || 'http://localhost:1337'
const backendApiUrl = process.env.SITE_BACKEND_API_URL || 'http://localhost:4001'
const cmsToken = process.env.SITE_CMS_TOKEN

async function fetchJson<T>(url: string, headers?: HeadersInit): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers,
      next: { revalidate: 300 }
    })
    if (!response.ok) return null
    return (await response.json()) as T
  } catch {
    return null
  }
}

function mapStrapiData(payload: unknown): CmsItem[] {
  if (!payload || typeof payload !== 'object') return []
  const data = (payload as { data?: unknown }).data
  if (!Array.isArray(data)) return []

  return data.map((entry) => {
    if (!entry || typeof entry !== 'object') return {}
    const normalized = entry as Record<string, unknown>
    const attrs = normalized.attributes
    if (attrs && typeof attrs === 'object') {
      return { id: normalized.id, ...(attrs as Record<string, unknown>) }
    }
    return normalized
  })
}

export async function getNewsPosts() {
  const headers: HeadersInit = cmsToken ? { Authorization: `Bearer ${cmsToken}` } : {}
  const payload = await fetchJson<unknown>(`${cmsApiUrl}/api/news-posts?sort=publishedAt:desc&pagination[limit]=6`, headers)
  return mapStrapiData(payload)
}

export async function getEvents() {
  const headers: HeadersInit = cmsToken ? { Authorization: `Bearer ${cmsToken}` } : {}
  const payload = await fetchJson<unknown>(`${cmsApiUrl}/api/events?sort=startAt:asc&pagination[limit]=6`, headers)
  return mapStrapiData(payload)
}

export async function getSponsors() {
  const headers: HeadersInit = cmsToken ? { Authorization: `Bearer ${cmsToken}` } : {}
  const payload = await fetchJson<unknown>(`${cmsApiUrl}/api/sponsors?sort=order:asc&pagination[limit]=12`, headers)
  return mapStrapiData(payload)
}

export async function getDocuments() {
  const headers: HeadersInit = cmsToken ? { Authorization: `Bearer ${cmsToken}` } : {}
  const payload = await fetchJson<unknown>(`${cmsApiUrl}/api/documents?sort=effectiveDate:desc&pagination[limit]=20`, headers)
  return mapStrapiData(payload)
}

export async function getLeagueTable() {
  return fetchJson<Array<Record<string, unknown>>>(`${backendApiUrl}/api/league/table`)
}

export async function getRoster() {
  return fetchJson<Array<Record<string, unknown>>>(`${backendApiUrl}/api/roster`)
}
