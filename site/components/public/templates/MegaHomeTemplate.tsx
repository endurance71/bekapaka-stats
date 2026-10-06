import Link from 'next/link'
import { formatDate, formatDiffValue, formatPointBalance } from '../../../lib/format'
import { FallbackImage } from '../shared/FallbackImage'
import { NearestEventCalendarActions } from '../home/NearestEventCalendarActions'
import { LiveMatchCard } from '../shared/LiveMatchCard'
import type {
  DataState,
  EventItem,
  GameSummary,
  NearestHighlight,
  NewsPost,
  RosterPlayer,
  SponsorItem,
  TeamStanding
} from '../../../lib/data'
import { selectHeroGame, resolvePresentation } from '../../../../packages/match-presentation'
import { Section } from '../shared/Section'
import { StandingsBoard } from '../shared/StandingsBoard'
import { NewsCard } from '../shared/NewsCard'
import { PlayerCard } from '../shared/PlayerCard'
import { PartnersGrid } from '../sponsors/PartnersGrid'
import { NearestEventCard } from '../home/NearestEventCard'
import { DataStateNotice } from '../shared/DataStateNotice'
import { FsmmSupportSection } from '../support/FsmmSupportSection'
export function MegaHomeTemplate({
  news,
  recentGames,
  allGames = recentGames,
  nearestEvent,
  table,
  roster,
  sponsors,
  newsState,
  tableState,
  eventsState
}: {
  news: NewsPost[]
  recentGames: GameSummary[]
  allGames?: GameSummary[]
  nearestEvent?: NearestHighlight | null
  table: TeamStanding[]
  roster: RosterPlayer[]
  sponsors: SponsorItem[]
  newsState?: DataState<NewsPost[]>
  tableState?: DataState<TeamStanding[]>
  eventsState?: DataState<EventItem[]>
}) {
  void eventsState
  const hero = selectHeroGame(allGames)
  const our = table.find((row) => /bekapaka|bobolice/i.test(row.name))
  const ourPointBalance = our?.pointsDiff != null
    ? formatDiffValue(our.pointsDiff)
    : formatPointBalance(our?.pointsFor, our?.pointsAgainst)
  const results = recentGames
    .filter((game) => resolvePresentation(game).status === 'FINAL')
    .slice(0, 3)
  return (
    <div className="digital-home">
      <div className="ticker">
        <div
          className="container ticker__inner"
          tabIndex={0}
          role="region"
          aria-label="Wyniki i najbliższy mecz, przewijaj poziomo"
        >
          <span className="ticker__label">KALK</span>
          {results.map((game) => (
            <Link
              key={game.id}
              href={`/mecze/kalk-${encodeURIComponent(game.id)}`}
              className="ticker__item"
            >
              <span className="ticker__meta">
                {game.competition}
                {game.round && ` · ${game.round}`} · {formatDate(game.date)}
              </span>
              <span>BeKaPaKa</span>
              <b>{game.scoreUs ?? '—'}</b>
              <span>{game.opponent}</span>
              <b>{game.scoreThem ?? '—'}</b>
            </Link>
          ))}
          {hero && hero.status !== 'FINAL' && (
            <Link href={`/mecze/kalk-${encodeURIComponent(hero.id)}`} className="ticker__item">
              <span className="ticker__meta">Następny · {formatDate(hero.date)}</span>
              <span>BeKaPaKa</span>
              <b>—</b>
              <span>{hero.opponent}</span>
              <b>—</b>
            </Link>
          )}
          {!results.length && !hero && <p>Wyniki pojawią się po potwierdzeniu terminarza.</p>}
        </div>
      </div>
      <Section tight>
        <h1 className="sr-only">BeKaPaKa Bobolice — koszykówka</h1>
        <div className="bento">
          <div className="bento__main">
            {hero ? (
              <LiveMatchCard
                game={{
                  ...hero,
                  opponentLogoUrl: table.find(
                    (row) => row.name.toLocaleLowerCase() === hero.opponent.toLocaleLowerCase()
                  )?.logoUrl
                }}
                hero
                actions={
                  <>
                    {hero.status === 'SCHEDULED' && (
                      <NearestEventCalendarActions
                        primary
                        highlight={{ source: 'kalk', at: hero.date, game: hero }}
                      />
                    )}
                    <Link
                      className="btn btn--secondary"
                      href={`/mecze/kalk-${encodeURIComponent(hero.id)}`}
                    >
                      Szczegóły meczu
                    </Link>
                  </>
                }
              />
            ) : nearestEvent?.source === 'cms' ? (
              <NearestEventCard highlight={nearestEvent} />
            ) : (
              <div className="tile">
                <div className="tile__body">
                  <p className="label accent">BeKaPaKa Bobolice</p>
                  <h2>Czekamy na kolejny mecz</h2>
                  <p>Termin i rywal pojawią się po potwierdzeniu terminarza.</p>
                  <Link className="btn btn--primary" href="/mecze">
                    Zobacz mecze
                  </Link>
                </div>
              </div>
            )}
          </div>
          <Link className="bento__side tile position-tile" href="/tabela">
            <div className="tile__body">
              <span className="position-tile__label">Tabela KALK</span>
              {our ? (
                <>
                  <div className="position-tile__rank">
                    <span className="tile__big brand-cut" aria-hidden="true">
                      {our.position}
                    </span>
                    <div>
                      <h2 className="tile__title">Miejsce</h2>
                      <p>
                        {our.points ?? '—'} pkt · {our.matches ?? our.wins + our.losses} {our.matches === 1 ? 'mecz' : 'meczów'} ·{' '}
                        <span className="position-tile__balance" aria-label={`Bilans punktów: ${ourPointBalance}`}>+/− {ourPointBalance}</span>
                      </p>
                    </div>
                  </div>
                  <span className="sr-only">
                    BeKaPaKa: {our.position}. miejsce w tabeli KALK, bilans {our.wins}–{our.losses}
                  </span>
                </>
              ) : (
                <p>Tabela czeka na dane ligi.</p>
              )}
              <span className="tile__link">Pełna tabela</span>
            </div>
          </Link>
          {news[0] ? (
            <Link className="bento__side tile story-tile" href={`/aktualnosci/${news[0].slug}`}>
              {news[0].coverImageUrl && (
                <div className="tile__bg">
                  <FallbackImage
                    src={news[0].coverImageUrl}
                    width={news[0].coverImageWidth || 800}
                    height={news[0].coverImageHeight || 600}
                    sizes="(min-width:1024px) 33vw, 100vw"
                    alt=""
                  />
                </div>
              )}
              <div className="tile__body">
                <span className="label accent">Ostatnia relacja</span>
                <h2 className="tile__title">{news[0].title}</h2>
                <time dateTime={news[0].publishedAt}>{formatDate(news[0].publishedAt)}</time>
              </div>
            </Link>
          ) : (
            <div className="bento__side tile">
              <div className="tile__body">
                <span className="label accent">Ostatnia relacja</span>
                <p>Relacje pojawią się po publikacji.</p>
              </div>
            </div>
          )}
        </div>
      </Section>
      <Section
        tone="paper"
        tag="Aktualności"
        title="Z klubu"
        titleId="h-news"
        link={<Link href="/aktualnosci" className="btn btn--text">Wszystkie aktualności</Link>}
      >
        {newsState && <DataStateNotice {...newsState} />}
        <div className="news-grid">
          {news.slice(0, 3).map((item) => (
            <NewsCard key={item.id} item={item} compact />
          ))}
        </div>
        {!news.length && <p>Nowe relacje pojawią się tutaj po publikacji.</p>}
      </Section>
      <Section
        tag={tableState?.meta?.season?.label || 'KALK'}
        title="Sezon i drużyna"
        titleId="h-liga"
      >
        <div className="home-sport-grid">
          <div className="home-sport-col home-sport-table">
            <div className="home-sport-head">
              <div className="home-sport-head__title">
                <span className="tag tag--accent">Rozgrywki</span>
                <h3 className="home-sport-heading">Tabela KALK</h3>
              </div>
              <Link href="/tabela" className="btn btn--text home-sport-more-btn">
                Pełna tabela
                <svg
                  className="ico"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            {tableState && <DataStateNotice {...tableState} />}
            <StandingsBoard table={table} compact />
          </div>
          <div className="home-sport-col home-sport-roster">
            <div className="home-sport-head">
              <div className="home-sport-head__title">
                <span className="tag tag--accent">Drużyna</span>
                <h3 className="home-sport-heading">Nasi liderzy</h3>
              </div>
              <Link href="/sklad" className="btn btn--text">Pełny skład</Link>
            </div>
            <div className="home-roster-grid">
              {[...roster]
                .sort((a, b) => ((b.ppg || 0) - (a.ppg || 0)) || ((b.eval || 0) - (a.eval || 0)))
                .slice(0, 4)
                .map(player => <PlayerCard key={player.id} player={player} showStats />)}
            </div>
            {!roster.length && <p>Skład pojawi się po potwierdzeniu danych.</p>}
          </div>
        </div>
      </Section>
      <Section
        tag="Dziękujemy"
        title="Partnerzy klubu"
        titleId="h-pz"
        link={<Link href="/sponsorzy" className="btn btn--text">Poznaj partnerów</Link>}
      >
        <PartnersGrid sponsors={sponsors} compact />
      </Section>
      <p className="container"><Link className="btn btn--text" href="/klub">Drużyna, relacje i kontakt — poznaj klub →</Link></p>
      <FsmmSupportSection variant="home" />
    </div>
  )
}
