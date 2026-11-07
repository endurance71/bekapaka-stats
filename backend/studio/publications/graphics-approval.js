// One-step approval of the graphics of a channel. The owner looked at the graphics (on the publication page
// in Studio, or in an agent's chat) and accepts them. For each graphic this approves the composition of the
// accepted formats (the template gate, once per design and format), records the approval of the revision and
// exports it. Before that the editor asked for a preview per format, a click per format, a separate data
// confirmation and an export, spread over another screen.
import { fail } from '../config.js';
import { BRAND_VERSION } from '../contracts.js';
import { designKey, DESIGN_VERSION } from '../post-types.js';
import { context, projectView, queueJob, updateProject, validation } from '../service.js';

const TERMINAL = ['completed', 'failed', 'superseded', 'uncertain'];

/** Polls the queue until every job ends or the wait runs out (the render worker works one job at a time). */
export async function waitForJobs(db, ids, { timeoutMs = 90_000, intervalMs = 1000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const jobs = await db.studioJob.findMany({ where: { id: { in: ids } } });
    if (jobs.every((j) => TERMINAL.includes(j.status)) || Date.now() >= deadline) return new Map(jobs.map((j) => [j.id, j]));
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

const usesProject = (item, projectId) => item.projectId === projectId || (Array.isArray(item.extraProjectIds) && item.extraProjectIds.includes(projectId));

/**
 * Drops formats that no channel in play publishes (a 16:9 of a post without a website variant): the export
 * renders every selected format, so an unused one would still need its own approval. Only formats are removed,
 * the look stays the same. Left alone when an approved variant uses the graphic, because a new revision would
 * make that approval stale.
 */
export async function dropUnusedFormats(db, owner, view) {
  if (view.status !== 'draft') return view;
  const items = (
    await db.studioPublicationItem.findMany({
      where: { publication: { ownerId: owner, status: 'draft' }, status: { in: ['draft', 'approved'] } },
      select: { projectId: true, extraProjectIds: true, format: true, status: true },
    })
  ).filter((i) => usesProject(i, view.id));
  if (!items.length || items.some((i) => i.status === 'approved')) return view;
  const used = new Set(items.map((i) => i.format));
  const formats = view.payload.formats.filter((f) => used.has(f));
  if (!formats.length || formats.length === view.payload.formats.length) return view;
  return updateProject(db, owner, view.id, view.currentRevision, { ...view.payload, formats });
}

/** Latest completed preview of this revision, format and materials that can still be opened, or null. */
export async function currentPreview(db, owner, view, format, resourceHash) {
  const jobs = await db.studioJob.findMany({
    where: { ownerId: owner, projectId: view.id, kind: 'preview', status: 'completed', revision: view.currentRevision },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  return (
    jobs.find(
      (j) => j.payload?.format === format && j.result?.resourceHash === resourceHash && new Date(j.result?.expiresAt || 0) > new Date(),
    ) || null
  );
}

/**
 * Approves the given formats of each graphic and exports the graphics that pass every Studio check.
 * `graphics`: [{ projectId, formats }]. With `render`, missing previews are rendered first (Studio: the owner
 * has the graphics in front of them); without it a current preview of every format must exist (an agent shows
 * the owner exactly what it renders, so anything newer needs a new look).
 * Returns per graphic: approved formats, export job and the errors that still block the export.
 */
export async function approveGraphics(db, owner, graphics, { render = false, adjustFormats = false, wait = {} } = {}) {
  const plan = [];
  for (const g of graphics) {
    let view = await projectView(db, owner, g.projectId);
    if (view.status === 'archived') fail(409, `Grafika „${view.name}” jest zarchiwizowana`);
    if (adjustFormats && !(await validation(db, owner, view)).valid) view = await dropUnusedFormats(db, owner, view);
    const missing = g.formats.filter((f) => !view.payload.formats.includes(f));
    if (missing.length) fail(422, `Grafika „${view.name}” nie ma formatu ${missing.join(', ')}. Włącz go w Studio.`);
    plan.push({ view, formats: [...new Set(g.formats)] });
  }

  // Previews: the owner's OK covers exactly the revision and materials of a preview.
  const todo = [];
  for (const p of plan) {
    const ctx = await context(db, owner, p.view);
    const formats = [];
    for (const format of p.formats) if (!(await currentPreview(db, owner, p.view, format, ctx.resourceHash))) formats.push(format);
    if (formats.length && !render) fail(422, `Grafika „${p.view.name}” zmieniła się od podglądu albo nie ma podglądu. Wywołaj render_graphics i pokaż ją właścicielowi ponownie.`);
    if (formats.length) todo.push({ view: p.view, formats });
  }
  // A new preview supersedes a queued one of the same graphic, so each round queues one format per graphic.
  while (todo.some((t) => t.formats.length)) {
    const queued = [];
    for (const t of todo) if (t.formats.length) queued.push(await queueJob(db, owner, t.view, 'preview', { format: t.formats.shift() }));
    const done = await waitForJobs(db, queued.map((j) => j.id), wait);
    const failed = queued.map((j) => done.get(j.id) || j).find((j) => j.status !== 'completed');
    if (failed) fail(failed.status === 'failed' ? 422 : 503, failed.status === 'failed' ? `Podgląd się nie udał: ${failed.error || 'błąd renderowania'}` : 'Podgląd jeszcze się renderuje. Spróbuj ponownie za chwilę.');
  }

  const approved = [];
  for (const p of plan) {
    await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "StudioProject" WHERE id = ${p.view.id} FOR UPDATE`;
      const view = await projectView(tx, owner, p.view.id);
      if (view.currentRevision !== p.view.currentRevision) fail(409, `Grafika „${view.name}” zmieniła się w trakcie zatwierdzania. Obejrzyj ją ponownie.`);
      const ctx = await context(tx, owner, view);
      const previews = [];
      for (const format of p.formats) {
        const preview = await currentPreview(tx, owner, view, format, ctx.resourceHash);
        if (!preview) fail(422, `Grafika „${view.name}” zmieniła się od podglądu albo nie ma podglądu. Obejrzyj ją ponownie.`);
        previews.push({ format, previewJobId: preview.id });
        // The composition gate of the editor („Zatwierdzam tę kompozycję”), for current designs only.
        if (view.payload.postType && view.payload.designVersion === DESIGN_VERSION && view.revision.brandVersion === BRAND_VERSION) {
          const version = designKey(view.payload, format);
          const id = `${owner}:${view.family}:${version}:${BRAND_VERSION}`;
          await tx.studioTemplate.upsert({
            where: { id },
            create: { id, ownerId: owner, family: view.family, version, brandVersion: BRAND_VERSION, status: 'approved', approvedAt: new Date() },
            update: { status: 'approved', approvedAt: new Date() },
          });
        }
      }
      // „Potwierdź dane i wygląd” of this revision.
      await tx.studioApproval.upsert({
        where: { revisionId_ownerId: { revisionId: view.revision.id, ownerId: owner } },
        create: { revisionId: view.revision.id, ownerId: owner, contentHash: view.revision.contentHash, resourceHash: ctx.resourceHash },
        update: { contentHash: view.revision.contentHash, resourceHash: ctx.resourceHash },
      });
      approved.push({ projectId: view.id, revision: view.currentRevision, previews });
    });
  }

  const exports = [];
  for (const p of plan) {
    const view = await projectView(db, owner, p.view.id);
    const report = await validation(db, owner, view);
    if (!report.valid) {
      exports.push({ view, job: null, errors: report.errors.map((e) => e.message) });
      continue;
    }
    const ctx = await context(db, owner, view);
    const key = `approve:${view.id}:${view.revision.contentHash.slice(0, 16)}:${ctx.resourceHash.slice(0, 16)}`;
    exports.push({ view, job: await queueJob(db, owner, view, 'export', {}, key), errors: [] });
  }
  const ids = exports.filter((e) => e.job).map((e) => e.job.id);
  const done = ids.length ? await waitForJobs(db, ids, wait) : new Map();
  return {
    approved,
    graphics: exports.map(({ view, job, errors }) => {
      const j = job ? done.get(job.id) || job : null;
      return { projectId: view.id, name: view.name, revision: view.currentRevision, formats: view.payload.formats, job: j, status: j?.status || 'blocked', errors };
    }),
  };
}
