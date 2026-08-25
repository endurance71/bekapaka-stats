import type { NearestHighlight } from '../../../lib/data'
import { calendarIcsHref, ICS_FILENAME } from '../../../lib/calendar-ics'

interface NearestEventCalendarActionsProps {
  highlight: NearestHighlight
}

export function NearestEventCalendarActions({ highlight }: NearestEventCalendarActionsProps) {
  const href = calendarIcsHref(highlight)
  if (!href) return null

  return (
    <div className='next-event-hero__calendar-actions'>
      <a className='next-event-hero__calendar-btn' href={href} download={ICS_FILENAME}>
        Dodaj do kalendarza
      </a>
    </div>
  )
}
