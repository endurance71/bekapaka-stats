import type { RosterPlayer } from '../../../lib/data/schemas'
import { resolvePlayerPhoto } from '../../../lib/data/utils'
import { FallbackImage } from '../shared/FallbackImage'

export function playerNumber(player: Pick<RosterPlayer, 'number'>) {
  const value = player.number?.trim()
  return value && value !== '-' ? value : null
}

/**
 * Portret zawodnika 4:5: numer konturem ZA postacią (jak na plecach koszulki).
 * Brak zatwierdzonego zdjęcia: sam numer + monogram BKPK — nigdy inicjały.
 */
export function PlayerPortrait({
  player,
  sizes,
  priority = false
}: {
  player: RosterPlayer
  sizes: string
  priority?: boolean
}) {
  const number = playerNumber(player)
  const monogram = <img className="portrait__monogram" src="/brand/monogram-bialy.svg" width={48} height={48} alt="" />
  return (
    <span className={`portrait${player.photoApproved ? '' : ' portrait--empty'}`}>
      <span className="portrait__number cut" aria-hidden="true">
        {number ?? '—'}
      </span>
      {player.photoApproved ? (
        <FallbackImage
          className="portrait__photo"
          src={resolvePlayerPhoto(player)}
          alt={player.photoAlt || ''}
          width={480}
          height={600}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          fallback={monogram}
        />
      ) : (
        monogram
      )}
    </span>
  )
}
