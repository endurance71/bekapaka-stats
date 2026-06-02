import type { Metadata } from 'next'
import { EditorialListingTemplate } from '../../components/public/templates/EditorialListingTemplate'
import { getRosterState, getSiteMetadataBase } from '../../lib/data'
import { resolvePlayerPhoto, getPositionLabel } from '../../lib/data/utils'

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
          <article key={player.id} className='player-card'>
            <div className='player-card__image-wrap'>
              <img
                src={resolvePlayerPhoto(player)}
                alt={`${player.firstName} ${player.lastName}`}
                className='player-card__image'
              />
              <div className='player-card__overlay' />
              <div className='player-card__number'>{player.number}</div>
            </div>
            <div className='player-card__info'>
              <h2 className='player-card__name'>{player.firstName} {player.lastName}</h2>
              <p className='player-card__position'>{getPositionLabel(player.position)}</p>
            </div>
          </article>
        ))}
      </div>
    </EditorialListingTemplate>
  )
}
