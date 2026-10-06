import type { Metadata } from 'next'
import { EditorialListingTemplate } from '../../components/public/templates/EditorialListingTemplate'
import { getRosterState, getSiteMetadataBase } from '../../lib/data'
import { RosterList } from './RosterList'

export const revalidate = 60

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  alternates: { canonical: '/sklad' },
  title: 'Skład | BeKaPaKa Bobolice',
  description: 'Pełny skład i interaktywne statystyki zawodników drużyny BeKaPaKa Bobolice.'
}

export default async function RosterPage() {
  const rosterState = await getRosterState()
  const roster = rosterState.data

  return (
    <EditorialListingTemplate
      title='Skład drużyny'
      description={`${roster[0]?.seasonLabel || 'Sezon niepotwierdzony'} · KALK · ${roster.length} zawodników w kadrze BeKaPaKa Bobolice.`}
      eyebrow='Drużyna · KALK Koszalin'
      hasItems={roster.length > 0}
      stateStatus={rosterState.status}
      stateSource={rosterState.source}
      stateMessage={rosterState.message}
      emptyTitle={rosterState.status === 'error' ? 'Nie można pobrać składu' : 'Brak składu'}
      emptyDescription={
        rosterState.status === 'error'
          ? 'Odśwież stronę lub wróć za chwilę.'
          : 'Skład zostanie uzupełniony po potwierdzeniu przez klub.'
      }
    >
      <div className='listing-panel'>
        <RosterList roster={roster} />
      </div>
    </EditorialListingTemplate>
  )
}
