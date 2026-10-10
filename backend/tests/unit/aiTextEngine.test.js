import { describe, it, expect, vi, beforeEach } from 'vitest';

const logs = [];
const state = { setting: null };
const gemini = vi.fn();
const sdk = vi.fn();

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    aiEngineSetting: { findUnique: async () => state.setting },
    aiGenerationLog: { create: async ({ data }) => logs.push(data) },
  },
}));
vi.mock('../../ai/geminiClient.js', async (original) => ({
  ...(await original()),
  generateTextWithMeta: (...args) => gemini(...args),
  getGeminiModelName: () => 'gemini-3.5-flash',
  isGeminiConfigured: () => true,
}));
vi.mock('../../ai-engine/agentSdk.js', async (original) => ({
  ...(await original()),
  runAgentSdk: (...args) => sdk(...args),
  isAgentSdkConfigured: () => true,
}));

const { aiText, activeModel } = await import('../../ai/textEngine.js');
const { clearEngineCache } = await import('../../ai-engine/settings.js');
const { ProviderError } = await import('../../ai-engine/errors.js');
const { AiConfigError } = await import('../../ai/errors.js');

const schema = { type: 'object', properties: { a: { type: 'string' } }, required: ['a'] };
const call = { operation: 'panel.scouting', system: 'SYS', user: 'USER', responseJsonSchema: schema, jsonMode: true, maxOutputTokens: 4096 };

describe('panel text engine router', () => {
  beforeEach(() => {
    logs.length = 0;
    gemini.mockReset();
    sdk.mockReset();
    state.setting = null;
    clearEngineCache();
    delete process.env.AI_ANALYSIS_ENABLED;
  });

  it('API mode is the existing Gemini call, unchanged, and is logged with a cost estimate', async () => {
    gemini.mockResolvedValue({ text: '{"a":"x"}', model: 'gemini-3.5-flash', usage: { inputTokens: 1000, outputTokens: 100 } });
    const out = await aiText(call);
    expect(gemini).toHaveBeenCalledWith({ system: 'SYS', user: 'USER', jsonMode: true, responseJsonSchema: schema, maxOutputTokens: 4096, timeoutMs: undefined, disableThinking: undefined });
    expect(sdk).not.toHaveBeenCalled();
    expect(out).toMatchObject({ text: '{"a":"x"}', model: 'gemini-3.5-flash', engine: 'api' });
    expect(logs[0]).toMatchObject({ operation: 'panel.scouting', source: 'panel', requestedEngine: 'api', actualEngine: 'api', status: 'ok', costKind: 'api-estimate', inputTokens: 1000, outputTokens: 100 });
    expect(logs[0].costMicros).toBe(1000 * 1.5 + 100 * 9);
  });

  it('SDK mode sends the same prompt and schema to Claude and returns the actual model', async () => {
    state.setting = { engine: 'claude-agent-sdk', agentSdkModel: 'claude-haiku-5-5', fallbackToApi: false };
    sdk.mockResolvedValue({ text: '{"a":"y"}', json: { a: 'y' }, model: 'claude-haiku-5-5', usage: { inputTokens: 10, outputTokens: 5 }, costUsd: 0.002 });
    const out = await aiText(call);
    expect(sdk.mock.calls[0][0]).toMatchObject({ system: 'SYS', user: 'USER', schema, model: 'claude-haiku-5-5', maxOutputTokens: 4096 });
    expect(gemini).not.toHaveBeenCalled();
    expect(out).toMatchObject({ text: '{"a":"y"}', model: 'claude-haiku-5-5', engine: 'claude-agent-sdk', costMicros: 2000 });
    expect(logs[0]).toMatchObject({ requestedEngine: 'claude-agent-sdk', actualEngine: 'claude-agent-sdk', costKind: 'agent-sdk-estimate' });
    expect(await activeModel()).toBe('claude-haiku-5-5');
  });

  it('never falls back to the paid API silently', async () => {
    state.setting = { engine: 'claude-agent-sdk', agentSdkModel: 'claude-haiku-5-5', fallbackToApi: false };
    sdk.mockRejectedValue(new ProviderError('Brak środków', { rejected: true, code: 'limit_reached' }));
    await expect(aiText(call)).rejects.toThrow('Brak środków');
    expect(gemini).not.toHaveBeenCalled();
    expect(logs[0]).toMatchObject({ status: 'rejected', errorCode: 'limit_reached' });
  });

  it('falls back only when the admin enabled it and the SDK generated nothing', async () => {
    state.setting = { engine: 'claude-agent-sdk', agentSdkModel: 'claude-haiku-5-5', fallbackToApi: true };
    gemini.mockResolvedValue({ text: 'ok', model: 'gemini-3.5-flash', usage: {} });
    sdk.mockRejectedValue(new ProviderError('Brak klucza', { rejected: true, code: 'not_configured' }));
    const out = await aiText(call);
    expect(out.engine).toBe('api');
    expect(logs.map((l) => [l.requestedEngine, l.actualEngine, l.status])).toEqual([
      ['claude-agent-sdk', 'claude-agent-sdk', 'rejected'],
      ['claude-agent-sdk', 'api', 'ok'],
    ]);
    // An uncertain outcome (request may have been processed and billed) is never retried elsewhere.
    clearEngineCache();
    gemini.mockClear();
    sdk.mockRejectedValue(new ProviderError('przerwane', { uncertain: true, code: 'connection_error' }));
    await expect(aiText(call)).rejects.toThrow('przerwane');
    expect(gemini).not.toHaveBeenCalled();
  });

  it('maps configuration problems to 503 and honours AI_ANALYSIS_ENABLED=false for both engines', async () => {
    state.setting = { engine: 'claude-agent-sdk', agentSdkModel: 'claude-haiku-5-5', fallbackToApi: false };
    sdk.mockRejectedValue(new ProviderError('Brak klucza', { rejected: true, code: 'not_configured' }));
    await expect(aiText(call)).rejects.toBeInstanceOf(AiConfigError);
    process.env.AI_ANALYSIS_ENABLED = 'false';
    sdk.mockClear();
    await expect(aiText(call)).rejects.toBeInstanceOf(AiConfigError);
    expect(sdk).not.toHaveBeenCalled();
  });
});
