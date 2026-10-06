import type { ReactNode } from 'react'
import type { GameSummary } from '../../../lib/data/schemas'
import { resolvePresentation } from '../../../../packages/match-presentation'
import { formatDateTime } from '../../../lib/format'
import { Countdown } from '../home/Countdown'
import { FallbackImage } from './FallbackImage'
const labels = {
  SCHEDULED: 'Najbliższy mecz',
  LIVE: 'Na żywo',
  BREAK: 'Przerwa',
  FINAL: 'Koniec meczu',
  POSTPONED: 'Mecz przełożony',
  CANCELLED: 'Mecz odwołany'
}
function dateParts(value: string) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime()))
    return { day: '—', month: '', weekday: '', time: '—', full: 'Termin zostanie potwierdzony' }
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('pl-PL', { timeZone: 'Europe/Warsaw', ...options }).format(date)
  return {
    day: part({ day: '2-digit' }),
    month: part({ month: 'short' }),
    weekday: part({ weekday: 'short' }),
    time: part({ hour: '2-digit', minute: '2-digit' }),
    full: part({ weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })
  }
}
export function MatchCard({
  game: source,
  hero = false,
  compact = false,
  actions
}: {
  game: GameSummary
  hero?: boolean
  compact?: boolean
  actions?: ReactNode
}) {
  const game = resolvePresentation(source)
  const date = dateParts(game.date)
  const hasScore =
    game.scoreUs != null &&
    game.scoreThem != null &&
    ['LIVE', 'BREAK', 'FINAL'].includes(game.status)
  const uncertainDate = game.status === 'POSTPONED' && !game.newDate
  const score = hasScore ? `${game.scoreUs}:${game.scoreThem}` : null
  if (compact)
    return (
      <article className={`fixture fixture--${game.status.toLowerCase()}`}>
        <div className="fixture__date">
          <span className="fixture__day">{uncertainDate ? '—' : date.day}</span>
          <span className="fixture__month">
            {date.month} · {date.weekday}
          </span>
        </div>
        <div className="fixture__teams">
          <strong className="fixture__vs">
            BeKaPaKa <span>vs</span> {game.opponent}
          </strong>
          <span className="fixture__venue">
            {game.venue || 'Miejsce zostanie potwierdzone'}
            {game.venue && game.status === 'SCHEDULED' && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(game.venue + ' Koszalin')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="fixture__venue-link"
                title={`Sprawdź dojazd: ${game.venue}`}
              >
                · Dojazd
              </a>
            )}
          </span>
          {game.statusMessage && <p>{game.statusMessage}</p>}
        </div>
        <div className="fixture__side">
          {['POSTPONED', 'CANCELLED', 'LIVE', 'BREAK'].includes(game.status) && (
            <span className={`match-status match-status--${game.status.toLowerCase()}`}>
              {labels[game.status]}
            </span>
          )}
          {uncertainDate ? (
            <span>Czekamy na nowy termin</span>
          ) : (
            game.status !== 'CANCELLED' && (
              <strong className="fixture__time">{score || date.time}</strong>
            )
          )}
          <span className="fixture__round">
            {game.round || (game.status === 'FINAL' ? 'Wynik końcowy' : game.competition)}
          </span>
          {game.previousDate && <span>Poprzedni termin: {formatDateTime(game.previousDate)}</span>}
        </div>
        <div className="fixture__actions">{actions}</div>
      </article>
    )
  return (
    <article className={`match-card ${hero ? 'tile match-tile' : ''}`} data-status={game.status}>
      {hero && (
        <div className="tile__bg">
          <FallbackImage
            src="/brand/photography/arena.webp"
            width={1200}
            height={675}
            sizes="(min-width: 1024px) 66vw, 100vw"
            loading="eager"
            fetchPriority="high"
            preload
            alt=""
          />
        </div>
      )}
      <div className={hero ? 'tile__body' : 'match-card__body'}>
        <span className={`match-status match-status--${game.status.toLowerCase()}`}>
          {labels[game.status]}
        </span>
        <p className="match-card__competition">
          {game.competition}
          {game.round && ` · ${game.round}`} ·{' '}
          {uncertainDate ? 'Termin do potwierdzenia' : date.full}
          {game.quarter && ` · ${game.quarter}`}
        </p>
        <div className="pair">
          <div className="pair__team">
            <img
              className="pair__mark"
              src="/brand/herb2-mini-kolor-ciasny.svg"
              width={168}
              height={168}
              alt=""
            />
            <strong className="pair__name">BeKaPaKa</strong>
          </div>
          <span className="pair__vs" aria-hidden="true">
            {score ? '—' : 'VS'}
          </span>
          <div className="pair__team">
            {source.opponentLogoUrl ? (
              <FallbackImage
                className="pair__mark pair__mark--rival"
                src={source.opponentLogoUrl}
                width={168}
                height={168}
                sizes="168px"
                alt=""
                fallback={
                  <div className="pair__rival" aria-hidden="true">
                    {game.opponent.split(' ')[0].slice(0, 4)}
                  </div>
                }
              />
            ) : (
              <div className="pair__rival" aria-hidden="true">
                {game.opponent.split(' ')[0].slice(0, 4)}
              </div>
            )}
            <strong className="pair__name">{game.opponent}</strong>
          </div>
        </div>
        {game.status !== 'CANCELLED' && (
          <div className={`timepanel${uncertainDate ? ' timepanel--muted' : ''}`}>
            <span className="timepanel__t brand-cut">
              {uncertainDate ? '—' : score || date.time}
            </span>
          </div>
        )}
        <div className="match-card__info">
          <span>{game.venue || 'Miejsce zostanie potwierdzone'}</span>
          {game.venue && game.status === 'SCHEDULED' && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(game.venue + ' Koszalin')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="fixture__venue-link"
              title={`Sprawdź dojazd: ${game.venue}`}
            >
              Dojazd
            </a>
          )}
          {game.status === 'SCHEDULED' && game.competition === 'KALK' && <span>Wstęp wolny</span>}
          {hero && game.status === 'SCHEDULED' && <Countdown date={game.date} />}
        </div>
        {uncertainDate && <p>Czekamy na nowy termin</p>}
        {game.previousDate && <p>Poprzedni termin: {formatDateTime(game.previousDate)}</p>}
        {game.statusMessage && <p role="status">{game.statusMessage}</p>}
        {game.kit && <p>Strój: {game.kit}</p>}
        {actions && <div className="match-card__actions">{actions}</div>}
      </div>
    </article>
  )
}
