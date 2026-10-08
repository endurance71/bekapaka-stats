import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createStudioRouter } from '../../studio/routes.js';
import { filePath, hash } from '../../studio/storage.js';
import { slugify } from '../../studio/publications/website.js';

const enabled = !!process.env.STUDIO_TEST_DATABASE_URL;
const owner = `studio-www-${crypto.randomUUID()}`;
let db, studio, cmsServer, base, cookie, publication, item;
const calls = [];

// Minimal Strapi 5 REST double: records every write with its query so the test can prove drafts stay drafts.
function fakeCms() {
  const app = express();
  app.use(express.json());
  const posts = new Map();
  let uploads = 0;
  app.use((req, _res, next) => {
    if (req.get('Authorization') !== 'Bearer write-token') return _res.status(401).json({ error: { message: 'bad token' } });
    next();
  });
  app.post('/api/upload', multer().array('files'), (req, res) => {
    calls.push({ method: 'POST', path: '/api/upload', size: req.files[0].size, info: JSON.parse(req.body.fileInfo) });
    uploads += 1;
    res.json([{ id: uploads, documentId: `file-${uploads}`, url: `/uploads/cover-${uploads}.png` }]);
  });
  app.get('/api/news-posts', (req, res) =>
    res.json({ data: [...posts.values()].filter((p) => p.slug === req.query.filters?.slug?.$eq && (req.query.status === 'draft' || p.published)) }),
  );
  app.post('/api/news-posts', (req, res) => {
    calls.push({ method: 'POST', path: '/api/news-posts', status: req.query.status, data: req.body.data });
    const doc = { documentId: `doc-${posts.size + 1}`, ...req.body.data, published: req.query.status !== 'draft' };
    posts.set(doc.documentId, doc);
    res.json({ data: doc });
  });
  app.put('/api/news-posts/:id', (req, res) => {
    calls.push({ method: 'PUT', path: '/api/news-posts', status: req.query.status, data: req.body.data });
    const doc = { ...posts.get(req.params.id), ...req.body.data };
    if (req.query.status === 'published') doc.published = true;
    posts.set(req.params.id, doc);
    res.json({ data: doc });
  });
  app.post('/api/media-records', (req, res) => {
    calls.push({ method: 'POST', path: '/api/media-records', status: req.query.status, data: req.body.data });
    res.json({ data: { documentId: 'media-1', ...req.body.data } });
  });
  app.put('/api/media-records/:id', (req, res) => {
    calls.push({ method: 'PUT', path: '/api/media-records', status: req.query.status, data: req.body.data });
    res.json({ data: { documentId: req.params.id, ...req.body.data } });
  });
  return { app, posts };
}

async function request(url, body, method = 'GET') {
  const res = await fetch(base + url, {
    method,
    redirect: 'manual',
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), Origin: 'http://localhost:5174', 'X-Studio-Request': '1', ...(cookie ? { Cookie: cookie } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { res, value: res.headers.get('content-type')?.includes('json') ? await res.json() : await res.text() };
}
const website = (view) => view.items.find((i) => i.channel === 'website');

describe.skipIf(!enabled)('Studio website channel → Strapi drafts', () => {
  let cms;
  beforeAll(async () => {
    cms = fakeCms();
    cmsServer = cms.app.listen(0, '127.0.0.1');
    await new Promise((r) => cmsServer.once('listening', r));
    Object.assign(process.env, {
      STUDIO_OWNER_ID: owner,
      STUDIO_ORIGIN: 'http://localhost:5174',
      STUDIO_CMS_URL: `http://127.0.0.1:${cmsServer.address().port}`,
      STUDIO_CMS_WRITE_TOKEN: 'write-token',
      STUDIO_SITE_URL: 'https://bekapaka.example',
      STUDIO_SITE_PREVIEW_SECRET: 'preview-secret',
    });
    db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.STUDIO_TEST_DATABASE_URL }) });
    await db.rosterPlayer.create({ data: { id: owner, firstName: 'Właściciel', lastName: 'Strona', username: owner, password: 'test-only' } });
    const app = express();
    app.use(express.json());
    app.use(createStudioRouter({ db, loginUser: async (_u, p) => (p === 'valid' ? { user: { id: owner, firstName: 'W' } } : null) }));
    studio = app.listen(0, '127.0.0.1');
    await new Promise((r) => studio.once('listening', r));
    base = `http://127.0.0.1:${studio.address().port}`;
    cookie = (await request('/auth/login', { username: 'owner', password: 'valid' }, 'POST')).res.headers.get('set-cookie').split(';')[0];
    publication = (await request('/publications', { playbook: 'news', facts: { title: 'Nowe stroje dla drużyny', date: '2026-11-07T15:00:00.000Z' } }, 'POST')).value;
    item = website(publication);
    // A completed export of the graphic (rendering itself is covered elsewhere).
    const project = await db.studioProject.findUnique({ where: { id: item.projectId } });
    const key = `jobs/test-${owner}/cover.png`;
    await fs.mkdir(path.dirname(filePath(key)), { recursive: true });
    await fs.writeFile(filePath(key), Buffer.from('89504e470d0a1a0a', 'hex'));
    await db.studioJob.create({
      data: {
        ownerId: owner,
        projectId: project.id,
        revision: project.currentRevision,
        kind: 'export',
        status: 'completed',
        payload: {},
        result: { files: [{ key: `${item.format}-01`, name: 'cover.png', mime: 'image/png', storageKey: key, sha256: 'sha-1' }], expiresAt: new Date(Date.now() + 86400_000).toISOString() },
      },
    });
  }, 30_000);
  afterAll(async () => {
    await new Promise((r) => studio.close(r));
    await new Promise((r) => cmsServer.close(r));
    await fs.rm(path.dirname(filePath(`jobs/test-${owner}/cover.png`)), { recursive: true, force: true });
    await db.studioPublication.deleteMany({ where: { ownerId: owner } });
    await db.studioJob.deleteMany({ where: { ownerId: owner } });
    await db.studioProject.deleteMany({ where: { ownerId: owner } });
    await db.studioSession.deleteMany({ where: { ownerId: owner } });
    await db.studioTemplate.deleteMany({ where: { ownerId: owner } });
    await db.rosterPlayer.delete({ where: { id: owner } });
    await db.$disconnect();
  });

  it('turns titles into stable Polish slugs', () => {
    expect(slugify('Wygrana! BeKaPaKa Bobolice 78:64 Pantery')).toBe('wygrana-bekapaka-bobolice-78-64-pantery');
    expect(slugify('Żółć, łąka i ćma — źle?')).toBe('zolc-laka-i-cma-zle');
    expect(slugify('!!!')).toBe('aktualnosc');
  });

  it('creates a draft with cover, media record and tags — never publishing, once even on a double click', async () => {
    const [synced] = await Promise.all([1, 2].map(() => request(`/publications/${publication.id}/items/${item.id}/website/draft`, {}, 'POST')));
    expect(synced.res.status).toBe(200);
    const w = website(synced.value);
    expect(w.externalId).toBe('doc-1');
    expect(w.cms).toMatchObject({ slug: 'nowe-stroje-dla-druzyny', upToDate: true });
    const writes = calls.filter((c) => c.path === '/api/news-posts');
    expect(writes.filter((c) => c.method === 'POST')).toHaveLength(1);
    expect(writes.every((c) => c.status === 'draft')).toBe(true);
    expect(calls.filter((c) => c.path === '/api/upload')).toHaveLength(1);
    expect(writes[0]).toMatchObject({ method: 'POST', status: 'draft', data: { slug: 'nowe-stroje-dla-druzyny', coverImage: 1, imageFit: expect.any(String), tags: expect.any(Array) } });
    expect(cms.posts.get('doc-1').published).toBe(false);
    const media = calls.find((c) => c.path === '/api/media-records');
    expect(media).toMatchObject({ method: 'POST', status: 'published', data: { url: '/uploads/cover-1.png', consentStatus: 'not_required', author: 'BeKaPaKa Studio' } });
    expect(media.data.alt.length).toBeGreaterThan(0);
  });

  it('refreshes the same draft without a new upload and keeps it a draft', async () => {
    const before = calls.length;
    const view = (await request(`/publications/${publication.id}`)).value;
    const copy = { ...website(view).copy, excerpt: 'Nowe stroje dla drużyny BeKaPaKa Bobolice. Prezentacja odbędzie się po najbliższym meczu w KOSiR Koszalin — zapraszamy kibiców i rodziny.' };
    await request(`/publications/${publication.id}/items/${item.id}`, { expectedRevision: website(view).revision, copy }, 'PUT');
    const outdated = website((await request(`/publications/${publication.id}`)).value);
    expect(outdated.cms.upToDate).toBe(false);
    await request(`/publications/${publication.id}/items/${item.id}/website/draft`, {}, 'POST');
    const newCalls = calls.slice(before);
    expect(newCalls.some((c) => c.path === '/api/upload')).toBe(false);
    expect(newCalls.filter((c) => c.path === '/api/news-posts')).toEqual([expect.objectContaining({ method: 'PUT', status: 'draft' })]);
    expect(cms.posts.get('doc-1').published).toBe(false);
  });

  it('redirects to the draft-mode preview of the article', async () => {
    const r = await request(`/publications/${publication.id}/items/${item.id}/website/preview`);
    expect(r.res.status).toBe(302);
    const target = new URL(r.res.headers.get('location'));
    expect(target.origin + target.pathname).toBe('https://bekapaka.example/api/preview');
    expect(Object.fromEntries(target.searchParams)).toEqual({ url: '/aktualnosci/nowe-stroje-dla-druzyny', secret: 'preview-secret', status: 'draft' });
  });

  it('publishes only an approved variant, then locks it', async () => {
    let w = website((await request(`/publications/${publication.id}`)).value);
    expect((await request(`/publications/${publication.id}/items/${item.id}/website/publish`, { expectedRevision: w.revision }, 'POST')).res.status).toBe(422);
    // Approve as the owner would (graphic approval itself is covered by the Studio integration suite).
    const graphic = await db.studioRevision.findFirst({ where: { projectId: item.projectId }, orderBy: { number: 'desc' } });
    await db.studioPublicationItem.update({ where: { id: item.id }, data: { status: 'approved', approvedHash: hash({ copy: w.copy, graphic: graphic.contentHash, format: w.format }) } });
    w = website((await request(`/publications/${publication.id}`)).value);
    expect(w.stale).toBe(false);
    const published = await request(`/publications/${publication.id}/items/${item.id}/website/publish`, { expectedRevision: w.revision }, 'POST');
    expect(published.res.status).toBe(200);
    expect(website(published.value)).toMatchObject({ status: 'published', externalUrl: 'https://bekapaka.example/aktualnosci/nowe-stroje-dla-druzyny' });
    expect(calls.at(-1)).toMatchObject({ method: 'PUT', path: '/api/news-posts', status: 'published' });
    expect(cms.posts.get('doc-1').published).toBe(true);
    // Every create/update of the article before the explicit publish call was a draft.
    const writes = calls.filter((c) => c.path === '/api/news-posts');
    expect(writes.slice(0, -1).every((c) => c.status === 'draft')).toBe(true);
    expect((await request(`/publications/${publication.id}/items/${item.id}/website/draft`, {}, 'POST')).res.status).toBe(409);
  });
});
