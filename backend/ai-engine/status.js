// Engine status for the settings screens and the "Testuj połączenie" button. Readiness of the SDK engine comes from
// real requests recorded in AiGenerationLog (tests and generations), never from the mere presence of a variable.
import { agentSdkAvailable, agentSdkConfig, runAgentSdk } from './agentSdk.js';
import { DEFAULT_SDK_MODEL, engineAudit, getEngineSetting, SDK_MODEL_IDS } from './settings.js';
import { IMAGE_NOTICE, operations } from './operations.js';
import { logGeneration, newRequestId, sanitizeError } from './log.js';
import { models } from '../studio/providers/catalog.js';

export const SDK = 'claude-agent-sdk';
const ERROR_STATUS = { limit_reached: 'limit_reached', auth_required: 'auth_required', unavailable: 'unavailable', not_configured: 'not_configured' };

async function lastSdkRows(db) {
  try {
    return await db.aiGenerationLog.findMany({ where: { actualEngine: SDK }, orderBy: { startedAt: 'desc' }, take: 10 });
  } catch (err) {
    if (err?.code === 'P2021') return [];
    throw err;
  }
}

const rowView = (r) =>
  r && { at: r.startedAt, ok: r.status === 'ok', operation: r.operation, model: r.model, durationMs: r.durationMs, errorCode: r.errorCode, error: r.error, costMicros: r.costMicros };

/** ready | untested | not_configured | auth_required | unavailable | connection_error | limit_reached */
export async function sdkStatus(db) {
  const config = agentSdkConfig();
  if (!config.configured) return { status: config.code, detail: config.reason, keyConfigured: config.code !== 'not_configured' };
  const available = await agentSdkAvailable();
  if (!available.ok) return { status: 'unavailable', detail: available.reason, keyConfigured: true };
  const rows = await lastSdkRows(db);
  const latest = rows[0];
  const lastTest = rows.find((r) => r.operation === 'engine.test');
  const base = { keyConfigured: true, lastCall: rowView(latest), lastTest: rowView(lastTest) };
  if (!latest) return { ...base, status: 'untested', detail: 'Klucz jest ustawiony, ale nie wykonano jeszcze żadnego żądania. Użyj „Testuj połączenie”.' };
  if (latest.status === 'ok') return { ...base, status: 'ready', detail: null };
  return { ...base, status: ERROR_STATUS[latest.errorCode] || 'connection_error', detail: latest.error };
}

async function actorName(db, id) {
  if (!id) return null;
  try {
    const p = await db.rosterPlayer.findUnique({ where: { id }, select: { username: true, firstName: true, lastName: true } });
    return p ? [p.firstName, p.lastName].filter(Boolean).join(' ') || p.username : null;
  } catch {
    return null;
  }
}

/**
 * Everything both settings screens show. `apiSummary` describes the existing API engine of the asking app
 * (panel: Gemini from env; Studio: per-task models).
 */
export async function engineStatus(db, { apiSummary } = {}) {
  const setting = await getEngineSetting(db, { fresh: true });
  const [sdk, audit, updatedByName] = await Promise.all([sdkStatus(db), engineAudit(db, 5), actorName(db, setting.updatedBy)]);
  const label = (id) => models.find((m) => m.id === id)?.label || id;
  return {
    engine: setting.engine,
    agentSdkModel: setting.agentSdkModel,
    fallbackToApi: setting.fallbackToApi,
    updatedAt: setting.updatedAt,
    updatedFrom: setting.updatedFrom,
    updatedByName,
    // Model actually used by text operations right now (SDK: last model the SDK reported, else the configured one).
    activeModel: setting.engine === SDK ? sdk.lastCall?.model || setting.agentSdkModel : apiSummary?.model || null,
    sdk: { ...sdk, billing: 'Klucz API z Claude Console (kredyty organizacji, np. dołączone do planu Max) — nie limity subskrypcji claude.ai.' },
    api: apiSummary || null,
    sdkModels: SDK_MODEL_IDS.map((id) => ({ id, label: label(id), default: id === DEFAULT_SDK_MODEL })),
    operations,
    imageNotice: IMAGE_NOTICE,
    audit: audit.map((a) => ({ at: a.createdAt, from: a.from, before: a.before, after: a.after })),
  };
}

const TEST_SCHEMA = { type: 'object', properties: { ok: { type: 'boolean' }, reply: { type: 'string' } }, required: ['ok', 'reply'], additionalProperties: false };
let lastTestAt = 0;

/**
 * Small, real request to the selected engine. `apiTest` runs the API engine's own check (supplied by the caller,
 * so this module never imports panel or Studio provider code). Every test is logged as operation 'engine.test'.
 */
export async function testEngine(db, { engine, source, apiTest, minIntervalMs = 10_000, queryImpl } = {}) {
  const setting = await getEngineSetting(db, { fresh: true });
  const target = engine || setting.engine;
  if (Date.now() - lastTestAt < minIntervalMs) return { ok: false, engine: target, error: 'Test był przed chwilą — odczekaj kilka sekund.', status: 'throttled' };
  lastTestAt = Date.now();
  const startedAt = new Date();
  const requestId = newRequestId();
  if (target === SDK) {
    try {
      const out = await runAgentSdk({
        system: 'To test połączenia aplikacji BeKaPaKa. Odpowiedz wyłącznie zgodnie ze schematem.',
        user: 'Zwróć ok=true oraz reply="BeKaPaKa".',
        schema: TEST_SCHEMA,
        model: setting.agentSdkModel,
        effort: 'low',
        maxOutputTokens: 400,
        maxBudgetUsd: 0.05,
        timeoutMs: 25_000,
        queryImpl,
      });
      const costMicros = Math.round(out.costUsd * 1_000_000);
      await logGeneration(db, { requestId, operation: 'engine.test', source, requestedEngine: SDK, actualEngine: SDK, model: out.model, status: 'ok', startedAt, inputTokens: out.usage?.inputTokens, outputTokens: out.usage?.outputTokens, costMicros, costKind: 'agent-sdk-estimate' });
      return { ok: out.json?.ok === true, engine: SDK, model: out.model, apiKeySource: out.apiKeySource, billing: 'Klucz API z Claude Console (ANTHROPIC_API_KEY) — koszt pobierany z kredytów organizacji Console.', durationMs: out.durationMs, costUsd: out.costUsd, error: out.json?.ok === true ? null : 'Model odpowiedział, ale nie w oczekiwanym formacie.' };
    } catch (err) {
      await logGeneration(db, { requestId, operation: 'engine.test', source, requestedEngine: SDK, actualEngine: SDK, model: setting.agentSdkModel, status: err.rejected ? 'rejected' : 'error', errorCode: err.code || 'connection_error', error: err.message, startedAt, costKind: 'agent-sdk-estimate' });
      return { ok: false, engine: SDK, model: setting.agentSdkModel, durationMs: Date.now() - startedAt.getTime(), error: err.message, status: ERROR_STATUS[err.code] || 'connection_error' };
    }
  }
  if (!apiTest) return { ok: false, engine: 'api', error: 'Brak testu API dla tej aplikacji.' };
  try {
    const out = await apiTest();
    await logGeneration(db, { requestId, operation: 'engine.test', source, requestedEngine: 'api', actualEngine: 'api', model: out.model, status: 'ok', startedAt, inputTokens: out.usage?.inputTokens, outputTokens: out.usage?.outputTokens, costMicros: out.costMicros, costKind: out.costMicros == null ? 'none' : 'api-estimate' });
    return { ok: true, engine: 'api', model: out.model, billing: out.billing, durationMs: Date.now() - startedAt.getTime(), error: null, detail: out.detail || null };
  } catch (err) {
    await logGeneration(db, { requestId, operation: 'engine.test', source, requestedEngine: 'api', actualEngine: 'api', model: err.model || null, status: 'error', errorCode: err.code || 'connection_error', error: err.message, startedAt });
    return { ok: false, engine: 'api', durationMs: Date.now() - startedAt.getTime(), error: sanitizeError(err.message || err) };
  }
}

/** Test hook. */
export function resetTestThrottle() {
  lastTestAt = 0;
}
