import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '../../../components/public-site'
import { getEvents, getSiteMetadataBase, type EventItem } from '../../../lib/data'
import { formatDateTime } from '../../../lib/format'

type Params = { slug: string }

async function getEventBySlug(slug: string): Promise<EventItem | null> {
  const items = await getEvents(200)
  return items.find((item) => item.slug === slug) || null
}

export async function generateStaticParams() {
  const items = await getEvents(100)
  return items.map((item) => ({ slug: item.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const item = await getEventBySlug(params.slug)
  if (!item) return { title: 'Wydarzenie | BeKaPaKa Bobolice' }
  return {
    ...getSiteMetadataBase(),
    title: `${item.title} | BeKaPaKa Bobolice`,
    description: item.description || 'Szczegoly wydarzenia BeKaPaKa Bobolice'
  }
}

export default async function EventDetailPage({ params }: { params: Params }) {
  const item = await getEventBySlug(params.slug)
  if (!item) notFound()

  return (
    <article className='section-card article-detail'>
      <Breadcrumbs items={[{ label: 'Start', href: '/' }, { label: 'Wydarzenia', href: '/wydarzenia' }, { label: item.title }]} />
      <p className='eyebrow'>Wydarzenie</p>
      <h1>{item.title}</h1>
      <p className='muted'>{formatDateTime(item.startAt)}{item.location ? ` | ${item.location}` : ''}</p>
      {item.description ? <p>{item.description}</p> : null}
      {item.registrationUrl ? (
        <p>
          <a href={item.registrationUrl} target='_blank' rel='noreferrer'>
            Rejestracja
          </a>
        </p>
      ) : null}
    </article>
  )
}
