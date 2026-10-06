import { MegaHomeTemplate } from '../components/public/templates/MegaHomeTemplate'
import { getPublicSiteData } from '../lib/data'

export const revalidate = 60

export default async function HomePage() {
  const { news, allGames, recentGames, nearestEvent, roster, sponsors, table, states } = await getPublicSiteData()
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name: 'BeKaPaKa Bobolice',
    sport: 'Basketball',
    url: 'https://bekapaka.pl'
  }

  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <MegaHomeTemplate
        allGames={allGames}
        news={news}
        recentGames={recentGames}
        nearestEvent={nearestEvent}
        roster={roster}
        sponsors={sponsors}
        table={table}
        newsState={states.news}
        tableState={states.table}
        eventsState={states.events}
      />
    </>
  )
}
