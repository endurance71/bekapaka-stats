/** Isolated CMS acceptance: never reads an existing database or remote CMS. */
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const path = require('node:path')
const fs = require('node:fs/promises')
const cwd = process.cwd()
assert.equal(path.basename(cwd), 'cms-app')
const filename = `.tmp/repair-cms-${process.pid}.db`
Object.assign(process.env, {
  NODE_ENV: 'test', HOST: '127.0.0.1', PORT: '3137',
  DATABASE_CLIENT: 'sqlite', DATABASE_FILENAME: filename, DATABASE_URL: '',
  APP_KEYS: `${crypto.randomBytes(32).toString('hex')},${crypto.randomBytes(32).toString('hex')}`,
  ADMIN_JWT_SECRET: crypto.randomBytes(32).toString('hex'),
  API_TOKEN_SALT: crypto.randomBytes(32).toString('hex'),
  TRANSFER_TOKEN_SALT: crypto.randomBytes(32).toString('hex'),
  JWT_SECRET: crypto.randomBytes(32).toString('hex'),
  ENCRYPTION_KEY: crypto.randomBytes(32).toString('hex'),
  STRAPI_TELEMETRY_DISABLED: 'true', STRAPI_DISABLE_UPDATE_NOTIFICATION: 'true'
})
const { createStrapi } = require('@strapi/strapi')
async function main() {
  const app = createStrapi({ appDir: cwd, distDir: cwd })
  try {
    await app.load()
    await new Promise((resolve, reject) => {
      app.server.httpServer.once('error', reject)
      app.server.listen(3137, '127.0.0.1', resolve)
    })
    const token = await app.service('admin::api-token').create({ name: 'repair-isolated-read', kind: 'content-api', type: 'full-access', lifespan: null })
    const headers = { Authorization: `Bearer ${token.accessKey}` }
    const uid = 'api::media-record.media-record'
    const draft = await app.documents(uid).create({ data: { url: 'https://cms.example/repair.jpg', alt: 'Opis testowy', caption: 'Podpis testowy', author: 'Autor testowy', consentStatus: 'granted' } })
    async function published() {
      const response = await fetch('http://127.0.0.1:3137/api/media-records?status=published', { headers })
      assert.equal(response.status, 200)
      return (await response.json()).data
    }
    assert.equal((await published()).length, 0)
    await app.documents(uid).publish({ documentId: draft.documentId })
    const data = await published()
    assert.equal(data.length, 1)
    assert.equal(data[0].author, 'Autor testowy')
    await app.documents(uid).unpublish({ documentId: draft.documentId })
    assert.equal((await published()).length, 0)
    const news = await app.documents('api::news-post.news-post').create({ data: { title: 'Testowy plakat', slug: 'repair-testowy-plakat', content: 'Opis testowy', imageFit: 'contain', eventDate: '2026-06-17T18:00:00.000Z' } })
    await app.documents('api::news-post.news-post').publish({ documentId: news.documentId })
    const response = await fetch('http://127.0.0.1:3137/api/news-posts?status=published', { headers })
    assert.equal(response.status, 200)
    const item = (await response.json()).data[0]
    assert.equal(item.imageFit, 'contain')
    assert.equal(item.eventDate, '2026-06-17T18:00:00.000Z')
    console.log(JSON.stringify({ isolatedDatabase: true, draftHidden: true, publishedMetadata: true, unpublishHidden: true, optionalNewsFields: true }))
  } finally {
    await app.destroy()
    await fs.rm(path.join(cwd, filename), { force: true })
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
