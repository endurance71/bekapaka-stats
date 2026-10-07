import assert from 'node:assert/strict'
import { test } from 'node:test'
import { collectMedia, meaningfulAlt, normalizeMediaUrl, run } from './seed-media-records.mjs'

test('camera file names and empty values are not used as alt', () => {
  assert.equal(meaningfulAlt('IMG_2041.jpg'), '')
  assert.equal(meaningfulAlt('3f2a9c1e-77aa-4b1c-9d00-aa11bb22cc33'), '')
  assert.equal(meaningfulAlt('  '), '')
  assert.equal(meaningfulAlt('Drużyna z pucharem'), 'Drużyna z pucharem')
})

test('CMS media URLs are stored as /uploads paths; data URIs are skipped', () => {
  assert.equal(normalizeMediaUrl('https://cms.bekapaka.pl/uploads/a.jpg'), '/uploads/a.jpg')
  assert.equal(normalizeMediaUrl('http://bkpk-cms:1337/uploads/a.jpg'), '/uploads/a.jpg')
  assert.equal(normalizeMediaUrl('/uploads/a.jpg'), '/uploads/a.jpg')
  assert.equal(normalizeMediaUrl('https://www.kalk-koszalin.com/p.png'), 'https://www.kalk-koszalin.com/p.png')
  assert.equal(normalizeMediaUrl('data:image/png;base64,AAAA'), '')
})

test('collects covers, inline images, image attachments and roster photos once, with readable alt', () => {
  const posts = [
    {
      title: 'Turniej',
      coverImage: { url: '/uploads/cover.jpg', alternativeText: 'IMG_1.jpg' },
      content: 'Tekst ![Zwycięzcy z pucharem](https://cms.bekapaka.pl/uploads/a.jpg)\n![DSC_0042.jpg](/uploads/b.jpg) ![x](/uploads/cover.jpg)',
      attachments: [{ url: '/uploads/plan.png', mime: 'image/png' }, { url: '/uploads/reg.pdf', mime: 'application/pdf' }]
    }
  ]
  const roster = [{ firstName: 'Jan', lastName: 'Nowak', photo: '/uploads/jan.png' }, { firstName: 'Bez', lastName: 'Zdjęcia' }]
  const media = collectMedia(posts, roster)
  assert.deepEqual(
    media.map((item) => [item.url, item.alt]),
    [
      ['/uploads/cover.jpg', 'Okładka artykułu „Turniej”'],
      ['/uploads/a.jpg', 'Zwycięzcy z pucharem'],
      ['/uploads/b.jpg', 'Zdjęcie z artykułu „Turniej” (2)'],
      ['/uploads/plan.png', 'Załącznik do artykułu „Turniej”'],
      ['/uploads/jan.png', 'Jan Nowak, zawodnik BeKaPaKa Bobolice']
    ]
  )
  assert.ok(media.every((item) => item.author === 'BeKaPaKa Bobolice' && item.consentStatus === 'not_required'))
})

function fakeCms({ posts, records }) {
  const calls = []
  const json = (data) => ({ ok: true, json: async () => data })
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, method: options.method || 'GET', body: options.body })
    if (url.includes('/api/news-posts')) return json({ data: posts })
    if (url.includes('/api/roster')) return json([])
    if (url.includes('/api/media-records') && !options.method) return json({ data: url.includes('status=published') ? records : [] })
    return { ok: true, json: async () => ({}) }
  }
  return { calls, fetchImpl }
}

test('dry run writes nothing; apply creates only missing records as published', async () => {
  const posts = [{ title: 'A', coverImage: { url: '/uploads/a.jpg' }, content: '![opis](/uploads/b.jpg)' }]
  const env = { SITE_CMS_TOKEN: 'secret', SITE_CMS_API_URL: 'http://cms', SITE_BACKEND_API_URL: 'http://api' }
  const log = () => {}

  const dry = fakeCms({ posts, records: [{ url: 'https://cms.bekapaka.pl/uploads/a.jpg' }] })
  const preview = await run({ fetchImpl: dry.fetchImpl, env, log })
  assert.deepEqual(preview.missing.map((item) => item.url), ['/uploads/b.jpg'])
  assert.equal(dry.calls.filter((call) => call.method === 'POST').length, 0)

  const live = fakeCms({ posts, records: [{ url: 'https://cms.bekapaka.pl/uploads/a.jpg' }] })
  const result = await run({ apply: true, fetchImpl: live.fetchImpl, env, log })
  const posts_ = live.calls.filter((call) => call.method === 'POST')
  assert.equal(result.created, 1)
  assert.equal(posts_.length, 1)
  assert.match(posts_[0].url, /\/api\/media-records\?status=published$/)
  assert.deepEqual(JSON.parse(posts_[0].body).data, { url: '/uploads/b.jpg', alt: 'opis', author: 'BeKaPaKa Bobolice', consentStatus: 'not_required' })
})

test('refuses to run without a CMS token', async () => {
  await assert.rejects(run({ env: {}, log: () => {} }), /Brak tokenu/)
})
