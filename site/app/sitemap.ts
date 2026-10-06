import type { MetadataRoute } from 'next'
import { getAllNewsPosts, getAllEvents, getAllDocuments } from '../lib/data/cms'
import { getRoster, getRecentGamesState } from '../lib/data'
import { siteBaseUrl } from '../lib/data/client'
export const revalidate = 60
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
 const [news,events,documents,roster,gamesState] = await Promise.all([getAllNewsPosts(),getAllEvents(),getAllDocuments(),getRoster(),getRecentGamesState()])
 return [ ...['','aktualnosci','mecze','tabela','sklad','sponsorzy','klub','wydarzenia','dokumenty'].map(path => ({ url: `${siteBaseUrl}/${path}` })),
 ...gamesState.data.map(item => ({ url: `${siteBaseUrl}/mecze/kalk-${encodeURIComponent(item.id)}` })),
 ...news.map(item => ({ url: `${siteBaseUrl}/aktualnosci/${item.slug}`, lastModified: item.updatedAt || item.publishedAt })),
 ...events.map(item => ({ url: `${siteBaseUrl}/mecze/${item.slug}` })), ...documents.map(item => ({ url: `${siteBaseUrl}/dokumenty/${item.slug}` })), ...roster.map(item => ({ url: `${siteBaseUrl}/sklad/${encodeURIComponent(item.id)}` })) ]
}
