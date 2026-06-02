export function formatDateTime(value?: string): string {
  if (!value) return 'Brak daty'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

export function formatDate(value?: string): string {
  if (!value) return 'Brak daty'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'medium'
  }).format(date)
}
