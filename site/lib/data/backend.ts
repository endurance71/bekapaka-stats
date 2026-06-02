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

export async function getRecentGamesState(limit = 100): Promise<DataState<GameSummary[]>> {
  const response = await fetchJsonState<Array<Record<string, unknown>>>(backendPath('/api/games'), { revalidate: 300 })
  if (response.status === 'error') return stateFromArray([], response.message)

  const items = response.payload
    .slice(0, limit)
    .map((game, index) => {
      const scoreUs = game.scoreUs !== undefined && game.scoreUs !== null ? sanitizeNumber(game.scoreUs, 0) : null
      const scoreThem = game.scoreThem !== undefined && game.scoreThem !== null ? sanitizeNumber(game.scoreThem, 0) : null
      const result = game.result ? sanitizeText(game.result, '-') : null

      return {
        id: sanitizeText(game.id, String(index)),
        date: sanitizeText(game.date, ''),
        opponent: sanitizeText(game.opponent, 'Rywal'),
        result,
        scoreUs,
        scoreThem,
        homeAway: sanitizeText(game.homeAway, 'home'),
        coachNotes: game.coachNotes ? sanitizeText(game.coachNotes, '') : null,
        aiSummary: game.aiSummary ? sanitizeText(game.aiSummary, '') : null,
        videoUrl: game.videoUrl ? String(game.videoUrl) : null,
        teams: Array.isArray(game.teams) ? game.teams : (Array.isArray(game.teamStats) ? game.teamStats : undefined),
        playerStats: Array.isArray(game.playerStats) ? game.playerStats : undefined,
        data: game.data
      }
    })
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
      photoUrl: player.photo_url || player.photoUrl ? String(player.photo_url || player.photoUrl) : null,
      ppg: player.ppg !== undefined ? sanitizeNumber(player.ppg, 0) : undefined,
      rpg: player.rpg !== undefined ? sanitizeNumber(player.rpg, 0) : undefined,
      apg: player.apg !== undefined ? sanitizeNumber(player.apg, 0) : undefined,
      eval: player.eval !== undefined && player.eval !== null ? sanitizeNumber(player.eval, 0) : null,
      fgPercentage: player.fgPercentage !== undefined ? sanitizeNumber(player.fgPercentage, 0) : undefined,
      threePercentage: player.threePercentage !== undefined ? sanitizeNumber(player.threePercentage, 0) : undefined,
      ftPercentage: player.ftPercentage !== undefined ? sanitizeNumber(player.ftPercentage, 0) : undefined,
      tsPercentage: player.tsPercentage !== undefined ? sanitizeNumber(player.tsPercentage, 0) : undefined,
      eFgPercentage: player.eFgPercentage !== undefined ? sanitizeNumber(player.eFgPercentage, 0) : undefined,
      plusMinus: player.plusMinus !== undefined ? sanitizeNumber(player.plusMinus, 0) : undefined,
      gamesPlayed: player.gamesPlayed !== undefined ? sanitizeNumber(player.gamesPlayed, 0) : undefined,
      birthDate: player.birthDate ? String(player.birthDate) : null,
      heightCm: player.heightCm !== undefined && player.heightCm !== null ? sanitizeNumber(player.heightCm, 0) : null,
      aiDevelopmentSummary: player.aiDevelopmentSummary ? String(player.aiDevelopmentSummary) : null,
      games: Array.isArray(player.games) ? player.games : undefined
    }))
    .map((item) => rosterPlayerSchema.parse(item))

  return stateFromArray(items)
}
