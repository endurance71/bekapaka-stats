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

/** Normalize Polish characters for URL-safe file paths */
export function normalizePolishChars(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/\s+/g, '-')
}

/** Build a local photo URL from player's first/last name */
export function getPhotoUrl(firstName?: string, lastName?: string): string {
  if (!firstName || !lastName) return '/photos/default.png'
  return `/photos/${normalizePolishChars(firstName)}-${normalizePolishChars(lastName)}.png`
}

/** Map position abbreviation to Polish label */
const POSITION_MAP: Record<string, string> = {
  G: 'Obrońca',
  F: 'Skrzydłowy',
  C: 'Środkowy',
  PG: 'Rozgrywający',
  SG: 'Rzucający obrońca',
  SF: 'Niski skrzydłowy',
  PF: 'Silny skrzydłowy'
}

export function getPositionLabel(position?: string): string {
  if (!position) return 'Zawodnik'
  return POSITION_MAP[position.toUpperCase()] || position
}

export function resolvePlayerPhoto(player?: {
  firstName?: string
  lastName?: string
  photo?: string | null
  photoUrl?: string | null
} | null): string {
  if (!player) return '/photos/default.png'

  // 1. Custom photo from user data (Base64 or URL)
  const customPhoto = player.photo
  if (customPhoto) return customPhoto

  // 2. Remote photo from KALK if valid and not empty placeholder
  const remotePhoto = player.photoUrl
  const hasValid = remotePhoto && !remotePhoto.toLowerCase().includes('empty.jpg')
  if (hasValid) return remotePhoto

  // 3. Fallback to name-based pattern
  return getPhotoUrl(player.firstName, player.lastName)
}

