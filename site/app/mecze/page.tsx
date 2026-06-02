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
            <span className='pill' style={{ display: 'inline-flex', alignSelf: 'center', background: event.type === 'match' ? 'var(--bkp-crimson)' : 'var(--bkp-slate)' }}>
              {event.type}
            </span>
            <div>
              <h2 style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: '1.8rem', margin: '0 0 6px', letterSpacing: '0.02em' }}>
                {event.title}
              </h2>
              <p className='muted' style={{ margin: '0 0 8px', fontSize: '0.9rem' }}>
                📅 {formatDateTime(event.startAt)} {event.location ? ` | 📍 ${event.location}` : ''}
              </p>
              {event.description ? <p style={{ margin: '8px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{event.description}</p> : null}
              <div style={{ marginTop: '12px' }}>
                <Link href={`/mecze/${event.slug}`} className='button button--ghost' style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', minHeight: '36px', padding: '8px 16px', display: 'inline-flex' }}>
                  Szczegóły
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </EditorialListingTemplate>
  )
}
