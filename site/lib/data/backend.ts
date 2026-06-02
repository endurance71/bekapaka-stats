import { backendPath, fetchJsonState } from './client'
import {
  rosterPlayerSchema,
  teamStandingSchema,
  type DataState,
  type RosterPlayer,
  type TeamStanding
} from './schemas'
import { sanitizeNumber, sanitizeText } from './utils'

export async function getLeagueTable(): Promise<TeamStanding[]> {
  const state = await getLeagueTableState()
  return state.data
}

function stateFromArray<T>(items: T[], errorMessage?: string): DataState<T[]> {
  if (errorMessage) return { status: 'error', data: [], message: errorMessage }
  if (items.length === 0) return { status: 'empty', data: [] }
  return { status: 'ok', data: items }
}

export async function getLeagueTableState(): Promise<DataState<TeamStanding[]>> {
  const response = await fetchJsonState<Array<Record<string, unknown>>>(backendPath('/api/league/table'), { revalidate: 900 })
  if (response.status === 'error') return stateFromArray([], response.message)

  const items = response.payload
    .map((row) => ({
      name: sanitizeText(row.team, sanitizeText(row.name, 'Druzyna')),
      position: sanitizeNumber(row.position, sanitizeNumber(row.rank, 0)),
      wins: sanitizeNumber(row.wins, 0),
      losses: sanitizeNumber(row.losses, 0)
    }))
    .map((item) => teamStandingSchema.parse(item))

  return stateFromArray(items)
}

export async function getRoster(): Promise<RosterPlayer[]> {
  const state = await getRosterState()
  return state.data
}

export async function getRosterState(): Promise<DataState<RosterPlayer[]>> {
  const response = await fetchJsonState<Array<Record<string, unknown>>>(backendPath('/api/roster'), { revalidate: 900 })
  if (response.status === 'error') return stateFromArray([], response.message)

  const items = response.payload
    .map((player, index) => ({
      id: sanitizeText(player.id, String(index)),
      firstName: sanitizeText(player.firstName, ''),
      lastName: sanitizeText(player.lastName, ''),
      position: sanitizeText(player.position, 'Brak'),
      number: sanitizeText(player.number, '-')
    }))
    .map((item) => rosterPlayerSchema.parse(item))

  return stateFromArray(items)
}
