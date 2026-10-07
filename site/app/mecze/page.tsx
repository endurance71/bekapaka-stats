import type { Metadata } from 'next'
import Link from 'next/link'
import { resolvePresentation, selectHeroGame } from '../../../packages/match-presentation'
import { FixtureRow } from '../../components/public/match/FixtureRow'
import { ScoreBoard } from '../../components/public/match/ScoreBoard'
import { ArrowLink } from '../../components/public/primitives/ArrowLink'
import { PositionSummary } from '../../components/public/shared/PositionSummary'
import { StandingsBoard } from '../../components/public/shared/StandingsBoard'
import { ListingTemplate } from '../../components/public/templates/ListingTemplate'
import { getLeagueTableState, getRecentGamesState, getSiteMetadataBase, type GameSummary } from '../../lib/data'
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
  const [gamesState, tableState] = await Promise.all([getRecentGamesState(100), getLeagueTableState()])
  const logos = new Map(tableState.data.map((row) => [row.name.toLocaleLowerCase(), row.logoUrl || undefined]))
  const games = gamesState.data
    .filter((game) =>
      results
        ? resolvePresentation(game).status === 'FINAL'
        : resolvePresentation(game).status !== 'FINAL'
    )
    .sort((a, b) =>
      results ? Date.parse(b.date) - Date.parse(a.date) : Date.parse(a.date) - Date.parse(b.date)
    )
    .map((game) => ({ ...game, opponentLogoUrl: game.opponentLogoUrl || logos.get(game.opponent.toLocaleLowerCase()) }))
  const withLogo = (game: GameSummary) => ({ ...game, opponentLogoUrl: game.opponentLogoUrl || logos.get(game.opponent.toLocaleLowerCase()) })
  const finals = gamesState.data.filter((game) => resolvePresentation(game).status === 'FINAL').sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
  const next = selectHeroGame(gamesState.data)
  const complementGame = results ? (next && next.status !== 'FINAL' ? next : null) : finals[0] || null
  const complement = complementGame ? withLogo(complementGame) : null

  return (
    <ListingTemplate
      kicker="KALK · KOSiR Koszalin"
      title="Mecze"
      lead="Terminarz i wyniki BeKaPaKa Bobolice. Wszystkie mecze KALK gramy w hali KOSiR w Koszalinie — wstęp wolny."
      headerExtra={
        <nav className="tabs" aria-label="Widok meczów">
          <Link href="/mecze" aria-current={!results ? 'page' : undefined}>
            Terminarz
          </Link>
          <Link href="/mecze?widok=wyniki" aria-current={results ? 'page' : undefined}>
            Wyniki
          </Link>
        </nav>
      }
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
      {games.length ? (
        <MatchesList games={games} />
      ) : (
        <p className="empty-line">
          {results ? 'Nie ma jeszcze potwierdzonych wyników.' : 'Czekamy na kolejne terminy meczów.'}{' '}
          <Link href={results ? '/mecze' : '/mecze?widok=wyniki'}>{results ? 'Zobacz terminarz' : 'Zobacz wyniki'}</Link>
        </p>
      )}
      {(complement || tableState.data.length > 0) && (
        <div className="fixtures-complement split split--7-5">
          {complement ? (
            <section className="fixtures-complement__main" aria-labelledby="h-complement">
              <p className="kicker">{results ? 'Kiedy gramy?' : 'Jak poszło?'}</p>
              <h2 id="h-complement" className="band-head__title">{results ? 'Najbliższy mecz' : 'Ostatni wynik'}</h2>
              {results ? (
                <ul className="rule-list" role="list">
                  <li>
                    <FixtureRow game={complement} />
                  </li>
                </ul>
              ) : (
                <>
                  <ScoreBoard game={complement} size="md" />
                  <ArrowLink href={`/mecze/kalk-${encodeURIComponent(complement.id)}`}>Statystyki i przebieg meczu</ArrowLink>
                </>
              )}
            </section>
          ) : (
            <div />
          )}
          {tableState.data.length > 0 && (
            <section className="fixtures-complement__table" aria-label="Tabela KALK">
              <PositionSummary table={tableState.data} kicker="Tabela KALK" />
              <StandingsBoard table={tableState.data} compact />
              <ArrowLink href="/tabela">Pełna tabela</ArrowLink>
            </section>
          )}
        </div>
      )}
    </ListingTemplate>
  )
}
