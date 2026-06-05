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
import { pickNearestUpcomingHighlight, type NearestHighlight } from './nearest-event'

export * from './schemas'
export { pickNearestUpcomingHighlight, cmsEventCategoryLabel, type NearestHighlight } from './nearest-event'
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
    getRecentGamesState(100),
    getNewsPostsState(6),
    getEventsState(50),
    getSponsorsState(18),
    getDocumentsState(24),
    getHomepageSectionsState()
  ])

  const table = tableState.data
  const roster = rosterState.data
  const allGames = recentGamesState.data
  const recentGames = allGames
    .filter((game) => game.result || (game.scoreUs !== null && game.scoreThem !== null))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6)
  const events = eventsState.data
  const nearestEvent: NearestHighlight | null = pickNearestUpcomingHighlight(allGames, events)
  const news = newsState.data
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
  const dataFallbacks = [
    tableState,
    rosterState,
    recentGamesState,
    newsState,
    eventsState,
    sponsorsState,
    documentsState,
    homepageSectionsState
  ].filter((state) => state.source === 'fallback')

  return {
    table,
    roster,
    recentGames,
    nearestEvent,
    news,
    events,
    sponsors,
    documents,
    homepageSections,
    ourPosition,
    clubLogoUrl: '/logo.png',
    dataErrors,
    dataFallbacks,
    states: {
      table: tableState,
      roster: rosterState,
      recentGames: recentGamesState,
      news: newsState,
      events: eventsState,
      sponsors: sponsorsState,
      documents: documentsState,
      homepageSections: homepageSectionsState
    }
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
