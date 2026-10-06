import { serializeJsonLd } from '../../../lib/json-ld'
import { getAllEvents } from '../../../lib/data/cms'
import { getGameByIdState } from '../../../lib/data/backend'
import { LiveMatchCard } from '../../../components/public/shared/LiveMatchCard'
import { MatchDrawerContent } from '../MatchDrawerContent'
import { NearestEventCalendarActions } from '../../../components/public/home/NearestEventCalendarActions'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EditorialDetailTemplate } from '../../../components/public/templates/EditorialDetailTemplate'
import { getEvents, getSiteMetadataBase, type EventItem } from '../../../lib/data'
import { formatDateTime } from '../../../lib/format'

type Params = { slug: string }

async function getMatchBySlug(slug: string): Promise<EventItem | null> {
  const items = await getAllEvents()
  return items.find((item) => item.slug === slug) || null
}

export async function generateStaticParams() {
  const items = await getEvents(100)
  return items.map((item) => ({ slug: item.slug }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  if (slug.startsWith('kalk-')) {
    const game = (await getGameByIdState(slug.slice(5))).data
    return {
      title: game ? `BeKaPaKa — ${game.opponent}` : 'Mecz BeKaPaKa',
      alternates: { canonical: `/mecze/${slug}` },
      openGraph: {
        images: [
          {
            url: `/api/og?type=match&id=${encodeURIComponent(slug.slice(5))}`,
            width: 1200,
            height: 630
          }
        ]
      }
    }
  }
  const item = await getMatchBySlug(slug)
  if (!item) return { title: 'Mecz | BeKaPaKa Bobolice' }
  return {
    ...getSiteMetadataBase(),
    alternates: { canonical: `/mecze/${slug}` },
    title: `${item.title} | BeKaPaKa Bobolice`,
    description: item.description || 'Szczegóły wydarzenia BeKaPaKa Bobolice',
    openGraph: {
      ...getSiteMetadataBase().openGraph,
      images: [
        { url: `/api/og?type=event&id=${encodeURIComponent(item.slug)}`, width: 1200, height: 630 }
      ]
    }
  }
}

export default async function MatchDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  if (slug.startsWith('kalk-')) {
    const game = (await getGameByIdState(slug.slice(5))).data
    if (!game) notFound()
    const isFinal = game.status === 'FINAL' || (!game.status && !!game.result)
    const parentHref = isFinal ? '/mecze?widok=wyniki' : '/mecze'
    return (
      <EditorialDetailTemplate
        sectionLabel="Mecze"
        theme="plyta"
        title={`BeKaPaKa — ${game.opponent}`}
        parentHref={parentHref}
        share
        content={
          <>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: serializeJsonLd({
                  '@context': 'https://schema.org',
                  '@type': 'SportsEvent',
                  name: `BeKaPaKa — ${game.opponent}`,
                  startDate: game.date,
                  sport: 'Basketball',
                  eventStatus:
                    game.status === 'CANCELLED'
                      ? 'https://schema.org/EventCancelled'
                      : game.status === 'POSTPONED'
                        ? 'https://schema.org/EventPostponed'
                        : 'https://schema.org/EventScheduled',
                  location: { '@type': 'Place', name: game.venue || 'KOSiR Koszalin' },
                  competitor: [
                    { '@type': 'SportsTeam', name: 'BeKaPaKa Bobolice' },
                    { '@type': 'SportsTeam', name: game.opponent }
                  ]
                })
              }}
            />
            <LiveMatchCard game={game} />
            {game.status === 'SCHEDULED' && (
              <NearestEventCalendarActions highlight={{ source: 'kalk', at: game.date, game }} />
            )}
            <MatchDrawerContent game={game} hideScoreHeader />
          </>
        }
      />
    )
  }
  const item = await getMatchBySlug(slug)
  if (!item) notFound()

  return (
    <EditorialDetailTemplate
      sectionLabel="Mecze"
      title={item.title}
      meta={`${formatDateTime(item.startAt)}${item.location ? ` | ${item.location}` : ''}`}
      parentHref="/mecze"
      content={
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: serializeJsonLd({
                '@context': 'https://schema.org',
                '@type': 'SportsEvent',
                name: item.title,
                startDate: item.startAt,
                endDate: item.endAt,
                location: { '@type': 'Place', name: item.location },
                organizer: { '@type': 'SportsOrganization', name: 'BeKaPaKa Bobolice' }
              })
            }}
          />
          {item.description ? <p style={{ whiteSpace: 'pre-wrap' }}>{item.description}</p> : null}
          {item.registrationUrl ? (
            <p>
              <a href={item.registrationUrl} target="_blank" rel="noreferrer">
                Rejestracja
              </a>
            </p>
          ) : null}
        </>
      }
    />
  )
}
