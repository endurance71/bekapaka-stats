// Error semantics shared by every text engine (API providers and the Claude Agent SDK).
// No automatic retries anywhere: an uncertain paid call is never repeated silently.

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
  constructor(message, { uncertain = false, usage, rejected = false, code } = {}) {
    super(message);
    this.uncertain = uncertain;
    this.usage = usage;
    // The provider refused the request before generating (limits, key, bad request): nothing is billed.
    this.rejected = rejected;
    // Machine-readable reason for status pages and the generation log (auth_required, limit_reached, …).
    this.code = code;
  }
}
const REJECTED = new Set([400, 401, 403, 404, 429]);
export function failure(err) {
  const status = Number(err?.status ?? err?.code);
  const text = String(err?.message || err).slice(0, 200);
  if (REJECTED.has(status) || /\b(429|Too Many Requests|quota|RESOURCE_EXHAUSTED|PERMISSION_DENIED|API key not valid)\b/i.test(text))
    return status === 429 || /429|Too Many|quota|RESOURCE_EXHAUSTED/i.test(text)
      ? new ProviderError('Dostawca odrzucił zapytanie: limit zapytań lub brak dostępu do tego modelu na Twoim kluczu.', { rejected: true, code: 'rate_limited' })
      : new ProviderError(`Dostawca odrzucił zapytanie: ${text}`, { rejected: true, code: status === 401 || status === 403 ? 'auth_required' : 'rejected' });
  // Network errors and timeouts may still be billed: keep the reservation, never retry automatically.
  return new ProviderError(`Dostawca AI nie odpowiedział poprawnie: ${text}`, { uncertain: true, code: 'connection_error' });
}
