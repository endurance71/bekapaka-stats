import Link from 'next/link'
import type { GameSummary } from '../../../lib/data/schemas'
import { resolvePresentation } from '../../../../packages/match-presentation'
import { matchDateParts } from '../../../lib/match-format'
import { Score, resultLabel } from './Score'
import { TeamMark } from './TeamMark'
import { ArrowIcon } from '../primitives/ArrowLink'

const statusText = {
  LIVE: 'Na żywo',
  BREAK: 'Przerwa',
  POSTPONED: 'Przełożony',
  CANCELLED: 'Odwołany'
} as const

/**
 * Wiersz terminarza / wyniku. Cały wiersz jest linkiem do meczu (bez zagnieżdżonych akcji).
 * Data to dane — bez cięcia i pochylenia (tom WWW s. 11).
 */
export function FixtureRow({ game: source }: { game: GameSummary }) {
  const game = resolvePresentation(source)
  const date = matchDateParts(game.date)
  const hasScore =
    game.scoreUs != null && game.scoreThem != null && ['LIVE', 'BREAK', 'FINAL'].includes(game.status)
  const uncertain = game.status === 'POSTPONED' && !game.newDate
  const flag = game.status in statusText ? statusText[game.status as keyof typeof statusText] : null

  return (
    <Link className="fixture" href={`/mecze/kalk-${encodeURIComponent(game.id)}`} data-status={game.status.toLowerCase()}>
      <span className="fixture__date">
        <span className="fixture__day">{uncertain ? '—' : date.dayNumber}</span>
        <span className="fixture__month">
          {date.month}
          <span>{date.weekday}</span>
        </span>
      </span>
      <span className="fixture__main">
        <span className="fixture__teams">
          <span className="fixture__team">
            <TeamMark own name="BeKaPaKa" size="sm" />
            <span>BeKaPaKa</span>
          </span>
          <span className="fixture__team">
            <TeamMark name={game.opponent} logoUrl={source.opponentLogoUrl} size="sm" />
            <span>{game.opponent}</span>
          </span>
        </span>
        <span className="fixture__meta">
          {flag && <span className={`status-flag status-flag--${game.status.toLowerCase()}`}>{flag}</span>}
          {hasScore && game.status === 'FINAL' && (
            <span className="fixture__outcome">{resultLabel(game.scoreUs as number, game.scoreThem as number)}</span>
          )}
          {[game.competition, game.round, game.venue, game.status === 'SCHEDULED' && game.competition === 'KALK' ? 'wstęp wolny' : null]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </span>
      <span className="fixture__value">
        {hasScore ? (
          <Score us={game.scoreUs as number} them={game.scoreThem as number} opponent={game.opponent} size="sm" />
        ) : game.status === 'CANCELLED' ? (
          <span className="fixture__time fixture__time--muted">—</span>
        ) : (
          <time className="fixture__time" dateTime={game.date}>
            {uncertain ? 'TBA' : date.time}
          </time>
        )}
      </span>
      <ArrowIcon />
      <span className="sr-only">Szczegóły meczu</span>
    </Link>
  )
}
