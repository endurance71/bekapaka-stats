import { MegaHomeTemplate } from '../components/public/templates/MegaHomeTemplate'
import { EmptyState } from '../components/public/shared/EmptyState'
import { getPublicSiteData } from '../lib/data'

export default async function HomePage() {
  const { dataErrors, documents, events, news, roster, sponsors, table } = await getPublicSiteData()
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
      {dataErrors.length > 0 ? (
        <EmptyState
          mode='error'
          title='Czesc danych jest chwilowo niedostepna'
          description='Pokazujemy dostepne sekcje i fallbacki. Sprobuj odswiezyc strone za chwile.'
        />
      ) : null}
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
