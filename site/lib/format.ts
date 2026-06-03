import { SITE_TIMEZONE } from './timezone'

export function formatDateTime(value?: string): string {
  if (!value) return 'Nieznana data'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Nieznana data'
  return new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: SITE_TIMEZONE
  }).format(date)
}

export function formatDate(value?: string): string {
  if (!value) return 'Nieznana data'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Nieznana data'
  return new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'medium',
    timeZone: SITE_TIMEZONE
  }).format(date)
}

export function formatStat(value?: number | null, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return value.toFixed(digits)
}
