import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createStudioRouter } from '../../studio/routes.js';
import { claimJob, processJob } from '../../studio/worker.js';
import { findModel, reservationMicros } from '../../studio/providers/catalog.js';

const enabled = !!process.env.STUDIO_TEST_DATABASE_URL;
const owner = `studio-agent-${crypto.randomUUID()}`;
let db, server, base, cookie, publication, token;

async function request(url, body, method = 'GET', headers = {}) {
  const res = await fetch(base + url, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), Origin: 'http://localhost:5174', 'X-Studio-Request': '1', ...(cookie ? { Cookie: cookie } : {}), ...headers },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { res, value: res.headers.get('content-type')?.includes('json') ? await res.json() : await res.text() };
}
// An agent: no cookie, no Origin, only the Bearer token.
let rpcId = 0;
async function mcp(method, params, bearer = token) {
  const res = await fetch(`${base}/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method, params }),
  });
  const body = res.headers.get('content-type')?.includes('json') ? await res.json() : await res.text();
  return { status: res.status, body };
}
const toolResult = (r) => JSON.parse(r.body.result.content[0].text);

describe.skipIf(!enabled)('Studio AI copy and MCP agent on isolated PostgreSQL', () => {
  beforeAll(async () => {
    process.env.STUDIO_OWNER_ID = owner;
    process.env.STUDIO_ORIGIN = 'http://localhost:5174';
    delete process.env.STUDIO_GEMINI_API_KEY;
    db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.STUDIO_TEST_DATABASE_URL }) });
    await db.rosterPlayer.create({ data: { id: owner, firstName: 'Właściciel', lastName: 'Agent', username: owner, password: 'test-only' } });
    const app = express();
    app.use(express.json());
    app.use(createStudioRouter({ db, loginUser: async (_u, p) => (p === 'valid' ? { user: { id: owner, firstName: 'Właściciel' } } : null) }));
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
    cookie = (await request('/auth/login', { username: 'owner', password: 'valid' }, 'POST')).res.headers.get('set-cookie').split(';')[0];
    publication = (await request('/publications', { playbook: 'news', facts: { title: 'Nowe stroje dla drużyny', notes: 'Prezentacja po meczu.' } }, 'POST')).value;
  }, 20_000);
  afterAll(async () => {
    delete process.env.STUDIO_GEMINI_API_KEY;
    await db.studioSecret.deleteMany({ where: { ownerId: owner } });
    await db.studioSetting.deleteMany({ where: { ownerId: owner } });
    await new Promise((resolve) => server.close(resolve));
    await db.studioPublication.deleteMany({ where: { ownerId: owner } });
    await db.studioAgentToken.deleteMany({ where: { ownerId: owner } });
    await db.studioCopyCache.deleteMany({ where: { ownerId: owner } });
    await db.studioAiUsage.deleteMany({ where: { ownerId: owner } });
    await db.studioJob.deleteMany({ where: { ownerId: owner } });
    await db.studioProject.deleteMany({ where: { ownerId: owner } });
    await db.studioSession.deleteMany({ where: { ownerId: owner } });
    await db.studioTemplate.deleteMany({ where: { ownerId: owner } });
    await db.rosterPlayer.delete({ where: { id: owner } });
    await db.$disconnect();
  });

  it('issues agent tokens once and stores only their hash', async () => {
    const created = await request('/agent-tokens', { name: 'Claude' }, 'POST');
    expect(created.res.status).toBe(201);
    token = created.value.token;
    expect(token).toMatch(/^bkpk_agent_/);
    const rows = await db.studioAgentToken.findMany({ where: { ownerId: owner } });
    expect(rows[0].id).not.toContain(token);
    expect(JSON.stringify((await request('/agent-tokens')).value)).not.toContain(token);
  });

  it('rejects agents without a valid token and cookies without the token on /mcp', async () => {
    expect((await mcp('tools/list', {}, null)).status).toBe(401);
    expect((await mcp('tools/list', {}, 'bkpk_agent_' + 'x'.repeat(43))).status).toBe(401);
    expect((await request('/mcp', { jsonrpc: '2.0', id: 1, method: 'tools/list' }, 'POST')).res.status).toBe(401);
  });

  it('lets an agent read facts and propose copy for draft channels only', async () => {
    const init = await mcp('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } });
    expect(init.status).toBe(200);
    expect(init.body.result.serverInfo.name).toBe('bekapaka-studio');
    const list = await mcp('tools/list', {});
    expect(list.body.result.tools.map((t) => t.name)).toContain('propose_copy');
    const view = toolResult(await mcp('tools/call', { name: 'get_publication', arguments: { id: publication.id } }));
    expect(view.facts.title).toBe('Nowe stroje dla drużyny');
    expect(view.factsConfirmed).toBe(false);
    const proposal = toolResult(
      await mcp('tools/call', {
        name: 'propose_copy',
        arguments: { publicationId: publication.id, channel: 'facebook', copy: { text: 'Nowe stroje dla drużyny! Prezentacja po meczu.', hashtags: ['#BKPK'], link: '', altText: 'Nowe stroje BeKaPaKa' } },
      }),
    );
    expect(proposal.saved).toBe(true);
    const item = await db.studioPublicationItem.findFirst({ where: { publicationId: publication.id, channel: 'facebook' }, include: { events: true } });
    expect(item.copyOrigin).toBe('agent');
    expect(item.events.at(-1)).toMatchObject({ action: 'copy', actor: 'agent' });
    // Owner-approved variants are out of reach for agents.
    await db.studioPublicationItem.update({ where: { id: item.id }, data: { status: 'approved' } });
    const blocked = await mcp('tools/call', { name: 'propose_copy', arguments: { publicationId: publication.id, channel: 'facebook', copy: { text: 'x', hashtags: [], link: '', altText: 'x' } } });
    expect(blocked.body.result.isError).toBe(true);
    expect((await db.studioPublicationItem.findUnique({ where: { id: item.id } })).status).toBe('approved');
    const unknown = await mcp('tools/call', { name: 'approve_item', arguments: {} });
    expect(unknown.body.result.isError).toBe(true);
  });

  it('queues AI copy only with a key and confirmed facts, settles it in the worker and serves the cache afterwards', async () => {
    expect((await request(`/publications/${publication.id}/ai-copy`, { channels: ['instagram_feed'] }, 'POST')).res.status).toBe(503);
    process.env.STUDIO_GEMINI_API_KEY = 'test-only';
    expect((await request(`/publications/${publication.id}/ai-copy`, { channels: ['instagram_feed'] }, 'POST')).res.status).toBe(422);
    const fresh = (await request(`/publications/${publication.id}`)).value;
    await request(`/publications/${publication.id}/confirm-facts`, { expectedRevision: fresh.revision }, 'POST');
    const queued = await request(`/publications/${publication.id}/ai-copy`, { channels: ['instagram_feed'], brief: 'ciepło' }, 'POST');
    expect(queued.res.status).toBe(202);
    expect(queued.value.job.kind).toBe('ai-copy');
    expect(queued.value.job.payload).toBeUndefined();
    expect((await db.studioAiUsage.findUnique({ where: { jobId: queued.value.job.id } })).reservedMicros).toBe(reservationMicros(findModel('gemini-3.5-flash'), 'copy'));

    const job = await claimJob(db, 'ai', owner);
    expect(job.id).toBe(queued.value.job.id);
    const copy = { caption: 'Nowe stroje dla drużyny!\n\nPrezentacja po meczu.', hashtags: ['#BKPK'], firstComment: '', altText: 'Nowe stroje BeKaPaKa' };
    await processJob(db, job, {
      generate: async () => ({ result: { copy: { instagram_feed: copy }, promptVersion: 'copy-test', model: 'gemini-3.5-flash' }, usage: { promptTokenCount: 1000, candidatesTokenCount: 200 }, chargedMicros: 3300 }),
    });
    const done = (await request(`/jobs/${job.id}`)).value;
    expect(done.status).toBe('completed');
    expect(done.result.copy.instagram_feed.caption).toContain('Nowe stroje');
    expect((await db.studioAiUsage.findUnique({ where: { jobId: job.id } })).chargedMicros).toBe(3300);

    const again = await request(`/publications/${publication.id}/ai-copy`, { channels: ['instagram_feed'], brief: 'ciepło' }, 'POST');
    expect(again.res.status).toBe(200);
    expect(again.value).toMatchObject({ cached: true, result: { copy: { instagram_feed: copy } } });
    expect(await db.studioAiUsage.count({ where: { ownerId: owner } })).toBe(1);
  });

  it('stores provider keys encrypted, never returns them and lets the owner pick a model per task or per call', async () => {
    const savedSecret = process.env.STUDIO_SECRETS_KEY;
    delete process.env.STUDIO_SECRETS_KEY;
    const apiKey = `sk-ant-test-${crypto.randomUUID()}`;
    expect((await request('/ai/keys/anthropic', { apiKey }, 'PUT')).res.status).toBe(503);
    process.env.STUDIO_SECRETS_KEY = crypto.randomBytes(32).toString('base64');
    try {
      expect((await request('/ai/keys/mistral', { apiKey }, 'PUT')).res.status).toBe(400);
      expect((await request('/ai/keys/anthropic', { apiKey: 'za krótki' }, 'PUT')).res.status).toBe(400);
      const saved = await request('/ai/keys/anthropic', { apiKey }, 'PUT');
      expect(saved.res.status).toBe(200);
      expect(JSON.stringify(saved.value)).not.toContain(apiKey);
      expect(saved.value.keys.find((k) => k.provider === 'anthropic')).toMatchObject({ source: 'studio', last4: apiKey.slice(-4) });
      expect(saved.value.keys.find((k) => k.provider === 'google').source).toBe('env');
      const row = await db.studioSecret.findUnique({ where: { ownerId_provider: { ownerId: owner, provider: 'anthropic' } } });
      expect(row.ciphertext).not.toContain('sk-ant');

      // Task model: only a model of the matching kind.
      expect((await request('/ai/tasks', { task: 'copy', model: 'gemini-3-pro-image' }, 'PUT')).res.status).toBe(422);
      const chosen = await request('/ai/tasks', { task: 'copy', model: 'claude-haiku-5-5' }, 'PUT');
      expect(chosen.value.tasks.find((t) => t.id === 'copy')).toMatchObject({ model: 'claude-haiku-5-5', available: true, maxCallMicros: reservationMicros(findModel('claude-haiku-5-5'), 'copy') });

      // Per-call override needs that provider's key; the reservation follows the chosen model's prices.
      expect((await request(`/publications/${publication.id}/ai-copy`, { channels: ['facebook'], model: 'gpt-6-luna' }, 'POST')).res.status).toBe(503);
      const queued = await request(`/publications/${publication.id}/ai-copy`, { channels: ['facebook'] }, 'POST');
      expect(queued.res.status).toBe(202);
      const usage = await db.studioAiUsage.findUnique({ where: { jobId: queued.value.job.id } });
      expect(usage).toMatchObject({ model: 'claude-haiku-5-5', reservedMicros: reservationMicros(findModel('claude-haiku-5-5'), 'copy') });
      expect((await db.studioJob.findUnique({ where: { id: queued.value.job.id } })).payload.model).toMatchObject({ id: 'claude-haiku-5-5', provider: 'anthropic', input: 0.1, output: 0.5 });
      await db.studioJob.update({ where: { id: queued.value.job.id }, data: { status: 'superseded' } });

      // Custom text model with owner prices; removing it resets the task to the default.
      expect((await request('/ai/custom-models', { id: 'claude-haiku-5-5', provider: 'anthropic', label: 'Dup', input: 1, output: 1 }, 'POST')).res.status).toBe(409);
      const custom = await request('/ai/custom-models', { id: 'claude-test-next', provider: 'anthropic', label: 'Claude test', input: 0.5, output: 2 }, 'POST');
      expect(custom.res.status).toBe(201);
      expect(custom.value.models.find((m) => m.id === 'claude-test-next')).toMatchObject({ custom: true, kind: 'text', available: true });
      await request('/ai/tasks', { task: 'text', model: 'claude-test-next' }, 'PUT');
      const removed = await request('/ai/custom-models/claude-test-next', null, 'DELETE');
      expect(removed.value.tasks.find((t) => t.id === 'text').model).toBe('gemini-3.5-flash');

      const deleted = await request('/ai/keys/anthropic', null, 'DELETE');
      expect(deleted.value.keys.find((k) => k.provider === 'anthropic').source).toBe(null);
      expect(deleted.value.tasks.find((t) => t.id === 'copy').available).toBe(false);
    } finally {
      process.env.STUDIO_SECRETS_KEY = savedSecret ?? '';
    }
  });

  it('lets the owner’s agent run a Studio AI task: prepare → write → submit, validated and saved as an agent draft', async () => {
    const tasks = toolResult(await mcp('tools/call', { name: 'list_ai_tasks', arguments: {} }));
    expect(tasks.panelAccess).toBe(false);
    expect(tasks.tasks.map((t) => t.operation)).toEqual(['studio.copy', 'studio.report']);
    const prepared = toolResult(await mcp('tools/call', { name: 'prepare_ai_task', arguments: { operation: 'studio.copy', args: { publicationId: publication.id, channels: ['instagram_feed'] } } }));
    expect(prepared.system).toContain('BeKaPaKa');
    expect(prepared.user).toContain('Nowe stroje dla drużyny');
    expect(Object.keys(prepared.outputSchema.properties)).toEqual(['instagram_feed']);
    const copy = { caption: 'Nowe stroje dla drużyny!\n\nPrezentacja po meczu.', hashtags: ['#BKPK'], firstComment: '', altText: 'Nowe stroje BeKaPaKa' };
    const invalid = await mcp('tools/call', { name: 'submit_ai_task_result', arguments: { operation: 'studio.copy', args: { publicationId: publication.id, channels: ['instagram_feed'] }, inputHash: prepared.inputHash, output: { instagram_feed: { caption: 42 } } } });
    expect(invalid.body.result.isError).toBe(true);
    const done = toolResult(await mcp('tools/call', { name: 'submit_ai_task_result', arguments: { operation: 'studio.copy', args: { publicationId: publication.id, channels: ['instagram_feed'] }, inputHash: prepared.inputHash, output: { instagram_feed: copy } } }));
    expect(done.channels).toMatchObject([{ channel: 'instagram_feed', saved: true }]);
    const item = await db.studioPublicationItem.findFirst({ where: { publicationId: publication.id, channel: 'instagram_feed' } });
    expect(item).toMatchObject({ copyOrigin: 'agent', status: 'draft' });
    expect(item.promptVersion).toMatch(/^agent:copy-/);
    // Panel analyses need the opt-in scope.
    const panel = await mcp('tools/call', { name: 'prepare_ai_task', arguments: { operation: 'panel.briefing', args: {} } });
    expect(panel.body.result.isError).toBe(true);
    expect(toolResult(panel).error).toMatch(/panel-ai/);
    await db.aiGenerationLog.deleteMany({ where: { source: 'mcp', operation: 'studio.copy', startedAt: { gte: new Date(Date.now() - 600_000) } } });
  });

  it('stops a revoked token immediately', async () => {
    const [row] = (await request('/agent-tokens')).value;
    expect((await request(`/agent-tokens/${row.id}/revoke`, {}, 'POST')).res.status).toBe(200);
    expect((await mcp('tools/list', {})).status).toBe(401);
  });
});
