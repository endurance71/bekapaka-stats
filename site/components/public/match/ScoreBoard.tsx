import type { GameSummary } from '../../../lib/data/schemas'
import { resolvePresentation } from '../../../../packages/match-presentation'
import { matchDateParts } from '../../../lib/match-format'
import { resultLabel } from './Score'
import { TeamMark } from './TeamMark'

/**
 * Wynik jako tablica: dwa wiersze „znak · drużyna · liczba”, BeKaPaKa zawsze u góry.
 * Liczby w skali Score — wynik jest nagłówkiem, nie przypisem.
 */
export function ScoreBoard({ game: source, size = 'lg' }: { game: GameSummary; size?: 'lg' | 'md' }) {
  const game = resolvePresentation(source)
  if (game.scoreUs == null || game.scoreThem == null) return null
  const us = game.scoreUs
  const them = game.scoreThem
  const date = matchDateParts(game.date)
  const meta = [game.competition, game.round, date.valid ? `${date.weekdayLong} ${date.numeric}` : null, game.venue]
    .filter(Boolean)
    .join(' · ')
  const rows = [
    { own: true, name: 'BeKaPaKa', value: us, lead: us >= them, logo: null },
    { own: false, name: game.opponent, value: them, lead: them >= us, logo: source.opponentLogoUrl }
  ]

  return (
    <div className={`scoreboard scoreboard--${size}`}>
      <p className="scoreboard__meta">
        <strong className={`scoreboard__outcome scoreboard__outcome--${us > them ? 'win' : us < them ? 'loss' : 'draw'}`}>
          {game.status === 'FINAL' ? resultLabel(us, them) : game.status === 'LIVE' ? 'Na żywo' : 'Przerwa'}
        </strong>
        <span>{meta}</span>
      </p>
      <dl className="scoreboard__rows" aria-label={`BeKaPaKa ${us}, ${game.opponent} ${them}`}>
        {rows.map((row) => (
          <div key={row.name} className={`scoreboard__row${row.own ? ' scoreboard__row--own' : ''}`}>
            <dt>
              <TeamMark own={row.own} name={row.name} logoUrl={row.logo} size="sm" />
              <span className="scoreboard__name">{row.name}</span>
            </dt>
            <dd className={`scoreboard__value cut${row.lead ? '' : ' outline'}`}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
