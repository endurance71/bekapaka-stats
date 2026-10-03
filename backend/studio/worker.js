import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { ownerId } from './config.js';
import { renderJob } from './render.js';
import { generateAi } from './ai.js';
import { filePath, saveImage } from './storage.js';
import crypto from 'node:crypto';
export async function claimJob(db, lane, owner = ownerId()) {
  const kinds = lane === 'render' ? ['preview', 'export'] : ['ai-text', 'ai-image'];
  return db.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`studio-worker:${lane}`}))`;
    const active = await tx.studioJob.count({ where: { kind: { in: kinds }, status: 'running', leaseUntil: { gt: new Date() } } });
    if (active) return null;
    const rows = await tx.$queryRaw`SELECT * FROM "StudioJob" WHERE "ownerId" = ${owner} AND status = 'queued' AND kind = ANY(${kinds}::text[]) ORDER BY "createdAt" ASC LIMIT 1 FOR UPDATE SKIP LOCKED`;
    if (!rows[0]) return null;
    return tx.studioJob.update({ where: { id: rows[0].id }, data: { status: 'running', leaseToken: crypto.randomUUID(), leaseUntil: new Date(Date.now() + 180_000), attempts: { increment: 1 }, startedAt: new Date() } });
  });
}
export async function recoverJobs(db) {
  const expired = await db.studioJob.findMany({ where: { status: 'running', leaseUntil: { lt: new Date() } } });
  for (const j of expired) {
    const ai = j.kind.startsWith('ai-');
    await db.studioJob.updateMany({ where: { id: j.id, status: 'running', leaseUntil: { lt: new Date() } }, data: { status: ai ? 'uncertain' : j.attempts < 3 ? 'queued' : 'failed', error: ai ? 'Przerwana odpowiedź AI. Rezerwacja kosztu pozostaje; żądanie nie zostanie automatycznie ponowione.' : 'Przerwany render — odzyskiwanie zadania', leaseToken: null, leaseUntil: null } });
    if (ai) await db.studioAiUsage.updateMany({ where: { jobId: j.id }, data: { status: 'uncertain' } });
  }
}
export async function processJob(db, job, { generate = generateAi, render = renderJob } = {}) {
  const heartbeat = setInterval(() => { db.studioJob.updateMany({ where: { id: job.id, leaseToken: job.leaseToken, status: 'running' }, data: { leaseUntil: new Date(Date.now() + 180_000) } }).catch(() => {}); }, 30_000);
  try {
    let result;
    if (job.kind.startsWith('ai-')) {
      const response = await generate(job);
      if (job.kind === 'ai-image') {
        const image = await saveImage(response.buffer);
        const asset = await db.studioAsset.create({ data: { ownerId: job.ownerId, name: `Tło AI · ${new Date().toLocaleDateString('pl-PL')}`, kind: 'background', origin: 'Gemini API · ilustracja AI', consent: 'not_required', ...image, provenance: { ...response.provenance, chargedMicros: response.chargedMicros } } });
        result = { assetId: asset.id, requiresReview: true };
      } else result = response.result;
      await db.studioAiUsage.update({ where: { jobId: job.id }, data: { chargedMicros: response.chargedMicros, usage: response.usage, status: 'settled' } });
    } else result = await render(db, job);
    await db.studioJob.updateMany({ where: { id: job.id, leaseToken: job.leaseToken, status: 'running' }, data: { status: 'completed', result, finishedAt: new Date(), leaseToken: null, leaseUntil: null, error: null } });
  } catch (err) {
    const ai = job.kind.startsWith('ai-');
    await db.studioJob.updateMany({ where: { id: job.id, leaseToken: job.leaseToken, status: 'running' }, data: { status: ai ? 'uncertain' : 'failed', error: String(err.message).slice(0, 3000), finishedAt: new Date(), leaseToken: null, leaseUntil: null } });
    if (ai) await db.studioAiUsage.updateMany({ where: { jobId: job.id, status: 'reserved' }, data: { status: 'uncertain' } });
  } finally { clearInterval(heartbeat); }
}
export async function cleanup(db) {
  await db.studioSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  const jobs = await db.studioJob.findMany({ where: { status: { in: ['completed', 'failed', 'superseded'] }, createdAt: { lt: new Date(Date.now() - 86400_000) } }, take: 1000 });
  for (const j of jobs) {
    const expiry = j.result?.expiresAt ? new Date(j.result.expiresAt) : new Date(j.createdAt.getTime() + (j.kind === 'export' ? 30 : 1) * 86400_000);
    if (expiry < new Date()) {
      await fs.rm(filePath(`jobs/${j.id}`), { recursive: true, force: true });
      await db.studioJob.update({ where: { id: j.id }, data: { status: j.status === 'completed' ? 'expired' : 'cleaned' } });
    }
  }
}
async function main() {
  if (!ownerId()) throw new Error('STUDIO_OWNER_ID jest wymagane dla workera');
  const { prisma } = await import('../lib/prisma.js');
  let stopping = false; process.on('SIGTERM', () => { stopping = true; }); process.on('SIGINT', () => { stopping = true; });
  const lanes = { render: null, ai: null }; let nextCleanup = 0;
  while (!stopping) {
    try {
      await recoverJobs(prisma);
      await fs.mkdir(filePath('jobs'), { recursive: true });
      await fs.writeFile(filePath('.worker-health'), new Date().toISOString(), { mode: 0o600 });
      for (const lane of Object.keys(lanes)) if (!lanes[lane]) {
        const job = await claimJob(prisma, lane);
        if (job) lanes[lane] = processJob(prisma, job).catch(err => console.error('Studio worker', err.name)).finally(() => { lanes[lane] = null; });
      }
      if (Date.now() > nextCleanup) { await cleanup(prisma); nextCleanup = Date.now() + 3600_000; }
    } catch (err) { console.error('Studio worker unavailable', err.name); }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  await Promise.all(Object.values(lanes).filter(Boolean)); await prisma.$disconnect();
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main().catch(err => { console.error(err.message); process.exitCode = 1; });
