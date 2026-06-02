import { MegaHomeTemplate } from '../components/public/templates/MegaHomeTemplate'
import { getPublicSiteData } from '../lib/data'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { documents, news, recentGames, nextGame, roster, sponsors, table, dataErrors, dataFallbacks } = await getPublicSiteData()
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
        documents={documents}
        news={news}
        recentGames={recentGames}
        nextGame={nextGame}
        roster={roster}
        sponsors={sponsors}
        table={table}
        hasDataWarning={dataErrors.length > 0 || dataFallbacks.length > 0}
      />
    </>
  )
}
