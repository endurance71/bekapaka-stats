import { getLeagueTable, getLeagueTableState, getRecentGamesState, getRoster, getRosterState } from './backend'
import {
  getDocuments,
  getDocumentsState,
  getEvents,
  getEventsState,
  getHomepageSections,
  getHomepageSectionsState,
  getNewsPosts,
  getNewsPostsState,
  getSponsors,
  getSponsorsState
} from './cms'
import { siteBaseUrl } from './client'

export * from './schemas'
export {
  getDocuments,
  getDocumentsState,
  getEvents,
  getEventsState,
  getHomepageSections,
  getHomepageSectionsState,
  getLeagueTable,
  getLeagueTableState,
  getRecentGamesState,
  getNewsPosts,
  getNewsPostsState,
  getRoster,
  getRosterState,
  getSponsors,
  getSponsorsState
}

export async function getPublicSiteData() {
  const [tableState, rosterState, recentGamesState, newsState, eventsState, sponsorsState, documentsState, homepageSectionsState] = await Promise.all([
    getLeagueTableState(),
    getRosterState(),
    getRecentGamesState(6),
    getNewsPostsState(6),
    getEventsState(8),
    getSponsorsState(18),
    getDocumentsState(24),
    getHomepageSectionsState()
  ])

  const table = tableState.data
  const roster = rosterState.data
  const recentGames = recentGamesState.data
  const news = newsState.data
  const events = eventsState.data
  const sponsors = sponsorsState.data
  const documents = documentsState.data
  const homepageSections = homepageSectionsState.data

  const ourPosition = table.find((row) => row.name.toLowerCase().includes('bekapaka'))
  const dataErrors = [
    tableState,
    rosterState,
    recentGamesState,
    newsState,
    eventsState,
    sponsorsState,
    documentsState,
    homepageSectionsState
  ].filter((state) => state.status === 'error')

  return {
    table,
    roster,
    recentGames,
    news,
    events,
    sponsors,
    documents,
    homepageSections,
    ourPosition,
    clubLogoUrl: '/favicon.ico',
    dataErrors
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
