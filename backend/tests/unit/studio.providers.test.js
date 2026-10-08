import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'node:crypto';
import { costMicros, findModel, models, reservationMicros, tasks } from '../../studio/providers/catalog.js';
import { portableSchema } from '../../studio/providers/clients.js';
import { decrypt, encrypt } from '../../studio/providers/secrets.js';
import { modelFor } from '../../studio/providers/settings.js';
import { responseSchema } from '../../studio/publications/prompts.js';
import { processJob } from '../../studio/worker.js';

describe('model catalog', () => {
  it('prices every model and keeps each call far below the monthly cap', () => {
    for (const m of models) {
      expect(m.input).toBeGreaterThan(0);
      expect(m.output).toBeGreaterThan(0);
      if (m.kind === 'image') expect(m.perImage2K).toBeGreaterThan(0);
      for (const [id, task] of Object.entries(tasks)) if (task.kind === m.kind) expect(reservationMicros(m, id)).toBeLessThan(1_000_000);
    }
    expect(new Set(models.map((m) => m.id)).size).toBe(models.length);
    for (const task of Object.values(tasks)) expect(findModel(task.default).kind).toBe(task.kind);
  });
  it('never charges more than the reservation, and the full reservation for unknown usage', () => {
    const flash = findModel('gemini-3.5-flash');
    const reserved = reservationMicros(flash, 'copy');
    // Worst case: input bytes/2 tokens and full output — exactly the reservation.
    expect(costMicros(flash, { inputTokens: tasks.copy.maxInputBytes / 2, outputTokens: tasks.copy.maxOutputTokens }, reserved)).toBe(reserved);
    expect(costMicros(flash, { inputTokens: 1000, outputTokens: 200 }, reserved)).toBe(3300);
    expect(costMicros(flash, { inputTokens: 10_000_000, outputTokens: 0 }, reserved)).toBe(reserved);
    expect(costMicros(flash, {}, reserved)).toBe(reserved);
    const image = findModel('gemini-3.1-flash-image');
    const imageReserved = reservationMicros(image, 'image');
    expect(costMicros(image, { inputTokens: 100, outputTokens: 1120, imageTokens: 1120 }, imageReserved)).toBe(50 + 1120 * 60);
    // Without an image-token breakdown the provider's per-image price applies.
    expect(costMicros(image, { inputTokens: 100, outputTokens: 0 }, imageReserved)).toBe(50 + 101_000);
  });
  it('resolves the owner choice, then the server default, and refuses a model of the wrong kind', () => {
    expect(modelFor({ tasks: {}, customModels: [] }, 'copy').id).toBe('gemini-3.5-flash');
    expect(modelFor({ tasks: { copy: 'claude-haiku-5-5' }, customModels: [] }, 'copy').id).toBe('claude-haiku-5-5');
    // An image model chosen for a text task falls back to the default.
    expect(modelFor({ tasks: { copy: 'gemini-3-pro-image' }, customModels: [] }, 'copy').id).toBe('gemini-3.5-flash');
    const custom = { id: 'gpt-local-test', provider: 'openai', label: 'Test', input: 1, output: 2 };
    expect(modelFor({ tasks: { text: custom.id }, customModels: [custom] }, 'text')).toMatchObject({ id: custom.id, kind: 'text', custom: true });
  });
});

describe('portable JSON schema', () => {
  it('drops length limits only on schema nodes and closes every object', () => {
    const schema = portableSchema({
      type: 'object',
      properties: { maxLength: { type: 'string', maxLength: 5 }, list: { type: 'array', maxItems: 2, items: { type: 'object', properties: { a: { type: 'string', minLength: 1 } } } } },
      required: ['maxLength', 'list'],
    });
    expect(schema.properties.maxLength).toEqual({ type: 'string' });
    expect(schema.properties.list).toEqual({ type: 'array', items: { type: 'object', properties: { a: { type: 'string' } }, additionalProperties: false } });
    expect(schema.additionalProperties).toBe(false);
    const copy = JSON.stringify(portableSchema(responseSchema(['instagram_feed', 'instagram_story', 'facebook', 'website'])));
    expect(copy).not.toMatch(/maxLength|maxItems|minLength|minItems/);
  });
});

describe('stored API keys', () => {
  const saved = process.env.STUDIO_SECRETS_KEY;
  beforeEach(() => {
    process.env.STUDIO_SECRETS_KEY = crypto.randomBytes(32).toString('base64');
  });
  afterEach(() => {
    process.env.STUDIO_SECRETS_KEY = saved;
  });
  it('round-trips with AES-GCM and refuses a rotated encryption key', () => {
    const sealed = encrypt('sk-test-0123456789abcdef');
    expect(sealed.ciphertext).not.toContain('sk-test');
    expect(decrypt(sealed)).toBe('sk-test-0123456789abcdef');
    process.env.STUDIO_SECRETS_KEY = crypto.randomBytes(32).toString('base64');
    expect(() => decrypt(sealed)).toThrow(/ponownie/);
  });
  it('refuses to store keys without a server encryption key', () => {
    process.env.STUDIO_SECRETS_KEY = '';
    expect(() => encrypt('sk-test-0123456789abcdef')).toThrow(/STUDIO_SECRETS_KEY/);
  });
});

describe('worker accounting of failed AI calls', () => {
  const db = () => ({ studioJob: { updateMany: vi.fn(async () => ({ count: 1 })) }, studioAiUsage: { update: vi.fn(async () => ({})), updateMany: vi.fn(async () => ({ count: 1 })) } });
  const job = { id: 'one', ownerId: 'owner', kind: 'ai-copy', leaseToken: 'lease', payload: {} };
  it('releases the reservation when nothing was sent to the provider', async () => {
    const store = db();
    await processJob(store, job, { generate: async () => { throw Object.assign(new Error('Brak klucza API'), { notCalled: true }); } });
    expect(store.studioJob.updateMany.mock.calls.at(-1)[0].data.status).toBe('failed');
    expect(store.studioAiUsage.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { chargedMicros: 0, status: 'released' } }));
  });
  it('settles the known cost of an unusable answer without retrying', async () => {
    const store = db();
    const generate = vi.fn(async () => { throw Object.assign(new Error('AI zwróciło niepoprawny tekst'), { usage: { inputTokens: 10, outputTokens: 5 }, chargedMicros: 60 }); });
    await processJob(store, job, { generate });
    expect(generate).toHaveBeenCalledTimes(1);
    expect(store.studioJob.updateMany.mock.calls.at(-1)[0].data.status).toBe('failed');
    expect(store.studioAiUsage.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { chargedMicros: 60, usage: { inputTokens: 10, outputTokens: 5 }, status: 'settled' } }));
  });
});

describe('provider refusals', () => {
  it('treats rate limits and access errors as not billed, network errors as uncertain', async () => {
    const { failure } = await import('../../studio/providers/clients.js');
    expect(failure({ message: 'Retryable HTTP Error: Too Many Requests' })).toMatchObject({ rejected: true, uncertain: false });
    expect(failure({ status: 403, message: 'forbidden' })).toMatchObject({ rejected: true });
    expect(failure({ message: 'socket hang up' })).toMatchObject({ rejected: false, uncertain: true });
  });
});
