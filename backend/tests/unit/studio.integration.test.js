import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createStudioRouter } from '../../studio/routes.js';
import { newProject, BRAND_VERSION } from '../../studio/contracts.js';
import { seedStudio } from '../../studio/seed.js';
import { claimJob, recoverJobs, processJob } from '../../studio/worker.js';
import { queueAi, budget } from '../../studio/ai.js';
import { projectView } from '../../studio/service.js';
const enabled = !!process.env.STUDIO_TEST_DATABASE_URL;
const owner = `studio-test-${crypto.randomUUID()}`;
let db, server, base, cookie, project, preview;
async function request(url, body, method = 'GET', authenticated = true, headers = {}) {
 const res = await fetch(base + url, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), Origin: 'http://localhost:5174', 'X-Studio-Request': '1', ...(authenticated && cookie ? { Cookie: cookie } : {}), ...headers }, ...(body ? { body: JSON.stringify(body) } : {}) });
 const value = res.headers.get('content-type')?.includes('json') ? await res.json() : Buffer.from(await res.arrayBuffer()); return { res, value };
}
describe.skipIf(!enabled)('Studio isolated PostgreSQL integration', () => {
 beforeAll(async () => {
  process.env.STUDIO_OWNER_ID = owner; process.env.STUDIO_ORIGIN = 'http://localhost:5174';
  db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.STUDIO_TEST_DATABASE_URL }) });
  await db.rosterPlayer.create({ data: { id: owner, firstName: 'Właściciel', lastName: 'Integracja', username: owner, password: 'test-only' } });
  const app = express(); app.use(express.json()); app.use(createStudioRouter({ db, loginUser: async (u, p) => p === 'valid' ? { user: { id: u === 'owner' ? owner : 'foreign', firstName: 'Właściciel' } } : null }));
  server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve)); base = `http://127.0.0.1:${server.address().port}`;
 }, 20_000);
 afterAll(async () => {
  await new Promise(resolve => server.close(resolve));
  await db.studioAiUsage.deleteMany({ where: { ownerId: owner } }); await db.studioSession.deleteMany({ where: { ownerId: owner } }); await db.studioJob.deleteMany({ where: { ownerId: owner } }); await db.studioProject.deleteMany({ where: { ownerId: owner } }); await db.studioAsset.deleteMany({ where: { ownerId: owner } }); await db.studioPartner.deleteMany({ where: { ownerId: owner } }); await db.studioTemplate.deleteMany({ where: { ownerId: owner } }); await db.rosterPlayer.delete({ where: { id: owner } }); await db.$disconnect();
 });
 it('rejects unauthenticated requests, foreign login and CSRF', async () => {
  expect((await request('/projects')).res.status).toBe(401);
  expect((await request('/auth/login', { username: 'foreign', password: 'valid' }, 'POST')).res.status).toBe(401);
  expect((await request('/auth/login', { username: 'owner', password: 'valid' }, 'POST', false, { Origin: 'https://evil.example' })).res.status).toBe(403);
 });
 it('uses a scoped HttpOnly session and seeds only draft templates', async () => {
  const r = await request('/auth/login', { username: 'owner', password: 'valid' }, 'POST'); expect(r.res.status).toBe(200); const set = r.res.headers.get('set-cookie'); expect(set).toContain('HttpOnly'); expect(set).toContain('SameSite=Strict'); cookie = set.split(';')[0];
  expect((await request('/auth/me')).value.user.id).toBe(owner);
  const r2 = await request('/templates'); expect(r2.value.templates).toHaveLength(8); expect(r2.value.templates.every(t => t.status === 'draft')).toBe(true);
 });
 it('keeps immutable revisions, rejects stale updates and blocks unapproved export', async () => {
  const p = newProject('announcement'); p.content.opponent = 'Koszalin Basketball'; p.content.opponentShort = 'KBS'; p.content.date = '2026-10-11T14:30:00+02:00'; p.content.altText = 'Mecz BeKaPaKa z Koszalin Basketball.';
  project = (await request('/projects', p, 'POST')).value; expect(project.currentRevision).toBe(1);
  const updated = await request(`/projects/${project.id}`, { expectedRevision: 1, project: { ...p, name: 'Zapowiedź meczu' } }, 'PUT'); expect(updated.res.status).toBe(200); project = updated.value;
  expect((await request(`/projects/${project.id}`, { expectedRevision: 1, project: p }, 'PUT')).res.status).toBe(409);
  expect((await request(`/projects/${project.id}/revisions`)).value).toHaveLength(2);
  expect((await request(`/projects/${project.id}/jobs`, { kind: 'export', idempotencyKey: 'before-approval' }, 'POST')).res.status).toBe(422);
 });
 it('supersedes queued previews and renders the exact revision to an sRGB PNG', async () => {
  const first = await request(`/projects/${project.id}/jobs`, { kind: 'preview', format: 'feed' }, 'POST');
  preview = (await request(`/projects/${project.id}/jobs`, { kind: 'preview', format: 'story' }, 'POST')).value;
  expect((await request(`/jobs/${first.value.id}`)).value.status).toBe('superseded');
  const job = await claimJob(db, 'render', owner); expect(job.id).toBe(preview.id); expect(await claimJob(db, 'render', owner)).toBe(null);
  await processJob(db, job); preview = (await request(`/jobs/${preview.id}`)).value; expect(preview.status, preview.error).toBe('completed'); expect(preview.result.revision).toBe(2);
  const f = await request(`/jobs/${preview.id}/files/story-01`); expect(f.res.status).toBe(200); const meta = await sharp(f.value).metadata(); expect(meta.width).toBe(1080); expect(meta.height).toBe(1920); expect(meta.icc?.length).toBeGreaterThan(0);
  expect((await request(`/jobs/${preview.id}/files/story-01`, undefined, 'GET', false)).res.status).toBe(401);
 }, 60_000);
 it('requires successful visual preview to approve a template, exports ZIP idempotently', async () => {
  expect((await request('/templates/announcement/approve', { confirmed: true, previewJobId: crypto.randomUUID() }, 'POST')).res.status).toBe(422);
  expect((await request('/templates/announcement/approve', { confirmed: true, previewJobId: preview.id }, 'POST')).res.status).toBe(200);
  expect((await request(`/projects/${project.id}/approve`, { confirmed: true, expectedRevision: 1, previewJobId: preview.id }, 'POST')).res.status).toBe(409);
  expect((await request(`/projects/${project.id}/approve`, { confirmed: true, expectedRevision: 2, previewJobId: preview.id }, 'POST')).res.status).toBe(200);
  const a = await request(`/projects/${project.id}/jobs`, { kind: 'export', idempotencyKey: 'same-export-01' }, 'POST'); const b = await request(`/projects/${project.id}/jobs`, { kind: 'export', idempotencyKey: 'same-export-01' }, 'POST'); expect(a.value.id).toBe(b.value.id);
  const job = await claimJob(db, 'render', owner); await processJob(db, job);
  const done = (await request(`/jobs/${job.id}`)).value; expect(done.status, done.error).toBe('completed');
  const zip = await request(`/jobs/${job.id}/files/zip`); expect(zip.res.status).toBe(200); expect(zip.value.subarray(0, 2).toString()).toBe('PK');
  const record = await db.studioExport.findUnique({ where: { jobId: job.id } }); expect(record.manifest.brandVersion).toBe(BRAND_VERSION); expect(record.manifest.project.content.opponent).toBe('Koszalin Basketball'); expect(record.manifest.files).toHaveLength(2);
 }, 60_000);
 it('serves the last stored preview for archived projects and restores them to draft', async () => {
  const copy = (await request(`/projects/${project.id}/duplicate`, {}, 'POST')).value;
  await db.studioJob.create({ data: { ownerId: owner, projectId: copy.id, revision: 1, kind: 'preview', status: 'completed', payload: { format: 'story' }, result: { files: [{ key: 'story-01', name: 'x.png', mime: 'image/png' }], expiresAt: new Date(Date.now() + 3600_000).toISOString() } } });
  expect((await request(`/projects/${copy.id}/archive`, { confirmed: true }, 'POST')).res.status).toBe(200);
  expect((await request(`/projects/${copy.id}/jobs`, { kind: 'preview', format: 'story' }, 'POST')).res.status).toBe(409);
  const stored = await request(`/projects/${copy.id}/preview?format=story`); expect(stored.res.status).toBe(200); expect(stored.value.result.files[0].key).toBe('story-01'); expect(stored.value.leaseToken).toBeUndefined();
  expect((await request(`/projects/${copy.id}/preview?format=feed`)).value).toBe(null);
  const restored = await request(`/projects/${copy.id}/restore`, { confirmed: true }, 'POST'); expect(restored.res.status).toBe(200); expect(restored.value.status).toBe('draft');
  expect((await request(`/projects/${copy.id}/restore`, { confirmed: true }, 'POST')).res.status).toBe(409);
 });
 it('recovers render leases but never retries an ambiguous AI request', async () => {
  const render = await db.studioJob.create({ data: { ownerId: owner, kind: 'preview', status: 'running', attempts: 1, payload: {}, leaseUntil: new Date(0) } });
  const ai = await db.studioJob.create({ data: { ownerId: owner, kind: 'ai-image', status: 'running', attempts: 1, payload: {}, leaseUntil: new Date(0) } }); await recoverJobs(db);
  expect((await db.studioJob.findUnique({ where: { id: render.id } })).status).toBe('queued'); expect((await db.studioJob.findUnique({ where: { id: ai.id } })).status).toBe('uncertain'); await db.studioJob.delete({ where: { id: render.id } });
 });
 it('serializes concurrent budget reservations and blocks over-budget requests', async () => {
  process.env.STUDIO_GEMINI_API_KEY = 'test-never-sent-to-provider'; process.env.STUDIO_AI_BUDGET_USD = '0.30';
  const v = await projectView(db, owner, project.id); const results = await Promise.allSettled([queueAi(db, owner, v, 'image', 'texture'), queueAi(db, owner, v, 'image', 'texture')]); expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1); expect((await budget(db, owner)).remainingMicros).toBe(0); delete process.env.STUDIO_GEMINI_API_KEY; delete process.env.STUDIO_AI_BUDGET_USD;
 });
 it('revokes sessions when the account password changes', async () => { await db.rosterPlayer.update({ where: { id: owner }, data: { password: 'rotated-test-only' } }); expect((await request('/auth/me')).res.status).toBe(401); const r = await request('/auth/login', { username: 'owner', password: 'valid' }, 'POST'); expect(r.res.status).toBe(200); cookie = r.res.headers.get('set-cookie').split(';')[0]; });
 it('revokes the session on logout', async () => { expect((await request('/auth/logout', {}, 'POST')).res.status).toBe(200); expect((await request('/auth/me')).res.status).toBe(401); });
});
