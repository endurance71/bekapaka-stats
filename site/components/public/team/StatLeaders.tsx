import Link from 'next/link'
import type { ReactNode } from 'react'
import type { RosterPlayer } from '../../../lib/data/schemas'
import { getPositionLabel } from '../../../lib/data/utils'
import { formatStat } from '../../../lib/format'
import { PlayerPortrait, playerNumber } from './PlayerPortrait'

const categories = [
  { key: 'ppg', label: 'Punkty', unit: 'na mecz', digits: 1 },
  { key: 'rpg', label: 'Zbiórki', unit: 'na mecz', digits: 1 },
  { key: 'apg', label: 'Asysty', unit: 'na mecz', digits: 1 },
  { key: 'eval', label: 'EVAL', unit: 'wskaźnik efektywności', digits: 1 }
] as const

type Key = (typeof categories)[number]['key']

function value(player: RosterPlayer, key: Key) {
  const raw = player[key]
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : null
}

export function selectLeaders(roster: RosterPlayer[]) {
  const active = roster.filter((player) => (player.gamesPlayed ?? 0) > 0)
  return categories
    .map((category) => {
      const leader = [...active]
        .filter((player) => (value(player, category.key) ?? 0) > 0)
        .sort((a, b) => (value(b, category.key) ?? 0) - (value(a, category.key) ?? 0) || (b.eval ?? 0) - (a.eval ?? 0))[0]
      return leader ? { ...category, player: leader, value: value(leader, category.key) as number } : null
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
}

/**
 * Liderzy sezonu: jeden wyróżniony zawodnik (najwyższy EVAL) z portretem i liderzy czterech kategorii jako
 * tabela redakcyjna. Bez powtarzania tych samych zdjęć, bez mikro-badge.
 */
export function StatLeaders({ roster, after }: { roster: RosterPlayer[]; after?: ReactNode }) {
  const leaders = selectLeaders(roster)
  if (!leaders.length) return null
  const featured = (leaders.find((entry) => entry.key === 'eval') || leaders[0]).player
  const featuredNumber = playerNumber(featured)

  return (
    <div className="leaders">
      <Link className="leaders__featured" href={`/sklad/${encodeURIComponent(featured.id)}`}>
        <PlayerPortrait player={featured} sizes="(min-width: 1024px) 34vw, 100vw" />
        <span className="leaders__featured-body">
          <span className="leaders__badge">Najwyższy EVAL</span>
          <span className="leaders__name">
            <span>{featured.firstName}</span> <strong>{featured.lastName}</strong>
          </span>
          <span className="leaders__meta">
            {featuredNumber ? `#${featuredNumber} · ` : ''}
            {getPositionLabel(featured.position)}
          </span>
          <span className="leaders__strip">
            {categories.map((category) => (
              <span key={category.key}>
                <b className="tnum">{formatStat(value(featured, category.key), category.digits)}</b>
                <small>{category.key === 'eval' ? 'EVAL' : category.label}</small>
              </span>
            ))}
          </span>
        </span>
      </Link>

      <div className="leaders__side">
      <ol className="leaders__list zebra-list" role="list">
        {leaders.map((entry) => {
          const number = playerNumber(entry.player)
          return (
            <li key={entry.key}>
              <Link className="leader" href={`/sklad/${encodeURIComponent(entry.player.id)}`}>
                <span className="leader__category">
                  {entry.label}
                  <small>{entry.unit}</small>
                </span>
                <span className="leader__player">
                  {entry.player.firstName} <strong>{entry.player.lastName}</strong>
                  {number && <span className="leader__number">#{number}</span>}
                </span>
                <span className="leader__value t-stat">{formatStat(entry.value, entry.digits)}</span>
              </Link>
            </li>
          )
        })}
      </ol>
      {after}
      </div>
    </div>
  )
}
