'use client'

import { useState } from 'react'
import type { TeamStanding } from '../../../lib/data'
import { formatDiffValue } from '../../../lib/format'

function isBekapakaRow(name: string) {
  const n = name.toLowerCase()
  return n.includes('bekapaka') || n.includes('bobolice')
}

export function TeamLogo({ logoUrl, name, isBkp }: { logoUrl?: string | null; name: string; isBkp: boolean }) {
  const [hasError, setHasError] = useState(false)

  if (isBkp) {
    return (
      <span className='standings-team-logo-wrap' aria-hidden='true'>
        <img
          src='/logo.png'
          alt='BeKaPaKa'
          className='standings-team-logo standings-team-logo--bkp'
          width={28}
          height={28}
          loading='lazy'
        />
      </span>
    )
  }

  const isPlaceholder = !logoUrl || logoUrl.includes('placeholder') || hasError

  if (isPlaceholder) {
    const initial = name.trim().charAt(0).toUpperCase() || '•'
    return (
      <span className='standings-team-logo-wrap standings-team-logo-wrap--shield' aria-hidden='true'>
        <svg viewBox='0 0 24 24' width='28' height='28' fill='none' className='shield-svg'>
          <path
            d='M12 2L4 5V11C4 16.5 7.5 21.3 12 22C16.5 21.3 20 16.5 20 11V5L12 2Z'
            fill='currentColor'
            fillOpacity='0.15'
            stroke='currentColor'
            strokeWidth='1.5'
          />
        </svg>
        <span className='shield-initial'>{initial}</span>
      </span>
    )
  }

  return (
    <span className='standings-team-logo-wrap' aria-hidden='true'>
      <img
        src={logoUrl}
        alt=''
        className='standings-team-logo'
        width={28}
        height={28}
        loading='lazy'
        onError={() => setHasError(true)}
      />
    </span>
  )
}

export function FormBadges({ form }: { form?: string[] }) {
  if (!form || form.length === 0) {
    return <span className='standings-badge standings-badge--neutral'>—</span>
  }
  return (
    <div className='standings-form-badges'>
      {form.map((f, i) => {
        const upper = f.toUpperCase()
        const isWin = upper === 'W' || upper === 'Z'
        const isLoss = upper === 'L' || upper === 'P'
        const cls = isWin
          ? 'standings-badge--win'
          : isLoss
          ? 'standings-badge--loss'
          : 'standings-badge--neutral'
        const label = isWin ? 'Wygrana' : isLoss ? 'Porażka' : f
        return (
          <span key={i} className={`standings-badge standings-badge--form ${cls}`} title={label}>
            {upper}
          </span>
        )
      })}
    </div>
  )
}

export function StreakBadge({ streak }: { streak?: string | null }) {
  if (!streak || streak.trim() === '' || streak.trim() === '—') {
    return <span className='standings-badge standings-badge--neutral'>—</span>
  }
  const upper = streak.toUpperCase()
  const isWin = upper.startsWith('W') || upper.startsWith('Z')
  const isLoss = upper.startsWith('L') || upper.startsWith('P')
  const cls = isWin
    ? 'standings-badge--win'
    : isLoss
    ? 'standings-badge--loss'
    : 'standings-badge--neutral'
  return (
    <span className={`standings-badge standings-badge--streak ${cls}`}>
      {streak}
    </span>
  )
}

export function StandingsBoard({ table, className }: { table: TeamStanding[]; className?: string }) {
  return (
    <div className={`standings-board-wrapper${className ? ` ${className}` : ''}`}>
      <div className='standings-scroll-hint' aria-hidden='true'>
        <span>↔ Przewiń tabelę w poziomie, aby zobaczyć wszystkie statystyki</span>
      </div>
      <div className='standings-board-shell'>
        <table className='standings-table' aria-label='Tabela ligowa Dywizji II'>
          <thead>
            <tr>
              <th scope='col' className='col-pos'>#</th>
              <th scope='col' className='col-team'>Drużyna</th>
              <th scope='col' className='col-stat'>M</th>
              <th scope='col' className='col-stat'>W</th>
              <th scope='col' className='col-stat'>P</th>
              <th scope='col' className='col-stat'>+</th>
              <th scope='col' className='col-stat'>-</th>
              <th scope='col' className='col-stat col-diff'>+/-</th>
              <th scope='col' className='col-stat col-pts'>PKT</th>
              <th scope='col' className='col-stat col-form'>Forma</th>
              <th scope='col' className='col-stat col-streak'>Seria</th>
            </tr>
          </thead>
          <tbody>
            {table.map((row, index) => {
              const isBkp = isBekapakaRow(row.name)
              const position = row.position > 0 ? row.position : index + 1
              const matches = row.matches ?? (row.wins + row.losses)
              const pointsFor = row.pointsFor ?? 0
              const pointsAgainst = row.pointsAgainst ?? 0
              const diff = row.pointsDiff ?? (pointsFor - pointsAgainst)
              const points = row.points ?? (row.wins * 2 + row.losses)
              const diffClass = diff > 0 ? 'is-positive' : diff < 0 ? 'is-negative' : 'is-zero'

              return (
                <tr
                  key={`${row.name}-${position}`}
                  className={`standings-row-v2 ${isBkp ? 'is-bkp' : ''}`}
                >
                  <td className='col-pos'>
                    <span className='standings-pos-badge'>{position}</span>
                  </td>
                  <td className='col-team'>
                    <div className='standings-team-identity'>
                      <TeamLogo logoUrl={row.logoUrl} name={row.name} isBkp={isBkp} />
                      <span className='standings-team-name'>{row.name}</span>
                    </div>
                  </td>
                  <td className='col-stat col-matches'>{matches}</td>
                  <td className='col-stat col-wins'>{row.wins}</td>
                  <td className='col-stat col-losses'>{row.losses}</td>
                  <td className='col-stat col-for'>{pointsFor}</td>
                  <td className='col-stat col-against'>{pointsAgainst}</td>
                  <td className={`col-stat col-diff ${diffClass}`}>{formatDiffValue(diff)}</td>
                  <td className='col-stat col-pts'>
                    <strong>{points}</strong>
                  </td>
                  <td className='col-stat col-form'>
                    <FormBadges form={row.form} />
                  </td>
                  <td className='col-stat col-streak'>
                    <StreakBadge streak={row.streak} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
