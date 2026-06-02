import type { MetadataRoute } from 'next'
import { getEvents, getNewsPosts } from '../lib/data'

const siteUrl = process.env.SITE_BASE_URL || 'https://bekapaka.pl'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const [news, events] = await Promise.all([getNewsPosts(150), getEvents(150)])

  const detailPages: MetadataRoute.Sitemap = [
    ...news.map((item) => ({ url: `${siteUrl}/aktualnosci/${item.slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 })),
    ...events.map((item) => ({ url: `${siteUrl}/mecze/${item.slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 }))
  ]

  return [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/aktualnosci`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/mecze`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/tabela`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/sklad`, lastModified: now, changeFrequency: 'daily', priority: 0.85 },
    { url: `${siteUrl}/sponsorzy`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/klub`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    ...detailPages
  ]
}
