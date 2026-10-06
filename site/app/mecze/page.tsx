import type { Metadata } from 'next'
import Link from 'next/link'
import { resolvePresentation } from '../../../packages/match-presentation'
import { EditorialListingTemplate } from '../../components/public/templates/EditorialListingTemplate'
import { getRecentGamesState, getSiteMetadataBase } from '../../lib/data'
import { MatchesList } from './MatchesList'

export const revalidate = 60

export const metadata: Metadata = {
  ...getSiteMetadataBase(),
  alternates: { canonical: '/mecze' },
  title: 'Mecze | BeKaPaKa Bobolice',
  description: 'Terminarz spotkań i wyniki meczów drużyny BeKaPaKa Bobolice.'
}

export default async function MatchesPage({
  searchParams
}: {
  searchParams: Promise<{ widok?: string }>
}) {
  const results = (await searchParams).widok === 'wyniki'
  const gamesState = await getRecentGamesState(100)
  const games = gamesState.data
    .filter((game) =>
      results
        ? resolvePresentation(game).status === 'FINAL'
        : resolvePresentation(game).status !== 'FINAL'
    )
    .sort((a, b) =>
      results ? Date.parse(b.date) - Date.parse(a.date) : Date.parse(a.date) - Date.parse(b.date)
    )

  return (
    <EditorialListingTemplate
      title="Terminarz i wyniki"
      eyebrow="KALK · KOSiR Koszalin"
      description="Terminarz i wyniki BeKaPaKa Bobolice. Mecze KALK — wstęp wolny."
      hasItems={gamesState.status !== 'error'}
      stateStatus={gamesState.status}
      stateSource={gamesState.source}
      stateMessage={gamesState.message}
      emptyTitle={gamesState.status === 'error' ? 'Błąd pobierania meczów' : 'Brak meczów'}
      emptyDescription={
        gamesState.status === 'error'
          ? 'Odśwież stronę lub wróć za chwilę.'
          : 'Terminarz i wyniki pojawią się automatycznie po dodaniu danych.'
      }
    >
      <nav className="sport-tabs" aria-label="Widok meczów">
        <Link href="/mecze" aria-current={!results ? 'page' : undefined}>
          Terminarz
        </Link>
        <Link href="/mecze?widok=wyniki" aria-current={results ? 'page' : undefined}>
          Wyniki
        </Link>
      </nav>
      {!games.length && (
        <p>
          {results
            ? 'Nie ma jeszcze potwierdzonych wyników.'
            : 'Czekamy na kolejne terminy meczów.'}
        </p>
      )}
      <div className="listing-panel">
        <MatchesList games={games} />
      </div>
    </EditorialListingTemplate>
  )
}
