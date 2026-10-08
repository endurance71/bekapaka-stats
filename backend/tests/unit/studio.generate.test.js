import { describe, it, expect, vi, beforeEach } from 'vitest';

const calls = [];
let reply;
vi.mock('../../studio/providers/clients.js', async (original) => {
  const real = await original();
  return {
    ...real,
    generateJson: vi.fn(async (params) => {
      calls.push(params);
      return reply();
    }),
  };
});
const { generateAi } = await import('../../studio/ai.js');
const { ProviderError } = await import('../../studio/providers/clients.js');
const { findModel, reservationMicros } = await import('../../studio/providers/catalog.js');

// Only the server-environment key is available: no key stored in Studio.
const db = { studioSecret: { findUnique: async () => null } };
const claude = { ...findModel('claude-sonnet-5-5') };
const prompt = { system: 'system', user: 'user', schema: { type: 'object' }, version: 'copy-test' };
const copyJob = { kind: 'ai-copy', ownerId: 'owner', payload: { model: claude, prompt, channels: ['instagram_story'], publicationId: 'p', factsHash: 'f', cacheKey: 'k' } };
const story = { stickerText: 'Gramy w sobotę', sticker: 'countdown', link: '', altText: 'Zapowiedź meczu' };

describe('generateAi with any provider', () => {
  beforeEach(() => {
    calls.length = 0;
    process.env.STUDIO_ANTHROPIC_API_KEY = 'sk-ant-env-test';
  });

  it('sends the prompt to the job model with the env key and charges actual usage', async () => {
    reply = async () => ({ json: { instagram_story: story }, usage: { inputTokens: 2000, outputTokens: 300 } });
    const out = await generateAi(copyJob, db);
    expect(calls[0]).toMatchObject({ apiKey: 'sk-ant-env-test', model: { id: 'claude-sonnet-5-5', provider: 'anthropic' }, system: 'system', user: 'user', maxOutputTokens: 10000 });
    expect(out.result).toMatchObject({ copy: { instagram_story: story }, model: 'claude-sonnet-5-5', provider: 'anthropic', promptVersion: 'copy-test' });
    expect(out.chargedMicros).toBe(2000 * 2 + 300 * 10);
  });

  it('settles the known cost when the answer breaks the channel contract', async () => {
    reply = async () => ({ json: { instagram_story: { ...story, sticker: 'gif' } }, usage: { inputTokens: 100, outputTokens: 10 } });
    await expect(generateAi(copyJob, db)).rejects.toMatchObject({ chargedMicros: 100 * 2 + 10 * 10 });
  });

  it('charges a truncated answer by its usage and a lost connection by the full reservation', async () => {
    reply = async () => {
      throw new ProviderError('ucięta', { usage: { inputTokens: 100, outputTokens: 10000 } });
    };
    await expect(generateAi(copyJob, db)).rejects.toMatchObject({ chargedMicros: 100 * 2 + 10000 * 10 });
    reply = async () => {
      throw new ProviderError('timeout', { uncertain: true });
    };
    const err = await generateAi(copyJob, db).catch((e) => e);
    expect(err.uncertain).toBe(true);
    expect(err.chargedMicros).toBeUndefined();
    expect(reservationMicros(claude, 'copy')).toBeGreaterThan(100 * 2 + 10000 * 10);
  });

  it('releases the reservation when the provider refuses the request (limits, access)', async () => {
    reply = async () => {
      throw new ProviderError('Dostawca odrzucił zapytanie', { rejected: true });
    };
    await expect(generateAi(copyJob, db)).rejects.toMatchObject({ notCalled: true });
  });

  it('does not call anything without a key', async () => {
    delete process.env.STUDIO_ANTHROPIC_API_KEY;
    await expect(generateAi(copyJob, db)).rejects.toMatchObject({ notCalled: true });
    expect(calls).toHaveLength(0);
  });
});
