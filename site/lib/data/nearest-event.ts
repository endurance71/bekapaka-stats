import type { EventItem, GameSummary } from './schemas'

export type NearestHighlight =
  | { source: 'kalk'; at: string; game: GameSummary }
  | { source: 'cms'; at: string; event: EventItem }

function isUpcomingKalkGame(game: GameSummary, nowMs: number): boolean {
  const isUpcoming = !game.result && game.scoreUs === null && game.scoreThem === null
  const atMs = new Date(game.date).getTime()
  return isUpcoming && Number.isFinite(atMs) && atMs >= nowMs
}

function isUpcomingCmsEvent(event: EventItem, nowMs: number): boolean {
  const atMs = new Date(event.startAt).getTime()
  return Number.isFinite(atMs) && atMs >= nowMs
}

/**
 * Wybiera najwcześniejsze nadchodzące wydarzenie spośród meczów KALK i wpisów events z CMS.
 */
export function pickNearestUpcomingHighlight(
  games: GameSummary[],
  events: EventItem[],
  nowMs: number = Date.now()
): NearestHighlight | null {
  const candidates: Array<{ atMs: number; highlight: NearestHighlight }> = []

  for (const game of games) {
    if (!isUpcomingKalkGame(game, nowMs)) continue
    const atMs = new Date(game.date).getTime()
    candidates.push({
      atMs,
      highlight: { source: 'kalk', at: game.date, game }
    })
  }

  for (const event of events) {
    if (!isUpcomingCmsEvent(event, nowMs)) continue
    const atMs = new Date(event.startAt).getTime()
    candidates.push({
      atMs,
      highlight: { source: 'cms', at: event.startAt, event }
    })
  }

  candidates.sort((a, b) => a.atMs - b.atMs)
  return candidates[0]?.highlight ?? null
}

export function cmsEventCategoryLabel(type: string): string {
  const normalized = type.trim().toLowerCase()
  if (normalized === 'game' || normalized === 'mecz') return 'Spotkanie'
  if (normalized === 'training' || normalized === 'trening') return 'Trening'
  if (normalized === 'tournament' || normalized === 'turniej') return 'Turniej'
  return 'Wydarzenie'
}
