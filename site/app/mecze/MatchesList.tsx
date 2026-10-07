import type { GameSummary } from '../../lib/data'
import { FixtureRow } from '../../components/public/match/FixtureRow'

/** Terminarz / wyniki pogrupowane miesiącami; każdy mecz to jeden wiersz-link. */
export function MatchesList({ games }: { games: GameSummary[] }) {
  const groups = games.reduce<Record<string, GameSummary[]>>((result, game) => {
    const date = new Date(game.date)
    const month = Number.isFinite(date.getTime())
      ? new Intl.DateTimeFormat('pl-PL', { timeZone: 'Europe/Warsaw', month: 'long', year: 'numeric' }).format(date)
      : 'Termin do potwierdzenia'
    ;(result[month] ||= []).push(game)
    return result
  }, {})

  return (
    <div className="fixtures">
      {Object.entries(groups).map(([month, items]) => (
        <section key={month} className="fixtures__group" aria-label={month}>
          <h2 className="fixtures__month">{month}</h2>
          <ul className="rule-list" role="list">
            {items.map((game) => (
              <li key={game.id}>
                <FixtureRow game={game} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
