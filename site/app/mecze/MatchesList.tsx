import Link from 'next/link'
import type { GameSummary } from '../../lib/data'
import { MatchCard } from '../../components/public/shared/MatchCard'

export function MatchesList({ games }: { games: GameSummary[] }) {
  const groups = games.reduce<Record<string, GameSummary[]>>((result, game) => {
    const date = new Date(game.date)
    const month = Number.isFinite(date.getTime())
      ? new Intl.DateTimeFormat('pl-PL', {
          timeZone: 'Europe/Warsaw',
          month: 'long',
          year: 'numeric'
        }).format(date)
      : 'Termin do potwierdzenia'
    ;(result[month] ||= []).push(game)
    return result
  }, {})

  return (
    <div className="matches-list">
      {Object.entries(groups).map(([month, items]) => (
        <section key={month} className="fixture-group">
          <h2 className="fixture-group__title">{month}</h2>
          {items.map((game) => (
            <MatchCard
              key={game.id}
              compact
              game={game}
              actions={
                <Link
                  href={`/mecze/kalk-${game.id}`}
                  className="button button--ghost"
                >
                  Szczegóły meczu
                </Link>
              }
            />
          ))}
        </section>
      ))}
    </div>
  )
}
