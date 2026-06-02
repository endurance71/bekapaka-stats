import type { Metadata } from 'next'
import { EditorialListingTemplate } from '../../components/public/templates/EditorialListingTemplate'
import { getRosterState, getSiteMetadataBase } from '../../lib/data'
import { slugify } from '../../lib/content'

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  title: 'Sklad | BeKaPaKa Bobolice',
  description: 'Pelny sklad druzyny BeKaPaKa Bobolice.'
}

export default async function RosterPage() {
  const rosterState = await getRosterState()
  const roster = rosterState.data

  return (
    <EditorialListingTemplate
      title='Sklad druzyny'
      description='Pelna lista zawodnikow i podstawowe informacje meczowe.'
      hasItems={roster.length > 0}
      emptyTitle={rosterState.status === 'error' ? 'Nie mozna pobrac skladu' : 'Brak skladu'}
      emptyDescription={
        rosterState.status === 'error'
          ? 'Sprawdz backend i endpoint /api/roster.'
          : 'Po imporcie skladu dane pojawia sie automatycznie.'
      }
    >
      <div className='card-grid'>
        {roster.map((player) => (
          <article key={player.id} className='content-card'>
            <h2>{player.firstName} {player.lastName}</h2>
            <p className='muted'>Slug: {slugify(`${player.firstName}-${player.lastName}`)}</p>
            <p>Pozycja: {player.position}</p>
            <p>Numer: {player.number}</p>
          </article>
        ))}
      </div>
    </EditorialListingTemplate>
  )
}
