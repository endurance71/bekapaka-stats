import type { MetadataRoute } from 'next'

const siteUrl = process.env.SITE_BASE_URL || 'https://bekapaka.pl'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/aktualnosci`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/wydarzenia`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/sponsorzy`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/dokumenty`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/o-klubie`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 }
  ]
}
