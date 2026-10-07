import Link from 'next/link'
import type { DataState, GameSummary, NearestHighlight, NewsPost, RosterPlayer, SponsorItem, TeamStanding } from '../../../lib/data'
import { FSMM_SUPPORT } from '../../../lib/fsmm-support'
import { resolvePresentation, selectHeroGame } from '../../../../packages/match-presentation'
import { NearestEventCalendarActions } from '../home/NearestEventCalendarActions'
import { EventHero } from '../match/EventHero'
import { ScoreBoard } from '../match/ScoreBoard'
import { Story } from '../news/Story'
import { ArrowLink } from '../primitives/ArrowLink'
import { Band } from '../primitives/Band'
import { BandHead } from '../primitives/BandHead'
import { DataStateNotice } from '../shared/DataStateNotice'
import { LiveMatchCard } from '../shared/LiveMatchCard'
import { PositionSummary } from '../shared/PositionSummary'
import { StandingsBoard } from '../shared/StandingsBoard'
import { isBekapakaRow } from '../../../lib/navigation'
import { PartnersGrid } from '../sponsors/PartnersGrid'
import { RosterIndex } from '../team/RosterIndex'
import { StatLeaders, selectLeaders } from '../team/StatLeaders'

function logoFor(table: TeamStanding[], opponent: string) {
  return table.find((row) => row.name.toLocaleLowerCase() === opponent.toLocaleLowerCase())?.logoUrl || undefined
}

/**
 * Strona główna jako program meczowy — pięć pytań kibica z Brandbooka 2.0, w tej kolejności:
 * Kiedy gramy? → Jak poszło? → Co się wydarzyło? → Kto gra? → Kto nas wspiera?
 */
export function HomeTemplate({
  news,
  recentGames,
  allGames = recentGames,
  nearestEvent,
  table,
  roster,
  sponsors,
  newsState,
  tableState
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
}) {
  const hero = selectHeroGame(allGames)
  const lastResult = recentGames.find((game) => resolvePresentation(game).status === 'FINAL')
  const showResult = lastResult && lastResult.id !== hero?.id
  const own = table.find((row) => isBekapakaRow(row.name))
  const pinned = news.findIndex((item) => item.isPinned)
  const leadIndex = pinned >= 0 ? pinned : 0
  const lead = news[leadIndex]
  const rest = news.filter((_, index) => index !== leadIndex)
  const hasLeaders = selectLeaders(roster).length > 0

  return (
    <div className="home">
      <h1 className="sr-only">BeKaPaKa Bobolice — koszykówka z Bobolic</h1>

      {/* 1 · Kiedy gramy? */}
      {hero ? (
        <LiveMatchCard
          game={{ ...hero, opponentLogoUrl: hero.opponentLogoUrl || logoFor(table, hero.opponent) }}
          kicker={hero.status === 'FINAL' ? 'Ostatni mecz' : undefined}
          priority
          actions={
            <>
              {hero.status === 'SCHEDULED' && (
                <NearestEventCalendarActions primary highlight={{ source: 'kalk', at: hero.date, game: hero }} />
              )}
              <Link className="btn btn--secondary" href={`/mecze/kalk-${encodeURIComponent(hero.id)}`}>
                Szczegóły meczu
              </Link>
            </>
          }
        />
      ) : nearestEvent?.source === 'cms' ? (
        <EventHero highlight={nearestEvent} />
      ) : (
        <Band size="lg" label="Najbliższy mecz">
          <BandHead kicker="Kiedy gramy?" title="Czekamy na terminarz" action={<ArrowLink href="/mecze">Mecze i wyniki</ArrowLink>}>
            Termin i rywal pojawią się tutaj po potwierdzeniu przez ligę.
          </BandHead>
        </Band>
      )}

      {/* 2 · Jak poszło? */}
      {(showResult || own) && (
        <Band labelledBy="h-wynik" className="home-result">
          <div className="split split--7-5">
            {showResult && lastResult ? (
              <div className="home-result__score">
                <BandHead
                  kicker="Jak poszło?"
                  title="Ostatni wynik"
                  titleId="h-wynik"
                  action={<ArrowLink href="/mecze?widok=wyniki">Wszystkie wyniki</ArrowLink>}
                />
                <ScoreBoard game={{ ...lastResult, opponentLogoUrl: lastResult.opponentLogoUrl || logoFor(table, lastResult.opponent) }} />
                <ArrowLink href={`/mecze/kalk-${encodeURIComponent(lastResult.id)}`}>Statystyki i przebieg meczu</ArrowLink>
              </div>
            ) : (
              <BandHead kicker="Jak poszło?" title="Sezon KALK" titleId="h-wynik">
                Wyniki pojawią się po pierwszym meczu sezonu.
              </BandHead>
            )}
            <div className="home-result__table">
              <PositionSummary table={table} kicker={`Tabela KALK${tableState?.meta?.season?.label ? ` · ${tableState.meta.season.label}` : ''}`} />
              {tableState && <DataStateNotice {...tableState} />}
              {table.length > 0 && <StandingsBoard table={table} compact />}
              <ArrowLink href="/tabela">Pełna tabela</ArrowLink>
            </div>
          </div>
        </Band>
      )}

      {/* 3 · Co się wydarzyło? */}
      <Band theme="papier" labelledBy="h-news" className="home-news">
        <BandHead kicker="Co się wydarzyło?" title="Aktualności" titleId="h-news" action={<ArrowLink href="/aktualnosci">Wszystkie aktualności</ArrowLink>} />
        {newsState && <DataStateNotice {...newsState} />}
        {lead ? (
          <div className="newsroom">
            <div className="newsroom__lead">
              <Story item={lead} variant="lead" />
            </div>
            {rest.length > 0 && (
              <div className="newsroom__aside">
                <ul className="newsroom__side rule-list" role="list">
                  {rest.slice(0, 2).map((item) => (
                    <li key={item.id}>
                      <Story item={item} variant="item" />
                    </li>
                  ))}
                </ul>
                {rest.length > 2 && (
                  <div className="newsroom__feed">
                    <p className="t-label muted">Wcześniej</p>
                    <ul className="rule-list" role="list">
                      {rest.slice(2, 5).map((item) => (
                        <li key={item.id}>
                          <Story item={item} variant="row" />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="empty-line">Nowe relacje pojawią się tutaj po publikacji.</p>
        )}
      </Band>

      {/* 4 · Kto gra? */}
      <Band labelledBy="h-team" className="home-team">
        <BandHead
          kicker="Kto gra?"
          title={hasLeaders ? 'Liderzy sezonu' : 'Skład drużyny'}
          titleId="h-team"
          action={<ArrowLink href="/sklad">{roster.length ? `Cały skład · ${roster.length}` : 'Skład'}</ArrowLink>}
        >
          {roster[0]?.seasonLabel ? `${roster[0].seasonLabel} · KALK` : 'KALK · Koszalińska Amatorska Liga Koszykówki'}
        </BandHead>
        {hasLeaders ? <StatLeaders roster={roster} after={<RosterIndex roster={roster} />} /> : <p className="empty-line">Statystyki pojawią się po pierwszym meczu sezonu.</p>}
      </Band>

      {/* 5 · Kto nas wspiera? */}
      <Band theme="papier" labelledBy="h-partners" className="home-partners">
        <BandHead kicker="Kto nas wspiera?" title="Partnerzy klubu" titleId="h-partners" action={<ArrowLink href="/sponsorzy">Poznaj partnerów</ArrowLink>}>
          Dzięki nim gramy w lidze i organizujemy turnieje w Bobolicach.
        </BandHead>
        <PartnersGrid sponsors={sponsors} compact />
        <div className="support-invite">
          <div className="support-invite__item">
            <p className="t-label">1,5% podatku</p>
            <p className="support-invite__value">
              KRS <span className="tnum">{FSMM_SUPPORT.krs}</span>
              <br />
              cel <span className="tnum">{FSMM_SUPPORT.purposeCode}</span>
            </p>
            <ArrowLink href="/klub#wsparcie">Jak przekazać 1,5%</ArrowLink>
          </div>
          <div className="support-invite__item">
            <p className="t-label">Darowizna</p>
            <p className="support-invite__text">Przelew na konto stowarzyszenia — numer i kod QR znajdziesz na stronie klubu.</p>
            <ArrowLink href="/klub#wsparcie">Wesprzyj przelewem</ArrowLink>
          </div>
          <div className="support-invite__item">
            <p className="t-label">Dla firm</p>
            <p className="support-invite__text">Chcesz, żeby Twoja firma była z nami na parkiecie? Porozmawiajmy.</p>
            <ArrowLink href="/sponsorzy#wspolpraca">Zostań partnerem</ArrowLink>
          </div>
        </div>
      </Band>
    </div>
  )
}
