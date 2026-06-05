import { GoogleGenAI } from '@google/genai';
import { AiConfigError } from './errors.js';

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 60000);
const DEFAULT_MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 8192);

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

/**
 * @param {import('@google/genai').GenerateContentResponse} response
 * @returns {string | undefined}
 */
function getFinishReason(response) {
  return response?.candidates?.[0]?.finishReason ?? response?.finishReason;
}

/**
 * @param {{ system: string, user: string, jsonMode?: boolean, maxOutputTokens?: number, disableThinking?: boolean }} params
 * @returns {Promise<string>}
 */
export async function generateText({
  system,
  user,
  jsonMode = false,
  maxOutputTokens,
  disableThinking = true
}) {
  if (process.env.AI_ANALYSIS_ENABLED === 'false') {
    throw new AiConfigError('Analiza AI jest wyłączona (AI_ANALYSIS_ENABLED=false)');
  }

  const ai = getClient();
  const outputTokenLimit = maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS;

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: user,
      config: {
        systemInstruction: system,
        temperature: 0.35,
        maxOutputTokens: outputTokenLimit,
        ...(disableThinking ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
        ...(jsonMode ? { responseMimeType: 'application/json' } : {})
      }
    });

    const finishReason = getFinishReason(response);
    const text = (response.text || '').trim();

    if (!text) {
      throw new Error('Pusta odpowiedź modelu');
    }

    if (finishReason === 'MAX_TOKENS') {
      throw new Error(
        `Odpowiedź modelu została ucięta (MAX_TOKENS, limit ${outputTokenLimit}). Spróbuj ponownie lub zwiększ GEMINI_MAX_OUTPUT_TOKENS.`
      );
    }

    return text;
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg.includes('429') || msg.toLowerCase().includes('rate')) {
      throw new Error('Limit zapytań Gemini — spróbuj za chwilę');
    }
    throw err;
  }
}

export function getGeminiModelName() {
  return DEFAULT_MODEL;
}

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY) && process.env.AI_ANALYSIS_ENABLED !== 'false';
}
