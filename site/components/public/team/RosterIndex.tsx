import Link from 'next/link'
import type { RosterPlayer } from '../../../lib/data/schemas'
import { playerNumber } from './PlayerPortrait'

/** Indeks składu: numer z pleców + nazwisko, jak lista w programie meczowym. */
export function RosterIndex({ roster }: { roster: RosterPlayer[] }) {
  const sorted = [...roster].sort((a, b) => {
    const left = Number(playerNumber(a) ?? 1000)
    const right = Number(playerNumber(b) ?? 1000)
    return left - right || a.lastName.localeCompare(b.lastName, 'pl')
  })
  if (!sorted.length) return null
  return (
    <div className="roster-index">
      <p className="t-label muted">Skład · {sorted.length} zawodników</p>
      <ul className="roster-index__list" role="list">
        {sorted.map((player) => {
          const number = playerNumber(player)
          return (
            <li key={player.id}>
              <Link href={`/sklad/${encodeURIComponent(player.id)}`}>
                <span className="roster-index__number" aria-hidden={number ? undefined : true}>
                  {number ?? '—'}
                </span>
                <span>
                  {player.firstName.charAt(0)}. <strong>{player.lastName}</strong>
                </span>
                {number && <span className="sr-only">, numer {number}</span>}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
