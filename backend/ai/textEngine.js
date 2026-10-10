// Jedno wejście dla tekstowych operacji AI panelu: wybiera silnik z globalnego ustawienia (API = dotychczasowy Gemini
// z env, albo Claude Agent SDK), loguje każde wywołanie i nigdy nie przełącza się po cichu na płatne API.
// Fallback na API działa tylko po świadomym włączeniu przez admina i tylko gdy SDK niczego nie wygenerowało.
import { prisma } from '../lib/prisma.js';
import { AiTimeoutError, generateTextWithMeta, getGeminiModelName, isGeminiConfigured } from './geminiClient.js';
import { AiConfigError } from './errors.js';
import { getEngineSetting } from '../ai-engine/settings.js';
import { isAgentSdkConfigured, runAgentSdk } from '../ai-engine/agentSdk.js';
import { logGeneration, newRequestId } from '../ai-engine/log.js';
import { costMicros, findModel } from '../studio/providers/catalog.js';

export const SDK = 'claude-agent-sdk';
// Panelowe żądania są synchroniczne (nginx panelu: 180 s na trasach AI) — SDK kończy wcześniej.
const SDK_TIMEOUT_MS = 150_000;
const maxBudgetUsd = () => {
  const n = Number(process.env.AGENT_SDK_PANEL_MAX_USD);
  return Number.isFinite(n) && n > 0 ? n : 0.5;
};

/** Szacunek kosztu wywołania Gemini z cennika Studio (gdy model jest w katalogu). */
function apiCost(model, usage) {
  const entry = findModel(model);
  if (!entry || !usage) return null;
  return costMicros(entry, usage, Number.MAX_SAFE_INTEGER);
}

/** Czy panel może teraz generować tekst AI w aktywnym silniku (do statusu i katalogu analiz). */
export async function isAiConfigured(db = prisma) {
  if (process.env.AI_ANALYSIS_ENABLED === 'false') return false;
  const setting = await getEngineSetting(db);
  if (setting.engine === SDK) return isAgentSdkConfigured() || (setting.fallbackToApi && isGeminiConfigured());
  return isGeminiConfigured();
}

/** Model, który obsłuży następną operację panelu. */
export async function activeModel(db = prisma) {
  const setting = await getEngineSetting(db);
  return setting.engine === SDK ? setting.agentSdkModel : getGeminiModelName();
}

function toPanelError(err) {
  if (err?.code === 'timeout') return new AiTimeoutError(SDK_TIMEOUT_MS);
  if (['not_configured', 'auth_required', 'unavailable'].includes(err?.code)) return new AiConfigError(err.message);
  return new Error(err?.message || 'Błąd generacji AI');
}

/**
 * @param {{ operation: string, system: string, user: string, responseJsonSchema?: object, jsonMode?: boolean,
 *   maxOutputTokens?: number, timeoutMs?: number, disableThinking?: boolean, effort?: 'low'|'medium'|'high', db?: any }} params
 * @returns {Promise<{ text: string, model: string, engine: 'api'|'claude-agent-sdk', costMicros: number|null }>}
 */
export async function aiText({ operation, system, user, responseJsonSchema, jsonMode, maxOutputTokens, timeoutMs, disableThinking, effort = 'low', db = prisma }) {
  if (process.env.AI_ANALYSIS_ENABLED === 'false') throw new AiConfigError('Analiza AI jest wyłączona (AI_ANALYSIS_ENABLED=false)');
  const setting = await getEngineSetting(db);
  const requestId = newRequestId();
  const base = { requestId, operation, source: 'panel', requestedEngine: setting.engine };

  const viaApi = async (actualEngine = 'api') => {
    const startedAt = new Date();
    try {
      const out = await generateTextWithMeta({ system, user, jsonMode, responseJsonSchema, maxOutputTokens, timeoutMs, disableThinking });
      const cost = apiCost(out.model, out.usage);
      await logGeneration(db, { ...base, actualEngine, model: out.model, status: 'ok', startedAt, ...out.usage, costMicros: cost, costKind: cost == null ? 'none' : 'api-estimate' });
      return { text: out.text, model: out.model, engine: 'api', costMicros: cost };
    } catch (err) {
      await logGeneration(db, { ...base, actualEngine, model: getGeminiModelName(), status: 'error', errorCode: err instanceof AiTimeoutError ? 'timeout' : err instanceof AiConfigError ? 'not_configured' : 'error', error: err.message, startedAt });
      throw err;
    }
  };

  if (setting.engine !== SDK) return viaApi();

  const startedAt = new Date();
  try {
    const out = await runAgentSdk({
      system,
      user,
      schema: responseJsonSchema,
      model: setting.agentSdkModel,
      effort,
      maxOutputTokens,
      maxBudgetUsd: maxBudgetUsd(),
      timeoutMs: SDK_TIMEOUT_MS,
    });
    const cost = Math.round(out.costUsd * 1_000_000);
    await logGeneration(db, { ...base, actualEngine: SDK, model: out.model, status: 'ok', startedAt, ...out.usage, costMicros: cost, costKind: 'agent-sdk-estimate' });
    return { text: out.text, model: out.model, engine: SDK, costMicros: cost };
  } catch (err) {
    await logGeneration(db, {
      ...base,
      actualEngine: SDK,
      model: setting.agentSdkModel,
      status: err.rejected ? 'rejected' : err.uncertain ? 'uncertain' : 'error',
      errorCode: err.code || 'error',
      error: err.message,
      startedAt,
      ...(err.usage || {}),
      costMicros: Number.isFinite(err.costUsd) ? Math.round(err.costUsd * 1_000_000) : null,
      costKind: 'agent-sdk-estimate',
    });
    // Świadomy fallback: tylko gdy admin go włączył i SDK niczego nie wygenerowało (nic nie zostało naliczone).
    if (setting.fallbackToApi && err.rejected && isGeminiConfigured()) return viaApi('api');
    throw toPanelError(err);
  }
}
