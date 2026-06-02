import type { Metadata } from 'next'
import { PageHeader } from '../../components/public-site'
import { getRoster, getSiteMetadataBase } from '../../lib/data'
import { slugify } from '../../lib/content'

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  title: 'Sklad | BeKaPaKa Bobolice',
  description: 'Pelny sklad druzyny BeKaPaKa Bobolice.'
}

export default async function RosterPage() {
  const roster = await getRoster()

  return (
    <section className='section-card'>
      <PageHeader title='Sklad druzyny' description='Pelna lista zawodnikow i podstawowe informacje meczowe.' />
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
    </section>
  )
}
