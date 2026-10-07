import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'
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
const fixtureId = `repair-${randomUUID()}`
const adminId = `${fixtureId}-admin`
const gameId = `${fixtureId}-game`
const seasonId = `${fixtureId}-season`
const token = jwt.sign({ id: adminId, role: 'ADMIN' }, process.env.JWT_SECRET)
try {
  await prisma.rosterPlayer.create({ data: { id: adminId, firstName: 'Admin', lastName: 'Testowy', username: adminId, password: 'test-only', role: 'ADMIN' } })
  const season = await prisma.kalkSeason.create({ data: { id: seasonId, slug: seasonId, label: 'Sezon testowy', divisionPath: 'dzial,dywizja-3,4.html', isActive: false } })
  await prisma.game.create({ data: { id: gameId, seasonId, date: new Date('2026-10-18T12:00:00Z'), opponent: 'Testowy rywal' } })
  const path = `/api/admin/matches/game/${season.id}/${gameId}/presentation`
  const unauthenticated = await fetch(base + path, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ presentation: { status: 'LIVE' } }) })
  assert.equal(unauthenticated.status, 401)
  const userToken = jwt.sign({ id: adminId, role: 'USER' }, process.env.JWT_SECRET)
  const forbidden = await fetch(base + path, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` }, body: '{}' })
  assert.equal(forbidden.status, 403)
  const response = await fetch(base + path, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ presentation: { status: 'LIVE', scoreUs: 0, scoreThem: 2, quarter: 'Q1' } }) })
  assert.equal(response.status, 200)
  const result = await response.json()
  assert.equal(result.presentation.status, 'LIVE')
  assert.equal(result.revalidated, true)
  const saved = await prisma.game.findUnique({ where: { id: gameId } })
  assert.equal(saved.presentation.scoreUs, 0)
  assert.ok(saved.presentationUpdatedAt)
  const publicGame = await (await fetch(`${base}/api/games/${gameId}?seasonId=${season.id}`)).json()
  assert.equal(publicGame.presentation.status, 'LIVE')
  const oldTable = await (await fetch(`${base}/api/league/table?seasonId=${season.id}`)).json()
  assert.ok(Array.isArray(oldTable))
  const table = await (await fetch(`${base}/api/league/table?seasonId=${season.id}&includeMeta=1`)).json()
  assert.equal(table.meta.season.id, season.id)
  assert.equal(table.meta.updatedAt, null)
  assert.equal(table.meta.division, 'Dywizja 3')
  const importedAt = new Date('2026-10-05T10:00:00Z')
  await prisma.leagueTeam.create({ data: { seasonId, name: 'Testowy klub', wins: 0, updatedAt: importedAt } })
  const imported = await (await fetch(`${base}/api/league/table?seasonId=${seasonId}&includeMeta=1`)).json()
  assert.equal(imported.meta.updatedAt, importedAt.toISOString())
  assert.equal(imported.data[0].wins, 0)
  assert.equal(imported.meta.season.label, 'Sezon testowy')
  const roster = await (await fetch(`${base}/api/roster?seasonId=${seasonId}`)).json()
  const player = roster.find(row => row.id === adminId)
  assert.equal(player.seasonId, seasonId)
  assert.equal(player.seasonLabel, 'Sezon testowy')
  assert.equal(player.gamesPlayed, 0)
  assert.equal('password' in player, false)
  console.log(JSON.stringify({ authorizedSave: true, unauthenticated: 401, nonAdmin: 403, publicRead: true, persistedZero: true, revalidationHttp: true, legacyTableArray: true, tableMetadata: true, persistedImportTimestamp: true, divisionMetadata: true, rosterSeasonMetadata: true, publicRosterPrivacy: true }))
} finally {
  await new Promise(resolve => server.close(resolve))
  // deleteMany also cleans up after a failure during fixture setup.
  await prisma.game.deleteMany({ where: { id: gameId } })
  await prisma.kalkSeason.deleteMany({ where: { id: seasonId } })
  await prisma.rosterPlayer.deleteMany({ where: { id: adminId } })
  await prisma.$disconnect()
}
