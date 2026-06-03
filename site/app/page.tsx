import { MegaHomeTemplate } from '../components/public/templates/MegaHomeTemplate'
import { getPublicSiteData } from '../lib/data'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { news, recentGames, nearestEvent, roster, sponsors, table } = await getPublicSiteData()
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
        news={news}
        recentGames={recentGames}
        nearestEvent={nearestEvent}
        roster={roster}
        sponsors={sponsors}
        table={table}
      />
    </>
  )
}
