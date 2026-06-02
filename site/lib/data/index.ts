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
  const allGames = recentGamesState.data
  const now = Date.now()
  const upcomingGames = allGames
    .filter((game) => {
      const isUpcoming = !game.result && game.scoreUs === null && game.scoreThem === null
      const gameTime = new Date(game.date).getTime()
      return isUpcoming && Number.isFinite(gameTime) && gameTime >= now
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const recentGames = allGames
    .filter((game) => game.result || (game.scoreUs !== null && game.scoreThem !== null))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6)
  const nextGame = upcomingGames[0] ?? null
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
    nextGame,
    news,
    events,
    sponsors,
    documents,
    homepageSections,
    ourPosition,
    clubLogoUrl: '/favicon.ico',
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
