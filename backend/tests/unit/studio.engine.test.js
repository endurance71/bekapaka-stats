import { describe, it, expect, vi, beforeEach } from 'vitest';

const apiCalls = [];
const sdkCalls = [];
let sdkReply;
vi.mock('../../studio/providers/clients.js', async (original) => ({
  ...(await original()),
  generateJson: vi.fn(async (params) => {
    apiCalls.push(params);
    return { json: { instagram_story: story }, usage: { inputTokens: 100, outputTokens: 10 } };
  }),
  generateImage: vi.fn(async () => {
    throw new Error('image API must not be reached in these tests');
  }),
}));
vi.mock('../../ai-engine/agentSdk.js', async (original) => ({
  ...(await original()),
  runAgentSdk: vi.fn(async (params) => {
    sdkCalls.push(params);
    return sdkReply();
  }),
}));

const { generateAi } = await import('../../studio/ai.js');
const { ProviderError } = await import('../../ai-engine/errors.js');
const { findModel, reservationFor, reservationMicros } = await import('../../studio/providers/catalog.js');
const { aiOverview } = await import('../../studio/providers/settings.js');
const { clearEngineCache } = await import('../../ai-engine/settings.js');

const story = { stickerText: 'Gramy w sobotę', sticker: 'countdown', link: '', altText: 'Zapowiedź meczu' };
const prompt = { system: 'system', user: 'user', schema: { type: 'object', properties: { instagram_story: { type: 'object', properties: { stickerText: { type: 'string', maxLength: 40 } } } } }, version: 'copy-test' };
const sdkModel = { ...findModel('claude-sonnet-5-5'), engine: 'claude-agent-sdk' };
const job = (model) => ({ id: 'job-1', kind: 'ai-copy', ownerId: 'owner', payload: { model, prompt, channels: ['instagram_story'], publicationId: 'p', factsHash: 'f', cacheKey: 'k' } });
const logs = [];
const secretLookups = [];
const db = { studioSecret: { findUnique: async (q) => (secretLookups.push(q), null) }, aiGenerationLog: { create: async ({ data }) => logs.push(data) } };

describe('Studio jobs on the Claude Agent SDK engine', () => {
  beforeEach(() => {
    apiCalls.length = 0;
    sdkCalls.length = 0;
    logs.length = 0;
    secretLookups.length = 0;
    process.env.STUDIO_ANTHROPIC_API_KEY = 'sk-ant-env-test';
  });

  it('runs on the SDK without Studio provider keys and charges the SDK estimate, capped at the reservation', async () => {
    sdkReply = async () => ({ json: { instagram_story: story }, usage: { inputTokens: 900, outputTokens: 80 }, costUsd: 0.004, model: 'claude-sonnet-5-5' });
    const out = await generateAi(job(sdkModel), db);
    expect(apiCalls).toHaveLength(0);
    expect(secretLookups).toHaveLength(0);
    const reserved = reservationFor(sdkModel, 'copy');
    expect(reserved).toBe(reservationMicros(sdkModel, 'copy') * 2);
    expect(sdkCalls[0]).toMatchObject({ system: 'system', user: 'user', model: 'claude-sonnet-5-5', effort: 'low', maxBudgetUsd: reserved / 1_000_000 });
    // Schema goes through the same portable form as the Claude API path; Zod enforces the limits afterwards.
    expect(JSON.stringify(sdkCalls[0].schema)).not.toContain('maxLength');
    expect(out.chargedMicros).toBe(4000);
    expect(out.result).toMatchObject({ copy: { instagram_story: story }, engine: 'claude-agent-sdk' });
    expect(logs[0]).toMatchObject({ requestId: 'job-1', operation: 'studio.copy', source: 'studio', actualEngine: 'claude-agent-sdk', status: 'ok', costMicros: 4000 });
  });

  it('releases the reservation when the SDK refused before generating (no key, no credits)', async () => {
    sdkReply = async () => {
      throw new ProviderError('Brak środków', { rejected: true, code: 'limit_reached' });
    };
    await expect(generateAi(job(sdkModel), db)).rejects.toMatchObject({ notCalled: true });
    expect(apiCalls).toHaveLength(0);
    expect(logs[0]).toMatchObject({ status: 'rejected', errorCode: 'limit_reached' });
  });

  it('settles a known SDK cost when the answer breaks the contract', async () => {
    sdkReply = async () => ({ json: { instagram_story: { ...story, sticker: 'gif' } }, usage: { inputTokens: 1, outputTokens: 1 }, costUsd: 0.01 });
    await expect(generateAi(job(sdkModel), db)).rejects.toMatchObject({ chargedMicros: 10000 });
  });

  it('keeps jobs queued before the switch on their API engine (old payloads have no engine)', async () => {
    const { engine, ...apiModel } = sdkModel;
    await generateAi(job(apiModel), db);
    expect(sdkCalls).toHaveLength(0);
    expect(apiCalls[0]).toMatchObject({ apiKey: 'sk-ant-env-test', model: { id: 'claude-sonnet-5-5' } });
  });

  it('never sends an image job to the SDK', async () => {
    const imageJob = { id: 'img', kind: 'ai-image', ownerId: 'owner', payload: { model: { ...findModel('gemini-3.1-flash-image'), engine: 'claude-agent-sdk' }, brief: 'texture' } };
    await expect(generateAi(imageJob, db)).rejects.toMatchObject({ notCalled: true });
    expect(sdkCalls).toHaveLength(0);
  });
});

describe('Studio settings overview under the SDK engine', () => {
  it('shows the SDK model for text tasks and leaves the image task on its API model', async () => {
    clearEngineCache();
    process.env.AGENT_SDK_ANTHROPIC_API_KEY = 'sk-ant-api03-x';
    const overviewDb = {
      studioSetting: { findUnique: async () => null },
      studioSecret: { findMany: async () => [] },
      aiEngineSetting: { findUnique: async () => ({ engine: 'claude-agent-sdk', agentSdkModel: 'claude-haiku-5-5', fallbackToApi: false }) },
    };
    const overview = await aiOverview(overviewDb, 'owner');
    const byId = Object.fromEntries(overview.tasks.map((t) => [t.id, t]));
    expect(overview.engine).toBe('claude-agent-sdk');
    expect(byId.copy).toMatchObject({ model: 'claude-haiku-5-5', apiModel: 'gemini-3.5-flash', engine: 'claude-agent-sdk', available: true });
    expect(byId.report.engine).toBe('claude-agent-sdk');
    expect(byId.image).toMatchObject({ engine: 'api', model: 'gemini-3.1-flash-image' });
    delete process.env.AGENT_SDK_ANTHROPIC_API_KEY;
    clearEngineCache();
  });
});
