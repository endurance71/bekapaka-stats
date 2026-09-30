'use client'

import type { TeamStanding } from '../../../lib/data'
import { StandingsBoard } from './StandingsBoard'

export function StandingsBoardInteractive({ table }: { table: TeamStanding[] }) {
  return <StandingsBoard table={table} />
}
