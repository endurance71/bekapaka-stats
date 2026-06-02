import { backendPath, fetchJson } from './client'
import { rosterPlayerSchema, teamStandingSchema, type RosterPlayer, type TeamStanding } from './schemas'
import { sanitizeNumber, sanitizeText } from './utils'

export async function getLeagueTable(): Promise<TeamStanding[]> {
  const payload = await fetchJson<Array<Record<string, unknown>>>(backendPath('/api/league/table'), { revalidate: 900 })
  if (!payload) return []

  return payload
    .map((row) => ({
      name: sanitizeText(row.team, sanitizeText(row.name, 'Druzyna')),
      position: sanitizeNumber(row.position, sanitizeNumber(row.rank, 0)),
      wins: sanitizeNumber(row.wins, 0),
      losses: sanitizeNumber(row.losses, 0)
    }))
    .map((item) => teamStandingSchema.parse(item))
}

export async function getRoster(): Promise<RosterPlayer[]> {
  const payload = await fetchJson<Array<Record<string, unknown>>>(backendPath('/api/roster'), { revalidate: 900 })
  if (!payload) return []

  return payload
    .map((player, index) => ({
      id: sanitizeText(player.id, String(index)),
      firstName: sanitizeText(player.firstName, ''),
      lastName: sanitizeText(player.lastName, ''),
      position: sanitizeText(player.position, 'Brak'),
      number: sanitizeText(player.number, '-')
    }))
    .map((item) => rosterPlayerSchema.parse(item))
}
