import type { Metadata } from 'next'
import { ListingTemplate } from '../../components/public/templates/ListingTemplate'
import { StatLeaders } from '../../components/public/team/StatLeaders'
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

  const active = roster.filter((player) => (player.gamesPlayed ?? 0) > 0).length

  return (
    <ListingTemplate
      kicker='Kto gra? · KALK'
      title='Skład drużyny'
      lead={`${roster[0]?.seasonLabel || 'Sezon niepotwierdzony'} · ${roster.length} zawodników w kadrze${active ? `, ${active} z występem w sezonie` : ''}.`}
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
      <RosterList roster={roster} />
      {active > 0 && (
        <section className='roster-leaders' aria-labelledby='h-leaders'>
          <h2 id='h-leaders' className='band-head__title'>Liderzy sezonu</h2>
          <StatLeaders roster={roster} />
        </section>
      )}
    </ListingTemplate>
  )
}
