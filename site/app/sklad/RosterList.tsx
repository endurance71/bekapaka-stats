import type { RosterPlayer } from '../../lib/data'
import { PlayerCard } from '../../components/public/shared/PlayerCard'
import { playerNumber } from '../../components/public/team/PlayerPortrait'

/** Skład w kolejności numerów z pleców; zawodnicy bez potwierdzonego numeru na końcu. */
export function RosterList({ roster }: { roster: RosterPlayer[] }) {
  const sorted = [...roster].sort(
    (a, b) => Number(playerNumber(a) ?? 1000) - Number(playerNumber(b) ?? 1000) || a.lastName.localeCompare(b.lastName, 'pl')
  )
  return (
    <ul className="roster-grid" role="list">
      {sorted.map((player, index) => (
        <li key={player.id}>
          <PlayerCard player={player} showStats priority={index < 5} />
        </li>
      ))}
    </ul>
  )
}
