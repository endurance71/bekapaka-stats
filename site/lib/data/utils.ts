import { strapiCollectionSchema } from './schemas'

export function sanitizeText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return String(value)
  return fallback
}

export function sanitizeNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const normalized = value.replace(',', '.').trim()
    const parsed = Number.parseFloat(normalized)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

/** Parse collection items one-by-one so a single Zod failure does not drop the list. */
export function parseCollectionItems<T>(
  items: unknown[],
  schema: { safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: { issues: unknown[] } } },
  label: string
): T[] {
  const parsed: T[] = []
  for (const item of items) {
    const result = schema.safeParse(item)
    if (result.success) {
      parsed.push(result.data)
      continue
    }
    console.warn(`[site] Pominięto nieprawidłowy element (${label}).`, result.error.issues)
  }
  return parsed
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

/** Slug for news URLs from a Polish title. */
export function slugifyTitle(title: string): string {
  return normalizePolishChars(title.trim())
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Strip common Markdown markers for card excerpts and meta descriptions. */
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/\n+/g, ' ')
    .trim()
}

/** Short plain-text excerpt from article body when CMS excerpt is empty. */
export function excerptFromContent(content: string, maxLength = 180): string {
  const plain = stripMarkdown(content)
  if (!plain) return ''
  if (plain.length <= maxLength) return plain
  const cut = plain.slice(0, maxLength)
  const lastSpace = cut.lastIndexOf(' ')
  const trimmed = lastSpace > 80 ? cut.slice(0, lastSpace) : cut
  return `${trimmed.trimEnd()}…`
}

const GENERIC_NEWS_SLUGS = new Set(['news-post', 'news', 'post'])

/** Prefer a readable slug; Strapi sometimes keeps the default uid "news-post". */
export function resolveNewsSlug(slug: string, title: string, fallbackIndex: number): string {
  const normalized = slug.trim().toLowerCase()
  if (normalized && !GENERIC_NEWS_SLUGS.has(normalized)) return slug.trim()
  const fromTitle = slugifyTitle(title)
  if (fromTitle) return fromTitle
  return `news-${fallbackIndex}`
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

const LOCAL_PHOTOS = new Set([
  'damian-motylinski',
  'emil-klos',
  'filip-karpinski',
  'filip-kawecki',
  'miroslaw-malina',
  'pablo-iriarte',
  'patryk-szczesniak',
  'pawel-samusionek',
  'przemyslaw-klimek',
  'robert-kulik',
  'tomasz-kaszubowski'
])

export function hasPlayerPhoto(player?: {
  firstName?: string
  lastName?: string
  photo?: string | null
  photoUrl?: string | null
} | null): boolean {
  if (!player) return false

  // 1. Database photo
  if (player.photo) return true

  // 2. Remote photo from KALK
  const remotePhoto = player.photoUrl
  const hasValidRemote = remotePhoto && !remotePhoto.toLowerCase().includes('empty.jpg')
  if (hasValidRemote) return true

  // 3. Check if local photo exists in our known list
  if (player.firstName && player.lastName) {
    const norm = normalizePolishChars(player.firstName) + '-' + normalizePolishChars(player.lastName)
    if (LOCAL_PHOTOS.has(norm)) return true
  }

  return false
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


