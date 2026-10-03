import crypto from 'node:crypto';
import { templates, projectSchema, BRAND_VERSION, RENDERER_VERSION, assetIds } from './contracts.js';
import { hash } from './storage.js';
import { fail } from './config.js';
import { validateProject } from './validation.js';
export async function projectView(db, ownerId, id, revision) {
  const p = await db.studioProject.findFirst({ where: { id, ownerId } });
  if (!p) fail(404, 'Projekt nie istnieje');
  const r = await db.studioRevision.findUnique({ where: { projectId_number: { projectId: id, number: revision || p.currentRevision } } });
  if (!r) fail(404, 'Rewizja nie istnieje');
  return { ...p, revision: r, payload: projectSchema.parse(r.payload) };
}
export async function createProject(db, owner, input) {
  const payload = projectSchema.parse(input); const t = templates.find(t => t.id === payload.family);
  return db.$transaction(async tx => {
    const p = await tx.studioProject.create({ data: { ownerId: owner, name: payload.name, family: payload.family } });
    await tx.studioRevision.create({ data: { projectId: p.id, number: 1, payload, contentHash: hash(payload), brandVersion: BRAND_VERSION, templateVersion: t.version } });
    return projectView(tx, owner, p.id);
  });
}
export async function updateProject(db, owner, id, expectedRevision, input) {
  const payload = projectSchema.parse(input);
  return db.$transaction(async tx => {
    const updated = await tx.studioProject.updateMany({ where: { id, ownerId: owner, currentRevision: expectedRevision, status: 'draft' }, data: { name: payload.name, family: payload.family, currentRevision: { increment: 1 } } });
    if (!updated.count) fail(409, 'Projekt zmienił się na innym urządzeniu albo jest zarchiwizowany. Odśwież projekt; Twoje zmiany pozostają w formularzu.');
    await tx.studioRevision.create({ data: { projectId: id, number: expectedRevision + 1, payload, contentHash: hash(payload), brandVersion: BRAND_VERSION, templateVersion: templates.find(t => t.id === payload.family).version } });
    return projectView(tx, owner, id);
  });
}
export async function context(db, owner, view) {
  const d = view.payload.content;
  const partners = await db.studioPartner.findMany({ where: { ownerId: owner, id: { in: d.partnerIds } } });
  const ids = [...new Set([...assetIds(d), ...partners.map(p => p.assetId).filter(Boolean)])];
  const assets = await db.studioAsset.findMany({ where: { ownerId: owner, id: { in: ids } } });
  const template = await db.studioTemplate.findFirst({ where: { ownerId: owner, family: view.family, version: view.revision.templateVersion, brandVersion: view.revision.brandVersion } });
  const approval = await db.studioApproval.findFirst({ where: { ownerId: owner, revisionId: view.revision.id, contentHash: view.revision.contentHash } });
  const resourceHash = hash({ assets: assets.map(a => ({ id: a.id, hash: a.contentHash, kind: a.kind, status: a.status, consent: a.consent, origin: a.origin })).sort((a, b) => a.id.localeCompare(b.id)), partners: partners.map(p => ({ id: p.id, name: p.name, assetId: p.assetId, seedLogo: p.seedLogo, status: p.status, contractNote: p.contractNote })).sort((a, b) => a.id.localeCompare(b.id)), brandVersion: view.revision.brandVersion, templateVersion: view.revision.templateVersion, rendererVersion: RENDERER_VERSION });
  return { assets, partners, template, resourceHash, approved: !!approval && approval.resourceHash === resourceHash };
}
export async function validation(db, owner, view) { return validateProject(view.payload, await context(db, owner, view)); }
export async function queueJob(db, owner, view, kind, payload = {}, key) {
  const request = { projectHash: view?.revision.contentHash || '', rendererVersion: RENDERER_VERSION, ...payload };
  const idempotencyKey = key ? hash(`${owner}:${kind}:${key}`) : null;
  if (idempotencyKey) {
    const found = await db.studioJob.findUnique({ where: { idempotencyKey } });
    if (found) { if (hash(found.payload) !== hash(request)) fail(409, 'Ten klucz eksportu należy do innego żądania'); return found; }
  }
  if (kind === 'export') {
    const report = await validation(db, owner, view);
    if (!report.valid) fail(422, 'Eksport wymaga poprawek', report.errors);
  }
  try {
    return await db.$transaction(async tx => {
      if (kind === 'preview') await tx.studioJob.updateMany({ where: { ownerId: owner, projectId: view.id, kind, status: 'queued' }, data: { status: 'superseded', finishedAt: new Date() } });
      return tx.studioJob.create({ data: { ownerId: owner, projectId: view?.id, revision: view?.revision.number, kind, payload: request, idempotencyKey } });
    });
  } catch (err) { if (err.code === 'P2002' && idempotencyKey) return db.studioJob.findUnique({ where: { idempotencyKey } }); throw err; }
}
export const newId = () => crypto.randomUUID();
