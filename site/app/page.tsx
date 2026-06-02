import { EditorialHomeTemplate } from '../components/public/templates/EditorialHomeTemplate'
import { EmptyState } from '../components/public/shared/EmptyState'
import { getPublicSiteData } from '../lib/data'

export default async function HomePage() {
  const { dataErrors, documents, events, homepageSections, news, ourPosition, roster, sponsors } = await getPublicSiteData()
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
      <EditorialHomeTemplate
        documents={documents}
        events={events}
        homepageSections={homepageSections}
        news={news}
        ourPosition={ourPosition}
        roster={roster}
        sponsors={sponsors}
      />
    </>
  )
}
