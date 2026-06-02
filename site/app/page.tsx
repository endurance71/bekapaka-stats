import { MegaHomeTemplate } from '../components/public/templates/MegaHomeTemplate'
import { getPublicSiteData } from '../lib/data'

export default async function HomePage() {
  const { documents, events, news, roster, sponsors, table } = await getPublicSiteData()
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
        events={events}
        news={news}
        roster={roster}
        sponsors={sponsors}
        table={table}
      />
    </>
  )
}
