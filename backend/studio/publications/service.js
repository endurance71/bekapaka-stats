import { strToU8, zipSync } from 'fflate';
import fs from 'node:fs/promises';
import { z } from 'zod';
import { fail } from '../config.js';
import { BRAND_VERSION, newPostProject, projectSchema } from '../contracts.js';
import { designFormats, postType, projectTemplateVersion } from '../post-types.js';
import { hash, filePath } from '../storage.js';
import { matches, sourceEnvelope } from '../sources.js';
import { statisticalSnapshot } from '../statistics.js';
import { projectView, validation } from '../service.js';
import { channelIds, channels, copySchemas, factsSchema } from './channels.js';
import { graphicFormats, playbook } from './playbooks.js';
import { altText, schematicCopy, TEMPLATE_VERSION, when } from './templates.js';
import { hasErrors, lintCopy } from './brand-lint.js';
import { channelTexts, folders } from './texts.js';

export const settingsSchema = z
  .object({
    hashtags: z
      .object({
        instagram: z.array(z.string().regex(/^#[\p{L}\p{N}_]{2,40}$/u)).max(5).default(['#BKPK']),
        facebook: z.array(z.string().regex(/^#[\p{L}\p{N}_]{2,40}$/u)).max(2).default([]),
      })
      .strict()
      .default({ instagram: ['#BKPK'], facebook: [] }),
  })
  .strict();

export async function getSettings(db, owner) {
  const row = await db.studioSetting.findUnique({ where: { ownerId_key: { ownerId: owner, key: 'publications' } } });
  return settingsSchema.parse(row?.value ?? {});
}
export async function saveSettings(db, owner, input) {
  const value = settingsSchema.parse(input);
  await db.studioSetting.upsert({
    where: { ownerId_key: { ownerId: owner, key: 'publications' } },
    create: { ownerId: owner, key: 'publications', value },
    update: { value },
  });
  return value;
}

// ---------- facts ----------
const romanValues = { M: 1000, D: 500, C: 100, L: 50, X: 10, V: 5, I: 1 };
export function romanToInt(roman) {
  const s = String(roman || '').trim().toUpperCase();
  if (/^\d+$/.test(s)) return Number(s);
  if (!/^[MDCLXVI]+$/.test(s)) return null;
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const v = romanValues[s[i]];
    total += v < (romanValues[s[i + 1]] || 0) ? -v : v;
  }
  return total > 0 && total < 100 ? total : null;
}

/** Confirmed public facts of a KALK match: score, round and leaders from the stats system. */
export async function matchFacts(db, seasonId, id) {
  const match = (await matches(db, seasonId)).find((m) => m.id === id);
  if (!match) fail(404, 'Mecz nie jest już dostępny w źródle');
  const season = await db.kalkSeason.findUnique({ where: { id: seasonId } });
  let leaders = [];
  if (match.scoreUs !== null && match.scoreThem !== null) {
    try {
      const snap = await statisticalSnapshot(db, 'match-statistics', seasonId, id, '', 'leaders');
      leaders = snap.tableRows.map((r) => ({ name: r.label, value: r.value, stat: r.detail }));
    } catch {
      // Box score is optional: a result without player statistics stays publishable.
    }
  }
  const facts = factsSchema.parse({
    kind: 'match',
    competition: 'KALK',
    seasonLabel: season?.label || '',
    round: match.round,
    opponent: match.opponent,
    date: match.date,
    venue: match.venue,
    entryInfo: 'Wstęp wolny',
    scoreUs: match.scoreUs,
    scoreThem: match.scoreThem,
    leaders,
  });
  return { facts, source: sourceEnvelope('match', match).source };
}

// Prefill a graphic project from the facts; the project keeps its own revisions afterwards.
function projectFromFacts(definition, facts, source, title, partnerIds, alt = '') {
  const type = postType(definition.postType);
  if (!type) fail(500, `Playbook wskazuje nieznany typ grafiki: ${definition.postType}`);
  const base = newPostProject(type.id);
  const formats = graphicFormats(definition).filter((f) => designFormats(type, base.visualStyle).includes(f));
  const [firstName, ...rest] = facts.person.split(' ');
  const content = {
    ...base.content,
    opponent: facts.opponent,
    date: facts.date,
    originalDate: facts.originalDate,
    venue: facts.venue || base.content.venue,
    entryInfo: facts.entryInfo,
    scoreUs: facts.scoreUs,
    scoreThem: facts.scoreThem,
    title: facts.title || facts.partner || '',
    body: facts.notes,
    ...(type.family === 'player' || type.variant === 'birthday' ? { firstName, lastName: rest.join(' ') } : {}),
    ...(type.variant === 'quote' ? { attribution: facts.person.slice(0, 100) } : {}),
    ...(type.family === 'tournament' ? { edition: romanToInt(facts.edition) } : {}),
    ...(type.family === 'partners' ? { partnerIds } : {}),
    ...(type.id === 'leaders' && facts.leaders.length
      ? { tableRows: facts.leaders.map((l) => ({ label: l.name, value: l.value, detail: l.stat })) }
      : {}),
    ...(source ? { source, references: [source] } : {}),
    altText: alt.slice(0, 1500),
  };
  return projectSchema.parse({ ...base, name: `${type.label} · ${title}`.slice(0, 180), formats: formats.length ? formats : base.formats, content });
}

// ---------- views ----------
const itemView = (item) => {
  const { events, ...rest } = item;
  return { ...rest, ...(events ? { events } : {}) };
};
export const factsConfirmed = (p) => !!p.factsConfirmedHash && p.factsConfirmedHash === p.factsHash;

async function latestExport(db, owner, projectId, revision) {
  return db.studioJob.findFirst({
    where: { ownerId: owner, projectId, kind: 'export', status: 'completed', revision },
    orderBy: { createdAt: 'desc' },
  });
}
const filesFor = (job, format) =>
  (job?.result?.files || []).filter((f) => f.mime === 'image/png' && (f.key === format || f.key.startsWith(`${format}-`)));

async function graphicState(db, owner, item, cache) {
  if (!item.projectId) return null;
  if (!cache.has(item.projectId)) {
    cache.set(
      item.projectId,
      (async () => {
        const view = await projectView(db, owner, item.projectId);
        const report = await validation(db, owner, view);
        const job = await latestExport(db, owner, view.id, view.currentRevision);
        const exportRow = job ? await db.studioExport.findUnique({ where: { jobId: job.id } }) : null;
        return {
          projectId: view.id,
          name: view.name,
          postType: view.payload.postType,
          formats: view.payload.formats,
          revision: view.currentRevision,
          contentHash: view.revision.contentHash,
          status: view.status,
          valid: report.valid,
          errors: report.errors,
          exportJobId: job?.id || null,
          exportFiles: job && new Date(job.result?.expiresAt || 0) > new Date() ? job.result.files.filter((f) => f.mime === 'image/png').map(({ storageKey, ...f }) => f) : [],
          aiAssets: !!exportRow?.manifest?.assets?.some((a) => a.provenance),
        };
      })(),
    );
  }
  const g = await cache.get(item.projectId);
  return { ...g, format: item.format, hasFormat: g.formats.includes(item.format) };
}

const approvalHash = (item, graphic) => hash({ copy: item.copy, graphic: graphic ? graphic.contentHash : null, format: item.format });

export async function publicationView(db, owner, id) {
  const p = await db.studioPublication.findFirst({
    where: { id, ownerId: owner },
    include: { items: { orderBy: { createdAt: 'asc' }, include: { events: { orderBy: { createdAt: 'desc' }, take: 20 } } } },
  });
  if (!p) fail(404, 'Publikacja nie istnieje');
  const cache = new Map();
  const items = [];
  for (const item of p.items.sort((a, b) => channelIds.indexOf(a.channel) - channelIds.indexOf(b.channel))) {
    const graphic = await graphicState(db, owner, item, cache).catch(() => null);
    const issues = lintCopy(item.channel, item.copy, p.facts);
    const stale = item.status === 'approved' && item.approvedHash !== approvalHash(item, graphic);
    items.push({ ...itemView(item), graphic, issues, stale, ready: readiness(p, item, graphic, issues) });
  }
  return { ...p, items, factsConfirmed: factsConfirmed(p), playbookDef: playbook(p.playbook) || null };
}

// What still blocks approval of a channel variant; empty = ready.
export function readiness(p, item, graphic, issues = lintCopy(item.channel, item.copy, p.facts)) {
  const missing = [];
  if (!factsConfirmed(p)) missing.push('Potwierdź fakty publikacji');
  if (hasErrors(issues)) missing.push('Popraw błędy w tekście');
  if (item.projectId) {
    if (!graphic) missing.push('Grafika jest niedostępna');
    else {
      if (!graphic.hasFormat) missing.push(`Włącz format ${item.format} w grafice`);
      if (!graphic.valid) missing.push('Zatwierdź grafikę (dane, wygląd, kompozycja)');
      else if (!graphic.exportJobId) missing.push('Wygeneruj eksport grafiki');
    }
  }
  return missing;
}

export async function listPublications(db, owner, query = {}) {
  const q = z
    .object({ from: z.string().datetime().optional(), to: z.string().datetime().optional(), status: z.enum(['draft', 'archived']).optional() })
    .parse(query);
  const rows = await db.studioPublication.findMany({
    where: {
      ownerId: owner,
      status: q.status || 'draft',
      ...(q.from || q.to ? { plannedAt: { ...(q.from ? { gte: new Date(q.from) } : {}), ...(q.to ? { lt: new Date(q.to) } : {}) } } : {}),
    },
    orderBy: [{ plannedAt: { sort: 'desc', nulls: 'last' } }, { updatedAt: 'desc' }],
    take: 300,
    include: { items: { select: { id: true, channel: true, status: true, plannedAt: true, publishedAt: true, projectId: true, revision: true } } },
  });
  return rows.map((p) => ({ ...p, factsConfirmed: factsConfirmed(p) }));
}

// ---------- commands ----------
const createInput = z
  .object({
    playbook: z.string().min(1).max(60),
    title: z.string().trim().max(180).optional(),
    plannedAt: z.string().datetime().nullable().optional(),
    source: z.object({ kind: z.literal('match'), id: z.string().min(1).max(128), seasonId: z.string().min(1).max(128) }).strict().optional(),
    facts: z.record(z.string(), z.unknown()).optional(),
    channels: z.array(z.enum(channelIds)).min(1).optional(),
  })
  .strict();

export async function createPublication(db, owner, input) {
  const data = createInput.parse(input);
  const def = playbook(data.playbook);
  if (!def) fail(404, 'Nieznany schemat publikacji');
  const fromSource = data.source ? await matchFacts(db, data.source.seasonId, data.source.id) : null;
  const facts = factsSchema.parse({ ...(fromSource?.facts || {}), ...(data.facts || {}), kind: def.factsKind });
  const settings = await getSettings(db, owner);
  const partnerIds = def.category === 'Partnerzy' ? (await db.studioPartner.findMany({ where: { ownerId: owner, status: 'approved' }, select: { id: true } })).map((p) => p.id) : [];
  const title = (data.title || [facts.opponent || facts.title || facts.person || facts.partner, facts.date ? when(facts.date).split(',')[1]?.trim() : ''].filter(Boolean).join(' · ') || def.label).slice(0, 180);
  const anchor = facts.date && Number.isFinite(Date.parse(facts.date)) ? new Date(Date.parse(facts.date) + def.offsetHours * 3600_000) : null;
  const plannedAt = data.plannedAt ? new Date(data.plannedAt) : anchor;
  const copy = schematicCopy(def, facts, settings);
  const wanted = Object.keys(def.items).filter((c) => !data.channels || data.channels.includes(c));
  return db.$transaction(async (tx) => {
    const projects = {};
    for (const [key, definition] of Object.entries(def.graphics)) {
      if (!wanted.some((c) => def.items[c].graphic === key)) continue;
      const payload = projectFromFacts(definition, facts, fromSource?.source, title, partnerIds, altText(def, facts));
      const project = await tx.studioProject.create({ data: { ownerId: owner, name: payload.name, family: payload.family } });
      await tx.studioRevision.create({ data: { projectId: project.id, number: 1, payload, contentHash: hash(payload), brandVersion: BRAND_VERSION, templateVersion: projectTemplateVersion(payload) } });
      projects[key] = project.id;
    }
    const factsHash = hash(facts);
    const publication = await tx.studioPublication.create({
      data: {
        ownerId: owner,
        title,
        playbook: def.id,
        facts,
        factsHash,
        // Facts imported unchanged from the stats system still need the owner's confirmation.
        factsConfirmedHash: null,
        sourceRef: data.source || null,
        plannedAt,
        items: {
          create: wanted.map((channel) => ({
            channel,
            projectId: def.items[channel].graphic ? projects[def.items[channel].graphic] : null,
            format: def.items[channel].format,
            copy: copy[channel],
            copyOrigin: 'template',
            promptVersion: `template:${TEMPLATE_VERSION}`,
            plannedAt: channel === 'instagram_story' && anchor && def.id === 'match-preview' ? new Date(Date.parse(facts.date) - 6 * 3600_000) : plannedAt,
          })),
        },
      },
    });
    return publication.id;
  });
}

const updateInput = z
  .object({
    expectedRevision: z.number().int().min(1),
    title: z.string().trim().min(1).max(180).optional(),
    plannedAt: z.string().datetime().nullable().optional(),
    facts: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

async function bump(tx, owner, id, expectedRevision, data) {
  const updated = await tx.studioPublication.updateMany({ where: { id, ownerId: owner, revision: expectedRevision, status: 'draft' }, data: { ...data, revision: { increment: 1 } } });
  if (!updated.count) fail(409, 'Publikacja zmieniła się na innym urządzeniu albo jest zarchiwizowana. Odśwież widok.');
}

export async function updatePublication(db, owner, id, input) {
  const data = updateInput.parse(input);
  const current = await db.studioPublication.findFirst({ where: { id, ownerId: owner } });
  if (!current) fail(404, 'Publikacja nie istnieje');
  const facts = data.facts ? factsSchema.parse({ ...current.facts, ...data.facts, kind: current.facts.kind }) : null;
  await db.$transaction((tx) =>
    bump(tx, owner, id, data.expectedRevision, {
      ...(data.title ? { title: data.title } : {}),
      ...(data.plannedAt !== undefined ? { plannedAt: data.plannedAt ? new Date(data.plannedAt) : null } : {}),
      ...(facts ? { facts, factsHash: hash(facts) } : {}),
    }),
  );
  return publicationView(db, owner, id);
}

// Fields the stats system owns; owner-entered facts (notes, person, link…) stay untouched.
const sourceKeys = ['competition', 'seasonLabel', 'round', 'opponent', 'date', 'venue', 'scoreUs', 'scoreThem', 'leaders'];
export async function refreshFacts(db, owner, id, expectedRevision) {
  const p = await db.studioPublication.findFirst({ where: { id, ownerId: owner } });
  if (!p) fail(404, 'Publikacja nie istnieje');
  if (!p.sourceRef) fail(422, 'Ta publikacja nie ma źródła KALK');
  const { facts: fresh } = await matchFacts(db, p.sourceRef.seasonId, p.sourceRef.id);
  const facts = factsSchema.parse({ ...p.facts, ...Object.fromEntries(sourceKeys.map((k) => [k, fresh[k]])), kind: p.facts.kind });
  await db.$transaction((tx) => bump(tx, owner, id, expectedRevision, { facts, factsHash: hash(facts) }));
  return publicationView(db, owner, id);
}

export async function confirmFacts(db, owner, id, expectedRevision) {
  const p = await db.studioPublication.findFirst({ where: { id, ownerId: owner } });
  if (!p) fail(404, 'Publikacja nie istnieje');
  await db.$transaction((tx) => bump(tx, owner, id, expectedRevision, { factsConfirmedHash: p.factsHash }));
  return publicationView(db, owner, id);
}

export async function archivePublication(db, owner, id, archived) {
  const updated = await db.studioPublication.updateMany({ where: { id, ownerId: owner }, data: { status: archived ? 'archived' : 'draft', revision: { increment: 1 } } });
  if (!updated.count) fail(404, 'Publikacja nie istnieje');
}

async function findItem(db, owner, pubId, itemId) {
  const item = await db.studioPublicationItem.findFirst({ where: { id: itemId, publicationId: pubId, publication: { ownerId: owner } }, include: { publication: true } });
  if (!item) fail(404, 'Wariant publikacji nie istnieje');
  if (item.publication.status === 'archived') fail(409, 'Publikacja jest zarchiwizowana');
  return item;
}
async function event(tx, itemId, action, actor, payload) {
  await tx.studioPublishEvent.create({ data: { itemId, action, actor, payload: payload ?? undefined } });
}
async function bumpItem(tx, item, expectedRevision, data) {
  const updated = await tx.studioPublicationItem.updateMany({ where: { id: item.id, revision: expectedRevision }, data: { ...data, revision: { increment: 1 } } });
  if (!updated.count) fail(409, 'Wariant zmienił się na innym urządzeniu. Odśwież widok; Twoje zmiany pozostają w formularzu.');
}

const itemInput = z
  .object({
    expectedRevision: z.number().int().min(1),
    copy: z.unknown().optional(),
    copyOrigin: z.enum(['manual', 'template', 'ai', 'agent']).optional(),
    promptVersion: z.string().max(80).nullable().optional(),
    plannedAt: z.string().datetime().nullable().optional(),
    format: z.string().max(20).optional(),
    status: z.enum(['draft', 'skipped']).optional(),
  })
  .strict();

/** Edits never keep an approval: any change returns the variant to draft. */
export async function updateItem(db, owner, pubId, itemId, input, actor = 'owner') {
  const data = itemInput.parse(input);
  const item = await findItem(db, owner, pubId, itemId);
  if (item.status === 'published' && (data.copy || data.status || data.format)) fail(409, 'Opublikowanego wariantu nie zmieniamy. Utwórz nową publikację.');
  const copy = data.copy !== undefined ? copySchemas[item.channel].parse(data.copy) : undefined;
  if (data.format && !channels[item.channel].formats.includes(data.format)) fail(422, 'Ten format nie pasuje do kanału');
  const changed = copy !== undefined && hash(copy) !== hash(item.copy);
  await db.$transaction(async (tx) => {
    await bumpItem(tx, item, data.expectedRevision, {
      ...(copy !== undefined ? { copy, copyOrigin: changed ? data.copyOrigin || 'manual' : item.copyOrigin, promptVersion: changed ? data.promptVersion ?? null : item.promptVersion } : {}),
      ...(data.plannedAt !== undefined ? { plannedAt: data.plannedAt ? new Date(data.plannedAt) : null } : {}),
      ...(data.format ? { format: data.format } : {}),
      ...(data.status ? { status: data.status } : {}),
      ...((changed || data.format || data.status === 'draft') && item.status === 'approved' ? { status: 'draft', approvedHash: null } : {}),
    });
    if (changed) await event(tx, item.id, 'copy', actor, { origin: data.copyOrigin || 'manual' });
    if (data.status) await event(tx, item.id, data.status === 'skipped' ? 'skipped' : 'reopened', actor);
  });
  return publicationView(db, owner, pubId);
}

/** Regenerate schematic copy from the current facts for variants that are not approved or published. */
export async function applyTemplates(db, owner, pubId, channelList) {
  const p = await db.studioPublication.findFirst({ where: { id: pubId, ownerId: owner }, include: { items: true } });
  if (!p) fail(404, 'Publikacja nie istnieje');
  const def = playbook(p.playbook);
  const copy = schematicCopy(def, factsSchema.parse(p.facts), await getSettings(db, owner));
  await db.$transaction(async (tx) => {
    for (const item of p.items.filter((i) => channelList.includes(i.channel) && ['draft', 'skipped'].includes(i.status) && copy[i.channel])) {
      await tx.studioPublicationItem.update({ where: { id: item.id }, data: { copy: copy[item.channel], copyOrigin: 'template', promptVersion: `template:${TEMPLATE_VERSION}`, revision: { increment: 1 } } });
      await event(tx, item.id, 'copy', 'owner', { origin: 'template' });
    }
  });
  return publicationView(db, owner, pubId);
}

export async function approveItem(db, owner, pubId, itemId, expectedRevision) {
  const view = await publicationView(db, owner, pubId);
  const item = view.items.find((i) => i.id === itemId);
  if (!item) fail(404, 'Wariant publikacji nie istnieje');
  if (item.status !== 'draft') fail(409, 'Zatwierdzić można tylko roboczy wariant');
  if (item.ready.length) fail(422, 'Wariant nie jest gotowy', item.ready.map((message) => ({ field: item.channel, message })));
  await db.$transaction(async (tx) => {
    await bumpItem(tx, item, expectedRevision, { status: 'approved', approvedHash: approvalHash(item, item.graphic) });
    await event(tx, item.id, 'approved', 'owner', { graphicRevision: item.graphic?.revision ?? null });
  });
  return publicationView(db, owner, pubId);
}

export async function markPublished(db, owner, pubId, itemId, input) {
  const data = z.object({ expectedRevision: z.number().int().min(1), url: z.string().trim().url().max(500).or(z.literal('')).default('') }).strict().parse(input);
  const view = await publicationView(db, owner, pubId);
  const item = view.items.find((i) => i.id === itemId);
  if (!item) fail(404, 'Wariant publikacji nie istnieje');
  if (item.status !== 'approved' || item.stale) fail(422, 'Opublikować można tylko aktualnie zatwierdzony wariant');
  await db.$transaction(async (tx) => {
    await bumpItem(tx, item, data.expectedRevision, { status: 'published', publishedAt: new Date(), externalUrl: data.url || null });
    await event(tx, item.id, 'published', 'owner', { url: data.url || null, manual: true });
  });
  return publicationView(db, owner, pubId);
}

// ---------- package ----------
/** ZIP of approved variants: per-channel folders with PNGs from the current export and ready-to-paste texts. */
export async function publicationPackage(db, owner, pubId) {
  const view = await publicationView(db, owner, pubId);
  const items = view.items.filter((i) => ['approved', 'published'].includes(i.status) && !i.stale);
  if (!items.length) fail(422, 'Zatwierdź co najmniej jeden wariant przed pobraniem paczki');
  const contents = {};
  let total = 0;
  for (const item of items) {
    const folder = folders[item.channel];
    for (const [name, text] of Object.entries(channelTexts(item, item.graphic))) contents[`${folder}/${name}`] = strToU8(text);
    if (!item.graphic) continue;
    const job = await db.studioJob.findUnique({ where: { id: item.graphic.exportJobId } });
    if (!job || new Date(job.result?.expiresAt || 0) <= new Date()) fail(409, `Eksport grafiki „${item.graphic.name}” wygasł. Wygeneruj go ponownie.`);
    for (const file of filesFor(job, item.format)) {
      const bytes = await fs.readFile(filePath(file.storageKey));
      total += bytes.length;
      if (total > 128 * 1024 * 1024) fail(413, 'Paczka przekracza 128 MB');
      contents[`${folder}/${file.name}`] = new Uint8Array(bytes);
    }
  }
  contents['manifest.json'] = strToU8(
    JSON.stringify(
      {
        publication: { id: view.id, title: view.title, playbook: view.playbook, factsHash: view.factsHash },
        items: items.map((i) => ({ channel: i.channel, status: i.status, copyOrigin: i.copyOrigin, promptVersion: i.promptVersion, graphic: i.graphic && { projectId: i.graphic.projectId, revision: i.graphic.revision, exportJobId: i.graphic.exportJobId, format: i.format } })),
        createdAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
  return { name: `bekapaka-publikacja-${view.playbook}-${view.id.slice(0, 8)}.zip`, zip: zipSync(contents, { level: 0 }) };
}

// ---------- suggestions ----------
/** Matches around today that still lack a preview or a result publication. */
export async function suggestions(db, owner, now = new Date()) {
  const season = await db.kalkSeason.findFirst({ where: { isActive: true }, orderBy: { startsAt: { sort: 'desc', nulls: 'last' } } });
  if (!season) return [];
  const list = await matches(db, season.id);
  const existing = await db.studioPublication.findMany({ where: { ownerId: owner, status: 'draft' }, select: { playbook: true, sourceRef: true } });
  const has = (pb, id) => existing.some((p) => p.playbook === pb && p.sourceRef?.id === id);
  const out = [];
  for (const m of list) {
    const t = Date.parse(m.date);
    if (!Number.isFinite(t)) continue;
    const days = (t - now.getTime()) / 86400_000;
    if (days > 0 && days <= 10 && !has('match-preview', m.id)) out.push({ playbook: 'match-preview', reason: 'Mecz w ciągu 10 dni — brak zapowiedzi', match: m, seasonId: season.id });
    if (days <= 0 && days >= -7 && m.scoreUs !== null && !has('match-result', m.id)) out.push({ playbook: 'match-result', reason: 'Wynik w KALK — brak publikacji wyniku', match: m, seasonId: season.id });
  }
  return out.sort((a, b) => Date.parse(a.match.date) - Date.parse(b.match.date));
}
