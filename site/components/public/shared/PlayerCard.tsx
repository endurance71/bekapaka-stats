import Link from 'next/link'
import type { RosterPlayer } from '../../../lib/data/schemas'
import { getPositionLabel } from '../../../lib/data/utils'
import { formatStat } from '../../../lib/format'
import { PlayerPortrait, playerNumber } from '../team/PlayerPortrait'

/** Zawodnik w składzie: portret z numerem, imię, nazwisko, pozycja; cała karta jest linkiem do profilu. */
export function PlayerCard({ player, showStats = false, priority = false }: { player: RosterPlayer; showStats?: boolean; priority?: boolean }) {
  const number = playerNumber(player)
  const played = (player.gamesPlayed ?? 0) > 0
  return (
    <Link className="player-card" href={`/sklad/${encodeURIComponent(player.id)}`}>
      <PlayerPortrait player={player} sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 50vw" priority={priority} />
      <span className="player-card__body">
        <span className="player-card__first">{player.firstName}</span>{' '}
        <strong className="player-card__last">{player.lastName}</strong>
        <span className="player-card__meta">
          {number ? `#${number} · ` : ''}
          {getPositionLabel(player.position)}
        </span>
        {showStats && played && (
          <span className="player-card__stats">
            <span>
              <b>{formatStat(player.ppg)}</b> pkt
            </span>
            <span>
              <b>{formatStat(player.rpg)}</b> zb
            </span>
            <span>
              <b>{formatStat(player.apg)}</b> as
            </span>
          </span>
        )}
      </span>
    </Link>
  )
}
