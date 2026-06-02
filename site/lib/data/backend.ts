import { backendPath, fetchJsonState } from './client'
import {
  gameSummarySchema,
  rosterPlayerSchema,
  teamStandingSchema,
  type DataState,
  type GameSummary,
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

  const rows = response.payload
    .map((row) => ({
      name: sanitizeText(row.team, sanitizeText(row.name, 'Druzyna')),
      position: sanitizeNumber(row.position, sanitizeNumber(row.rank, 0)),
      points: sanitizeNumber(row.points, 0),
      wins: sanitizeNumber(row.wins, 0),
      losses: sanitizeNumber(row.losses, 0)
    }))
    .sort((a, b) => b.points - a.points)

  const items = rows
    .map((row, index) => ({
      name: row.name,
      position: row.position > 0 ? row.position : index + 1,
      wins: row.wins,
      losses: row.losses
    }))
    .map((item) => teamStandingSchema.parse(item))

  return stateFromArray(items)
}

export async function getRecentGamesState(limit = 6): Promise<DataState<GameSummary[]>> {
  const response = await fetchJsonState<Array<Record<string, unknown>>>(backendPath('/api/games'), { revalidate: 300 })
  if (response.status === 'error') return stateFromArray([], response.message)

  const items = response.payload
    .slice(0, limit)
    .map((game, index) => ({
      id: sanitizeText(game.id, String(index)),
      date: sanitizeText(game.date, ''),
      opponent: sanitizeText(game.opponent, 'Rywal'),
      result: sanitizeText(game.result, '-'),
      scoreUs: sanitizeNumber(game.scoreUs, 0),
      scoreThem: sanitizeNumber(game.scoreThem, 0)
    }))
    .map((item) => gameSummarySchema.parse(item))

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
      number: sanitizeText(player.number, '-'),
      photo: player.photo ? String(player.photo) : null,
      photoUrl: player.photo_url ? String(player.photo_url) : null
    }))
    .map((item) => rosterPlayerSchema.parse(item))

  return stateFromArray(items)
}
