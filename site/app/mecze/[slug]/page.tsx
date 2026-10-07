import { serializeJsonLd } from '../../../lib/json-ld'
import { getAllEvents } from '../../../lib/data/cms'
import { getLeagueTableState } from '../../../lib/data/backend'
import { getGameByIdState } from '../../../lib/data/backend'
import { LiveMatchCard } from '../../../components/public/shared/LiveMatchCard'
import { resolvePresentation } from '../../../../packages/match-presentation'
import { MatchDrawerContent } from '../MatchDrawerContent'
import { NearestEventCalendarActions } from '../../../components/public/home/NearestEventCalendarActions'
import { Breadcrumbs } from '../../../components/public/primitives/PageHeader'
import { ShareActions } from '../../../components/public/shared/ShareActions'
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
    const state = await getGameByIdState(slug.slice(5))
    if (state.status === 'error') throw new Error('Nie udało się pobrać szczegółów meczu')
    const game = state.data
    if (!game) notFound()
    const table = (await getLeagueTableState()).data
    game.opponentLogoUrl ||= table.find(row => row.name.toLocaleLowerCase() === game.opponent.toLocaleLowerCase())?.logoUrl || undefined
    const isFinal = game.status === 'FINAL' || (!game.status && !!game.result)
    // Mecz przed rozpoczęciem (z uwzględnieniem statusu ustawionego w panelu).
    const upcoming = resolvePresentation(game).status === 'SCHEDULED'
    const parentHref = isFinal ? '/mecze?widok=wyniki' : '/mecze'
    return (
      <div className="match-page" data-theme="plyta">
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
        <div className="container match-detail__crumbs">
          <Breadcrumbs items={[{ label: 'Start', href: '/' }, { label: 'Mecze', href: parentHref }, { label: `BeKaPaKa — ${game.opponent}` }]} />
        </div>
        <LiveMatchCard
          game={
            upcoming && !resolvePresentation(game).statusMessage
              ? { ...game, statusMessage: 'Statystyki i przebieg meczu pojawią się po końcowej syrenie.' }
              : game
          }
          heading="h1"
          priority
          actions={
            <>
              {game.status === 'SCHEDULED' && <NearestEventCalendarActions primary highlight={{ source: 'kalk', at: game.date, game }} />}
              <ShareActions />
            </>
          }
        />
        {/* Przed meczem nie ma czego pokazać — informacja jest w hero, bez pustej sekcji między paskami. */}
        {!upcoming && (
          <section className="match-detail" aria-label="Statystyki meczu">
            <div className="container">
              <MatchDrawerContent game={game} hideScoreHeader />
            </div>
          </section>
        )}
      </div>
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
