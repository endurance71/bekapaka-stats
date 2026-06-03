import { cmsEventCategoryLabel, type NearestHighlight } from './data/nearest-event'
import { formatVenue } from './venue'

const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000

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

export function buildIcsDocument(payload: CalendarEventPayload): string {
  const start = toIcsUtc(new Date(payload.startAt))
  const end = toIcsUtc(new Date(payload.endAt))
  const stamp = toIcsUtc(new Date())
  if (!start || !end) return ''

  return [
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
  ].join('\r\n')
}

export function downloadIcsFile(payload: CalendarEventPayload, filename = 'bekapaka-wydarzenie.ics'): void {
  const ics = buildIcsDocument(payload)
  if (!ics) return
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

/** Safari / iOS — otwiera import w aplikacji Kalendarz (Apple). */
export function openAppleCalendar(payload: CalendarEventPayload): void {
  const ics = buildIcsDocument(payload)
  if (!ics) return
  const dataUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`
  window.location.assign(dataUrl)
}
