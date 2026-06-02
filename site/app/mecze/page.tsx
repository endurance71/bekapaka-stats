import type { Metadata } from 'next'
import Link from 'next/link'
import { EditorialListingTemplate } from '../../components/public/templates/EditorialListingTemplate'
import { getEvents, getSiteMetadataBase } from '../../lib/data'
import { formatDateTime } from '../../lib/format'

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  title: 'Mecze | BeKaPaKa Bobolice',
  description: 'Kalendarz meczowy i wydarzenia druzyny BeKaPaKa Bobolice.'
}

export default async function MatchesPage() {
  const events = await getEvents(24)

  return (
    <EditorialListingTemplate
      title='Mecze i wydarzenia'
      description='Terminarz spotkan, turniejow i wydarzen klubowych.'
      hasItems={events.length > 0}
      emptyTitle='Brak zaplanowanych meczow'
      emptyDescription='Dodaj wydarzenia w CMS, aby wyswietlic terminarz.'
    >
      <div className='stack-list'>
        {events.map((event) => (
          <article key={event.id} className='list-row'>
            <span className='pill'>{event.type}</span>
            <div>
              <h2>{event.title}</h2>
              <p className='muted'>{formatDateTime(event.startAt)}{event.location ? ` | ${event.location}` : ''}</p>
              {event.description ? <p>{event.description}</p> : null}
              <p><Link href={`/mecze/${event.slug}`}>Szczegoly meczu</Link></p>
            </div>
          </article>
        ))}
      </div>
    </EditorialListingTemplate>
  )
}
