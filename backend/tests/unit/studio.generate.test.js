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

describe('copy job with the AI reporter', () => {
  it('runs social copy and the report as two calls and charges both', async () => {
    const { factsSchema } = await import('../../studio/publications/channels.js');
    const { buildReportPrompt } = await import('../../studio/publications/report-prompt.js');
    const facts = factsSchema.parse({ kind: 'match', round: '3', opponent: 'Pantery', scoreUs: 70, scoreThem: 60, venue: 'KOSiR Koszalin', report: { quarters: [{ label: '1. kwarta', us: 40, them: 30 }, { label: '2. kwarta', us: 30, them: 30 }] } });
    process.env.STUDIO_ANTHROPIC_API_KEY = 'sk-ant-env-test';
    process.env.STUDIO_GEMINI_API_KEY = 'gemini-env-test';
    calls.length = 0;
    let n = 0;
    reply = async () =>
      ++n === 1
        ? { json: { instagram_story: story }, usage: { inputTokens: 1000, outputTokens: 100 } }
        : { json: { title: 'Wygrana BeKaPaKa z zespołem Pantery 70:60', excerpt: 'BeKaPaKa Bobolice wygrała z zespołem Pantery 70:60 w meczu 3. kolejki KALK.', lead: 'Wygraliśmy 70:60.', story: ['Pierwsza połowa.', 'Druga połowa.'], heroes: ['Bohater.'], coverAlt: '' }, usage: { inputTokens: 2000, outputTokens: 3000 } };
    const gemini = { ...findModel('gemini-3.5-flash') };
    const job = { kind: 'ai-copy', ownerId: 'owner', payload: { model: claude, reportModel: gemini, prompt, reportPrompt: buildReportPrompt(facts), facts, channels: ['instagram_story', 'website'], publicationId: 'p', factsHash: 'f' } };
    const out = await generateAi(job, db);
    expect(calls).toHaveLength(2);
    expect(calls[1]).toMatchObject({ apiKey: 'gemini-env-test', model: { id: 'gemini-3.5-flash' }, think: true, maxOutputTokens: 12000 });
    expect(out.result.copy.instagram_story).toEqual(story);
    expect(out.result.copy.website.content).toContain('## Przebieg meczu\n\nPierwsza połowa.');
    expect(out.result.model).toBe('claude-sonnet-5-5 + gemini-3.5-flash');
    expect(out.chargedMicros).toBe(1000 * 2 + 100 * 10 + (2000 * 1.5 + 3000 * 9));
  });
});
