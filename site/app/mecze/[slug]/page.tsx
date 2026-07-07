import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EditorialDetailTemplate } from '../../../components/public/templates/EditorialDetailTemplate'
import { getEvents, getSiteMetadataBase, type EventItem } from '../../../lib/data'
import { formatDateTime } from '../../../lib/format'

type Params = { slug: string }

async function getMatchBySlug(slug: string): Promise<EventItem | null> {
  const items = await getEvents(200)
  return items.find((item) => item.slug === slug) || null
}

export async function generateStaticParams() {
  const items = await getEvents(100)
  return items.map((item) => ({ slug: item.slug }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const item = await getMatchBySlug(slug)
  if (!item) return { title: 'Mecz | BeKaPaKa Bobolice' }
  return {
    ...getSiteMetadataBase(),
    title: `${item.title} | BeKaPaKa Bobolice`,
    description: item.description || 'Szczegoly meczu BeKaPaKa Bobolice'
  }
}

export default async function MatchDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const item = await getMatchBySlug(slug)
  if (!item) notFound()

  return (
    <EditorialDetailTemplate
      sectionLabel='Mecze'
      title={item.title}
      meta={`${formatDateTime(item.startAt)}${item.location ? ` | ${item.location}` : ''}`}
      parentHref='/mecze'
      content={
        <>
          {item.description ? <p style={{ whiteSpace: 'pre-wrap' }}>{item.description}</p> : null}
          {item.registrationUrl ? (
            <p>
              <a href={item.registrationUrl} target='_blank' rel='noreferrer'>
                Rejestracja
              </a>
            </p>
          ) : null}
        </>
      }
    />
  )
}
