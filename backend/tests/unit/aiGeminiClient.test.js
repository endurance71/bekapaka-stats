import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/** @type {any[]} */
let calls = [];
/** @type {(req: any) => Promise<any>} */
let behaviour = async () => ({ text: '{}', candidates: [{ finishReason: 'STOP' }] });

describe('geminiClient (mocked SDK — bez sieci)', () => {
  let client;

  beforeEach(async () => {
    calls = [];
    process.env.GEMINI_API_KEY = 'test-key';
    delete process.env.AI_ANALYSIS_ENABLED;
    vi.doMock('@google/genai', () => ({
      GoogleGenAI: class {
        constructor() {
          this.models = {
            generateContent: (req) => {
              calls.push(req);
              return behaviour(req);
            }
          };
        }
      }
    }));
    client = await import('../../ai/geminiClient.js');
    client.resetGeminiClientForTests();
  });

  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('@google/genai');
    delete process.env.GEMINI_TIMEOUT_MS;
    delete process.env.GEMINI_API_KEY;
  });

  it('applies GEMINI_TIMEOUT_MS: aborts the request and throws AiTimeoutError', async () => {
    process.env.GEMINI_TIMEOUT_MS = '40';
    behaviour = (req) =>
      new Promise((_, reject) => {
        req.config.abortSignal.addEventListener('abort', () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });

    const started = Date.now();
    await expect(client.generateText({ system: 's', user: 'u' })).rejects.toBeInstanceOf(client.AiTimeoutError);
    expect(Date.now() - started).toBeLessThan(2000);
    expect(calls[0].config.abortSignal.aborted).toBe(true);
    expect(calls[0].config.httpOptions).toEqual({ timeout: 40 });
  });

  it('times out even when the SDK ignores the abort signal', async () => {
    process.env.GEMINI_TIMEOUT_MS = '30';
    behaviour = () => new Promise(() => {});
    await expect(client.generateText({ system: 's', user: 'u' })).rejects.toThrow(/limit czasu/);
  });

  it('passes responseJsonSchema and JSON mime type', async () => {
    behaviour = async () => ({ text: '{"ok":true}', candidates: [{ finishReason: 'STOP' }] });
    const schema = { type: 'object', properties: { ok: { type: 'boolean' } } };
    const text = await client.generateText({ system: 's', user: 'u', responseJsonSchema: schema });
    expect(text).toBe('{"ok":true}');
    expect(calls[0].config.responseJsonSchema).toEqual(schema);
    expect(calls[0].config.responseMimeType).toBe('application/json');
  });

  it('template model name differs from the Gemini model name', () => {
    expect(client.TEMPLATE_MODEL_NAME).toBe('template');
    expect(client.getGeminiModelName()).not.toBe(client.TEMPLATE_MODEL_NAME);
  });
});
