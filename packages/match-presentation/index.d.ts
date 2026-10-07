export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'BREAK' | 'FINAL' | 'POSTPONED' | 'CANCELLED'
export type Presentation = {
  status?: MatchStatus
  competition?: string
  round?: string
  venue?: string
  kit?: string
  quarter?: string
  statusMessage?: string
  previousDate?: string | null
  newDate?: string | null
  scoreUs?: number | null
  scoreThem?: number | null
}
export const MATCH_STATUSES: MatchStatus[]
export function validatePresentation(value: unknown): Presentation | null
export function resolvePresentation<
  T extends { date: string; scoreUs?: number | null; scoreThem?: number | null }
>(
  game: T
): T &
  Presentation & {
    status: MatchStatus
    date: string
    competition: string
    venue: string
    updatedAt: string | null
  }
export function selectHeroGame<T extends { date: string }>(
  games: T[],
  now?: number
): ReturnType<typeof resolvePresentation<T>> | null
export function normalizeRoundName(round: string | null | undefined): string
