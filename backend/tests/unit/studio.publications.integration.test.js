import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createStudioRouter } from '../../studio/routes.js';

const enabled = !!process.env.STUDIO_TEST_DATABASE_URL;
const owner = `studio-pub-${crypto.randomUUID()}`;
let db, server, base, cookie;
async function request(url, body, method = 'GET') {
  const res = await fetch(base + url, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), Origin: 'http://localhost:5174', 'X-Studio-Request': '1', ...(cookie ? { Cookie: cookie } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const value = res.headers.get('content-type')?.includes('json') ? await res.json() : Buffer.from(await res.arrayBuffer());
  return { res, value };
}

describe.skipIf(!enabled)('Studio publications on isolated PostgreSQL', () => {
  beforeAll(async () => {
    process.env.STUDIO_OWNER_ID = owner;
    process.env.STUDIO_ORIGIN = 'http://localhost:5174';
    db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.STUDIO_TEST_DATABASE_URL }) });
    await db.rosterPlayer.create({ data: { id: owner, firstName: 'Właściciel', lastName: 'Publikacje', username: owner, password: 'test-only' } });
    const app = express();
    app.use(express.json());
    app.use(createStudioRouter({ db, loginUser: async (u, p) => (p === 'valid' ? { user: { id: owner, firstName: 'Właściciel' } } : null) }));
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
    const login = await request('/auth/login', { username: 'owner', password: 'valid' }, 'POST');
    cookie = login.res.headers.get('set-cookie').split(';')[0];
  }, 20_000);
  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
    await db.studioPublication.deleteMany({ where: { ownerId: { in: [owner, `${owner}-other`] } } });
    await db.studioSetting.deleteMany({ where: { ownerId: owner } });
    await db.studioJob.deleteMany({ where: { ownerId: owner } });
    await db.studioProject.deleteMany({ where: { ownerId: owner } });
    await db.studioSession.deleteMany({ where: { ownerId: owner } });
    await db.studioTemplate.deleteMany({ where: { ownerId: owner } });
    await db.rosterPlayer.delete({ where: { id: owner } });
    await db.$disconnect();
  });

  it('creates a publication with channel variants, schematic copy and a prefilled graphic', async () => {
    const created = await request(
      '/publications',
      { playbook: 'news', facts: { title: 'Spotkanie kibiców przed meczem', date: '2026-11-07T15:00:00.000Z', notes: 'Spotkanie przed meczem.' } },
      'POST',
    );
    expect(created.res.status).toBe(201);
    const p = created.value;
    expect(p.items.map((i) => i.channel)).toEqual(['instagram_feed', 'facebook', 'website']);
    expect(p.items.every((i) => i.copyOrigin === 'template' && i.status === 'draft')).toBe(true);
    expect(p.factsConfirmed).toBe(false);
    const graphic = await db.studioRevision.findFirst({ where: { projectId: p.items[0].projectId } });
    expect(graphic.payload.postType).toBe('news');
    expect(graphic.payload.content.title).toBe('Spotkanie kibiców przed meczem');
    expect(graphic.payload.content.altText).toContain('Aktualność');
    // Schematic copy never ships with brand errors.
    expect(p.items.flatMap((i) => i.issues).filter((i) => i.level === 'error')).toEqual([]);
  });

  it('blocks approval until facts are confirmed and the graphic is approved and exported', async () => {
    const [p] = (await request('/publications')).value;
    const item = p.items.find((i) => i.channel === 'facebook');
    const blocked = await request(`/publications/${p.id}/items/${item.id}/approve`, { expectedRevision: item.revision }, 'POST');
    expect(blocked.res.status).toBe(422);
    expect(blocked.value.details.map((d) => d.message)).toEqual(
      expect.arrayContaining(['Potwierdź fakty publikacji', 'Zatwierdź grafikę (dane, wygląd, kompozycja)']),
    );
    const confirmed = await request(`/publications/${p.id}/confirm-facts`, { expectedRevision: p.revision }, 'POST');
    expect(confirmed.value.factsConfirmed).toBe(true);
    // Editing facts afterwards requires a new confirmation.
    const edited = await request(`/publications/${p.id}`, { expectedRevision: confirmed.value.revision, facts: { notes: 'Zbiórka o 16:30.' } }, 'PUT');
    expect(edited.value.factsConfirmed).toBe(false);
  });

  it('keeps optimistic revisions, rejects copy outside the channel contract and never approves a stale draft', async () => {
    const [p] = (await request('/publications')).value;
    const item = p.items.find((i) => i.channel === 'instagram_feed');
    const copy = { caption: 'Bekapaka zaprasza!', hashtags: ['#BKPK'], firstComment: '', altText: 'Aktualność' };
    const saved = await request(`/publications/${p.id}/items/${item.id}`, { expectedRevision: item.revision, copy }, 'PUT');
    const next = saved.value.items.find((i) => i.id === item.id);
    expect(next.copyOrigin).toBe('manual');
    expect(next.issues.find((i) => i.field === 'caption').level).toBe('error');
    expect((await request(`/publications/${p.id}/items/${item.id}`, { expectedRevision: item.revision, copy }, 'PUT')).res.status).toBe(409);
    expect(
      (await request(`/publications/${p.id}/items/${item.id}`, { expectedRevision: next.revision, copy: { ...copy, hashtags: ['bez krzyżyka'] } }, 'PUT')).res.status,
    ).toBe(400);
    const applied = await request(`/publications/${p.id}/templates`, { channels: ['instagram_feed'] }, 'POST');
    expect(applied.value.items.find((i) => i.id === item.id).copyOrigin).toBe('template');
  });

  it('stores owner hashtag sets and isolates other owners', async () => {
    expect((await request('/settings')).value).toEqual({ hashtags: { instagram: ['#BKPK'], facebook: [] } });
    expect((await request('/settings', { hashtags: { instagram: ['#BKPK', '#KALK'], facebook: ['#BKPK'] } }, 'PUT')).res.status).toBe(200);
    const foreign = await db.studioPublication.create({ data: { ownerId: `${owner}-other`, title: 'Obca', playbook: 'news', facts: {}, factsHash: 'x' } });
    expect((await request(`/publications/${foreign.id}`)).res.status).toBe(404);
    expect((await request('/publications')).value.every((p) => p.ownerId === owner)).toBe(true);
  });

  it('refuses a package before any variant is approved and archives the publication', async () => {
    const [p] = (await request('/publications')).value;
    expect((await request(`/publications/${p.id}/package`)).res.status).toBe(422);
    expect((await request(`/publications/${p.id}/archive`, { archived: true }, 'POST')).res.status).toBe(200);
    expect((await request('/publications')).value).toHaveLength(0);
    expect((await request('/publications?status=archived')).value).toHaveLength(1);
  });
});
