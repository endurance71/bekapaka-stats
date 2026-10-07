import type { NearestHighlight } from '../../../lib/data'
import { calendarIcsHref, ICS_FILENAME } from '../../../lib/calendar-ics'

/** Plik .ics z terminem meczu / wydarzenia. Primary tylko tam, gdzie to jedyna główna akcja ekranu. */
export function NearestEventCalendarActions({ highlight, primary = false }: { highlight: NearestHighlight; primary?: boolean }) {
  const href = calendarIcsHref(highlight)
  if (!href) return null
  return (
    <a className={`btn ${primary ? 'btn--primary' : 'btn--secondary'}`} href={href} download={ICS_FILENAME}>
      Dodaj do kalendarza
    </a>
  )
}
