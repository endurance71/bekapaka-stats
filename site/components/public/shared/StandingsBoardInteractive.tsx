'use client'

import { useState } from 'react'
import type { TeamStanding } from '../../../lib/data'
import { StandingsBoard } from './StandingsBoard'

export function StandingsBoardInteractive({ table }: { table: TeamStanding[] }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div>
      <button
        type='button'
        className='standings-board__toggle-cols'
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {expanded ? 'Ukryj kolumny bilansu' : 'Pokaż więcej kolumn'}
      </button>
      <StandingsBoard table={table} className={expanded ? 'is-expanded' : undefined} />
    </div>
  )
}
