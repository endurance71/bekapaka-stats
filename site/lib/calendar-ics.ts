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

const ICS_FILENAME = 'bekapaka-wydarzenie.ics'

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

/** Safari / iOS — otwiera import w aplikacji Kalendarz (Apple). */
function openAppleCalendarFromIcs(ics: string): void {
  const dataUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`
  window.location.assign(dataUrl)
}

async function shareIcsOnMobile(ics: string, payload: CalendarEventPayload): Promise<boolean> {
  if (!isMobileDevice() || typeof navigator.share !== 'function') return false

  const file = new File([ics], ICS_FILENAME, { type: 'text/calendar' })
  if (navigator.canShare && !navigator.canShare({ files: [file] })) return false

  try {
    await navigator.share({
      files: [file],
      title: payload.title,
      text: payload.description
    })
    return true
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return true
    return false
  }
}

function openIcsBlob(ics: string, forceDownload: boolean): void {
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.rel = 'noopener'
  if (forceDownload) anchor.download = ICS_FILENAME
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Jedna akcja „Dodaj do kalendarza”: iOS → Kalendarz Apple,
 * Android → udostępnienie pliku .ics (wybór aplikacji kalendarza),
 * desktop → pobranie .ics.
 */
export async function addToCalendar(payload: CalendarEventPayload): Promise<void> {
  const ics = buildIcsDocument(payload)
  if (!ics) return

  if (isIosDevice()) {
    openAppleCalendarFromIcs(ics)
    return
  }

  const shared = await shareIcsOnMobile(ics, payload)
  if (shared) return

  openIcsBlob(ics, !isMobileDevice())
}
