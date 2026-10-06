import Link from 'next/link'
import { FallbackImage } from './FallbackImage'
import type { RosterPlayer } from '../../../lib/data/schemas'
import { getPositionLabel, resolvePlayerPhoto } from '../../../lib/data/utils'
export function PlayerCardContent({ player, showStats = false }: { player: RosterPlayer; showStats?: boolean }) {
  const hasNumber = player.number && player.number.trim() !== '' && player.number.trim() !== '-'
  const numberDisplay = hasNumber ? player.number.trim() : '—'
  const posLabel = getPositionLabel(player.position)

  const hasStats = Boolean(
    (player.gamesPlayed && player.gamesPlayed > 0) ||
    (player.ppg != null && player.ppg > 0) ||
    (player.eval != null && player.eval > 0)
  )

  return <>
    <div className="player-card__img" aria-hidden="true">
      <span className="player-card__num">{numberDisplay}</span>
      {player.photoApproved ? <FallbackImage src={resolvePlayerPhoto(player)} alt={player.photoAlt || ''}
        width={480} height={600} sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
        fallback={<span className="player-card__placeholder" />} /> : <span className="player-card__placeholder" />}
    </div>
    <div className="player-card__body">
      <span className="player-card__first">
        {player.firstName}{hasNumber ? ` · #${numberDisplay}` : ''}
      </span>
      <strong className="player-card__last">{player.lastName}</strong>
      <span className="player-card__pos">{posLabel}</span>
      {showStats && hasStats && (
        <div className="player-card__stats-strip" aria-label="Statystyki lidera">
          {player.ppg != null && (
            <div className="player-card__stat-item">
              <span className="player-card__stat-val">{player.ppg}</span>
              <span className="player-card__stat-lbl">PPG</span>
            </div>
          )}
          {player.eval != null && (
            <div className="player-card__stat-item player-card__stat-item--eval">
              <span className="player-card__stat-val">{player.eval}</span>
              <span className="player-card__stat-lbl">EVAL</span>
            </div>
          )}
          {player.apg != null && player.apg > 0 && (
            <div className="player-card__stat-item">
              <span className="player-card__stat-val">{player.apg}</span>
              <span className="player-card__stat-lbl">APG</span>
            </div>
          )}
          {player.rpg != null && player.rpg > 0 && (
            <div className="player-card__stat-item">
              <span className="player-card__stat-val">{player.rpg}</span>
              <span className="player-card__stat-lbl">RPG</span>
            </div>
          )}
        </div>
      )}
    </div>
  </>
}
export function PlayerCard({ player, showStats = false }: { player: RosterPlayer; showStats?: boolean }) {
  return <Link className="player-card" href={`/sklad/${encodeURIComponent(player.id)}`}><PlayerCardContent player={player} showStats={showStats} /></Link>
}
