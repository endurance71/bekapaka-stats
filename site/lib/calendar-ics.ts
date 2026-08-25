import { cmsEventCategoryLabel, type NearestHighlight } from './data/nearest-event'
import { formatVenue } from './venue'

const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000

export const ICS_FILENAME = 'bekapaka-wydarzenie.ics'

export interface CalendarEventPayload {
  uid: string
  title: string
  description: string
  location: string
  startAt: string
  endAt: string
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function toIcsUtc(date: Date): string {
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function resolveEndAt(startMs: number, endAtIso?: string): number {
  if (endAtIso) {
    const endMs = new Date(endAtIso).getTime()
    if (Number.isFinite(endMs) && endMs > startMs) return endMs
  }
  return startMs + DEFAULT_DURATION_MS
}

/** RFC 5545 — linie dłuższe niż 75 oktetów są łamane CRLF + spacja. */
function foldIcsLine(line: string): string {
  const max = 75
  if (line.length <= max) return line
  const parts = [line.slice(0, max)]
  let rest = line.slice(max)
  while (rest.length > 0) {
    parts.push(` ${rest.slice(0, max - 1)}`)
    rest = rest.slice(max - 1)
  }
  return parts.join('\r\n')
}

export function highlightToCalendarPayload(highlight: NearestHighlight): CalendarEventPayload | null {
  if (highlight.source === 'kalk') {
    const { game } = highlight
    const startMs = new Date(game.date).getTime()
    if (!Number.isFinite(startMs)) return null
    const venue = formatVenue(game.data?.venue)
    return {
      uid: `bekapaka-kalk-${game.id}@bekapaka.pl`,
      title: `BeKaPaKa vs ${game.opponent}`,
      description: 'Mecz ligowy BeKaPaKa Bobolice (terminarz KALK).',
      location: venue === '—' ? 'Bobolice' : venue,
      startAt: new Date(startMs).toISOString(),
      endAt: new Date(resolveEndAt(startMs)).toISOString()
    }
  }

  const { event } = highlight
  const startMs = new Date(event.startAt).getTime()
  if (!Number.isFinite(startMs)) return null
  return {
    uid: `bekapaka-event-${event.slug}@bekapaka.pl`,
    title: event.title,
    description: event.description || `${cmsEventCategoryLabel(event.type)} — BeKaPaKa Bobolice`,
    location: event.location || 'Bobolice',
    startAt: new Date(startMs).toISOString(),
    endAt: new Date(resolveEndAt(startMs, event.endAt)).toISOString()
  }
}

const UID_RE = /^bekapaka-(kalk|event)-[^@\s]{1,80}@bekapaka\.pl$/
const MAX_TEXT = {
  title: 180,
  description: 500,
  location: 180
} as const

function clip(value: string, max: number): string {
  return value.trim().slice(0, max)
}

export function calendarIcsHref(highlight: NearestHighlight): string | null {
  const payload = highlightToCalendarPayload(highlight)
  if (!payload) return null

  const params = new URLSearchParams({
    uid: payload.uid,
    title: clip(payload.title, MAX_TEXT.title),
    description: clip(payload.description, MAX_TEXT.description),
    location: clip(payload.location, MAX_TEXT.location),
    startAt: payload.startAt,
    endAt: payload.endAt
  })
  return `/api/calendar?${params.toString()}`
}

export function parseCalendarPayloadFromSearchParams(
  searchParams: URLSearchParams
): CalendarEventPayload | null {
  const uid = searchParams.get('uid')?.trim() || ''
  const title = clip(searchParams.get('title') || '', MAX_TEXT.title)
  const description = clip(searchParams.get('description') || '', MAX_TEXT.description)
  const location = clip(searchParams.get('location') || '', MAX_TEXT.location)
  const startAt = searchParams.get('startAt')?.trim() || ''
  const endAt = searchParams.get('endAt')?.trim() || ''

  if (!UID_RE.test(uid) || !title || !startAt || !endAt) return null

  const startMs = new Date(startAt).getTime()
  const endMs = new Date(endAt).getTime()
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return null

  return {
    uid,
    title,
    description,
    location: location || 'Bobolice',
    startAt: new Date(startMs).toISOString(),
    endAt: new Date(endMs).toISOString()
  }
}

export function buildIcsDocument(payload: CalendarEventPayload): string {
  const start = toIcsUtc(new Date(payload.startAt))
  const end = toIcsUtc(new Date(payload.endAt))
  const stamp = toIcsUtc(new Date())
  if (!start || !end) return ''

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BeKaPaKa Bobolice//PL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${payload.uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcsText(payload.title)}`,
    `DESCRIPTION:${escapeIcsText(payload.description)}`,
    `LOCATION:${escapeIcsText(payload.location)}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ]

  return `${lines.map(foldIcsLine).join('\r\n')}\r\n`
}
