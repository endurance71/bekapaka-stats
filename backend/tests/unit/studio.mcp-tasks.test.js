import { describe, it, expect, vi, beforeEach } from 'vitest';

const saved = [];
let currentInput = 'facts-v1';
vi.mock('../../studio/agent/operations.js', () => ({
  studioAgentOperations: {
    'studio.copy': {
      label: 'copy',
      output: 'json',
      args: { type: 'object' },
      prepare: async () => ({ inputHash: `hash-${currentInput}-0000000000`, version: 'copy-v', prompt: { system: 'SYS', user: currentInput, schema: { type: 'object' } } }),
      save: async (_db, owner, prep, output) => {
        if (!output?.instagram_story) throw Object.assign(new Error('Tekst kanału instagram_story nie spełnia kontraktu'), { status: 422 });
        saved.push({ owner, output });
        return { channels: [{ channel: 'instagram_story', saved: true }] };
      },
    },
  },
}));
const panelSaves = [];
vi.mock('../../ai/agentOperations.js', () => ({
  panelAgentOperations: {
    'panel.match': {
      label: 'match',
      output: 'markdown',
      args: { type: 'object' },
      parse: (a) => a,
      prepare: async () => ({ lockKey: 'game:x', inputHash: 'match-hash-000000000000', version: 'match-v', prompt: { system: 'S', user: 'U' } }),
      save: async (prep, output) => panelSaves.push(output),
    },
  },
  withAiLock: async (_key, fn) => fn(),
}));

const { tools } = await import('../../studio/agent/mcp.js');
const tool = (name) => tools.find((t) => t.name === name);
const logs = [];
const db = { aiGenerationLog: { create: async ({ data }) => logs.push(data) }, rosterPlayer: { findUnique: async () => ({ role: 'ADMIN' }) } };
const agent = (scopes = ['read', 'draft']) => ({ id: 't', ownerId: 'owner', scopes });
const parse = (res) => JSON.parse(res.content[0].text);

describe('MCP AI tasks for the owner’s own agent', () => {
  beforeEach(() => {
    saved.length = 0;
    panelSaves.length = 0;
    logs.length = 0;
    currentInput = 'facts-v1';
  });

  it('hands out the exact prompt, schema and input hash', async () => {
    const out = parse(await tool('prepare_ai_task').run(db, 'owner', { operation: 'studio.copy', args: {} }, agent()));
    expect(out).toMatchObject({ operation: 'studio.copy', system: 'SYS', user: 'facts-v1', outputKind: 'json', inputHash: 'hash-facts-v1-0000000000' });
  });

  it('saves a validated result as an agent draft and logs it without cost', async () => {
    const out = parse(await tool('submit_ai_task_result').run(db, 'owner', { operation: 'studio.copy', args: {}, inputHash: 'hash-facts-v1-0000000000', output: { instagram_story: { stickerText: 'x' } } }, agent()));
    expect(out).toMatchObject({ model: 'agent-mcp', channels: [{ saved: true }] });
    expect(saved).toHaveLength(1);
    expect(logs[0]).toMatchObject({ source: 'mcp', actualEngine: 'mcp-agent', status: 'ok', costKind: 'none' });
  });

  it('rejects a result prepared on data that has since changed', async () => {
    currentInput = 'facts-v2';
    await expect(tool('submit_ai_task_result').run(db, 'owner', { operation: 'studio.copy', inputHash: 'hash-facts-v1-0000000000', output: { instagram_story: {} } }, agent())).rejects.toMatchObject({ status: 409 });
    expect(saved).toHaveLength(0);
  });

  it('surfaces contract errors instead of saving', async () => {
    await expect(tool('submit_ai_task_result').run(db, 'owner', { operation: 'studio.copy', inputHash: 'hash-facts-v1-0000000000', output: {} }, agent())).rejects.toMatchObject({ status: 422 });
    expect(logs[0]).toMatchObject({ status: 'error' });
  });

  it('keeps panel analyses behind the opt-in panel-ai scope and an ADMIN owner', async () => {
    await expect(tool('prepare_ai_task').run(db, 'owner', { operation: 'panel.match', args: {} }, agent())).rejects.toMatchObject({ status: 403 });
    const listed = parse(await tool('list_ai_tasks').run(db, 'owner', {}, agent()));
    expect(listed.tasks.map((t) => t.operation)).toEqual(['studio.copy']);
    const withPanel = parse(await tool('list_ai_tasks').run(db, 'owner', {}, agent(['read', 'draft', 'panel-ai'])));
    expect(withPanel.tasks.map((t) => t.operation)).toEqual(['studio.copy', 'panel.match']);
    const notAdmin = { ...db, rosterPlayer: { findUnique: async () => ({ role: 'USER' }) } };
    await expect(tool('prepare_ai_task').run(notAdmin, 'owner', { operation: 'panel.match', args: {} }, agent(['read', 'draft', 'panel-ai']))).rejects.toMatchObject({ status: 403 });
  });

  it('saves panel Markdown through the shared save under the same lock, and refuses JSON for Markdown tasks', async () => {
    const a = agent(['read', 'draft', 'panel-ai']);
    await tool('submit_ai_task_result').run(db, 'owner', { operation: 'panel.match', args: {}, inputHash: 'match-hash-000000000000', output: '## Analiza' }, a);
    expect(panelSaves).toEqual(['## Analiza']);
    await expect(tool('submit_ai_task_result').run(db, 'owner', { operation: 'panel.match', args: {}, inputHash: 'match-hash-000000000000', output: { text: 'x' } }, a)).rejects.toMatchObject({ status: 422 });
  });
});

describe('agent tokens', () => {
  it('grant panel-ai only when asked for explicitly', async () => {
    const { createAgentToken } = await import('../../studio/agent/tokens.js');
    const rows = [];
    const tokenDb = { studioAgentToken: { count: async () => 0, create: async ({ data }) => (rows.push(data), data) } };
    await createAgentToken(tokenDb, 'owner', { name: 'Claude Code' });
    await createAgentToken(tokenDb, 'owner', { name: 'Claude Code + panel', scopes: ['panel-ai'] });
    expect(rows.map((r) => r.scopes)).toEqual([['read', 'draft'], ['read', 'draft', 'panel-ai']]);
    await expect(createAgentToken(tokenDb, 'owner', { name: 'x', scopes: ['publish'] })).rejects.toThrow();
  });
});
