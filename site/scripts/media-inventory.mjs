import { writeFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
if (existsSync('.env.local')) process.loadEnvFile('.env.local')
const base = process.env.SITE_CMS_API_URL || 'http://localhost:1337'
const headers = process.env.SITE_CMS_TOKEN
  ? { Authorization: `Bearer ${process.env.SITE_CMS_TOKEN}` }
  : {}
const media = new Map()
for (let start = 0; ; start += 100) {
  const response = await fetch(
    `${base}/api/news-posts?status=published&pagination[start]=${start}&pagination[limit]=100&populate[coverImage]=true&populate[attachments]=true`,
    { headers }
  )
  if (!response.ok) throw new Error(`CMS ${response.status}`)
  const { data } = await response.json()
  for (const raw of data || []) {
    const item = raw.attributes || raw
    const urls = []
    if (item.coverImage?.url) urls.push(item.coverImage.url)
    for (const match of String(item.content || '').matchAll(/!\[(.*?)\]\((.*?)\)/g))
      urls.push(match[2])
    for (const file of item.attachments || [])
      if (file.mime?.startsWith('image/')) urls.push(file.url)
    for (const rawUrl of urls) {
      const url = new URL(rawUrl, base).href
      const current = media.get(url) || {
        url,
        usedBy: [],
        alt: '',
        caption: '',
        author: '',
        consentStatus: 'unknown'
      }
      if (!current.usedBy.includes(item.slug)) current.usedBy.push(item.slug)
      media.set(url, current)
    }
  }
  if ((data || []).length < 100) break
}
const rosterResponse = await fetch(
  `${process.env.SITE_PREVIEW_BACKEND_URL || process.env.SITE_BACKEND_API_URL || 'http://localhost:4000'}/api/roster`
)
if (rosterResponse.ok)
  for (const player of await rosterResponse.json()) {
    const url = player.photo_url || player.photoUrl || player.photo
    if (typeof url === 'string' && !url.startsWith('data:'))
      media.set(url, {
        url,
        usedBy: [`/sklad/${player.id}`],
        alt: '',
        caption: '',
        author: '',
        consentStatus: 'unknown'
      })
  }
for (const name of await readdir('public/photos')) {
  if (name === 'default.png') continue
  const url = `/photos/${name}`
  media.set(url,{url,usedBy:['Lokalne portrety składu'],alt:'',caption:'',author:'',consentStatus:'unknown'})
}
const output = process.argv[2] || '../docs/qa/bekapaka-2-media-inventory.json'
await writeFile(output, JSON.stringify([...media.values()], null, 2) + '\n')
console.log(`Zapisano ${media.size} materiałów. Nie nadano zgód ani opisów.`)
