// AI providers and models available in Studio, with standard paid-tier prices (USD per 1M tokens).
// Sources verified 2026-10-08: ai.google.dev/gemini-api/docs/pricing (updated 2026-10-07),
// developers.openai.com/api/docs/pricing, Anthropic models table (cached 2026-10-06).
// A model with no known price cannot be used: the monthly budget reserves the worst case before every call.
export const CATALOG_VERSION = 'models-2026-10-08';

export const providers = {
  google: { label: 'Google Gemini', keyHint: 'Klucz z Google AI Studio (aistudio.google.com)', envKey: 'STUDIO_GEMINI_API_KEY' },
  anthropic: { label: 'Anthropic Claude', keyHint: 'Klucz z platform.claude.com (sk-ant-…)', envKey: 'STUDIO_ANTHROPIC_API_KEY' },
  openai: { label: 'OpenAI', keyHint: 'Klucz z platform.openai.com (sk-…)', envKey: 'STUDIO_OPENAI_API_KEY' },
};
export const providerIds = Object.keys(providers);

// kind: text (JSON copy) or image (backgrounds). `thinking: 'off'` = Gemini thinkingBudget 0 (cheaper, faster).
export const models = [
  { id: 'gemini-3.5-flash', provider: 'google', kind: 'text', label: 'Gemini 3.5 Flash', input: 1.5, output: 9, thinking: 'off' },
  { id: 'gemini-3.8-flash', provider: 'google', kind: 'text', label: 'Gemini 3.8 Flash', input: 0.75, output: 3.75, thinking: 'off' },
  { id: 'gemini-3.5-flash-lite', provider: 'google', kind: 'text', label: 'Gemini 3.5 Flash-Lite', input: 0.3, output: 2.5, thinking: 'off' },
  { id: 'gemini-3.1-pro-preview', provider: 'google', kind: 'text', label: 'Gemini 3.1 Pro (preview)', input: 2, output: 12 },
  { id: 'claude-opus-5-5', provider: 'anthropic', kind: 'text', label: 'Claude Opus 5.5', input: 4, output: 20 },
  { id: 'claude-sonnet-5-5', provider: 'anthropic', kind: 'text', label: 'Claude Sonnet 5.5', input: 2, output: 10 },
  { id: 'claude-haiku-5-5', provider: 'anthropic', kind: 'text', label: 'Claude Haiku 5.5', input: 0.1, output: 0.5 },
  { id: 'gpt-6.1-sol', provider: 'openai', kind: 'text', label: 'GPT-6.1 Sol', input: 2, output: 10 },
  { id: 'gpt-6-astra', provider: 'openai', kind: 'text', label: 'GPT-6 Astra', input: 10, output: 50 },
  { id: 'gpt-5.6-terra', provider: 'openai', kind: 'text', label: 'GPT-5.6 Terra', input: 2, output: 12 },
  { id: 'gpt-6-luna', provider: 'openai', kind: 'text', label: 'GPT-6 Luna', input: 0.1, output: 0.5 },
  // Image models: `imageOutput` per 1M image tokens; `perImage2K` is the provider's 2K equivalent used as the floor.
  { id: 'gemini-3.1-flash-image', provider: 'google', kind: 'image', label: 'Gemini 3.1 Flash Image', input: 0.5, output: 3, imageOutput: 60, perImage2K: 0.101 },
  { id: 'gemini-nano-banana-2.1', provider: 'google', kind: 'image', label: 'Nano Banana 2.1', input: 1.5, output: 7.5, imageOutput: 30, perImage2K: 0.0504 },
  { id: 'gemini-3-pro-image', provider: 'google', kind: 'image', label: 'Gemini 3 Pro Image', input: 2, output: 12, imageOutput: 120, perImage2K: 0.134 },
];

// Studio tasks that call a model. Limits drive the worst-case reservation of each call.
export const tasks = {
  copy: { label: 'Teksty publikacji (IG, FB, WWW)', kind: 'text', maxInputBytes: 24000, maxOutputTokens: 10000, default: 'gemini-3.5-flash' },
  // Written match report for bekapaka.pl (report-prompt.js); the model thinks before writing.
  report: { label: 'Relacja meczowa na stronę', kind: 'text', maxInputBytes: 16000, maxOutputTokens: 12000, default: 'gemini-3.5-flash', thinking: true },
  text: { label: 'Opis i tekst alternatywny grafiki', kind: 'text', maxInputBytes: 16000, maxOutputTokens: 2000, default: 'gemini-3.5-flash' },
  image: { label: 'Tła AI (2K, bez ludzi)', kind: 'image', maxInputBytes: 4000, maxOutputTokens: 4096, default: 'gemini-3.1-flash-image' },
};
export const taskIds = Object.keys(tasks);

// Tokens × USD per 1M tokens = microdollars, so costs are computed in whole micros without float drift.
const perImageMicros = (model) => Math.round((model.perImage2K || 0) * 1_000_000);

/**
 * Worst-case cost of one call in microdollars. Tokens are bounded by bytes/2 on input (pessimistic for Polish)
 * and by the task's output cap; image models add 1.5× the provider's 2K image price.
 */
export function reservationMicros(model, taskId) {
  const task = tasks[taskId];
  const text = (task.maxInputBytes / 2) * model.input + task.maxOutputTokens * model.output;
  return Math.ceil(model.kind === 'image' ? text + perImageMicros(model) * 1.5 : text);
}

/** Actual cost from provider usage; unknown usage keeps the full reservation. */
export function costMicros(model, usage, reserved) {
  if (!usage || !Number.isFinite(usage.inputTokens) || !Number.isFinite(usage.outputTokens)) return reserved;
  const imageTokens = usage.imageTokens || 0;
  // An image call without an image-token breakdown is charged at the provider's 2K per-image price.
  const image = model.kind === 'image' && !imageTokens ? perImageMicros(model) : imageTokens * (model.imageOutput || 0);
  const cost = usage.inputTokens * model.input + Math.max(0, usage.outputTokens - imageTokens) * model.output + image;
  return Math.min(reserved, Math.max(0, Math.ceil(cost)));
}

/** Built-in models plus the owner's custom text models (prices entered by the owner). */
export function allModels(customModels = []) {
  return [...models, ...customModels.map((m) => ({ ...m, kind: 'text', custom: true }))];
}
export const findModel = (id, customModels = []) => allModels(customModels).find((m) => m.id === id) || null;
