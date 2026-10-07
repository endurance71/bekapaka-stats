import { cmsHeaders, cmsPath, fetchJson, toAbsoluteCmsUrl } from './client'
export type MediaRecord = {
  url: string
  alt: string
  caption?: string
  author: string
  consentStatus: 'unknown' | 'granted' | 'not_required' | 'revoked'
}
export function approvedMedia(records: MediaRecord[], url: string | undefined) {
  if (!url) return undefined
  return records.find(
    (record) =>
      toAbsoluteCmsUrl(record.url) === toAbsoluteCmsUrl(url) &&
      ['granted', 'not_required'].includes(record.consentStatus) &&
      typeof record.alt === 'string' &&
      record.alt.trim() &&
      typeof record.author === 'string' &&
      record.author.trim()
  )
}
export async function getMediaRecords(): Promise<MediaRecord[]> {
  const records: MediaRecord[] = []
  for (let start = 0; ; start += 100) {
    const response = await fetchJson<{ data?: Array<MediaRecord & { attributes?: MediaRecord }> }>(
      cmsPath(
        `/api/media-records?status=published&pagination[start]=${start}&pagination[limit]=100`
      ),
      { headers: cmsHeaders(), revalidate: 60, tags: ['cms', 'cms-media'] }
    )
    const page = response?.data || []
    records.push(
      ...page.map((item) => {
        const record = item.attributes || item
        return {
          url: typeof record.url === 'string' ? record.url : '',
          alt: typeof record.alt === 'string' ? record.alt : '',
          author: typeof record.author === 'string' ? record.author : '',
          caption: typeof record.caption === 'string' ? record.caption : undefined,
          consentStatus: ['granted', 'not_required', 'revoked'].includes(record.consentStatus)
            ? record.consentStatus
            : ('unknown' as const)
        }
      })
    )
    if (page.length < 100) break
  }
  return records
}

/** Explicit local-only preview, never enabled by a public hostname. */
export function isLocalMediaPreview() {
  try {
    return (
      process.env.SITE_MEDIA_PREVIEW === '1' &&
      ['localhost', '127.0.0.1', '::1'].includes(new URL(process.env.SITE_BASE_URL || '').hostname)
    )
  } catch {
    return false
  }
}
