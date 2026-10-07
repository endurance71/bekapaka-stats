'use client'

import { useState } from 'react'
import type { TeamStanding } from '../../../lib/data'
import { formatDiffValue } from '../../../lib/format'
import { isBekapakaRow } from '../../../lib/navigation'


export function TeamLogo({ logoUrl, name, isBkp }: { logoUrl?: string | null; name: string; isBkp: boolean }) {
  const [hasError, setHasError] = useState(false)

  if (isBkp) {
    return (
      <span className="standings-logo" aria-hidden="true">
        <img src="/brand/sygnet2-kolor-ciasny.svg" alt="" className="standings-team-logo--bkp" width={28} height={28} loading="lazy" />
      </span>
    )
  }

  if (!logoUrl || logoUrl.includes('placeholder') || hasError) {
    const initial = name.trim().charAt(0).toUpperCase() || '•'
    return (
      <span className="standings-logo standings-logo--shield" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" className="shield-svg">
          <path d="M12 2L4 5V11C4 16.5 7.5 21.3 12 22C16.5 21.3 20 16.5 20 11V5L12 2Z" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <span className="shield-initial">{initial}</span>
      </span>
    )
  }

  return (
    <span className="standings-logo" aria-hidden="true">
      <img src={logoUrl} alt="" width={28} height={28} loading="lazy" onError={() => setHasError(true)} />
    </span>
  )
}

function resultKind(value: string) {
  const upper = value.toUpperCase()
  if (upper.startsWith('W') || upper.startsWith('Z')) return 'win'
  if (upper.startsWith('L') || upper.startsWith('P')) return 'loss'
  return 'neutral'
}

/** Forma: litera + kształt (pełny / kontur) + tekst dla czytnika — kolor nie jest jedyną informacją. */
export function FormBadges({ form }: { form?: string[] }) {
  if (!form || form.length === 0) return <span className="standings-badge standings-badge--neutral">—</span>
  return (
    <span className="standings-form">
      {form.map((entry, index) => {
        const kind = resultKind(entry)
        const label = kind === 'win' ? 'Wygrana' : kind === 'loss' ? 'Porażka' : entry
        return (
          <span key={index} className={`standings-badge standings-badge--${kind}`} title={label}>
            <span aria-hidden="true">{kind === 'win' ? 'W' : kind === 'loss' ? 'P' : entry.toUpperCase()}</span>
            <span className="sr-only">{label}</span>
          </span>
        )
      })}
    </span>
  )
}

export function StreakBadge({ streak }: { streak?: string | null }) {
  if (!streak || streak.trim() === '' || streak.trim() === '—') {
    return <span className="standings-streak standings-badge--neutral">—</span>
  }
  const kind = resultKind(streak)
  // Polska notacja w tabeli (L → P)
  const display = streak.toUpperCase().startsWith('L') ? `P${streak.slice(1)}` : streak
  return (
    <span className={`standings-streak standings-badge--${kind}`}>
      <span aria-hidden="true">{display}</span>
      <span className="sr-only">
        {kind === 'win' ? 'Seria wygranych' : kind === 'loss' ? 'Seria porażek' : 'Seria'}: {streak.replace(/\D/g, '')}
      </span>
    </span>
  )
}

/**
 * Tabela ligi. compact: 5 wierszy wokół BeKaPaKa (strona główna). Pełna: kolumny dobierane do szerokości —
 * telefon: # · drużyna · M · W · P · Pkt; tablet: + bilans i forma; desktop: wszystkie. Bez przewijania i przełączników.
 */
export function StandingsBoard({ table, className, compact = false }: { table: TeamStanding[]; className?: string; compact?: boolean }) {
  const ownIndex = table.findIndex((row) => isBekapakaRow(row.name))
  const start = ownIndex < 0 ? 0 : Math.min(Math.max(ownIndex - 2, 0), Math.max(table.length - 5, 0))
  const visibleRows = compact ? table.slice(start, start + 5) : table

  return (
    <div className={`standings standings--${compact ? 'compact' : 'full'}${className ? ` ${className}` : ''}`}>
      <table className="table standings-table">
        <caption className="sr-only">Tabela KALK{compact ? ` — 5 z ${table.length} zespołów` : ''}</caption>
        <thead>
          <tr>
            <th scope="col" className="col-pos">#</th>
            <th scope="col" className="col-team">Drużyna</th>
            <th scope="col" className="col-stat col-matches"><abbr title="Mecze">M</abbr></th>
            <th scope="col" className="col-stat col-wins"><abbr title="Wygrane">W</abbr></th>
            <th scope="col" className="col-stat col-losses"><abbr title="Porażki">P</abbr></th>
            {!compact && <th scope="col" className="col-stat col-for col-wide"><abbr title="Punkty zdobyte">+</abbr></th>}
            {!compact && <th scope="col" className="col-stat col-against col-wide"><abbr title="Punkty stracone">−</abbr></th>}
            <th scope="col" className="col-stat col-diff col-mid"><abbr title="Bilans punktów">+/−</abbr></th>
            <th scope="col" className="col-stat col-pts col-key"><abbr title="Punkty ligowe">Pkt</abbr></th>
            {!compact && <th scope="col" className="col-form col-mid">Forma</th>}
            {!compact && <th scope="col" className="col-stat col-streak col-wide">Seria</th>}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => {
            const isBkp = isBekapakaRow(row.name)
            const position = row.position > 0 ? row.position : table.indexOf(row) + 1
            const matches = row.matches ?? row.wins + row.losses
            const pointsFor = row.pointsFor ?? 0
            const pointsAgainst = row.pointsAgainst ?? 0
            const diff = row.pointsDiff ?? pointsFor - pointsAgainst
            const points = row.points ?? row.wins * 2 + row.losses
            const diffClass = diff > 0 ? 'is-positive' : diff < 0 ? 'is-negative' : 'is-zero'
            return (
              <tr key={`${row.name}-${position}`} className={`standings-row${isBkp ? ' is-bkp' : ''}`} aria-current={isBkp ? 'true' : undefined}>
                <td className="col-pos">{position}</td>
                <th scope="row" className="col-team">
                  <span className="standings-team">
                    <TeamLogo logoUrl={row.logoUrl} name={row.name} isBkp={isBkp} />
                    <span className="standings-team__name">{row.name}</span>
                  </span>
                </th>
                <td className="col-stat col-matches">{matches}</td>
                <td className="col-stat col-wins">{row.wins}</td>
                <td className="col-stat col-losses">{row.losses}</td>
                {!compact && <td className="col-stat col-for col-wide">{pointsFor}</td>}
                {!compact && <td className="col-stat col-against col-wide">{pointsAgainst}</td>}
                <td className={`col-stat col-diff col-mid ${diffClass}`}>{formatDiffValue(diff)}</td>
                <td className="col-stat col-pts">{points}</td>
                {!compact && (
                  <td className="col-form col-mid">
                    <FormBadges form={row.form} />
                  </td>
                )}
                {!compact && (
                  <td className="col-stat col-streak col-wide">
                    <StreakBadge streak={row.streak} />
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>

      {compact && table.length > 5 && <p className="standings__note">Wybrane 5 z {table.length} zespołów.</p>}
      {!compact && (
        <dl className="glossary-inline glossary-inline--table" aria-label="Objaśnienia skrótów tabeli">
          <div><dt>M</dt><dd>mecze</dd></div>
          <div><dt>W</dt><dd>wygrane</dd></div>
          <div><dt>P</dt><dd>porażki</dd></div>
          <div className="col-wide"><dt>+ i −</dt><dd>punkty zdobyte i stracone</dd></div>
          <div className="col-mid"><dt>+/−</dt><dd>bilans punktów</dd></div>
          <div><dt>Pkt</dt><dd>punkty ligowe: 2 za wygraną, 1 za porażkę</dd></div>
          <div className="col-mid"><dt>Forma</dt><dd>ostatnie wyniki: W wygrana, P porażka</dd></div>
          <div className="col-wide"><dt>Seria</dt><dd>kolejne wygrane lub porażki</dd></div>
        </dl>
      )}
    </div>
  )
}
