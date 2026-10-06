'use client'

import { useState } from 'react'
import type { TeamStanding } from '../../../lib/data'
import { formatDiffValue, formatTeamShortName } from '../../../lib/format'

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
          src='/brand/sygnet2-kolor-ciasny.svg'
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
            <span aria-hidden='true'>{isWin ? 'W' : isLoss ? 'P' : upper}</span><span className='sr-only'>{label}</span>
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
  // Normalizacja do polskiej notacji w tabeli (L -> P)
  const displayStreak = upper.startsWith('L') ? `P${streak.slice(1)}` : streak
  return (
    <span className={`standings-badge standings-badge--streak ${cls}`}>
      <span aria-hidden='true'>{displayStreak}</span><span className='sr-only'>{isWin ? 'Seria wygranych' : isLoss ? 'Seria porażek' : 'Seria'}: {streak.replace(/\D/g, '')}</span>
    </span>
  )
}

export function StandingsBoard({ table, className, compact = false }: { table: TeamStanding[]; className?: string; compact?: boolean }) {
  const [viewMode, setViewMode] = useState<'main' | 'all'>('main')
  const ownIndex = table.findIndex(row => isBekapakaRow(row.name))
  const start = ownIndex < 0 ? 0 : Math.min(Math.max(ownIndex - 2, 0), Math.max(table.length - 5, 0))
  const visibleRows = compact ? table.slice(start, start + 5) : table

  return (
    <div className={`standings-board-wrapper standings-board-wrapper--${viewMode}${className ? ` ${className}` : ''}${compact ? ' standings-board-wrapper--compact' : ''}`}>
      <div className='standings-mobile-tabs' hidden={compact}><button type='button' className='btn btn--secondary btn--sm' aria-expanded={viewMode === 'all'} onClick={() => setViewMode(viewMode === 'all' ? 'main' : 'all')}>{viewMode === 'all' ? 'Podstawowe kolumny' : 'Więcej kolumn'}</button></div>

      {viewMode === 'all' && (
        <div className='standings-scroll-hint' aria-hidden='true'>
          <span>↔ Przewiń tabelę w poziomie, aby zobaczyć wszystkie statystyki</span>
        </div>
      )}

      <div className='standings-board-shell' tabIndex={0} role='region' aria-label='Tabela ligi, przewijaj poziomo'>
        <table className={`standings-table standings-table--tab-${viewMode}`} aria-label='Tabela ligowa'>
          <thead>
            <tr>
              <th scope='col' className='col-pos'>#</th>
              <th scope='col' className='col-team'>Drużyna</th>
              <th scope='col' className='col-stat col-matches'>M</th>
              <th scope='col' className='col-stat col-wins'>W</th>
              <th scope='col' className='col-stat col-losses'>P</th>
              <th scope='col' className='col-stat col-for'>+</th>
              <th scope='col' className='col-stat col-against'>-</th>
              <th scope='col' className='col-stat col-diff'>+/-</th>
              <th scope='col' className='col-stat col-pts'>PKT</th>
              <th scope='col' className='col-stat col-form'>Forma</th>
              <th scope='col' className='col-stat col-streak'>Seria</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const isBkp = isBekapakaRow(row.name)
              const position = row.position > 0 ? row.position : table.indexOf(row) + 1
              const matches = row.matches ?? (row.wins + row.losses)
              const pointsFor = row.pointsFor ?? 0
              const pointsAgainst = row.pointsAgainst ?? 0
              const diff = row.pointsDiff ?? (pointsFor - pointsAgainst)
              const points = row.points ?? (row.wins * 2 + row.losses)
              const diffClass = diff > 0 ? 'is-positive' : diff < 0 ? 'is-negative' : 'is-zero'

              return (
                <tr
                  key={`${row.name}-${position}`}
                  className={`standings-row-v2 ${isBkp ? 'is-bkp is-own' : ''}`}
                >
                  <td className='col-pos'>
                    <span className='standings-pos-badge'>{position}</span>
                  </td>
                  <th scope='row' className='col-team'>
                    <div className='standings-team-identity'>
                      <TeamLogo logoUrl={row.logoUrl} name={row.name} isBkp={isBkp} />
                      <span className='standings-team-name' title={row.name}>
                        <span className='standings-team-name__full'>{row.name}</span>
                        <span className='standings-team-name__short' aria-hidden='true'>{formatTeamShortName(row.name)}</span>
                      </span>
                    </div>
                  </th>
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

      {compact && table.length > 5 && <p className='muted text-xs'>Wybrane 5 z {table.length} zespołów. Pełne zestawienie na stronie tabeli.</p>}
      <div className='standings-legend' aria-label='Objaśnienia skrótów tabeli'>
        <span><strong>M</strong> – mecze</span>
        <span><strong>W</strong> – wygrane</span>
        <span><strong>P</strong> – porażki</span>
        <span className={compact ? 'standings-legend__extended' : undefined}><strong>+</strong> – punkty zdobyte</span><span className={compact ? 'standings-legend__extended' : undefined}><strong>−</strong> – punkty stracone</span><span className={compact ? 'standings-legend__extended' : undefined}><strong>+/−</strong> – różnica punktów zdobytych i straconych</span><span className={compact ? 'standings-legend__extended' : undefined}><strong>Forma</strong> – ostatnie wyniki: W wygrana, P porażka</span><span className={compact ? 'standings-legend__extended' : undefined}><strong>Seria</strong> – liczba kolejnych wygranych lub porażek</span>
        <span><strong>PKT</strong> – punkty ligowe (2 za wygraną, 1 za porażkę)</span>
      </div>
    </div>
  )
}
