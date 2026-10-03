import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createStudioRouter } from '../../studio/routes.js';
import { newProject, newPostProject, templates, postTypes, BRAND_VERSION } from '../../studio/contracts.js';
import { seedStudio } from '../../studio/seed.js';
import { claimJob, recoverJobs, processJob } from '../../studio/worker.js';
import { queueAi, budget } from '../../studio/ai.js';
import { projectView } from '../../studio/service.js';
import { importBackgroundPack } from '../../studio/import-backgrounds.js';
import { filePath } from '../../studio/storage.js';
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
  const r2 = await request('/templates'); expect(r2.value.templates).toHaveLength(templates.length); expect(r2.value.templates.every(t => t.status === 'draft')).toBe(true);
 });
 it('imports the background pack once and preserves withdrawals on subsequent releases', async () => {
  const imported = await importBackgroundPack(db, owner);
  const ids = imported.map(a => a.id);
  try {
   expect(imported).toHaveLength(9);
   expect(imported.every(a => a.created)).toBe(true);
   expect(imported.filter(a => a.status === 'approved')).toHaveLength(6);
   const first = await db.studioAsset.findUnique({ where: { id: ids[0] } });
   expect(first.provenance.prompt).toBeTruthy();
   expect(first.provenance.billingSource).toBe('external');
   await db.studioAsset.update({ where: { id: first.id }, data: { status: 'retired', consent: 'withdrawn' } });
   const repeated = await importBackgroundPack(db, owner);
   expect(repeated.every(a => !a.created)).toBe(true);
   expect(repeated.map(a => a.id)).toEqual(ids);
   expect(await db.studioAsset.count({ where: { ownerId: owner } })).toBe(9);
   const retired = await db.studioAsset.findUnique({ where: { id: first.id } });
   expect(retired.status).toBe('retired'); expect(retired.consent).toBe('withdrawn');
   expect(await db.studioAiUsage.count({ where: { ownerId: owner } })).toBe(0);
   await expect(importBackgroundPack(db, 'unknown-owner')).rejects.toThrow('Studio owner does not exist');
  } finally {
   const rows = await db.studioAsset.findMany({ where: { id: { in: ids } } });
   await db.studioAsset.deleteMany({ where: { id: { in: ids } } });
   await Promise.all(rows.map(a => fs.unlink(filePath(a.storageKey)).catch(() => {})));
  }
 }, 60_000);
 it('imports public statistics across seasons without changing sports data',async()=>{
  const seasonId=owner+'-season',second=owner+'-other';
  try {
   for(const id of [seasonId,second])await db.kalkSeason.create({data:{id,slug:id,label:id===seasonId?'2026/2027':'2025/2026'}});
   for(const [season,score] of [[seasonId,103],[second,80]])await db.kalkMatch.create({data:{id:'17',seasonId:season,slug:'match-17',date:new Date('2026-10-11T12:00:00Z'),homeTeamName:'Koszalin Basketball',guestTeamName:'BeKaPaKa Bobolice',scoreHome:91,scoreAway:score,isFinished:true,boxScore:{teams:[{name:'BeKaPaKa Bobolice',pts:score}]},aiSummary:'PRIVATE'}});
   await db.kalkPlayer.create({data:{id:owner+'-player',seasonId,name:'Paweł Lis',raw:{coachNotes:'PRIVATE'}}});
   await db.kalkPlayerGameLog.create({data:{seasonId,kalkPlayerId:owner+'-player',kalkMatchId:'17',teamName:'BeKaPaKa Bobolice',opponentName:'Koszalin Basketball',stats:{pts:0,reb:8}}});
   await db.leagueTeam.create({data:{seasonId,name:'BeKaPaKa Bobolice',position:1,matches:1,wins:1,losses:0,points:2}});
   await db.leagueMatch.create({data:{seasonId,date:new Date('2026-10-11T12:00:00Z'),homeTeam:'Koszalin Basketball',guestTeam:'BeKaPaKa Bobolice',scoreHome:91,scoreAway:103,isFinished:true,phaseLabel:'1'}});
   const first=await request(`/sources/statistics?kind=match-statistics&seasonId=${seasonId}&id=17`);expect(first.res.status).toBe(200);expect(first.value.data.scoreUs).toBe(103);expect(JSON.stringify(first.value)).not.toContain('PRIVATE');
   expect((await request(`/sources/statistics?kind=match-statistics&seasonId=${second}&id=17`)).value.data.scoreUs).toBe(80);
   const player=await request(`/sources/statistics?kind=match-statistics&seasonId=${seasonId}&id=17&subjectId=${owner}-player&view=player`);expect(player.value.data.tableRows[0].value).toBe('0');
   const refreshed=await request(`/sources/snapshot?kind=match-statistics&seasonId=${seasonId}&id=17&subjectId=${owner}-player&view=player`);expect(refreshed.value.source.hash).toBe(player.value.source.hash);
   for(const kind of ['standings','season','round']) {const r=await request(`/sources/statistics?kind=${kind}&seasonId=${seasonId}&id=1`);expect(r.res.status,JSON.stringify(r.value)).toBe(200);expect(r.value.data.tableRows.length).toBeGreaterThan(0);}
   expect((await request(`/sources/rounds?seasonId=${seasonId}`)).value).toEqual([{id:'1',title:'Kolejka 1'}]);
   expect((await request(`/sources/statistical-matches?seasonId=${seasonId}`)).value).toHaveLength(1);
   expect((await db.kalkMatch.findUnique({where:{seasonId_id:{seasonId,id:'17'}}})).scoreAway).toBe(103);
  } finally {await db.kalkSeason.deleteMany({where:{id:{in:[seasonId,second]}}});}
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
 it('isolates new composition and format approvals from legacy approvals', async()=>{
  const payload=newPostProject('preview');Object.assign(payload.content,{opponent:'Koszalin Basketball',opponentShort:'KBS',date:'2026-10-11T14:30:00+02:00',altText:'Zapowiedź meczu.'});
  const v=(await request('/projects',payload,'POST')).value;
  expect(v.revision.templateVersion).toBe('2.0.0:preview:sport');
  const catalog=(await request('/templates')).value;expect(catalog.postTypes).toHaveLength(postTypes.length);
  expect(catalog.postTypes.find(p=>p.id==='preview').designs.every(d=>d.status==='draft')).toBe(true);
  expect((await request(`/projects/${v.id}/jobs`,{kind:'export',idempotencyKey:'unapproved-v2'},'POST')).res.status).toBe(422);
  const p=(await request(`/projects/${v.id}/jobs`,{kind:'preview',format:'feed'},'POST')).value;
  const j=await claimJob(db,'render',owner);expect(j.id).toBe(p.id);await processJob(db,j);
  const done=(await request(`/jobs/${p.id}`)).value;expect(done.status,done.error).toBe('completed');
  expect((await request('/templates/announcement/approve',{confirmed:true,previewJobId:p.id},'POST')).res.status).toBe(422);
  expect((await request('/designs/preview/sport/story/approve',{confirmed:true,previewJobId:p.id},'POST')).res.status).toBe(422);
  expect((await request('/designs/preview/photo/feed/approve',{confirmed:true,previewJobId:p.id},'POST')).res.status).toBe(422);
  expect((await request('/designs/preview/sport/feed/approve',{confirmed:true,previewJobId:p.id},'POST')).res.status).toBe(200);
  const states=(await request('/templates')).value.postTypes.find(p=>p.id==='preview').designs;
  expect(states.filter(d=>d.status==='approved')).toEqual([{style:'sport',format:'feed',status:'approved'}]);
  expect((await request(`/projects/${v.id}/validation`)).value.errors.map(e=>e.field)).toContain('template');
  const story=(await request(`/projects/${v.id}/jobs`,{kind:'preview',format:'story'},'POST')).value;
  await processJob(db,await claimJob(db,'render',owner));
  expect((await request('/designs/preview/sport/story/approve',{confirmed:true,previewJobId:story.id},'POST')).res.status).toBe(200);
  expect((await request(`/projects/${v.id}/approve`,{confirmed:true,expectedRevision:1,previewJobId:story.id},'POST')).res.status).toBe(200);
  const exp=(await request(`/projects/${v.id}/jobs`,{kind:'export',idempotencyKey:'approved-v2'},'POST')).value;
  await processJob(db,await claimJob(db,'render',owner));
  expect((await request(`/jobs/${exp.id}`)).value.status).toBe('completed');
  const record=await db.studioExport.findUnique({where:{jobId:exp.id}});expect(record.manifest).toMatchObject({postType:'preview',visualStyle:'sport',designVersion:'2.0.0',rendererVersion:'2.0.0'});
  const changed=await request(`/projects/${v.id}`,{expectedRevision:1,project:{...payload,visualStyle:'editorial'}},'PUT');expect(changed.value.currentRevision).toBe(2);
  expect((await request('/designs/preview/sport/story/approve',{confirmed:true,previewJobId:story.id},'POST')).res.status).toBe(422);
 },60000);
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
