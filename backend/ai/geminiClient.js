import { GoogleGenAI } from '@google/genai';
import { AiConfigError } from './errors.js';

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const DEFAULT_TIMEOUT_MS = 60000;
const DEFAULT_MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 8192);

/** Model zapisywany, gdy plan zawodnika pochodzi z szablonu (fallback), a nie z Gemini. */
export const TEMPLATE_MODEL_NAME = 'template';

let client = null;

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AiConfigError();
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

/** Tylko do testów — resetuje singleton klienta (np. po vi.doMock). */
export function resetGeminiClientForTests() {
  client = null;
}

/**
 * Timeout wywołania Gemini (ms) — `GEMINI_TIMEOUT_MS`, czytany przy każdym wywołaniu.
 * @returns {number}
 */
export function getGeminiTimeoutMs() {
  const n = Number(process.env.GEMINI_TIMEOUT_MS);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TIMEOUT_MS;
}

export class AiTimeoutError extends Error {
  /** @param {number} ms */
  constructor(ms) {
    super(`Przekroczono limit czasu odpowiedzi Gemini (${Math.round(ms / 1000)} s) — spróbuj ponownie`);
    this.name = 'AiTimeoutError';
    this.statusCode = 504;
  }
}

/**
 * @param {import('@google/genai').GenerateContentResponse} response
 * @returns {string | undefined}
 */
function getFinishReason(response) {
  return response?.candidates?.[0]?.finishReason ?? response?.finishReason;
}

/**
 * @param {{
 *   system: string,
 *   user: string,
 *   jsonMode?: boolean,
 *   responseJsonSchema?: object,
 *   maxOutputTokens?: number,
 *   disableThinking?: boolean,
 *   timeoutMs?: number
 * }} params
 * @returns {Promise<string>}
 */
export async function generateText(params) {
  return (await generateTextWithMeta(params)).text;
}

/**
 * Jak generateText, ale zwraca też zużycie tokenów (do logu generacji i szacunku kosztu).
 * @param {Parameters<typeof generateText>[0]} params
 * @returns {Promise<{ text: string, model: string, usage: { inputTokens?: number, outputTokens?: number } }>}
 */
export async function generateTextWithMeta({
  system,
  user,
  jsonMode = false,
  responseJsonSchema,
  maxOutputTokens,
  disableThinking = true,
  timeoutMs
}) {
  if (process.env.AI_ANALYSIS_ENABLED === 'false') {
    throw new AiConfigError('Analiza AI jest wyłączona (AI_ANALYSIS_ENABLED=false)');
  }

  const ai = getClient();
  const outputTokenLimit = maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS;
  const limitMs = timeoutMs ?? getGeminiTimeoutMs();
  const wantsJson = jsonMode || Boolean(responseJsonSchema);

  const controller = new AbortController();
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new AiTimeoutError(limitMs));
    }, limitMs);
  });

  try {
    const request = ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: user,
      config: {
        systemInstruction: system,
        temperature: 0.35,
        maxOutputTokens: outputTokenLimit,
        abortSignal: controller.signal,
        httpOptions: { timeout: limitMs },
        ...(disableThinking ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
        ...(wantsJson ? { responseMimeType: 'application/json' } : {}),
        ...(responseJsonSchema ? { responseJsonSchema } : {})
      }
    });

    // Promise.race — timeout działa także gdy SDK zignoruje abortSignal.
    const response = await Promise.race([request, timeoutPromise]);

    const finishReason = getFinishReason(response);
    const text = (response?.text || '').trim();

    if (!text) {
      throw new Error('Pusta odpowiedź modelu');
    }

    if (finishReason === 'MAX_TOKENS') {
      throw new Error(
        `Odpowiedź modelu została ucięta (MAX_TOKENS, limit ${outputTokenLimit}). Spróbuj ponownie lub zwiększ GEMINI_MAX_OUTPUT_TOKENS.`
      );
    }

    const u = response?.usageMetadata || {};
    return {
      text,
      model: DEFAULT_MODEL,
      usage: { inputTokens: u.promptTokenCount, outputTokens: (u.candidatesTokenCount || 0) + (u.thoughtsTokenCount || 0) }
    };
  } catch (err) {
    if (err instanceof AiTimeoutError) throw err;
    if (controller.signal.aborted || err?.name === 'AbortError') {
      throw new AiTimeoutError(limitMs);
    }
    const msg = err?.message || String(err);
    if (msg.includes('429') || msg.toLowerCase().includes('rate')) {
      throw new Error('Limit zapytań Gemini — spróbuj za chwilę');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export function getGeminiModelName() {
  return DEFAULT_MODEL;
}

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY) && process.env.AI_ANALYSIS_ENABLED !== 'false';
}
