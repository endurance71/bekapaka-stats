import { cmsHeaders, cmsPath, fetchJson, toAbsoluteCmsUrl } from './client'
import {
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

export async function getNewsPosts(limit = 6): Promise<NewsPost[]> {
  const payload = await fetchJson<unknown>(
    cmsPath(`/api/news-posts?sort=publishedAt:desc&pagination[limit]=${limit}`),
    { headers: cmsHeaders(), revalidate: 300 }
  )

  return toNormalizedArray(payload)
    .map((item, index) => ({
      id: sanitizeText(item.id, String(index)),
      title: sanitizeText(item.title, 'Bez tytulu'),
      slug: sanitizeText(item.slug, `news-${index}`),
      excerpt: sanitizeText(item.excerpt, sanitizeText(item.description, '')),
      content: sanitizeText(item.content, ''),
      publishedAt: sanitizeText(item.publishedAtCustom, sanitizeText(item.publishedAt, ''))
    }))
    .map((item) => newsPostSchema.parse(item))
}

export async function getEvents(limit = 6): Promise<EventItem[]> {
  const payload = await fetchJson<unknown>(
    cmsPath(`/api/events?sort=startAt:asc&pagination[limit]=${limit}`),
    { headers: cmsHeaders(), revalidate: 300 }
  )

  return toNormalizedArray(payload)
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
}

export async function getSponsors(limit = 12): Promise<SponsorItem[]> {
  const payload = await fetchJson<unknown>(
    cmsPath(`/api/sponsors?sort=order:asc&pagination[limit]=${limit}`),
    { headers: cmsHeaders(), revalidate: 600 }
  )

  return toNormalizedArray(payload)
    .map((item, index) => ({
      id: sanitizeText(item.id, String(index)),
      name: sanitizeText(item.name, 'Sponsor'),
      slug: sanitizeText(item.slug, `sponsor-${index}`),
      tier: sanitizeText(item.tier, 'support'),
      websiteUrl: sanitizeText(item.websiteUrl, ''),
      order: sanitizeNumber(item.order, index)
    }))
    .map((item) => sponsorSchema.parse(item))
}

export async function getDocuments(limit = 20): Promise<DocumentItem[]> {
  const payload = await fetchJson<unknown>(
    cmsPath(`/api/documents?sort=effectiveDate:desc&pagination[limit]=${limit}`),
    { headers: cmsHeaders(), revalidate: 600 }
  )

  return toNormalizedArray(payload)
    .map((item, index) => ({
      id: sanitizeText(item.id, String(index)),
      title: sanitizeText(item.title, 'Dokument'),
      slug: sanitizeText(item.slug, `document-${index}`),
      category: sanitizeText(item.category, 'other'),
      effectiveDate: sanitizeText(item.effectiveDate, ''),
      fileUrl: toAbsoluteCmsUrl(sanitizeText(item.fileUrl, ''))
    }))
    .map((item) => documentSchema.parse(item))
}

export async function getHomepageSections(): Promise<HomepageSection[]> {
  const payload = await fetchJson<unknown>(
    cmsPath('/api/homepage-sections?sort=order:asc&pagination[limit]=50'),
    { headers: cmsHeaders(), revalidate: 300 }
  )

  return toNormalizedArray(payload)
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
}
