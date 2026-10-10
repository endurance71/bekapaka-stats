// Claude Agent SDK as a text engine: one locked-down, single-purpose query() per call.
// Authentication is an Anthropic Console API key only (AGENT_SDK_ANTHROPIC_API_KEY) — e.g. a key from the Console
// organization linked to the owner's Max plan, so calls draw on its monthly API credits. A claude.ai subscription
// login (OAuth) is never used on the server: Anthropic does not allow routing app requests through plan credentials.
// The agent gets no tools, no settings, no MCP servers, no session files and a throwaway HOME, so it can only answer.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ProviderError } from './errors.js';

export const AGENT_SDK_KEY_ENV = 'AGENT_SDK_ANTHROPIC_API_KEY';
// `apiKeySource` reported by the SDK's init message: only the env API key is acceptable (never 'none' = OAuth login).
export const ALLOWED_KEY_SOURCES = new Set(['ANTHROPIC_API_KEY']);
// Variables that would make the CLI authenticate with something other than our API key.
const FORBIDDEN_AUTH_ENV = ['CLAUDE_CODE_OAUTH_TOKEN', 'ANTHROPIC_AUTH_TOKEN'];
// Credit exhaustion on the Console organization (included Max/Team credits or purchased credits).
const CREDIT_ERROR = /credit balance is too low|credits_required|purchase credits/i;
const MAX_CONCURRENT = 1;
const MAX_WAITING = 2;

/**
 * Is the server set up to run the SDK engine? Presence of a key is not readiness — status pages also need a real test.
 * @returns {{ configured: boolean, code?: string, reason?: string }}
 */
export function agentSdkConfig(env = process.env) {
  const oauth = FORBIDDEN_AUTH_ENV.find((name) => env[name]);
  if (oauth) return { configured: false, code: 'auth_required', reason: `Na serwerze ustawiono ${oauth} (logowanie subskrypcją). Silnik SDK używa wyłącznie klucza API z Claude Console — usuń tę zmienną.` };
  const key = env[AGENT_SDK_KEY_ENV];
  if (!key) return { configured: false, code: 'not_configured', reason: `Brak klucza ${AGENT_SDK_KEY_ENV} (klucz API z Claude Console) na serwerze.` };
  if (/^sk-ant-oat/i.test(key)) return { configured: false, code: 'auth_required', reason: `${AGENT_SDK_KEY_ENV} zawiera token OAuth subskrypcji, a nie klucz API z Claude Console.` };
  return { configured: true };
}
export const isAgentSdkConfigured = (env = process.env) => agentSdkConfig(env).configured;

let sdkModule = null;
async function loadQuery() {
  sdkModule ??= import('@anthropic-ai/claude-agent-sdk');
  try {
    return (await sdkModule).query;
  } catch (err) {
    sdkModule = null;
    throw new ProviderError(`Claude Agent SDK nie jest zainstalowane na serwerze (${String(err?.message || err).slice(0, 120)})`, { rejected: true, code: 'unavailable' });
  }
}

/** Can the SDK module be loaded in this process (the native binary is checked by a real test)? */
export async function agentSdkAvailable() {
  try {
    await loadQuery();
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

// In-process limiter: the SDK spawns a Claude Code process per call, so calls queue instead of piling up RAM.
let active = 0;
const waiting = [];
async function acquire() {
  if (active < MAX_CONCURRENT) {
    active++;
    return;
  }
  if (waiting.length >= MAX_WAITING) throw new ProviderError('Silnik Claude Agent SDK jest zajęty innymi generacjami. Spróbuj za chwilę.', { rejected: true, code: 'busy' });
  await new Promise((resolve) => waiting.push(resolve));
}
function release() {
  const next = waiting.shift();
  if (next) next();
  else active--;
}
/** Test hook. */
export function limiterState() {
  return { active, waiting: waiting.length };
}

/** Minimal environment for the CLI subprocess: replaces process.env entirely (no secrets, no OAuth, no base URL). */
export function sdkEnv({ apiKey, home, maxOutputTokens }) {
  return {
    PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
    HOME: home,
    CLAUDE_CONFIG_DIR: home,
    TMPDIR: home,
    ANTHROPIC_API_KEY: apiKey,
    ...(maxOutputTokens ? { CLAUDE_CODE_MAX_OUTPUT_TOKENS: String(maxOutputTokens) } : {}),
    DISABLE_AUTOUPDATER: '1',
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
    DISABLE_TELEMETRY: '1',
    CLAUDE_AGENT_SDK_CLIENT_APP: 'bekapaka/1',
  };
}

/** query() options for a text-only call. Exported for tests: nothing here may grant tools or load local config. */
export function sdkOptions({ system, schema, model, effort, maxBudgetUsd, home, apiKey, maxOutputTokens, abortController }) {
  return {
    model,
    systemPrompt: system,
    tools: [],
    mcpServers: {},
    strictMcpConfig: true,
    settingSources: [],
    persistSession: false,
    permissionMode: 'dontAsk',
    canUseTool: async () => ({ behavior: 'deny', message: 'Narzędzia są wyłączone w generowaniu treści.' }),
    cwd: home,
    env: sdkEnv({ apiKey, home, maxOutputTokens }),
    maxTurns: schema ? 3 : 1,
    ...(effort ? { effort } : {}),
    ...(maxBudgetUsd ? { maxBudgetUsd } : {}),
    ...(schema ? { outputFormat: { type: 'json_schema', schema } } : {}),
    abortController,
  };
}

function usageOf(result) {
  const entries = Object.entries(result?.modelUsage || {});
  if (!entries.length) {
    const u = result?.usage;
    return u ? { inputTokens: (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0), outputTokens: u.output_tokens || 0 } : undefined;
  }
  return entries.reduce(
    (sum, [, u]) => ({
      inputTokens: sum.inputTokens + (u.inputTokens || 0) + (u.cacheReadInputTokens || 0) + (u.cacheCreationInputTokens || 0),
      outputTokens: sum.outputTokens + (u.outputTokens || 0),
    }),
    { inputTokens: 0, outputTokens: 0 },
  );
}

/** Maps an SDK error result to the shared ProviderError semantics (rejected = nothing billed; uncertain = unknown). */
export function resultError(result) {
  const text = [result.result, ...(result.errors || [])].filter(Boolean).join(' ').slice(0, 300);
  const usage = usageOf(result);
  const costUsd = Number(result.total_cost_usd) || 0;
  const status = Number(result.api_error_status);
  if (CREDIT_ERROR.test(text)) return new ProviderError('Brak środków na koncie Claude Console (kredyty API wyczerpane). Silnik SDK nie przełącza się sam na inne płatne API.', { rejected: true, code: 'limit_reached', usage });
  if (status === 401 || status === 403 || /invalid x-api-key|authentication_error|invalid api key/i.test(text)) return new ProviderError('Claude odrzucił klucz API silnika SDK (sprawdź AGENT_SDK_ANTHROPIC_API_KEY).', { rejected: true, code: 'auth_required', usage });
  if (status === 429 || /rate.?limit|overloaded/i.test(text)) return new ProviderError('Limit zapytań Claude API — spróbuj za chwilę.', { rejected: true, code: 'rate_limited', usage });
  if (status === 400 || status === 404) return new ProviderError(`Claude odrzucił zapytanie: ${text || status}`, { rejected: true, code: 'rejected', usage });
  const known = { usage, costUsd };
  if (result.subtype === 'error_max_budget_usd') return Object.assign(new ProviderError('Przekroczono limit kosztu jednego wywołania SDK.', { code: 'budget' }), known);
  if (result.subtype === 'error_max_turns' || result.subtype === 'error_max_structured_output_retries') return Object.assign(new ProviderError('Model nie zwrócił poprawnej odpowiedzi w formacie aplikacji.', { code: 'invalid_output' }), known);
  if (costUsd > 0 || (usage && usage.outputTokens > 0)) return Object.assign(new ProviderError(`Claude Agent SDK zakończył się błędem: ${text || result.subtype}`, { code: 'execution_error' }), known);
  // Nothing reported as spent: may still be billed (crash mid-request) — treat as uncertain, never retry.
  return new ProviderError(`Claude Agent SDK zakończył się błędem: ${text || result.subtype}`, { uncertain: true, code: 'connection_error' });
}

/**
 * One text generation through the Claude Agent SDK.
 * @returns {Promise<{ text: string, json?: unknown, model: string, apiKeySource: string, usage?: { inputTokens: number, outputTokens: number }, costUsd: number, durationMs: number, numTurns?: number }>}
 */
export async function runAgentSdk({ system, user, schema, model, effort = 'low', maxOutputTokens, maxBudgetUsd, timeoutMs = 120_000, queryImpl, env = process.env }) {
  const config = agentSdkConfig(env);
  if (!config.configured) throw new ProviderError(config.reason, { rejected: true, code: config.code });
  const query = queryImpl || (await loadQuery());
  await acquire();
  const started = Date.now();
  let home;
  const abortController = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    abortController.abort();
  }, timeoutMs);
  let init = null;
  let requested = false;
  let result = null;
  try {
    home = await fs.mkdtemp(path.join(os.tmpdir(), 'bkpk-agent-'));
    const options = sdkOptions({ system, schema, model, effort, maxBudgetUsd, home, apiKey: env[AGENT_SDK_KEY_ENV], maxOutputTokens, abortController });
    for await (const message of query({ prompt: user, options })) {
      if (message.type === 'system' && message.subtype === 'init') {
        init = message;
        if (!ALLOWED_KEY_SOURCES.has(message.apiKeySource)) {
          abortController.abort();
          throw new ProviderError(`Silnik SDK nie uwierzytelnił się kluczem API (źródło: ${message.apiKeySource}). Zatrzymano przed wysłaniem zapytania.`, { rejected: true, code: 'auth_required' });
        }
        requested = true;
      } else if (message.type === 'result') result = message;
    }
    if (!result) throw new ProviderError('Claude Agent SDK zakończył pracę bez wyniku.', { uncertain: requested, rejected: !requested, code: 'connection_error' });
    if (result.subtype !== 'success' || result.is_error) throw resultError(result);
    const usage = usageOf(result);
    const actualModel = Object.keys(result.modelUsage || {})[0] || init?.model || model;
    let json;
    if (schema) {
      json = result.structured_output;
      if (json === undefined) {
        try {
          json = JSON.parse(result.result || '');
        } catch {
          throw Object.assign(new ProviderError('AI zwróciło nieprawidłowy JSON', { usage, code: 'invalid_output' }), { costUsd: Number(result.total_cost_usd) || 0 });
        }
      }
    }
    return {
      text: schema ? JSON.stringify(json) : String(result.result || '').trim(),
      json,
      model: actualModel,
      apiKeySource: init?.apiKeySource,
      usage,
      costUsd: Number(result.total_cost_usd) || 0,
      durationMs: Date.now() - started,
      numTurns: result.num_turns,
    };
  } catch (err) {
    if (err instanceof ProviderError) throw err;
    // The SDK throws after yielding an error result: map the result, which says what actually happened.
    if (result && (result.subtype !== 'success' || result.is_error)) throw resultError(result);
    if (timedOut) throw new ProviderError(`Przekroczono limit czasu Claude Agent SDK (${Math.round(timeoutMs / 1000)} s).`, { uncertain: requested, rejected: !requested, code: 'timeout' });
    // Spawn failures (missing/wrong-libc binary) happen before any request: nothing billed.
    const text = String(err?.message || err).slice(0, 200);
    if (!requested) throw new ProviderError(`Nie udało się uruchomić Claude Agent SDK: ${text}`, { rejected: true, code: 'unavailable' });
    throw new ProviderError(`Claude Agent SDK przerwał pracę: ${text}`, { uncertain: true, code: 'connection_error' });
  } finally {
    clearTimeout(timer);
    release();
    if (home) await fs.rm(home, { recursive: true, force: true }).catch(() => {});
  }
}
