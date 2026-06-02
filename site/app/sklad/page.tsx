import type { Metadata } from 'next'
import { EditorialListingTemplate } from '../../components/public/templates/EditorialListingTemplate'
import { getRosterState, getSiteMetadataBase } from '../../lib/data'
import { RosterList } from './RosterList'

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  title: 'Skład | BeKaPaKa Bobolice',
  description: 'Pełny skład i interaktywne statystyki zawodników drużyny BeKaPaKa Bobolice.'
}

export default async function RosterPage() {
  const rosterState = await getRosterState()
  const roster = rosterState.data

  return (
    <EditorialListingTemplate
      title='Skład drużyny'
      description='Kliknij na dowolnego zawodnika, aby zobaczyć zaawansowane statystyki oraz analizę rozwoju AI.'
      hasItems={roster.length > 0}
      emptyTitle={rosterState.status === 'error' ? 'Nie można pobrać składu' : 'Brak składu'}
      emptyDescription={
        rosterState.status === 'error'
          ? 'Sprawdź backend i endpoint /api/roster.'
          : 'Po imporcie składu dane pojawią się automatycznie.'
      }
    >
      <RosterList roster={roster} />
    </EditorialListingTemplate>
  )
}
