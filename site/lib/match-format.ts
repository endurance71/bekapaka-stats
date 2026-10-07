import type React from 'react'
import { SITE_TIMEZONE } from './timezone'

export type MatchDateParts = {
  valid: boolean
  day: string
  dayNumber: string
  month: string
  monthLong: string
  weekday: string
  weekdayLong: string
  time: string
  numeric: string
  long: string
}

const EMPTY: MatchDateParts = {
  valid: false,
  day: '—',
  dayNumber: '—',
  month: '',
  monthLong: '',
  weekday: '',
  weekdayLong: '',
  time: '—',
  numeric: '—',
  long: 'Termin zostanie potwierdzony'
}

/** Części daty meczu w strefie klubu — jedno źródło dla hero, wiersza terminarza i wyniku. */
export function matchDateParts(value?: string | null): MatchDateParts {
  if (!value) return EMPTY
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return EMPTY
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('pl-PL', { timeZone: SITE_TIMEZONE, ...options }).format(date)
  const day = part({ day: '2-digit' })
  const monthNumber = part({ month: '2-digit' })
  return {
    valid: true,
    day,
    dayNumber: part({ day: 'numeric' }),
    month: part({ month: 'short' }).replace('.', ''),
    monthLong: part({ day: 'numeric', month: 'long' }).replace(/^\d+\s/, ''),
    weekday: part({ weekday: 'short' }).replace('.', ''),
    weekdayLong: part({ weekday: 'long' }),
    time: part({ hour: '2-digit', minute: '2-digit', hour12: false }),
    numeric: `${day}.${monthNumber}`,
    long: part({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }
}

/** Długość nazwy drużyny dla typografii display (CSS dobiera rozmiar do szerokości kolumny). */
export function nameVars(name: string) {
  return { '--chars': String(Math.max(6, name.trim().length)) } as React.CSSProperties
}

export function mapsHref(venue: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`
}
