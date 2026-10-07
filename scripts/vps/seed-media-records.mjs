#!/usr/bin/env node
/**
 * Rekordy „Metadane i zgody zdjęć” (Strapi media-record) dla zdjęć już opublikowanych na stronie.
 *
 * Strona 2.0 pokazuje okładkę, galerię albo zdjęcie zawodnika tylko z opublikowanym rekordem
 * (alt + autor + zgoda granted / not_required) — site/lib/data/media-review.ts.
 * Skrypt tworzy brakujące rekordy (istniejących nie zmienia): zgoda „nie wymagana” (zdjęcia klubowe),
 * autor „BeKaPaKa Bobolice”, opis z alt / tytułu artykułu / imienia zawodnika. Poprawki — w panelu CMS.
 *
 * Uruchomienie na VPS (sieć Docker BeKaPaKa, sekrety z .env, nic nie jest wypisywane):
 *   cd /opt/bekapaka-stats
 *   docker run --rm --network bkpk-network --env-file <(grep -E '^(SITE_CMS_TOKEN|CMS_MEDIA_TOKEN)=' .env) \
 *     -v "$PWD/scripts/vps/seed-media-records.mjs:/seed.mjs:ro" node:22-alpine node /seed.mjs          # podgląd
 *   … node /seed.mjs --apply                                                                         # zapis
 */

export const AUTHOR = 'BeKaPaKa Bobolice'
export const CONSENT = 'not_required'

const CAMERA_OR_FILE = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4})|^(img|image|dsc|screenshot|photo|c[0-9a-f]{6,}|[0-9a-f]{8,})[_\s-]?\d*|\.(png|jpe?g|webp|gif|svg)$/i

/** Alt z CMS / Markdown tylko wtedy, gdy opisuje zdjęcie, a nie jest nazwą pliku. */
export function meaningfulAlt(text) {
  const clean = typeof text === 'string' ? text.trim() : ''
  return clean && !CAMERA_OR_FILE.test(clean) ? clean : ''
}

/** Adres pliku z CMS zapisujemy jako ścieżkę /uploads/… — strona porównuje adresy po sprowadzeniu do publicznego hosta CMS. */
export function normalizeMediaUrl(raw, cmsHosts = ['cms.bekapaka.pl', 'bkpk-cms', 'localhost']) {
  if (typeof raw !== 'string' || !raw.trim() || raw.startsWith('data:')) return ''
  const value = raw.trim()
  if (value.startsWith('/')) return value
  try {
    const url = new URL(value)
    return cmsHosts.includes(url.hostname) ? url.pathname : url.href
  } catch {
    return ''
  }
}

/** Lista rekordów do utworzenia z opublikowanych artykułów i składu (bez duplikatów, w kolejności występowania). */
export function collectMedia(posts, roster = []) {
  const media = new Map()
  const add = (rawUrl, alt) => {
    const url = normalizeMediaUrl(rawUrl)
    if (url && !media.has(url)) media.set(url, { url, alt, author: AUTHOR, consentStatus: CONSENT })
  }
  for (const raw of posts) {
    const post = raw.attributes || raw
    const title = String(post.title || 'Aktualność').trim()
    const cover = post.coverImage?.data?.attributes || post.coverImage
    if (cover?.url) add(cover.url, meaningfulAlt(cover.alternativeText) || `Okładka artykułu „${title}”`)
    let index = 0
    for (const match of String(post.content || '').matchAll(/!\[(.*?)\]\((.*?)\)/g)) {
      index += 1
      add(match[2], meaningfulAlt(match[1]) || `Zdjęcie z artykułu „${title}” (${index})`)
    }
    const attachments = post.attachments?.data || post.attachments || []
    for (const file of attachments) {
      const item = file.attributes || file
      if (String(item.mime || '').startsWith('image/')) add(item.url, meaningfulAlt(item.alternativeText) || `Załącznik do artykułu „${title}”`)
    }
  }
  for (const player of roster) {
    const name = [player.firstName, player.lastName].filter(Boolean).join(' ').trim()
    add(player.photo_url || player.photoUrl || player.photo, name ? `${name}, zawodnik BeKaPaKa Bobolice` : 'Zawodnik BeKaPaKa Bobolice')
  }
  return [...media.values()]
}

async function fetchAll(fetchImpl, base, path, headers) {
  const items = []
  for (let start = 0; ; start += 100) {
    const separator = path.includes('?') ? '&' : '?'
    const response = await fetchImpl(`${base}${path}${separator}pagination[start]=${start}&pagination[limit]=100`, { headers })
    if (!response.ok) throw new Error(`CMS ${path.split('?')[0]}: HTTP ${response.status}`)
    const { data } = await response.json()
    items.push(...(data || []))
    if ((data || []).length < 100) return items
  }
}

export async function run({ apply = false, fetchImpl = fetch, env = process.env, log = console.log } = {}) {
  const cms = env.SITE_CMS_API_URL || 'http://bkpk-cms:1337'
  const backend = env.SITE_BACKEND_API_URL || 'http://bkpk-backend:4001'
  const token = env.CMS_MEDIA_TOKEN || env.SITE_CMS_TOKEN
  if (!token) throw new Error('Brak tokenu CMS (CMS_MEDIA_TOKEN albo SITE_CMS_TOKEN).')
  const headers = { Authorization: `Bearer ${token}` }

  const posts = await fetchAll(fetchImpl, cms, '/api/news-posts?status=published&populate[coverImage]=true&populate[attachments]=true', headers)
  const rosterResponse = await fetchImpl(`${backend}/api/roster`)
  const roster = rosterResponse.ok ? await rosterResponse.json() : []
  const wanted = collectMedia(posts, Array.isArray(roster) ? roster : [])

  // Szkice i opublikowane — żeby nie tworzyć drugiego rekordu dla adresu, który ktoś już opisuje w CMS.
  const existing = new Set()
  for (const status of ['published', 'draft']) {
    for (const raw of await fetchAll(fetchImpl, cms, `/api/media-records?status=${status}`, headers)) {
      existing.add(normalizeMediaUrl((raw.attributes || raw).url))
    }
  }
  const missing = wanted.filter((item) => !existing.has(item.url))
  log(`Artykuły: ${posts.length} · zdjęcia: ${wanted.length} · mają rekord: ${wanted.length - missing.length} · do utworzenia: ${missing.length}`)
  for (const item of missing) log(`  ${apply ? '+' : '·'} ${item.url} — ${item.alt}`)
  if (!apply) {
    log('Podgląd — nic nie zapisano. Zapis: --apply')
    return { created: 0, missing }
  }

  let created = 0
  for (const item of missing) {
    const response = await fetchImpl(`${cms}/api/media-records?status=published`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: item })
    })
    if (!response.ok) throw new Error(`Nie udało się utworzyć rekordu ${item.url}: HTTP ${response.status} (utworzono ${created})`)
    created += 1
  }
  log(`Utworzono i opublikowano ${created} rekordów.`)
  return { created, missing }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run({ apply: process.argv.includes('--apply') }).catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
