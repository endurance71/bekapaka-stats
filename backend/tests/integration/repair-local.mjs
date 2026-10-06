import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'
const url = new URL(process.env.REPAIR_TEST_DATABASE_URL || 'http://invalid')
assert.equal(url.hostname, '127.0.0.1')
assert.equal(url.port, '54491')
assert.equal(url.pathname, '/bkpk_repair')
assert.equal(process.env.DATABASE_URL, url.toString())
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'repair-test-only-secret-never-for-production'
process.env.SITE_REVALIDATE_SECRET = 'repair-local-revalidation-only'
process.env.SITE_BASE_URL = 'http://127.0.0.1:3100'
const { prisma } = await import('../../lib/prisma.js')
const { app } = await import('../../server.js')
const server = app.listen(0, '127.0.0.1')
await new Promise(resolve => server.once('listening', resolve))
const base = `http://127.0.0.1:${server.address().port}`
const token = jwt.sign({ id: 'repair-admin', role: 'ADMIN' }, process.env.JWT_SECRET)
await prisma.rosterPlayer.create({ data: { id: 'repair-admin', firstName: 'Admin', lastName: 'Testowy', username: 'repair-admin', password: 'test-only', role: 'ADMIN' } })
const season = await prisma.kalkSeason.create({ data: { id: 'repair-season', slug: 'repair-season', label: 'Sezon testowy', isActive: false } })
await prisma.game.create({ data: { id: 'repair-game', seasonId: season.id, date: new Date('2026-10-18T12:00:00Z'), opponent: 'Testowy rywal' } })
try {
  const path = `/api/admin/matches/game/${season.id}/repair-game/presentation`
  const unauthenticated = await fetch(base + path, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ presentation: { status: 'LIVE' } }) })
  assert.equal(unauthenticated.status, 401)
  const userToken = jwt.sign({ id: 'repair-admin', role: 'USER' }, process.env.JWT_SECRET)
  const forbidden = await fetch(base + path, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` }, body: '{}' })
  assert.equal(forbidden.status, 403)
  const response = await fetch(base + path, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ presentation: { status: 'LIVE', scoreUs: 0, scoreThem: 2, quarter: 'Q1' } }) })
  assert.equal(response.status, 200)
  const result = await response.json()
  assert.equal(result.presentation.status, 'LIVE')
  assert.equal(result.revalidated, true)
  const saved = await prisma.game.findUnique({ where: { id: 'repair-game' } })
  assert.equal(saved.presentation.scoreUs, 0)
  assert.ok(saved.presentationUpdatedAt)
  const publicGame = await (await fetch(`${base}/api/games/repair-game?seasonId=${season.id}`)).json()
  assert.equal(publicGame.presentation.status, 'LIVE')
  const oldTable = await (await fetch(`${base}/api/league/table?seasonId=${season.id}`)).json()
  assert.ok(Array.isArray(oldTable))
  const table = await (await fetch(`${base}/api/league/table?seasonId=${season.id}&includeMeta=1`)).json()
  assert.equal(table.meta.season.id, season.id)
  assert.equal(table.meta.updatedAt, null)
  console.log(JSON.stringify({ authorizedSave: true, unauthenticated: 401, nonAdmin: 403, publicRead: true, persistedZero: true, revalidationHttp: true, legacyTableArray: true, tableMetadata: true }))
} finally {
  await new Promise(resolve => server.close(resolve))
  await prisma.game.delete({ where: { id: 'repair-game' } })
  await prisma.kalkSeason.delete({ where: { id: season.id } })
  await prisma.rosterPlayer.delete({ where: { id: 'repair-admin' } })
  await prisma.$disconnect()
}
