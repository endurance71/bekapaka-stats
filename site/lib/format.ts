import { SITE_TIMEZONE } from './timezone'

/** Krótki identyfikator do mobilnej tabeli; pełna nazwa pozostaje w nagłówku wiersza. */
export function formatTeamShortName(name: string): string {
  const trimmed = name.trim()
  if (/bekapaka|bobolice/i.test(trimmed)) return 'BKP'
  const words = trimmed.match(/[\p{L}\p{N}]+/gu) ?? []
  const first = words[0]
  if (!first) return '—'
  if (first.length >= 2 && first.length <= 4 && first === first.toLocaleUpperCase('pl-PL')) return first
  if (words.length > 1) return words.slice(0, 4).map(word => Array.from(word)[0]).join('').toLocaleUpperCase('pl-PL')
  return Array.from(first).slice(0, 3).join('').toLocaleUpperCase('pl-PL')
}

/** Składa datę z części Intl — unika różnic SSR/CSR (np. „,” vs „o” w pl-PL). */
function pickPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((part) => part.type === type)?.value ?? ''
}

function formatPlParts(date: Date, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormatPart[] {
  return new Intl.DateTimeFormat('pl-PL', { ...options, timeZone: SITE_TIMEZONE }).formatToParts(date)
}

export function formatDateTime(value?: string): string {
  if (!value) return 'Nieznana data'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Nieznana data'

  const parts = formatPlParts(date, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return `${pickPart(parts, 'day')} ${pickPart(parts, 'month')} ${pickPart(parts, 'year')} o ${pickPart(parts, 'hour')}:${pickPart(parts, 'minute')}`
}

export function formatDate(value?: string): string {
  if (!value) return 'Nieznana data'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Nieznana data'

  const parts = formatPlParts(date, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return `${pickPart(parts, 'day')} ${pickPart(parts, 'month')} ${pickPart(parts, 'year')}`
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

export function formatDiffValue(diff: number): string {
  if (diff > 0) return `+${diff}`
  return String(diff)
}
