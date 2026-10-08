/**
 * Akcja po akcji: odpowiedź backendu (`GET /api/games/:id/play-by-play`, dane KALK v2 z bazy)
 * → okresy i zdarzenia dla `app/mecze/MatchPlayByPlay.tsx`.
 */

export interface PlayByPlayEvent {
  time: string
  side: 'home' | 'away' | 'neutral'
  player?: string | null
  action: string
  score?: string | null
}

export interface PlayByPlayPeriod {
  title: string
  events: PlayByPlayEvent[]
}

export interface PlayByPlayTeam {
  name: string
  isBekapaka: boolean
}

export interface PlayByPlayData {
  home: PlayByPlayTeam
  away: PlayByPlayTeam
  periods: PlayByPlayPeriod[]
}

interface BackendPbpEvent {
  period: number
  clockSec: number | null
  side: 'home' | 'away' | null
  playerName: string | null
  actionRaw: string | null
  actionType: string | null
  reboundType: string | null
  scoreHome: number | null
  scoreAway: number | null
  isScoring: boolean | null
}

interface BackendPbp {
  available?: boolean
  home?: { name?: string; isBekapaka?: boolean }
  away?: { name?: string; isBekapaka?: boolean }
  events?: BackendPbpEvent[]
}

function formatClock(sec: number | null): string {
  if (typeof sec !== 'number' || !Number.isFinite(sec) || sec < 0) return ''
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(Math.floor(sec % 60)).padStart(2, '0')}`
}

function periodTitle(period: number): string {
  return period > 4 ? `Dogrywka ${period - 4}` : `Kwarta ${period}`
}

const REBOUND_LABEL: Record<string, string> = {
  O: 'Zbiórka w ataku',
  D: 'Zbiórka w obronie',
  TEAM: 'Zbiórka zespołowa'
}

function actionText(ev: BackendPbpEvent): string {
  if (ev.actionType === 'rebound' && ev.reboundType && REBOUND_LABEL[ev.reboundType]) return REBOUND_LABEL[ev.reboundType]
  return ev.actionRaw?.trim() || ''
}

/** `null`, gdy mecz nie ma zapisu akcja po akcji (historia przed 2026/27). */
export function mapBackendPlayByPlay(raw: BackendPbp | null | undefined): PlayByPlayData | null {
  const events = Array.isArray(raw?.events) ? raw.events : []
  if (!raw || raw.available === false || events.length === 0) return null

  const byPeriod = new Map<number, PlayByPlayEvent[]>()
  for (const ev of events) {
    const list = byPeriod.get(ev.period) ?? []
    list.push({
      time: formatClock(ev.clockSec),
      side: ev.side === 'home' || ev.side === 'away' ? ev.side : 'neutral',
      player: ev.playerName,
      action: actionText(ev),
      score: ev.isScoring && ev.scoreHome != null && ev.scoreAway != null ? `${ev.scoreHome}:${ev.scoreAway}` : null
    })
    byPeriod.set(ev.period, list)
  }

  return {
    home: { name: raw.home?.name || 'Gospodarze', isBekapaka: Boolean(raw.home?.isBekapaka) },
    away: { name: raw.away?.name || 'Goście', isBekapaka: Boolean(raw.away?.isBekapaka) },
    periods: [...byPeriod.keys()]
      .sort((a, b) => a - b)
      .map((period) => ({ title: periodTitle(period), events: byPeriod.get(period)! }))
  }
}
