const cmsApiUrl = process.env.SITE_CMS_API_URL || 'http://localhost:1337'
const backendApiUrl = process.env.SITE_BACKEND_API_URL || 'http://localhost:4001'
const cmsToken = process.env.SITE_CMS_TOKEN
const siteBaseUrl = process.env.SITE_BASE_URL || 'https://bekapaka.pl'

type StrapiEntry = {
  id?: number | string
  attributes?: Record<string, unknown>
} & Record<string, unknown>

type StrapiCollectionResponse = {
  data?: StrapiEntry[] | StrapiEntry
}

export type NewsPost = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  publishedAt: string
}

export type EventItem = {
  id: string
  title: string
  slug: string
  type: string
  description: string
  location: string
  startAt: string
  endAt: string
  registrationUrl: string
}

export type SponsorItem = {
  id: string
  name: string
  slug: string
  tier: string
  websiteUrl: string
  order: number
}

export type DocumentItem = {
  id: string
  title: string
  slug: string
  category: string
  effectiveDate: string
  fileUrl: string
}

export type HomepageSection = {
  id: string
  key: string
  title: string
  subtitle: string
  body: string
  order: number
  isEnabled: boolean
}

export type TeamStanding = {
  name: string
  position: number
  wins: number
  losses: number
}

export type RosterPlayer = {
  id: string
  firstName: string
  lastName: string
  position: string
  number: string
}

export function toAbsoluteUrl(rawValue?: string): string {
  if (!rawValue) return ''
  if (rawValue.startsWith('http://') || rawValue.startsWith('https://')) return rawValue
  if (rawValue.startsWith('/')) return `${cmsApiUrl}${rawValue}`
  return rawValue
}

function sanitizeText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return String(value)
  return fallback
}

function sanitizeNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function toNormalizedArray(payload: unknown): Record<string, unknown>[] {
  if (!payload || typeof payload !== 'object') return []
  const data = (payload as StrapiCollectionResponse).data
  const entries = Array.isArray(data) ? data : data ? [data] : []

  return entries.map((entry) => {
    const baseId = entry.id
    if (entry.attributes && typeof entry.attributes === 'object') {
      return {
        id: baseId,
        ...entry.attributes
      }
    }
    return entry
  })
}

async function fetchJson<T>(url: string, options?: { headers?: HeadersInit; revalidate?: number }): Promise<T | null> {
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

function getCmsHeaders(): HeadersInit {
  if (!cmsToken) return {}
  return { Authorization: `Bearer ${cmsToken}` }
}

export async function getNewsPosts(limit = 6): Promise<NewsPost[]> {
  const payload = await fetchJson<unknown>(
    `${cmsApiUrl}/api/news-posts?sort=publishedAt:desc&pagination[limit]=${limit}`,
    { headers: getCmsHeaders(), revalidate: 300 }
  )
  const items = toNormalizedArray(payload)

  return items.map((item, index) => ({
    id: sanitizeText(item.id, String(index)),
    title: sanitizeText(item.title, 'Bez tytułu'),
    slug: sanitizeText(item.slug, sanitizeText(item.id, `news-${index}`)),
    excerpt: sanitizeText(item.excerpt, sanitizeText(item.description, '')),
    content: sanitizeText(item.content, ''),
    publishedAt: sanitizeText(item.publishedAtCustom, sanitizeText(item.publishedAt, ''))
  }))
}

export async function getEvents(limit = 6): Promise<EventItem[]> {
  const payload = await fetchJson<unknown>(
    `${cmsApiUrl}/api/events?sort=startAt:asc&pagination[limit]=${limit}`,
    { headers: getCmsHeaders(), revalidate: 300 }
  )
  const items = toNormalizedArray(payload)

  return items.map((item, index) => ({
    id: sanitizeText(item.id, String(index)),
    title: sanitizeText(item.title, sanitizeText(item.name, 'Wydarzenie')),
    slug: sanitizeText(item.slug, sanitizeText(item.id, `event-${index}`)),
    type: sanitizeText(item.type, 'other'),
    description: sanitizeText(item.description, ''),
    location: sanitizeText(item.location, ''),
    startAt: sanitizeText(item.startAt, ''),
    endAt: sanitizeText(item.endAt, ''),
    registrationUrl: sanitizeText(item.registrationUrl, '')
  }))
}

export async function getSponsors(limit = 12): Promise<SponsorItem[]> {
  const payload = await fetchJson<unknown>(
    `${cmsApiUrl}/api/sponsors?sort=order:asc&pagination[limit]=${limit}`,
    { headers: getCmsHeaders(), revalidate: 600 }
  )
  const items = toNormalizedArray(payload)

  return items.map((item, index) => ({
    id: sanitizeText(item.id, String(index)),
    name: sanitizeText(item.name, 'Sponsor'),
    slug: sanitizeText(item.slug, sanitizeText(item.id, `sponsor-${index}`)),
    tier: sanitizeText(item.tier, 'support'),
    websiteUrl: sanitizeText(item.websiteUrl, ''),
    order: sanitizeNumber(item.order, index)
  }))
}

export async function getDocuments(limit = 20): Promise<DocumentItem[]> {
  const payload = await fetchJson<unknown>(
    `${cmsApiUrl}/api/documents?sort=effectiveDate:desc&pagination[limit]=${limit}`,
    { headers: getCmsHeaders(), revalidate: 600 }
  )
  const items = toNormalizedArray(payload)

  return items.map((item, index) => ({
    id: sanitizeText(item.id, String(index)),
    title: sanitizeText(item.title, 'Dokument'),
    slug: sanitizeText(item.slug, sanitizeText(item.id, `document-${index}`)),
    category: sanitizeText(item.category, 'other'),
    effectiveDate: sanitizeText(item.effectiveDate, ''),
    fileUrl: toAbsoluteUrl(sanitizeText(item.fileUrl, ''))
  }))
}

export async function getHomepageSections(): Promise<HomepageSection[]> {
  const payload = await fetchJson<unknown>(
    `${cmsApiUrl}/api/homepage-sections?sort=order:asc&pagination[limit]=50`,
    { headers: getCmsHeaders(), revalidate: 300 }
  )
  const items = toNormalizedArray(payload)

  return items
    .map((item, index) => ({
      id: sanitizeText(item.id, String(index)),
      key: sanitizeText(item.key, `section-${index}`),
      title: sanitizeText(item.title, ''),
      subtitle: sanitizeText(item.subtitle, ''),
      body: sanitizeText(item.body, ''),
      order: sanitizeNumber(item.order, index),
      isEnabled: item.isEnabled !== false
    }))
    .filter((section) => section.isEnabled)
}

export async function getLeagueTable(): Promise<TeamStanding[]> {
  const payload = await fetchJson<Array<Record<string, unknown>>>(`${backendApiUrl}/api/league/table`, { revalidate: 900 })
  if (!payload) return []

  return payload.map((row) => ({
    name: sanitizeText(row.team, sanitizeText(row.name, 'Drużyna')),
    position: sanitizeNumber(row.position, sanitizeNumber(row.rank, 0)),
    wins: sanitizeNumber(row.wins, 0),
    losses: sanitizeNumber(row.losses, 0)
  }))
}

export async function getRoster(): Promise<RosterPlayer[]> {
  const payload = await fetchJson<Array<Record<string, unknown>>>(`${backendApiUrl}/api/roster`, { revalidate: 900 })
  if (!payload) return []

  return payload.map((player, index) => ({
    id: sanitizeText(player.id, String(index)),
    firstName: sanitizeText(player.firstName, ''),
    lastName: sanitizeText(player.lastName, ''),
    position: sanitizeText(player.position, 'Brak'),
    number: sanitizeText(player.number, '-')
  }))
}

export async function getPublicSiteData() {
  const [table, roster, news, events, sponsors, documents, homepageSections] = await Promise.all([
    getLeagueTable(),
    getRoster(),
    getNewsPosts(6),
    getEvents(6),
    getSponsors(18),
    getDocuments(20),
    getHomepageSections()
  ])

  const ourPosition = table.find((row) => row.name.toLowerCase().includes('bekapaka'))

  return {
    table,
    roster,
    news,
    events,
    sponsors,
    documents,
    homepageSections,
    ourPosition
  }
}

export function getSiteMetadataBase() {
  return {
    metadataBase: new URL(siteBaseUrl),
    openGraph: {
      type: 'website' as const,
      locale: 'pl_PL',
      siteName: 'BeKaPaKa Bobolice'
    },
    twitter: {
      card: 'summary_large_image' as const
    }
  }
}
