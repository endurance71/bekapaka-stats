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

/** Różnica zdobytych i straconych punktów (bilans punktowy w tabeli). */
export function formatPointBalance(pointsFor?: number, pointsAgainst?: number): string {
  if (
    pointsFor === undefined ||
    pointsAgainst === undefined ||
    Number.isNaN(pointsFor) ||
    Number.isNaN(pointsAgainst)
  ) {
    return '—'
  }
  const diff = pointsFor - pointsAgainst
  if (diff > 0) return `+${diff}`
  return String(diff)
}
