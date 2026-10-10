import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import { runAgentSdk, agentSdkConfig, limiterState, resultError } from '../../ai-engine/agentSdk.js';

const KEY = 'sk-ant-api03-test-key';
const env = { AGENT_SDK_ANTHROPIC_API_KEY: KEY };
const schema = { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'], additionalProperties: false };
const init = (apiKeySource = 'ANTHROPIC_API_KEY') => ({ type: 'system', subtype: 'init', apiKeySource, model: 'claude-sonnet-5-5', tools: ['StructuredOutput'] });
const success = (extra = {}) => ({
  type: 'result',
  subtype: 'success',
  is_error: false,
  result: '',
  structured_output: { ok: true },
  total_cost_usd: 0.0123,
  num_turns: 2,
  modelUsage: { 'claude-sonnet-5-5': { inputTokens: 100, outputTokens: 40, cacheReadInputTokens: 10, cacheCreationInputTokens: 5, costUSD: 0.0123 } },
  ...extra,
});

/** Fake query(): records the options and replays the given messages. */
function fakeQuery(messages, seen = {}) {
  return ({ prompt, options }) => {
    seen.prompt = prompt;
    seen.options = seen.options || options;
    seen.home = options.cwd;
    seen.homeExisted = fs.existsSync(options.cwd);
    return (async function* () {
      for (const m of messages) {
        if (m instanceof Error) throw m;
        yield m;
      }
    })();
  };
}

describe('Claude Agent SDK engine — configuration', () => {
  it('needs a Console API key and refuses subscription credentials', () => {
    expect(agentSdkConfig({})).toMatchObject({ configured: false, code: 'not_configured' });
    expect(agentSdkConfig({ ...env, CLAUDE_CODE_OAUTH_TOKEN: 'x' })).toMatchObject({ configured: false, code: 'auth_required' });
    expect(agentSdkConfig({ AGENT_SDK_ANTHROPIC_API_KEY: 'sk-ant-oat01-abc' })).toMatchObject({ configured: false, code: 'auth_required' });
    expect(agentSdkConfig(env)).toEqual({ configured: true });
  });

  it('does not start the SDK at all without a valid configuration', async () => {
    const seen = {};
    await expect(runAgentSdk({ system: 's', user: 'u', model: 'm', env: {}, queryImpl: fakeQuery([], seen) })).rejects.toMatchObject({ rejected: true, code: 'not_configured' });
    await expect(runAgentSdk({ system: 's', user: 'u', model: 'm', env: { ...env, CLAUDE_CODE_OAUTH_TOKEN: 't' }, queryImpl: fakeQuery([], seen) })).rejects.toMatchObject({ rejected: true, code: 'auth_required' });
    expect(seen.options).toBeUndefined();
  });
});

describe('Claude Agent SDK engine — locked-down call', () => {
  beforeEach(() => {
    process.env.BKPK_TEST_SECRET = 'must-not-leak';
  });

  it('runs with no tools, no local settings, no sessions and a minimal environment', async () => {
    const seen = {};
    const out = await runAgentSdk({ system: 'SYSTEM', user: 'USER', schema, model: 'claude-sonnet-5-5', maxOutputTokens: 500, maxBudgetUsd: 0.2, env, queryImpl: fakeQuery([init(), success()], seen) });
    const o = seen.options;
    expect(seen.prompt).toBe('USER');
    expect(o).toMatchObject({ systemPrompt: 'SYSTEM', tools: [], mcpServers: {}, strictMcpConfig: true, settingSources: [], persistSession: false, permissionMode: 'dontAsk', model: 'claude-sonnet-5-5', maxBudgetUsd: 0.2, outputFormat: { type: 'json_schema', schema } });
    expect(o.allowDangerouslySkipPermissions).toBeUndefined();
    expect(await o.canUseTool('Bash', {})).toMatchObject({ behavior: 'deny' });
    // The environment replaces process.env: our key, a throwaway HOME, nothing else from the server.
    expect(o.env.ANTHROPIC_API_KEY).toBe(KEY);
    expect(o.env.HOME).toBe(o.cwd);
    expect(o.env.CLAUDE_CONFIG_DIR).toBe(o.cwd);
    expect(o.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS).toBe('500');
    for (const name of ['BKPK_TEST_SECRET', 'CLAUDE_CODE_OAUTH_TOKEN', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_BASE_URL', 'DATABASE_URL', 'AGENT_SDK_ANTHROPIC_API_KEY']) expect(o.env[name]).toBeUndefined();
    // Result mapping: structured output, actual model, usage across every call, SDK cost estimate.
    expect(out).toMatchObject({ json: { ok: true }, text: '{"ok":true}', model: 'claude-sonnet-5-5', apiKeySource: 'ANTHROPIC_API_KEY', usage: { inputTokens: 115, outputTokens: 40 }, costUsd: 0.0123 });
    // The temporary HOME existed during the call and is gone afterwards.
    expect(seen.homeExisted).toBe(true);
    expect(fs.existsSync(seen.home)).toBe(false);
  });

  it('returns plain text when no schema is requested', async () => {
    const out = await runAgentSdk({ system: 's', user: 'u', model: 'm', env, queryImpl: fakeQuery([init(), success({ structured_output: undefined, result: '## Analiza\n\nTekst' })]) });
    expect(out.text).toBe('## Analiza\n\nTekst');
    expect(out.json).toBeUndefined();
  });

  it('stops before the request when the CLI did not authenticate with the API key', async () => {
    let consumed = 0;
    const queryImpl = () =>
      (async function* () {
        yield init('none');
        consumed++;
        yield success();
      })();
    await expect(runAgentSdk({ system: 's', user: 'u', model: 'm', env, queryImpl })).rejects.toMatchObject({ rejected: true, code: 'auth_required' });
    expect(consumed).toBe(0);
  });

  it('maps error results: credits, key, rate limit, budget, and the throw that follows an error result', async () => {
    const credit = { type: 'result', subtype: 'success', is_error: true, api_error_status: 400, result: 'Your credit balance is too low to access the Anthropic API.', total_cost_usd: 0, modelUsage: {} };
    await expect(runAgentSdk({ system: 's', user: 'u', model: 'm', env, queryImpl: fakeQuery([init(), credit, new Error('Claude Code returned an error result')]) })).rejects.toMatchObject({ rejected: true, code: 'limit_reached' });
    expect(resultError({ ...credit, api_error_status: 401, result: 'Invalid API key' })).toMatchObject({ rejected: true, code: 'auth_required' });
    expect(resultError({ ...credit, api_error_status: 429, result: 'rate limited' })).toMatchObject({ rejected: true, code: 'rate_limited' });
    const budget = resultError({ type: 'result', subtype: 'error_max_budget_usd', errors: [], total_cost_usd: 0.3, modelUsage: { m: { inputTokens: 1, outputTokens: 2 } } });
    expect(budget).toMatchObject({ rejected: false, uncertain: false, costUsd: 0.3, code: 'budget' });
    expect(resultError({ type: 'result', subtype: 'error_during_execution', errors: ['crash'], total_cost_usd: 0, modelUsage: {} })).toMatchObject({ uncertain: true });
  });

  it('times out with an uncertain outcome once the request may have been sent', async () => {
    const queryImpl = ({ options }) =>
      (async function* () {
        yield init();
        await new Promise((_, reject) => options.abortController.signal.addEventListener('abort', () => reject(new Error('aborted'))));
      })();
    await expect(runAgentSdk({ system: 's', user: 'u', model: 'm', env, queryImpl, timeoutMs: 20 })).rejects.toMatchObject({ code: 'timeout', uncertain: true });
    expect(limiterState()).toEqual({ active: 0, waiting: 0 });
  });

  it('runs one call at a time and refuses a long queue instead of piling up processes', async () => {
    let release;
    const gate = new Promise((r) => (release = r));
    const slow = () =>
      (async function* () {
        yield init();
        await gate;
        yield success();
      })();
    const first = runAgentSdk({ system: 's', user: 'u', model: 'm', env, queryImpl: slow });
    const second = runAgentSdk({ system: 's', user: 'u', model: 'm', env, queryImpl: slow });
    const third = runAgentSdk({ system: 's', user: 'u', model: 'm', env, queryImpl: slow });
    await new Promise((r) => setTimeout(r, 10));
    await expect(runAgentSdk({ system: 's', user: 'u', model: 'm', env, queryImpl: slow })).rejects.toMatchObject({ rejected: true, code: 'busy' });
    expect(limiterState()).toEqual({ active: 1, waiting: 2 });
    release();
    await Promise.all([first, second, third]);
    expect(limiterState()).toEqual({ active: 0, waiting: 0 });
  });
});
