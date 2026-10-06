import type { RosterPlayer } from '../../lib/data'
import { PlayerCard } from '../../components/public/shared/PlayerCard'

export function RosterList({ roster }: { roster: RosterPlayer[] }) {
  return (
    <div className="roster-grid">
      {roster.map((player) => (
        <PlayerCard key={player.id} player={player} />
      ))}
    </div>
  )
}
