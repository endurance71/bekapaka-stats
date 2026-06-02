import { cmsHeaders, cmsPath, fetchJsonState, toAbsoluteCmsUrl } from './client'
import {
  type DataState,
  documentSchema,
  eventSchema,
  homepageSectionSchema,
  newsPostSchema,
  sponsorSchema,
  type DocumentItem,
  type EventItem,
  type HomepageSection,
  type NewsPost,
  type SponsorItem
} from './schemas'
import { sanitizeNumber, sanitizeText, toNormalizedArray } from './utils'

function mapMediaUrl(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined
  const payload = value as { data?: unknown; url?: unknown }
  if (typeof payload.url === 'string') return toAbsoluteCmsUrl(payload.url)
  if (payload.data && typeof payload.data === 'object') {
    const nested = payload.data as { attributes?: { url?: unknown }; url?: unknown }
    if (typeof nested.url === 'string') return toAbsoluteCmsUrl(nested.url)
    if (nested.attributes && typeof nested.attributes.url === 'string') {
      return toAbsoluteCmsUrl(nested.attributes.url)
    }
  }
  return undefined
}

function stateFromArray<T>(items: T[], errorMessage?: string): DataState<T[]> {
  if (errorMessage) return { status: 'error', data: [], message: errorMessage }
  if (items.length === 0) return { status: 'empty', data: [] }
  return { status: 'ok', data: items }
}

export async function getNewsPosts(limit = 6): Promise<NewsPost[]> {
  const state = await getNewsPostsState(limit)
  return state.data
}

export async function getNewsPostsState(limit = 6): Promise<DataState<NewsPost[]>> {
  const response = await fetchJsonState<unknown>(
    cmsPath(`/api/news-posts?sort=publishedAt:desc&pagination[limit]=${limit}&populate=coverImage`),
    { headers: cmsHeaders(), revalidate: 300 }
  )
  if (response.status === 'error') return stateFromArray([], response.message)

  const items = toNormalizedArray(response.payload)
    .map((item, index) => ({
      id: sanitizeText(item.id, String(index)),
      title: sanitizeText(item.title, 'Bez tytulu'),
      slug: sanitizeText(item.slug, `news-${index}`),
      excerpt: sanitizeText(item.excerpt, sanitizeText(item.description, '')),
      content: sanitizeText(item.content, ''),
      publishedAt: sanitizeText(item.publishedAtCustom, sanitizeText(item.publishedAt, '')),
      coverImageUrl: mapMediaUrl(item.coverImage)
    }))
    .map((item) => newsPostSchema.parse(item))

  return stateFromArray(items)
}

export async function getEvents(limit = 6): Promise<EventItem[]> {
  const state = await getEventsState(limit)
  return state.data
}

export async function getEventsState(limit = 6): Promise<DataState<EventItem[]>> {
  const response = await fetchJsonState<unknown>(
    cmsPath(`/api/events?sort=startAt:asc&pagination[limit]=${limit}`),
    { headers: cmsHeaders(), revalidate: 300 }
  )
  if (response.status === 'error') return stateFromArray([], response.message)

  const items = toNormalizedArray(response.payload)
    .map((item, index) => ({
      id: sanitizeText(item.id, String(index)),
      title: sanitizeText(item.title, sanitizeText(item.name, 'Wydarzenie')),
      slug: sanitizeText(item.slug, `event-${index}`),
      type: sanitizeText(item.type, 'other'),
      description: sanitizeText(item.description, ''),
      location: sanitizeText(item.location, ''),
      startAt: sanitizeText(item.startAt, ''),
      endAt: sanitizeText(item.endAt, ''),
      registrationUrl: sanitizeText(item.registrationUrl, '')
    }))
    .map((item) => eventSchema.parse(item))

  return stateFromArray(items)
}

export async function getSponsors(limit = 12): Promise<SponsorItem[]> {
  const state = await getSponsorsState(limit)
  return state.data
}

export async function getSponsorsState(limit = 12): Promise<DataState<SponsorItem[]>> {
  const response = await fetchJsonState<unknown>(
    cmsPath(`/api/sponsors?sort=order:asc&pagination[limit]=${limit}&populate=logo`),
    { headers: cmsHeaders(), revalidate: 600 }
  )
  if (response.status === 'error') return stateFromArray([], response.message)

  const items = toNormalizedArray(response.payload)
    .map((item, index) => ({
      id: sanitizeText(item.id, String(index)),
      name: sanitizeText(item.name, 'Sponsor'),
      slug: sanitizeText(item.slug, `sponsor-${index}`),
      tier: sanitizeText(item.tier, 'support'),
      websiteUrl: sanitizeText(item.websiteUrl, ''),
      order: sanitizeNumber(item.order, index),
      logoUrl: mapMediaUrl(item.logo)
    }))
    .map((item) => sponsorSchema.parse(item))

  return stateFromArray(items)
}

export async function getDocuments(limit = 20): Promise<DocumentItem[]> {
  const state = await getDocumentsState(limit)
  return state.data
}

export async function getDocumentsState(limit = 20): Promise<DataState<DocumentItem[]>> {
  const response = await fetchJsonState<unknown>(
    cmsPath(`/api/documents?sort=effectiveDate:desc&pagination[limit]=${limit}`),
    { headers: cmsHeaders(), revalidate: 600 }
  )
  if (response.status === 'error') return stateFromArray([], response.message)

  const items = toNormalizedArray(response.payload)
    .map((item, index) => ({
      id: sanitizeText(item.id, String(index)),
      title: sanitizeText(item.title, 'Dokument'),
      slug: sanitizeText(item.slug, `document-${index}`),
      category: sanitizeText(item.category, 'other'),
      effectiveDate: sanitizeText(item.effectiveDate, ''),
      fileUrl: toAbsoluteCmsUrl(sanitizeText(item.fileUrl, ''))
    }))
    .map((item) => documentSchema.parse(item))

  return stateFromArray(items)
}

export async function getHomepageSections(): Promise<HomepageSection[]> {
  const state = await getHomepageSectionsState()
  return state.data
}

export async function getHomepageSectionsState(): Promise<DataState<HomepageSection[]>> {
  const response = await fetchJsonState<unknown>(
    cmsPath('/api/homepage-sections?sort=order:asc&pagination[limit]=50'),
    { headers: cmsHeaders(), revalidate: 300 }
  )
  if (response.status === 'error') return stateFromArray([], response.message)

  const items = toNormalizedArray(response.payload)
    .map((item, index) => ({
      id: sanitizeText(item.id, String(index)),
      key: sanitizeText(item.key, `section-${index}`),
      title: sanitizeText(item.title, ''),
      subtitle: sanitizeText(item.subtitle, ''),
      body: sanitizeText(item.body, ''),
      order: sanitizeNumber(item.order, index),
      isEnabled: item.isEnabled !== false
    }))
    .filter((item) => item.isEnabled)
    .map((item) => homepageSectionSchema.parse(item))

  return stateFromArray(items)
}
