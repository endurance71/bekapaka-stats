import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createStudioRouter } from '../../studio/routes.js';
import { renderJob } from '../../studio/render.js';

const enabled = !!process.env.STUDIO_TEST_DATABASE_URL;
const owner = `studio-agent-graphics-${crypto.randomUUID()}`;
let db, server, base, cookie, publication, projectId, token, draftToken, tokenRow;

async function request(url, body, method = 'GET') {
  const res = await fetch(base + url, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), Origin: 'http://localhost:5174', 'X-Studio-Request': '1', ...(cookie ? { Cookie: cookie } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { res, value: res.headers.get('content-type')?.includes('json') ? await res.json() : await res.text() };
}
let rpcId = 0;
async function mcp(method, params, bearer = token) {
  const res = await fetch(`${base}/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', Authorization: `Bearer ${bearer}` },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method, params }),
  });
  return res.json();
}
// Production renders in the worker container. Here this owner's queue is rendered directly, never marked „running”,
// so parallel test files keep their one-job-at-a-time render lane (claimJob counts running jobs of every owner).
async function drain() {
  const jobs = await db.studioJob.findMany({ where: { ownerId: owner, status: 'queued', kind: { in: ['preview', 'export'] } }, orderBy: { createdAt: 'asc' } });
  for (const job of jobs) {
    try {
      await db.studioJob.update({ where: { id: job.id }, data: { status: 'completed', result: await renderJob(db, job), finishedAt: new Date() } });
    } catch (err) {
      await db.studioJob.update({ where: { id: job.id }, data: { status: 'failed', error: String(err.message), finishedAt: new Date() } });
    }
  }
}
async function withWorker(fn) {
  let running = true;
  const loop = (async () => {
    while (running) {
      await drain();
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  })();
  try {
    return await fn();
  } finally {
    running = false;
    await loop;
  }
}
const call = (name, args, bearer) => withWorker(() => mcp('tools/call', { name, arguments: args }, bearer));
const summary = (r) => JSON.parse(r.result.content[0].text);
// Signed links carry the Studio origin; the test server listens elsewhere.
const local = (url) => base + url.slice(url.indexOf('/agent-files/'));

describe.skipIf(!enabled)('Studio MCP graphics: preview, approval after the owner OK, export links', () => {
  beforeAll(async () => {
    process.env.STUDIO_OWNER_ID = owner;
    process.env.STUDIO_ORIGIN = 'http://localhost:5174';
    db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.STUDIO_TEST_DATABASE_URL }) });
    await db.rosterPlayer.create({ data: { id: owner, firstName: 'Właściciel', lastName: 'Grafiki', username: owner, password: 'test-only' } });
    const app = express();
    app.use(express.json());
    app.use(createStudioRouter({ db, loginUser: async (_u, p) => (p === 'valid' ? { user: { id: owner, firstName: 'Właściciel' } } : null) }));
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
    cookie = (await request('/auth/login', { username: 'owner', password: 'valid' }, 'POST')).res.headers.get('set-cookie').split(';')[0];
    publication = (await request('/publications', { playbook: 'news', facts: { title: 'Spotkanie kibiców przed meczem', date: '2026-11-07T15:00:00.000Z', notes: 'Spotkanie przed meczem.' } }, 'POST')).value;
    projectId = publication.items.find((i) => i.channel === 'instagram_feed').projectId;
    draftToken = (await request('/agent-tokens', { name: 'Tylko szkice' }, 'POST')).value.token;
    const created = await request('/agent-tokens', { name: 'OpenBot Social' }, 'POST');
    token = created.value.token;
    tokenRow = created.value;
  }, 20_000);
  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
    await db.studioPublication.deleteMany({ where: { ownerId: owner } });
    await db.studioAgentToken.deleteMany({ where: { ownerId: owner } });
    await db.studioJob.deleteMany({ where: { ownerId: owner } });
    await db.studioProject.deleteMany({ where: { ownerId: owner } });
    await db.studioSession.deleteMany({ where: { ownerId: owner } });
    await db.studioTemplate.deleteMany({ where: { ownerId: owner } });
    await db.studioSetting.deleteMany({ where: { ownerId: owner } });
    await db.rosterPlayer.delete({ where: { id: owner } });
    await db.$disconnect();
  });

  it('keeps approve_graphics behind the opt-in graphics scope, switchable on an existing token', async () => {
    const names = async (bearer) => (await mcp('tools/list', {}, bearer)).result.tools.map((t) => t.name);
    expect(await names(token)).toContain('render_graphics');
    expect(await names(token)).not.toContain('approve_graphics');
    const denied = await mcp('tools/call', { name: 'approve_graphics', arguments: { publicationId: publication.id, channel: 'instagram_feed', ownerApproval: 'akceptuję' } });
    expect(denied.result.isError).toBe(true);
    const updated = await request(`/agent-tokens/${tokenRow.id}/scopes`, { scopes: ['graphics'] }, 'POST');
    expect(updated.res.status).toBe(200);
    expect(updated.value.scopes).toEqual(['read', 'draft', 'graphics']);
    expect(await names(token)).toContain('approve_graphics');
    expect(await names(draftToken)).not.toContain('approve_graphics');
    expect((await request(`/agent-tokens/${tokenRow.id}/scopes`, { scopes: ['publish'] }, 'POST')).res.status).toBe(400);
  });

  it('renders the channel preview as an image with a signed full-size link', async () => {
    const r = await call('render_graphics', { publicationId: publication.id, channel: 'instagram_feed' });
    expect(r.result.isError).toBeFalsy();
    const s = summary(r);
    expect(s.graphics).toHaveLength(1);
    const [g] = s.graphics;
    expect(g.status, g.error).toBe('completed');
    // No story channel in this publication: render drops that format first (revision 2), so it cannot block the export.
    expect(g).toMatchObject({ projectId, format: 'feed', revision: 2 });
    expect((await request(`/projects/${projectId}`)).value.payload.formats).toEqual(['feed', 'landscape']);
    // Nothing approved yet: the template still needs the owner's look in Studio; the revision approval is not listed.
    expect(g.blockersBeforeExport).toContain('Zatwierdź bieżącą wersję szablonu po ocenie podglądu');
    expect(g.blockersBeforeExport).not.toContain('Potwierdź dane i wygląd tej rewizji');
    expect(r.result.content[1]).toMatchObject({ type: 'image', mimeType: 'image/jpeg' });
    expect(Buffer.from(r.result.content[1].data, 'base64').subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]));
    const file = await fetch(local(g.previewLinks[0]));
    expect(file.status).toBe(200);
    expect(file.headers.get('content-type')).toBe('image/png');
    // A tampered or expired link opens nothing.
    expect((await fetch(local(g.previewLinks[0]).replace(/sig=[^&]+/, 'sig=' + 'A'.repeat(43)))).status).toBe(404);
    const exp = Date.now() - 1000;
    expect((await fetch(local(g.previewLinks[0]).replace(/exp=\d+/, `exp=${exp}`))).status).toBe(404);
  }, 60_000);

  it('records the owner OK but exports only once Studio checks pass', async () => {
    const r = await call('approve_graphics', { publicationId: publication.id, channel: 'instagram_feed', ownerApproval: 'akceptuję' });
    const s = summary(r);
    expect(s).toMatchObject({ approved: 1, exported: false });
    // The OK covers the composition shown (4:5); the 16:9 of the website variant still waits for its own look.
    expect(s.blocked[0].errors).toContain('Zatwierdź bieżącą wersję szablonu po ocenie podglądu');
    expect(s.blocked[0].errors).not.toContain('Potwierdź dane i wygląd tej rewizji');
    const project = (await request(`/projects/${projectId}`)).value;
    const designs = await db.studioTemplate.findMany({ where: { ownerId: owner, status: 'approved' } });
    expect(designs.map((d) => d.version.split(':')[3])).toEqual(['feed']);
    expect(project.currentRevision).toBe(2);
    const item = publication.items.find((i) => i.channel === 'instagram_feed');
    const event = await db.studioPublishEvent.findFirst({ where: { itemId: item.id, action: 'graphics-approved' } });
    expect(event).toMatchObject({ actor: 'agent:OpenBot Social', payload: { ownerApproval: 'akceptuję', graphics: [{ projectId, revision: 2, formats: ['feed'] }] } });
  }, 60_000);

  it('exports the approved revision and serves the final PNG through the signed link', async () => {
    // The owner approves the composition (once per design and format) in Studio.
    const project = (await request(`/projects/${projectId}`)).value;
    for (const format of project.payload.formats) {
      const queued = (await request(`/projects/${projectId}/jobs`, { kind: 'preview', format }, 'POST')).value;
      await drain();
      const done = (await request(`/jobs/${queued.id}`)).value;
      expect(done.status, done.error).toBe('completed');
      const ok = await request(`/designs/${project.payload.postType}/${project.payload.visualStyle}/${format}/approve`, { confirmed: true, previewJobId: queued.id }, 'POST');
      expect(ok.res.status, JSON.stringify(ok.value)).toBe(200);
    }
    const r = await call('approve_graphics', { publicationId: publication.id, channel: 'instagram_feed', ownerApproval: 'akceptuję' });
    const s = summary(r);
    expect(s.exported, JSON.stringify(s)).toBe(true);
    const [g] = s.graphics;
    expect(g.files).toHaveLength(1);
    expect(g.files[0]).toMatchObject({ name: expect.stringMatching(/-feed(-\d+)?\.png$/), width: 1080 });
    const png = await fetch(local(g.files[0].url));
    expect(png.status).toBe(200);
    const body = Buffer.from(await png.arrayBuffer());
    expect(crypto.createHash('sha256').update(body).digest('hex')).toBe(g.files[0].sha256);
    expect(png.headers.get('content-disposition')).toContain('attachment');
    // Same approval again: the same export, no duplicate job.
    const again = summary(await call('approve_graphics', { publicationId: publication.id, channel: 'instagram_feed', ownerApproval: 'akceptuję' }));
    expect(again.graphics[0].exportJobId).toBe(g.exportJobId);
    // Revoking the token kills its links at once.
    await request(`/agent-tokens/${tokenRow.id}/revoke`, {}, 'POST');
    expect((await fetch(local(g.files[0].url))).status).toBe(404);
  }, 90_000);

  it('refuses to approve a revision the owner has not seen', async () => {
    const view = (await request(`/projects/${projectId}`)).value;
    const changed = await request(`/projects/${projectId}`, { expectedRevision: view.currentRevision, project: { ...view.payload, content: { ...view.payload.content, title: 'Spotkanie kibiców po meczu' } } }, 'PUT');
    expect(changed.res.status).toBe(200);
    const fresh = (await request('/agent-tokens', { name: 'OpenBot 2', scopes: ['graphics'] }, 'POST')).value.token;
    const r = await call('approve_graphics', { publicationId: publication.id, channel: 'instagram_feed', ownerApproval: 'akceptuję' }, fresh);
    expect(r.result.isError).toBe(true);
    expect(summary(r).error).toContain('zmieniła się od podglądu');
  }, 30_000);

  it('lets the owner accept a channel in one step: compositions of every format the publication uses, revision, export', async () => {
    // Nothing approved in the editor: the one OK on the publication page has to pass the composition gate itself.
    await db.studioTemplate.deleteMany({ where: { ownerId: owner } });
    const pub = (await request(`/publications/${publication.id}`)).value;
    expect((await request(`/publications/${publication.id}/confirm-facts`, { expectedRevision: pub.revision }, 'POST')).res.status).toBe(200);
    const fb = (await request(`/publications/${publication.id}`)).value.items.find((i) => i.channel === 'facebook');
    expect(fb.ready.some((m) => m.startsWith('Zatwierdź grafikę'))).toBe(true);
    const r = await withWorker(() => request(`/publications/${publication.id}/items/${fb.id}/approve-graphics`, { expectedRevision: fb.revision }, 'POST'));
    expect(r.res.status, JSON.stringify(r.value)).toBe(200);
    expect(r.value.graphics).toEqual([expect.objectContaining({ projectId, status: 'completed', errors: [] })]);
    // The website variant uses the same graphic in 16:9: its graphic step is done by the same OK.
    for (const item of r.value.publication.items) expect(item.ready.filter((m) => /grafik/i.test(m)), item.channel).toEqual([]);
    const after = r.value.publication.items.find((i) => i.id === fb.id);
    expect(r.value.variantApproved).toBe(after.status === 'approved');
    const event = await db.studioPublishEvent.findFirst({ where: { itemId: fb.id, action: 'graphics-approved' } });
    expect(event).toMatchObject({ actor: 'owner' });
    expect([...event.payload.graphics[0].formats].sort()).toEqual(['feed', 'landscape']);
    // A stale revision number is refused, so a second tab cannot approve what it did not show.
    const stale = await request(`/publications/${publication.id}/items/${fb.id}/approve-graphics`, { expectedRevision: fb.revision + 5 }, 'POST');
    expect(stale.res.status).toBe(409);
  }, 120_000);

  it('lets the agent fix the graphic, then carry out everything after one „akceptuję”', async () => {
    const pub = (await request('/publications', { playbook: 'news', facts: { title: 'Mikołajkowy turniej rodzinny', date: '2026-12-06T10:00:00.000Z', notes: 'Turniej rodzinny w CESiR Bobolice.' } }, 'POST')).value;
    const agentToken = (await request('/agent-tokens', { name: 'OpenBot 3', scopes: ['graphics'] }, 'POST')).value.token;
    // Only photos the owner may publish can go on a graphic.
    const badPhoto = await call('update_graphic', { publicationId: pub.id, channel: 'instagram_feed', photoAssetId: 'nie-ma-takiego' }, agentToken);
    expect(badPhoto.result.isError).toBe(true);
    const fixed = summary(await call('update_graphic', { publicationId: pub.id, channel: 'instagram_feed', title: 'Mikołajkowy turniej rodzinny w Bobolicach', body: 'Zapraszamy całe rodziny.' }, agentToken));
    expect(fixed).toMatchObject({ title: 'Mikołajkowy turniej rodzinny w Bobolicach', body: 'Zapraszamy całe rodziny.', stillToFix: [] });
    // The rival shield text Studio guessed from the name can be corrected by the agent (stored upper case, max 8).
    expect(summary(await call('update_graphic', { publicationId: pub.id, channel: 'instagram_feed', opponentShort: ' psp ' }, agentToken))).toMatchObject({ opponentShort: 'PSP' });
    expect((await call('update_graphic', { publicationId: pub.id, channel: 'instagram_feed', opponentShort: 'ZADLUGISKROT' }, agentToken)).result.isError).toBe(true);
    expect(summary(await call('list_photos', {}, agentToken)).photos).toEqual([]);
    // No OK from the owner, no call: the tool requires the verbatim answer.
    expect((await call('accept_publication', { publicationId: pub.id }, agentToken)).result.isError).toBe(true);
    const r = await call('accept_publication', { publicationId: pub.id, ownerApproval: 'akceptuję' }, agentToken);
    expect(r.result.isError, r.result.content[0].text).toBeFalsy();
    const s = summary(r);
    expect(s.factsConfirmed).toBe(true);
    const after = (await request(`/publications/${pub.id}`)).value;
    expect(after.factsConfirmed).toBe(true);
    for (const c of s.channels.filter((c) => !c.problem)) expect(after.items.find((i) => i.channel === c.channel).status, c.channel).toMatch(/approved|published/);
    for (const item of after.items) expect(item.graphic.valid && !!item.graphic.exportJobId, item.channel).toBe(true);
    const feed = s.channels.find((c) => c.channel === 'instagram_feed');
    expect(feed.files[0].url).toContain('/agent-files/');
    // Without CMS settings the article waits in Studio instead of failing.
    const www = s.channels.find((c) => c.channel === 'website');
    expect(www.website).toContain('CMS');
    const accepted = await db.studioPublishEvent.findMany({ where: { action: 'owner-accepted', item: { publicationId: pub.id } } });
    expect(accepted.length).toBe(after.items.length);
    expect(accepted.every((e) => e.payload.ownerApproval.startsWith('akceptuję') && e.actor === 'agent:OpenBot 3')).toBe(true);
    // Facebook repeats the previous post's composition: reported, not silently accepted.
    expect(s.channels.filter((c) => c.problem).map((c) => c.channel)).toEqual(['facebook']);
    // The agent showed the owner the warning and the OK covered it.
    const again = summary(await call('accept_publication', { publicationId: pub.id, ownerApproval: 'akceptuję, powtórzenie OK', acceptRepetition: true }, agentToken));
    expect(again.channels.map((c) => [c.channel, c.status, c.problem])).toEqual([['facebook', 'approved', undefined]]);
    const final = (await request(`/publications/${pub.id}`)).value;
    expect(final.items.map((i) => i.status)).toEqual(['approved', 'approved', 'approved']);
  }, 120_000);
});
