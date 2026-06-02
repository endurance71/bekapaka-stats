import type { MetadataRoute } from 'next'
import { getDocuments, getEvents, getNewsPosts } from '../lib/data'

const siteUrl = process.env.SITE_BASE_URL || 'https://bekapaka.pl'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const [news, events, documents] = await Promise.all([getNewsPosts(150), getEvents(150), getDocuments(200)])

  const detailPages: MetadataRoute.Sitemap = [
    ...news.map((item) => ({ url: `${siteUrl}/aktualnosci/${item.slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 })),
    ...events.map((item) => ({ url: `${siteUrl}/wydarzenia/${item.slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 })),
    ...documents.map((item) => ({ url: `${siteUrl}/dokumenty/${item.slug}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6 }))
  ]

  return [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/aktualnosci`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/wydarzenia`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/tabela`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/sklad`, lastModified: now, changeFrequency: 'daily', priority: 0.85 },
    { url: `${siteUrl}/sponsorzy`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/dokumenty`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/o-klubie`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    ...detailPages
  ]
}
