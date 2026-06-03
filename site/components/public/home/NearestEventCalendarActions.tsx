'use client'

import type { NearestHighlight } from '../../../lib/data'
import {
  downloadIcsFile,
  highlightToCalendarPayload,
  openAppleCalendar
} from '../../../lib/calendar-ics'

interface NearestEventCalendarActionsProps {
  highlight: NearestHighlight
}

export function NearestEventCalendarActions({ highlight }: NearestEventCalendarActionsProps) {
  const payload = highlightToCalendarPayload(highlight)
  if (!payload) return null

  const handleDownloadIcs = () => {
    downloadIcsFile(payload)
  }

  const handleAppleCalendar = () => {
    openAppleCalendar(payload)
  }

  return (
    <div className='next-event-hero__calendar-actions'>
      <button
        type='button'
        className='next-event-hero__calendar-btn'
        onClick={handleDownloadIcs}
      >
        Pobierz .ics
      </button>
      <button
        type='button'
        className='next-event-hero__calendar-btn next-event-hero__calendar-btn--apple'
        onClick={handleAppleCalendar}
      >
        Apple Kalendarz
      </button>
    </div>
  )
}
