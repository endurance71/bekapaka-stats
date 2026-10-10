import { describe, it, expect, beforeEach } from 'vitest';
import { clearEngineCache, DEFAULT_SDK_MODEL, getEngineSetting, SDK_MODEL_IDS, setEngineSetting } from '../../ai-engine/settings.js';
import { engineStatus, resetTestThrottle, sdkStatus, testEngine } from '../../ai-engine/status.js';
import { sanitizeError } from '../../ai-engine/log.js';
import { operations } from '../../ai-engine/operations.js';

/** In-memory stand-in for the three engine tables. */
function memoryDb() {
  const state = { setting: null, audit: [], logs: [] };
  const db = {
    state,
    aiEngineSetting: {
      findUnique: async () => state.setting,
      upsert: async ({ create, update }) => (state.setting = { ...(state.setting || create), ...update, updatedAt: new Date() }),
    },
    aiSettingAudit: {
      create: async ({ data }) => state.audit.push({ ...data, createdAt: new Date() }),
      findMany: async () => [...state.audit].reverse(),
    },
    aiGenerationLog: {
      create: async ({ data }) => state.logs.push(data),
      findMany: async ({ where }) => state.logs.filter((r) => r.actualEngine === where.actualEngine).reverse(),
    },
    rosterPlayer: { findUnique: async () => ({ firstName: 'Damian', lastName: 'M', username: 'dm' }) },
    $transaction: async (fn) => fn(db),
  };
  return db;
}

describe('engine setting', () => {
  beforeEach(() => clearEngineCache());

  it('defaults to the existing API when nothing is stored or the table is missing', async () => {
    expect(await getEngineSetting(memoryDb())).toMatchObject({ engine: 'api', fallbackToApi: false, agentSdkModel: DEFAULT_SDK_MODEL });
    clearEngineCache();
    const missing = { aiEngineSetting: { findUnique: async () => Promise.reject(Object.assign(new Error('no table'), { code: 'P2021' })) } };
    expect((await getEngineSetting(missing)).engine).toBe('api');
    clearEngineCache();
    expect((await getEngineSetting({})).engine).toBe('api');
  });

  it('saves the choice with an audit row and applies it immediately', async () => {
    const db = memoryDb();
    await getEngineSetting(db); // warm the cache with the old value
    await setEngineSetting(db, { engine: 'claude-agent-sdk', agentSdkModel: SDK_MODEL_IDS[0] }, { actorId: 'admin-1', from: 'panel' });
    expect((await getEngineSetting(db)).engine).toBe('claude-agent-sdk');
    expect(db.state.audit).toHaveLength(1);
    expect(db.state.audit[0]).toMatchObject({ actorId: 'admin-1', from: 'panel', before: { engine: 'api' }, after: { engine: 'claude-agent-sdk', fallbackToApi: false } });
    expect(db.state.setting).toMatchObject({ updatedBy: 'admin-1', updatedFrom: 'panel' });
  });

  it('accepts only known engines and catalog Claude models (prices must exist for the budget)', async () => {
    const db = memoryDb();
    await expect(setEngineSetting(db, { engine: 'openai-agents' }, { actorId: 'a', from: 'panel' })).rejects.toThrow();
    await expect(setEngineSetting(db, { engine: 'claude-agent-sdk', agentSdkModel: 'gemini-3.5-flash' }, { actorId: 'a', from: 'studio' })).rejects.toThrow();
    await expect(setEngineSetting(db, { engine: 'api', apiKey: 'sk-x' }, { actorId: 'a', from: 'studio' })).rejects.toThrow();
    expect(db.state.audit).toHaveLength(0);
  });
});

describe('engine status', () => {
  const saved = process.env.AGENT_SDK_ANTHROPIC_API_KEY;
  beforeEach(() => {
    clearEngineCache();
    resetTestThrottle();
    delete process.env.AGENT_SDK_ANTHROPIC_API_KEY;
    delete process.env.CLAUDE_CODE_OAUTH_TOKEN;
  });

  it('is never "ready" from a variable alone: it needs a real successful request', async () => {
    const db = memoryDb();
    expect((await sdkStatus(db)).status).toBe('not_configured');
    process.env.AGENT_SDK_ANTHROPIC_API_KEY = 'sk-ant-api03-x';
    expect((await sdkStatus(db)).status).toBe('untested');
    db.state.logs.push({ actualEngine: 'claude-agent-sdk', operation: 'engine.test', status: 'ok', startedAt: new Date(), model: 'claude-sonnet-5-5' });
    expect((await sdkStatus(db)).status).toBe('ready');
    db.state.logs.push({ actualEngine: 'claude-agent-sdk', operation: 'panel.match', status: 'rejected', errorCode: 'limit_reached', startedAt: new Date() });
    expect((await sdkStatus(db)).status).toBe('limit_reached');
    process.env.AGENT_SDK_ANTHROPIC_API_KEY = saved || '';
  });

  it('lists every operation and marks images as API-only', async () => {
    const status = await engineStatus(memoryDb(), { apiSummary: { model: 'gemini-3.5-flash' } });
    expect(status.engine).toBe('api');
    expect(status.activeModel).toBe('gemini-3.5-flash');
    expect(status.imageNotice).toMatch(/obrazów nadal wykorzystują skonfigurowane API/);
    expect(operations.filter((o) => o.routing === 'api-only').map((o) => o.id)).toEqual(['studio.image']);
    expect(status.sdk.billing).toMatch(/Claude Console/);
  });

  it('tests the SDK with a small real-shaped request, logs it, and throttles repeats', async () => {
    process.env.AGENT_SDK_ANTHROPIC_API_KEY = 'sk-ant-api03-x';
    const db = memoryDb();
    await setEngineSetting(db, { engine: 'claude-agent-sdk' }, { actorId: 'owner', from: 'studio' });
    const queryImpl = ({ options }) =>
      (async function* () {
        expect(options.maxBudgetUsd).toBe(0.05);
        yield { type: 'system', subtype: 'init', apiKeySource: 'ANTHROPIC_API_KEY', model: 'claude-sonnet-5-5' };
        yield { type: 'result', subtype: 'success', is_error: false, structured_output: { ok: true, reply: 'BeKaPaKa' }, total_cost_usd: 0.001, modelUsage: { 'claude-sonnet-5-5': { inputTokens: 50, outputTokens: 10 } } };
      })();
    const result = await testEngine(db, { source: 'studio', queryImpl });
    expect(result).toMatchObject({ ok: true, engine: 'claude-agent-sdk', model: 'claude-sonnet-5-5', apiKeySource: 'ANTHROPIC_API_KEY' });
    expect(db.state.logs.at(-1)).toMatchObject({ operation: 'engine.test', source: 'studio', actualEngine: 'claude-agent-sdk', status: 'ok', costKind: 'agent-sdk-estimate', costMicros: 1000 });
    expect((await testEngine(db, { source: 'studio', queryImpl })).status).toBe('throttled');
    expect((await sdkStatus(db)).status).toBe('ready');
  });

  it('reports a failed API test without leaking keys', async () => {
    const db = memoryDb();
    const result = await testEngine(db, { engine: 'api', source: 'panel', apiTest: async () => Promise.reject(new Error('bad key sk-ant-api03-SECRET123 rejected')) });
    expect(result.ok).toBe(false);
    expect(result.error).not.toContain('SECRET123');
    expect(db.state.logs.at(-1).error).not.toContain('SECRET123');
  });
});

describe('log sanitizing', () => {
  it('removes API keys and bearer tokens', () => {
    expect(sanitizeError('x sk-ant-api03-abc-def y AIzaSyA1234567890abcdef Bearer abc.def')).toBe('x [ukryto] y [ukryto] [ukryto]');
  });
});
