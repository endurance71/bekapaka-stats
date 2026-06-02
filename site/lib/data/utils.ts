import { strapiCollectionSchema } from './schemas'

export function sanitizeText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return String(value)
  return fallback
}

export function sanitizeNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

export function toNormalizedArray(payload: unknown): Record<string, unknown>[] {
  const parsed = strapiCollectionSchema.safeParse(payload)
  if (!parsed.success) return []
  const data = parsed.data.data
  const entries = Array.isArray(data) ? data : data ? [data] : []

  return entries.map((entry) => {
    if (!entry || typeof entry !== 'object') return {}
    const attrs = (entry as { attributes?: unknown }).attributes
    if (attrs && typeof attrs === 'object') {
      return {
        id: sanitizeText((entry as { id?: unknown }).id),
        ...(attrs as Record<string, unknown>)
      }
    }
    return entry as Record<string, unknown>
  })
}
