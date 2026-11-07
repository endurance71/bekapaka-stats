// Graphics for external agents: render a preview to show the owner in chat and, after the owner's explicit OK
// (opt-in token scope `graphics`), approve the shown revision and export the final PNG files.
// Files go out through short-lived signed links, so an agent can download them for Business Suite.
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { z } from 'zod';
import { fail, origin, ownerId } from '../config.js';
import { filePath } from '../storage.js';
import { context, projectView, queueJob, validation } from '../service.js';
import { publicationView } from '../publications/service.js';

export const LINK_TTL_MS = 3600_000;
const TERMINAL = ['completed', 'failed', 'superseded', 'uncertain'];
const THUMB_WIDTH = 720;

/** Graphics of one channel in set order (cover first), each with the format that channel publishes. */
export async function channelGraphics(db, owner, publicationId, channel) {
  const p = await publicationView(db, owner, publicationId);
  if (p.status === 'archived') fail(409, 'Publikacja jest zarchiwizowana');
  const item = p.items.find((i) => i.channel === channel);
  if (!item) fail(404, 'Publikacja nie ma tego kanału');
  const graphics = [item.graphic, ...(item.extraGraphics || [])];
  if (!item.graphic) fail(422, 'Ten kanał nie ma grafiki');
  if (graphics.some((g) => !g)) fail(409, 'Grafika zestawu nie jest już dostępna. Uzupełnij zestaw w Studio.');
  return { publication: p, item, graphics: graphics.map((g) => ({ ...g, format: g.formats.includes(item.format) ? item.format : g.formats[0] })) };
}

/** Polls the queue until every job ends or the wait runs out (the render worker works one job at a time). */
export async function waitForJobs(db, ids, { timeoutMs = 90_000, intervalMs = 1000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const jobs = await db.studioJob.findMany({ where: { id: { in: ids } } });
    if (jobs.every((j) => TERMINAL.includes(j.status)) || Date.now() >= deadline) return new Map(jobs.map((j) => [j.id, j]));
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

const signature = (secret, jobId, key, exp) => crypto.createHmac('sha256', secret).update(`${jobId}/${key}/${exp}`).digest('base64url');

/** Signed link valid for an hour; the secret is the token's stored hash, so revoking the token kills its links. */
export function signedLink(agent, jobId, key, now = Date.now()) {
  const exp = now + LINK_TTL_MS;
  const query = new URLSearchParams({ t: agent.id.slice(0, 16), exp: String(exp), sig: signature(agent.id, jobId, key, exp) });
  return `${origin()}/api/studio/v1/agent-files/${jobId}/${encodeURIComponent(key)}?${query}`;
}

/** Resolves a signed link to the file it names, or null. */
export async function resolveSignedLink(db, { jobId, key, t, exp, sig }, now = Date.now()) {
  const parsed = z
    .object({ jobId: z.string().uuid(), key: z.string().min(1).max(80), t: z.string().regex(/^[a-f0-9]{16}$/), exp: z.coerce.number().int(), sig: z.string().min(20).max(100) })
    .safeParse({ jobId, key, t, exp, sig });
  if (!parsed.success) return null;
  const q = parsed.data;
  if (q.exp < now || q.exp > now + LINK_TTL_MS + 60_000) return null;
  const agent = await db.studioAgentToken.findFirst({ where: { id: { startsWith: q.t }, ownerId: ownerId(), revokedAt: null } });
  if (!agent) return null;
  const expected = Buffer.from(signature(agent.id, q.jobId, q.key, q.exp));
  const given = Buffer.from(q.sig);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  const job = await db.studioJob.findFirst({ where: { id: q.jobId, ownerId: ownerId(), status: 'completed', kind: { in: ['preview', 'export'] } } });
  const file = job?.result?.files?.find((f) => f.key === q.key && f.mime === 'image/png');
  if (!file || new Date(job.result.expiresAt || 0) <= new Date(now)) return null;
  return { path: filePath(file.storageKey), name: file.name, kind: job.kind };
}

// Small JPEG for the agent to look at; the full PNG stays behind the signed link.
async function thumbnail(file) {
  const data = await sharp(await fs.readFile(filePath(file.storageKey))).resize({ width: THUMB_WIDTH, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
  return { type: 'image', mimeType: 'image/jpeg', data: data.toString('base64') };
}

const filesFor = (job, format) => (job?.result?.files || []).filter((f) => f.mime === 'image/png' && (f.key === format || f.key.startsWith(`${format}-`)));
const messages = (errors) => errors.map((e) => e.message);

/** Queues one preview per graphic of the channel and returns them as images plus signed full-size links. */
export async function renderChannelPreviews(db, owner, agent, { publicationId, channel }, wait = {}) {
  const { publication, graphics } = await channelGraphics(db, owner, publicationId, channel);
  const queued = [];
  for (const g of graphics) {
    const view = await projectView(db, owner, g.projectId);
    if (view.status === 'archived') fail(409, `Grafika „${view.name}” jest zarchiwizowana`);
    queued.push({ g, view, job: await queueJob(db, owner, view, 'preview', { format: g.format }) });
  }
  const done = await waitForJobs(db, queued.map((q) => q.job.id), wait);
  const out = [];
  const images = [];
  for (const [index, { g, view, job }] of queued.entries()) {
    const j = done.get(job.id) || job;
    const report = await validation(db, owner, view);
    // `approval` is what approve_graphics records after the owner's OK; everything else needs fixing in Studio first.
    const blockers = report.errors.filter((e) => e.field !== 'approval');
    const files = j.status === 'completed' ? filesFor(j, g.format) : [];
    out.push({
      index: index + 1,
      name: g.name,
      projectId: g.projectId,
      revision: view.currentRevision,
      format: g.format,
      previewJobId: j.id,
      status: j.status,
      error: j.status === 'failed' ? j.error : undefined,
      previewLinks: files.map((f) => signedLink(agent, j.id, f.key)),
      blockersBeforeExport: messages(blockers),
    });
    for (const f of files) images.push(await thumbnail(f));
  }
  const pending = out.some((o) => !TERMINAL.includes(o.status));
  return {
    summary: {
      publicationId: publication.id,
      title: publication.title,
      channel,
      factsConfirmed: publication.factsConfirmed,
      graphics: out,
      note: pending
        ? 'Część podglądów jeszcze się renderuje — wywołaj render_graphics ponownie za chwilę.'
        : 'Podgląd ma napis PODGLĄD ROBOCZY. Pokaż grafiki i tekst kanału właścicielowi; po jego wyraźnej akceptacji wywołaj approve_graphics (eksport bez napisu).',
    },
    images,
  };
}

/**
 * Records the owner's approval (given to the agent in chat) for the revisions shown in the latest previews,
 * then exports them and returns signed links to the final PNG files of the channel's format.
 */
export async function approveChannelGraphics(db, owner, agent, { publicationId, channel, ownerApproval }, wait = {}) {
  const { item, graphics } = await channelGraphics(db, owner, publicationId, channel);
  const approved = [];
  for (const g of graphics) {
    await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "StudioProject" WHERE id = ${g.projectId} FOR UPDATE`;
      const view = await projectView(tx, owner, g.projectId);
      const ctx = await context(tx, owner, view);
      // The owner saw a preview of exactly this revision and these materials (render_graphics); anything newer needs a new look.
      const preview = await tx.studioJob.findFirst({ where: { ownerId: owner, projectId: view.id, kind: 'preview', status: 'completed', revision: view.currentRevision }, orderBy: { createdAt: 'desc' } });
      if (!preview || preview.result?.resourceHash !== ctx.resourceHash)
        fail(422, `Grafika „${view.name}” zmieniła się od podglądu albo nie ma podglądu. Wywołaj render_graphics i pokaż ją właścicielowi ponownie.`);
      await tx.studioApproval.upsert({
        where: { revisionId_ownerId: { revisionId: view.revision.id, ownerId: owner } },
        create: { revisionId: view.revision.id, ownerId: owner, contentHash: view.revision.contentHash, resourceHash: ctx.resourceHash },
        update: { resourceHash: ctx.resourceHash },
      });
      approved.push({ projectId: view.id, revision: view.currentRevision, previewJobId: preview.id });
    });
  }
  await db.studioPublishEvent.create({ data: { itemId: item.id, action: 'graphics-approved', actor: `agent:${agent.name}`.slice(0, 120), payload: { ownerApproval, graphics: approved } } });

  const queued = [];
  const blocked = [];
  for (const g of graphics) {
    const view = await projectView(db, owner, g.projectId);
    const report = await validation(db, owner, view);
    if (!report.valid) {
      blocked.push({ name: view.name, errors: messages(report.errors) });
      continue;
    }
    const ctx = await context(db, owner, view);
    const key = `agent:${view.id}:${view.revision.contentHash.slice(0, 16)}:${ctx.resourceHash.slice(0, 16)}`;
    queued.push({ g, view, job: await queueJob(db, owner, view, 'export', {}, key) });
  }
  if (blocked.length)
    return {
      summary: { publicationId, channel, approved: approved.length, exported: false, blocked, note: 'Zatwierdzenie zapisane, ale eksport wymaga poprawek w Studio (np. zatwierdzenia szablonu albo materiałów). Przekaż je właścicielowi.' },
      images: [],
    };
  const done = await waitForJobs(db, queued.map((q) => q.job.id), wait);
  const out = [];
  const images = [];
  for (const [index, { g, view, job }] of queued.entries()) {
    const j = done.get(job.id) || job;
    const files = j.status === 'completed' ? filesFor(j, g.format) : [];
    out.push({
      index: index + 1,
      name: view.name,
      format: g.format,
      exportJobId: j.id,
      status: j.status,
      error: j.status === 'failed' ? j.error : undefined,
      files: files.map((f) => ({ name: f.name, width: f.width, height: f.height, sha256: f.sha256, url: signedLink(agent, j.id, f.key) })),
    });
    for (const f of files) images.push(await thumbnail(f));
  }
  const pending = out.some((o) => o.status !== 'completed');
  return {
    summary: {
      publicationId,
      channel,
      approved: approved.length,
      exported: !pending,
      graphics: out,
      note: pending
        ? 'Eksport jeszcze trwa albo się nie udał — wywołaj approve_graphics ponownie z tą samą akceptacją (nie tworzy duplikatów).'
        : `Pliki PNG w pełnej jakości: pobierz z url (ważne ${LINK_TTL_MS / 60_000} min) i opublikuj w tej kolejności.`,
    },
    images,
  };
}
