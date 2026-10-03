import { describe, it, expect, vi } from 'vitest';
import { processJob } from '../../studio/worker.js';
function db() { return { studioJob: { updateMany: vi.fn(async () => ({ count: 1 })) }, studioAiUsage: { update: vi.fn(async () => ({})), updateMany: vi.fn(async () => ({ count: 1 })) } }; }
const job = { id: 'one', ownerId: 'owner', kind: 'ai-text', leaseToken: 'lease', payload: {} };
describe('Studio worker failure accounting', () => {
 it.each(['timeout', '429 provider limit', 'AI refusal', 'invalid JSON'])('does not retry %s and retains reserved cost', async message => {
  const store = db(); const generate = vi.fn(async () => { throw new Error(message); });
  await processJob(store, job, { generate }); expect(generate).toHaveBeenCalledTimes(1); expect(store.studioJob.updateMany.mock.calls.at(-1)[0].data.status).toBe('uncertain'); expect(store.studioAiUsage.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'uncertain' } }));
 });
 it('settles confirmed response usage exactly once', async () => { const store = db(); await processJob(store, job, { generate: async () => ({ result: { caption: 'Gramy razem.' }, chargedMicros: 1250, usage: { promptTokenCount: 200 } }) }); expect(store.studioAiUsage.update).toHaveBeenCalledWith(expect.objectContaining({ data: { chargedMicros: 1250, usage: { promptTokenCount: 200 }, status: 'settled' } })); expect(store.studioJob.updateMany.mock.calls.at(-1)[0].data.status).toBe('completed'); });
 it('records renderer failures as actionable errors', async () => { const store = db(); await processJob(store, { ...job, kind: 'export' }, { render: async () => { throw new Error('title: Nagłówek za długi'); } }); expect(store.studioJob.updateMany.mock.calls.at(-1)[0].data).toMatchObject({ status: 'failed', error: 'title: Nagłówek za długi' }); expect(store.studioAiUsage.update).not.toHaveBeenCalled(); });
});
