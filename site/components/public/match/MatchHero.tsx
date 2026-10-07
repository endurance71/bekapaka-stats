import type { ReactNode } from 'react'
import type { GameSummary } from '../../../lib/data/schemas'
import { resolvePresentation } from '../../../../packages/match-presentation'
import { formatDateTime } from '../../../lib/format'
import { mapsHref, matchDateParts, nameVars } from '../../../lib/match-format'
import { Countdown } from '../home/Countdown'
import { FallbackImage } from '../shared/FallbackImage'
import { JerseyStripes } from '../primitives/JerseyStripes'
import { Score, resultLabel } from './Score'
import { TeamMark, VersusMark } from './TeamMark'

const statusLabels = {
  SCHEDULED: 'Najbliższy mecz',
  LIVE: 'Na żywo',
  BREAK: 'Przerwa',
  FINAL: 'Koniec meczu',
  POSTPONED: 'Mecz przełożony',
  CANCELLED: 'Mecz odwołany'
} as const

/**
 * Hero meczu: rywalizacja w skali Display XL po lewej, termin albo wynik po prawej.
 * Jeden komponent dla strony głównej (najbliższy mecz) i szczegółów meczu (każdy stan).
 */
export function MatchHero({
  game: source,
  heading = 'h2',
  kicker,
  actions,
  priority = false
}: {
  game: GameSummary
  heading?: 'h1' | 'h2'
  kicker?: string
  actions?: ReactNode
  priority?: boolean
}) {
  const game = resolvePresentation(source)
  const date = matchDateParts(game.date)
  const hasScore =
    game.scoreUs != null && game.scoreThem != null && ['LIVE', 'BREAK', 'FINAL'].includes(game.status)
  const uncertain = game.status === 'POSTPONED' && !game.newDate
  const Heading = heading
  const competition = [game.competition, game.round].filter(Boolean).join(' · ')

  return (
    <article className="match-hero" data-status={game.status.toLowerCase()} data-kit={game.kit === 'B' ? 'B' : undefined}>
      <div className="match-hero__media" aria-hidden="true">
        <FallbackImage
          src="/brand/photography/arena.webp"
          width={1600}
          height={900}
          sizes="100vw"
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          preload={priority}
          alt=""
        />
      </div>
      <div className="container match-hero__inner">
        <div className="match-hero__top">
          <p className={`kicker${['LIVE', 'BREAK'].includes(game.status) ? ' kicker--live' : ''}`}>
            {kicker || statusLabels[game.status]}
          </p>
          {competition && <p className="match-hero__competition">{competition}</p>}
        </div>

        <div className="match-hero__grid">
          <Heading className="match-hero__teams">
            <span className="match-hero__team" style={nameVars('BeKaPaKa')}>
              <TeamMark own name="BeKaPaKa" size="lg" />
              <span className="match-hero__name">BeKaPaKa</span>
            </span>
            <span className="match-hero__versus">
              <VersusMark />
              <span className="match-hero__vs">vs</span>
            </span>
            <span className="match-hero__team" style={nameVars(game.opponent)}>
              <TeamMark name={game.opponent} logoUrl={source.opponentLogoUrl} size="lg" />
              <span className="match-hero__name">{game.opponent}</span>
            </span>
          </Heading>

          <div className="match-hero__panel">
            {hasScore ? (
              <div className="match-hero__result">
                <Score us={game.scoreUs as number} them={game.scoreThem as number} opponent={game.opponent} size="xl" />
                <p className="match-hero__outcome">
                  {game.status === 'FINAL'
                    ? resultLabel(game.scoreUs as number, game.scoreThem as number)
                    : [statusLabels[game.status], game.quarter].filter(Boolean).join(' · ')}
                </p>
              </div>
            ) : game.status === 'CANCELLED' ? (
              <p className="match-hero__date">{date.valid ? date.long : 'Termin odwołany'}</p>
            ) : (
              <div className="match-hero__when">
                <p className="match-hero__date">{uncertain ? 'Czekamy na nowy termin' : `${date.weekdayLong}, ${date.dayNumber} ${date.monthLong}`}</p>
                {!uncertain && (
                  <p className="match-hero__time">
                    <time dateTime={game.date} className="cut">
                      {date.time}
                    </time>
                  </p>
                )}
              </div>
            )}

            <dl className="match-hero__facts">
              {hasScore && (
                <div>
                  <dt>Termin</dt>
                  <dd>{matchDateParts(game.date).long}</dd>
                </div>
              )}
              <div>
                <dt>Hala</dt>
                <dd>
                  {game.venue || 'Miejsce zostanie potwierdzone'}
                  {game.venue && game.status === 'SCHEDULED' && (
                    <>
                      {' · '}
                      <a href={mapsHref(game.venue)} target="_blank" rel="noopener noreferrer">
                        Szukaj hali w mapach
                      </a>
                    </>
                  )}
                </dd>
              </div>
              {game.status === 'SCHEDULED' && game.competition === 'KALK' && (
                <div>
                  <dt>Wstęp</dt>
                  <dd>wolny</dd>
                </div>
              )}
              {game.status === 'SCHEDULED' && (
                <div>
                  <dt>Do meczu</dt>
                  <dd>
                    <Countdown date={game.date} />
                  </dd>
                </div>
              )}
              {game.previousDate && (
                <div>
                  <dt>Poprzedni termin</dt>
                  <dd>
                    <s>{formatDateTime(game.previousDate)}</s>
                  </dd>
                </div>
              )}
              {game.kit && (
                <div>
                  <dt>Strój</dt>
                  <dd>{game.kit}</dd>
                </div>
              )}
            </dl>
            {game.statusMessage && (
              <p className="match-hero__message" role="status">
                {game.statusMessage}
              </p>
            )}
            {actions && <div className="match-hero__actions actions">{actions}</div>}
          </div>
        </div>
      </div>
      <JerseyStripes className="match-hero__stripes" />
    </article>
  )
}
