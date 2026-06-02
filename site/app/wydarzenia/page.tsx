import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '../../components/public-site'
import { getEvents, getSiteMetadataBase } from '../../lib/data'
import { formatDateTime } from '../../lib/format'

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  title: 'Wydarzenia | BeKaPaKa Bobolice',
  description: 'Kalendarz wydarzen i meczow BeKaPaKa Bobolice.'
}

export default async function EventsPage() {
  const events = await getEvents(24)

  return (
    <section className='section-card'>
      <PageHeader title='Wydarzenia' description='Sprawdz najblizsze mecze, turnieje i wydarzenia klubowe.' />
      <div className='stack-list'>
        {events.length === 0 ? (
          <p>Brak wydarzen.</p>
        ) : (
          events.map((event) => (
            <article key={event.id} className='list-row'>
              <span className='pill'>{event.type}</span>
              <div>
                <h2>{event.title}</h2>
                <p className='muted'>{formatDateTime(event.startAt)}{event.location ? ` | ${event.location}` : ''}</p>
                {event.description ? <p>{event.description}</p> : null}
                {event.registrationUrl ? (
                  <a href={event.registrationUrl} target='_blank' rel='noreferrer'>
                    Rejestracja
                  </a>
                ) : null}
                <p>
                  <Link href={`/wydarzenia/${event.slug}`}>Szczegoly wydarzenia</Link>
                </p>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
