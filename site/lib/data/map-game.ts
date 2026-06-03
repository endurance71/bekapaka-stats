import { gameSummarySchema, type GameSummary } from './schemas'
import { sanitizeNumber, sanitizeText } from './utils'

function isTeamComparisonStats(value: unknown): value is Record<string, { home?: number; away?: number }> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

/**
 * Mapuje odpowiedź backendu (lista lub szczegóły) na {@link GameSummary} używany w site.
 */
export function mapApiGameToSummary(game: Record<string, unknown>, index = 0): GameSummary {
  const scoreUs = game.scoreUs !== undefined && game.scoreUs !== null ? sanitizeNumber(game.scoreUs, 0) : null
  const scoreThem =
    game.scoreThem !== undefined && game.scoreThem !== null ? sanitizeNumber(game.scoreThem, 0) : null
  const result = game.result ? sanitizeText(game.result, '-') : null

  const teams = Array.isArray(game.teams)
    ? game.teams
    : Array.isArray(game.teamStats) && game.teamStats.length > 0 && typeof game.teamStats[0] === 'object'
      ? (game.teamStats as unknown[])
      : undefined

  const nestedData =
    game.data && typeof game.data === 'object' && !Array.isArray(game.data)
      ? (game.data as Record<string, unknown>)
      : {}

  const teamStatsRaw = nestedData.teamStats ?? game.teamStats
  const comparisonTeamStats = isTeamComparisonStats(teamStatsRaw) ? teamStatsRaw : undefined
  const quarters = Array.isArray(game.quarters)
    ? game.quarters
    : Array.isArray(nestedData.quarters)
      ? nestedData.quarters
      : undefined

  const venue =
    typeof game.venue === 'string'
      ? game.venue
      : typeof nestedData.venue === 'string'
        ? nestedData.venue
        : undefined

  return gameSummarySchema.parse({
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
    teams,
    playerStats: Array.isArray(game.playerStats) ? game.playerStats : undefined,
    data: {
      ...nestedData,
      venue,
      quarters,
      teamStats: comparisonTeamStats,
      teams: teams ?? (Array.isArray(nestedData.teams) ? nestedData.teams : undefined)
    }
  })
}
