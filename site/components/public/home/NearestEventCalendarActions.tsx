'use client'

import type { NearestHighlight } from '../../../lib/data'
import { addToCalendar, highlightToCalendarPayload } from '../../../lib/calendar-ics'

interface NearestEventCalendarActionsProps {
  highlight: NearestHighlight
}

export function NearestEventCalendarActions({ highlight }: NearestEventCalendarActionsProps) {
  const payload = highlightToCalendarPayload(highlight)
  if (!payload) return null

  const handleAddToCalendar = () => {
    void addToCalendar(payload)
  }

  return (
    <div className='next-event-hero__calendar-actions'>
      <button
        type='button'
        className='next-event-hero__calendar-btn'
        onClick={handleAddToCalendar}
      >
        Dodaj do kalendarza
      </button>
    </div>
  )
}
