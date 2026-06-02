import { getRoster, getLeagueTable } from './backend'
import { getDocuments, getEvents, getHomepageSections, getNewsPosts, getSponsors } from './cms'
import { siteBaseUrl } from './client'

export * from './schemas'
export { getDocuments, getEvents, getHomepageSections, getLeagueTable, getNewsPosts, getRoster, getSponsors }

export async function getPublicSiteData() {
  const [table, roster, news, events, sponsors, documents, homepageSections] = await Promise.all([
    getLeagueTable(),
    getRoster(),
    getNewsPosts(6),
    getEvents(8),
    getSponsors(18),
    getDocuments(24),
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
