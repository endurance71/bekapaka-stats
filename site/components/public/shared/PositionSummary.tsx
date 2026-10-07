import type { TeamStanding } from '../../../lib/data'
import { formatDiffValue, formatPointBalance } from '../../../lib/format'
import { isBekapakaRow } from '../../../lib/navigation'

/** Pozycja BeKaPaKa w tabeli: cięta cyfra jako nagłówek + punkty, bilans, różnica. */
export function PositionSummary({ table, kicker }: { table: TeamStanding[]; kicker?: string }) {
  const own = table.find((row) => isBekapakaRow(row.name))
  const balance = own?.pointsDiff != null ? formatDiffValue(own.pointsDiff) : formatPointBalance(own?.pointsFor, own?.pointsAgainst)
  return (
    <div className="position">
      {kicker && <p className="kicker">{kicker}</p>}
      {own ? (
        <p className="position__line">
          <span className="position__rank cut" aria-hidden="true">
            {own.position}
          </span>
          <span className="position__text">
            <strong>{own.position}. miejsce</strong>
            <span>
              {own.points ?? '—'} pkt · bilans {own.wins}–{own.losses} ·{' '}
              <span aria-label={`Bilans punktów: ${balance}`}>+/− {balance}</span>
            </span>
          </span>
        </p>
      ) : (
        <p className="muted">Tabela czeka na dane ligi.</p>
      )}
    </div>
  )
}
