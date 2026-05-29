import { GoogleGenAI } from '@google/genai';
import { AiConfigError } from './errors.js';

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 60000);

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
 * @param {{ system: string, user: string, jsonMode?: boolean }} params
 * @returns {Promise<string>}
 */
export async function generateText({ system, user, jsonMode = false }) {
  if (process.env.AI_ANALYSIS_ENABLED === 'false') {
    throw new AiConfigError('Analiza AI jest wyłączona (AI_ANALYSIS_ENABLED=false)');
  }

  const ai = getClient();

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: user,
      config: {
        systemInstruction: system,
        temperature: 0.35,
        maxOutputTokens: 2048,
        ...(jsonMode ? { responseMimeType: 'application/json' } : {})
      }
    });

    const text = (response.text || '').trim();
    if (!text) {
      throw new Error('Pusta odpowiedź modelu');
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
