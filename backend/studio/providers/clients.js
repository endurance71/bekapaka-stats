// One call shape for every provider: system + user prompt → JSON matching a schema, with token usage.
// No automatic retries: an uncertain paid call is never repeated silently (the worker marks it `uncertain`).
import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

const TIMEOUT_MS = 90_000;

// Anthropic and OpenAI structured outputs reject length/size constraints; Zod validates them after the call.
// Keywords are stripped only on schema nodes — never on property names inside `properties`.
const unsupported = new Set(['maxLength', 'minLength', 'maxItems', 'minItems', 'minimum', 'maximum']);
export function portableSchema(node) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return node;
  const out = {};
  for (const [k, v] of Object.entries(node)) {
    if (unsupported.has(k)) continue;
    if (k === 'properties') out.properties = Object.fromEntries(Object.entries(v).map(([name, child]) => [name, portableSchema(child)]));
    else if (k === 'items' || k === 'additionalProperties') out[k] = portableSchema(v);
    else if (k === 'anyOf' || k === 'allOf' || k === 'oneOf') out[k] = v.map(portableSchema);
    else out[k] = v;
  }
  if (out.type === 'object') out.additionalProperties = false;
  return out;
}

// `uncertain`: the provider may have billed a call whose outcome is unknown. Otherwise the call is known to have
// failed; `usage` (when the provider reported it) settles the cost instead of the full reservation.
export class ProviderError extends Error {
  constructor(message, { uncertain = false, usage, rejected = false } = {}) {
    super(message);
    this.uncertain = uncertain;
    this.usage = usage;
    // The provider refused the request before generating (limits, key, bad request): nothing is billed.
    this.rejected = rejected;
  }
}
const REJECTED = new Set([400, 401, 403, 404, 429]);
export function failure(err) {
  const status = Number(err?.status ?? err?.code);
  const text = String(err?.message || err).slice(0, 200);
  if (REJECTED.has(status) || /\b(429|Too Many Requests|quota|RESOURCE_EXHAUSTED|PERMISSION_DENIED|API key not valid)\b/i.test(text))
    return new ProviderError(status === 429 || /429|Too Many|quota|RESOURCE_EXHAUSTED/i.test(text) ? 'Dostawca odrzucił zapytanie: limit zapytań lub brak dostępu do tego modelu na Twoim kluczu.' : `Dostawca odrzucił zapytanie: ${text}`, { rejected: true });
  // Network errors and timeouts may still be billed: keep the reservation, never retry automatically.
  return new ProviderError(`Dostawca AI nie odpowiedział poprawnie: ${text}`, { uncertain: true });
}

async function google({ apiKey, model, system, user, schema, maxOutputTokens, think = false }) {
  const client = new GoogleGenAI({ apiKey, httpOptions: { timeout: TIMEOUT_MS, retryOptions: { attempts: 1 } } });
  const response = await client.models.generateContent({
    model: model.id,
    contents: user,
    config: {
      systemInstruction: system,
      temperature: think ? 0.7 : 0.4,
      maxOutputTokens,
      // A task that asks for thinking (the written report) gets a bounded budget even on „thinking off” models.
      ...(think ? { thinkingConfig: { thinkingBudget: 4096 } } : model.thinking === 'off' ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
      responseMimeType: 'application/json',
      responseJsonSchema: schema,
    },
  });
  const u = response.usageMetadata || {};
  const usage = { inputTokens: u.promptTokenCount, outputTokens: (u.candidatesTokenCount || 0) + (u.thoughtsTokenCount || 0) };
  if (response.candidates?.[0]?.finishReason === 'MAX_TOKENS') throw new ProviderError('Odpowiedź AI została ucięta (limit długości).', { usage });
  return { text: response.text || '', usage };
}

async function anthropic({ apiKey, model, system, user, schema, maxOutputTokens, think = false }) {
  const client = new Anthropic({ apiKey, timeout: TIMEOUT_MS, maxRetries: 0 });
  // Current Claude models think adaptively; low effort keeps copywriting fast and cheap.
  const response = await client.messages.create({
    model: model.id,
    max_tokens: maxOutputTokens,
    system,
    messages: [{ role: 'user', content: user }],
    output_config: { effort: think ? 'medium' : 'low', format: { type: 'json_schema', schema: portableSchema(schema) } },
  });
  const usage = { inputTokens: response.usage?.input_tokens, outputTokens: response.usage?.output_tokens };
  if (response.stop_reason === 'refusal') throw new ProviderError('Model odmówił odpowiedzi. Zmień fakty lub wskazówkę.', { usage });
  if (response.stop_reason === 'max_tokens') throw new ProviderError('Odpowiedź AI została ucięta (limit długości).', { usage });
  const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  return { text, usage };
}

async function openai({ apiKey, model, system, user, schema, maxOutputTokens, think = false }) {
  const client = new OpenAI({ apiKey, timeout: TIMEOUT_MS, maxRetries: 0 });
  const response = await client.responses.create({
    model: model.id,
    input: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    max_output_tokens: maxOutputTokens,
    text: { format: { type: 'json_schema', name: 'studio_copy', schema: portableSchema(schema), strict: true } },
  });
  const usage = { inputTokens: response.usage?.input_tokens, outputTokens: response.usage?.output_tokens };
  if (response.status === 'incomplete') throw new ProviderError('Odpowiedź AI została ucięta (limit długości).', { usage });
  const refusal = response.output?.flatMap((o) => o.content || []).find((c) => c.type === 'refusal');
  if (refusal) throw new ProviderError('Model odmówił odpowiedzi. Zmień fakty lub wskazówkę.', { usage });
  return { text: response.output_text || '', usage };
}

const textProviders = { google, anthropic, openai };

/** @returns {Promise<{ json: unknown, usage: { inputTokens?: number, outputTokens?: number } }>} */
export async function generateJson(params) {
  const call = textProviders[params.model.provider];
  if (!call) throw new ProviderError('Nieobsługiwany dostawca AI');
  let result;
  try {
    result = await call(params);
  } catch (err) {
    if (err instanceof ProviderError) throw err;
    throw failure(err);
  }
  try {
    return { json: JSON.parse(result.text || '{}'), usage: result.usage };
  } catch {
    throw new ProviderError('AI zwróciło nieprawidłowy JSON', { usage: result.usage });
  }
}

/** Background image (Gemini image models only). */
export async function generateImage({ apiKey, model, prompt, maxOutputTokens }) {
  if (model.provider !== 'google') throw new ProviderError('Tła AI obsługują tylko modele obrazowe Gemini');
  const client = new GoogleGenAI({ apiKey, httpOptions: { timeout: TIMEOUT_MS, retryOptions: { attempts: 1 } } });
  let response;
  try {
    response = await client.models.generateContent({
      model: model.id,
      contents: prompt,
      config: { responseModalities: ['IMAGE'], maxOutputTokens, imageConfig: { aspectRatio: '4:5', imageSize: '2K' } },
    });
  } catch (err) {
    throw failure(err);
  }
  const u = response.usageMetadata || {};
  const imageTokens = (u.candidatesTokensDetails || []).filter((t) => t.modality === 'IMAGE').reduce((s, t) => s + t.tokenCount, 0);
  const usage = { inputTokens: u.promptTokenCount, outputTokens: (u.candidatesTokenCount || 0) + (u.thoughtsTokenCount || 0), imageTokens };
  const part = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.mimeType?.startsWith('image/'));
  if (!part) throw new ProviderError('Model nie zwrócił obrazu. Wymagana ocena odpowiedzi, bez automatycznego ponowienia.', { usage });
  return { buffer: Buffer.from(part.inlineData.data, 'base64'), usage };
}

/** Cheap key check: listing models costs nothing on every provider. */
export async function testKey(providerId, apiKey) {
  if (providerId === 'google') {
    const client = new GoogleGenAI({ apiKey, httpOptions: { timeout: 15_000, retryOptions: { attempts: 1 } } });
    const pager = await client.models.list({ config: { pageSize: 1 } });
    return !!pager;
  }
  if (providerId === 'anthropic') {
    await new Anthropic({ apiKey, timeout: 15_000, maxRetries: 0 }).models.list({ limit: 1 });
    return true;
  }
  await new OpenAI({ apiKey, timeout: 15_000, maxRetries: 0 }).models.list();
  return true;
}
