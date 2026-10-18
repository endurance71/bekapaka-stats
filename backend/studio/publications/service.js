import { strToU8, zipSync } from 'fflate';
import fs from 'node:fs/promises';
import { z } from 'zod';
import { fail } from '../config.js';
import { BRAND_VERSION, newPostProject, projectSchema } from '../contracts.js';
import { designFormats, postType, projectTemplateVersion } from '../post-types.js';
import { hash, filePath } from '../storage.js';
import { matches, sourceEnvelope } from '../sources.js';
import { statisticalSnapshot } from '../statistics.js';
import { matchReport } from './match-report.js';
import { currentSponsorFooter } from './sponsors.js';
import { projectView, validation } from '../service.js';
import { channelIds, channels, copySchemas, factsSchema } from './channels.js';
import { graphicFormats, itemGraphicKeys, playbook } from './playbooks.js';
import { setContent } from './match-graphics.js';
import { altText, schematicCopy, TEMPLATE_VERSION, when } from './templates.js';
import { hasErrors, lintCopy } from './brand-lint.js';
import { channelTexts, folders } from './texts.js';
import { GRID_CHANNELS, GRID_SIZE, compositionName, signatureOf, varietyWarnings } from './variety.js';

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
  const seasonMatches = await matches(db, seasonId);
  const match = seasonMatches.find((m) => m.id === id);
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
  let report = null;
  if (match.scoreUs !== null && match.scoreThem !== null) {
    try {
      report = await matchReport(db, match, seasonMatches);
    } catch {
      // Same rule as leaders: missing statistics never block the result.
    }
  }
  const facts = factsSchema.parse({
    kind: 'match',
    competition: 'KALK',
    seasonLabel: season?.label || '',
    // KALK labels rounds „Kolejka - 3”; copy says „3. kolejka”.
    round: match.round.match(/\d+/)?.[0] ?? match.round,
    opponent: match.opponent,
    date: match.date,
    venue: match.venue,
    entryInfo: 'Wstęp wolny',
    scoreUs: match.scoreUs,
    scoreThem: match.scoreThem,
    leaders,
    report,
  });
  return { facts, source: sourceEnvelope('match', match).source };
}

// Text on the neutral rival shield (no other club's crest, brand rule M8): initials of a multi-word name
// („Młode Wilki” → MW, „Kosz-All-In” → KAI), a short name as is, otherwise its first 4 letters.
export function opponentShort(name) {
  const words = String(name || '')
    .split(/[\s\-–]+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter((w) => w.length > 1 || /\p{N}/u.test(w));
  if (!words.length) return '';
  const short = words.length > 1 ? words.map((w) => w[0]).join('').slice(0, 4) : words[0].length <= 5 ? words[0] : words[0].slice(0, 4);
  return short.toLocaleUpperCase('pl-PL');
}

// Prefill a graphic project from the facts; the project keeps its own revisions afterwards.
function projectFromFacts(definition, facts, source, title, partnerIds, alt = '') {
  const type = postType(definition.postType);
  if (!type) fail(500, `Playbook wskazuje nieznany typ grafiki: ${definition.postType}`);
  const base = newPostProject(type.id, type.styles.includes(definition.visualStyle) ? definition.visualStyle : undefined);
  const formats = graphicFormats(definition).filter((f) => designFormats(type, base.visualStyle).includes(f));
  // Post-match set (reference 18.10.2026): poster numbers, leaders and comparison rows from the confirmed report.
  const set = definition.role ? setContent(definition.role, facts) : {};
  const [firstName, ...rest] = facts.person.split(' ');
  const content = {
    ...base.content,
    opponent: facts.opponent,
    opponentShort: opponentShort(facts.opponent).slice(0, 8),
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
    ...set,
  };
  content.altText = content.altText.slice(0, 1500);
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

async function graphicState(db, owner, item, cache, projectId = item.projectId) {
  if (!projectId) return null;
  if (!cache.has(projectId)) {
    cache.set(
      projectId,
      (async () => {
        const view = await projectView(db, owner, projectId);
        const report = await validation(db, owner, view);
        const job = await latestExport(db, owner, view.id, view.currentRevision);
        return {
          projectId: view.id,
          name: view.name,
          postType: view.payload.postType,
          formats: view.payload.formats,
          revision: view.currentRevision,
          contentHash: view.revision.contentHash,
          signature: signatureOf(view.payload),
          altText: view.payload.content.altText || '',
          status: view.status,
          valid: report.valid,
          errors: report.errors,
          exportJobId: job?.id || null,
          exportFiles: job && new Date(job.result?.expiresAt || 0) > new Date() ? job.result.files.filter((f) => f.mime === 'image/png').map(({ storageKey, ...f }) => f) : [],
        };
      })(),
    );
  }
  const g = await cache.get(projectId);
  return { ...g, format: item.format, hasFormat: g.formats.includes(item.format) };
}
const extraIds = (item) => (Array.isArray(item.extraProjectIds) ? item.extraProjectIds : []);
// Further graphics of a set; an unavailable (deleted) one stays as null so readiness can name it.
const extraGraphics = (db, owner, item, cache) => Promise.all(extraIds(item).map((id) => graphicState(db, owner, item, cache, id).catch(() => null)));

// A single-graphic variant keeps the hash it had before sets existed, so earlier approvals stay valid.
const approvalHash = (item, graphic, extras = []) =>
  hash({ copy: item.copy, graphic: graphic ? graphic.contentHash : null, format: item.format, ...(extras.length ? { extra: extras.map((g) => g?.contentHash ?? null) } : {}) });

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
    const extras = await extraGraphics(db, owner, item, cache);
    const issues = lintCopy(item.channel, item.copy, p.facts);
    const stale = item.status === 'approved' && item.approvedHash !== approvalHash(item, graphic, extras);
    // Website variant: state of the CMS draft (events are newest first).
    const synced = item.channel === 'website' ? item.events.find((e) => e.action === 'cms-draft')?.payload : null;
    const cms = synced ? { slug: synced.slug, documentId: synced.documentId, syncedAt: item.events.find((e) => e.action === 'cms-draft').createdAt, upToDate: synced.copyHash === hash(item.copy) } : null;
    items.push({ ...itemView(item), graphic, extraGraphics: extras, issues, stale, cms, ready: readiness(p, item, graphic, issues, extras) });
  }
  // Feed variety: compare each grid channel's graphic with the channel's other posts (published and scheduled).
  for (const item of items) {
    if (!GRID_CHANNELS.includes(item.channel) || !item.graphic || item.status === 'skipped') continue;
    const history = await gridHistory(db, owner, item.channel, { exclude: item.id, cache });
    const warnings = item.status === 'draft' ? varietyWarnings({ signature: item.graphic.signature, plannedAt: item.plannedAt }, history) : [];
    item.variety = { warnings, composition: compositionName(item.graphic.signature), history: history.slice(0, GRID_SIZE - 1) };
  }
  return { ...p, items, factsConfirmed: factsConfirmed(p), playbookDef: playbook(p.playbook) || null };
}

// Last posts of a grid channel (published and approved for later), newest first, with what their graphic looked like.
async function signatureFor(db, owner, projectId, cache) {
  const key = `signature:${projectId}`;
  if (!cache.has(key)) cache.set(key, projectView(db, owner, projectId).then((v) => signatureOf(v.payload)).catch(() => null));
  return cache.get(key);
}
async function thumbnailFor(db, owner, item, published) {
  if (published?.payload?.images?.length) return `/publications/${item.publicationId}/items/${item.id}/external-images/0`;
  if (!item.projectId) return null;
  const job = await db.studioJob.findFirst({
    where: { ownerId: owner, projectId: item.projectId, kind: { in: ['export', 'preview'] }, status: 'completed' },
    orderBy: { createdAt: 'desc' },
  });
  const file = filesFor(job, item.format)[0] || (job?.result?.files || []).find((f) => f.mime === 'image/png');
  return job && file && new Date(job.result?.expiresAt || 0) > new Date() ? `/jobs/${job.id}/files/${file.key}` : null;
}
export async function gridHistory(db, owner, channel, { exclude = null, cache = new Map(), limit = GRID_SIZE } = {}) {
  const rows = await db.studioPublicationItem.findMany({
    where: { channel, status: { in: ['published', 'approved'] }, publication: { ownerId: owner }, ...(exclude ? { id: { not: exclude } } : {}) },
    include: {
      publication: { select: { title: true } },
      events: { where: { action: { in: ['approved', 'published'] } }, orderBy: { createdAt: 'desc' }, take: 3 },
    },
    orderBy: { updatedAt: 'desc' },
    take: 60,
  });
  const dated = rows
    .map((r) => ({ r, at: r.publishedAt || r.plannedAt }))
    .filter((x) => x.at)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, limit);
  const out = [];
  for (const { r } of dated) {
    const published = r.events.find((e) => e.action === 'published');
    const stored = r.events.find((e) => e.payload?.signature)?.payload.signature;
    const signature = stored || (r.projectId ? await signatureFor(db, owner, r.projectId, cache) : null);
    out.push({
      itemId: r.id,
      publicationId: r.publicationId,
      title: r.publication.title,
      status: r.status,
      publishedAt: r.publishedAt,
      plannedAt: r.plannedAt,
      signature,
      composition: compositionName(signature),
      thumbnail: await thumbnailFor(db, owner, r, published),
    });
  }
  return out;
}

/** Grid preview of one channel (Instagram profile or Facebook timeline) with repetition marks. */
export async function gridPreview(db, owner, channel) {
  if (!GRID_CHANNELS.includes(channel)) fail(400, 'Podgląd siatki jest dla posta Instagrama i Facebooka');
  const history = await gridHistory(db, owner, channel);
  return history.map((entry, i) => ({ ...entry, warnings: varietyWarnings(entry, history.slice(i + 1)) }));
}

// What still blocks approval of a channel variant; empty = ready.
export function readiness(p, item, graphic, issues = lintCopy(item.channel, item.copy, p.facts), extras = []) {
  const missing = [];
  if (!factsConfirmed(p)) missing.push('Potwierdź fakty publikacji');
  if (hasErrors(issues)) missing.push('Popraw błędy w tekście');
  const set = [...(item.projectId ? [graphic] : []), ...extras];
  set.forEach((g, i) => {
    // „grafice 2/3” only when the variant carries a set.
    const which = set.length > 1 ? ` ${i + 1}/${set.length}${g ? ` („${g.name}”)` : ''}` : '';
    if (!g) missing.push(`Grafika${which} jest niedostępna`);
    else {
      if (!g.hasFormat) missing.push(`Włącz format ${item.format} w grafice${which}`);
      if (!g.valid) missing.push(`Zatwierdź grafikę${which} (dane, wygląd, kompozycja)`);
      else if (!g.exportJobId) missing.push(`Wygeneruj eksport grafiki${which}`);
    }
  });
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
    plannedAt: z.string().datetime({ offset: true }).nullable().optional(),
    source: z.object({ kind: z.literal('match'), id: z.string().min(1).max(128), seasonId: z.string().min(1).max(128) }).strict().optional(),
    facts: z.record(z.string(), z.unknown()).optional(),
    channels: z.array(z.enum(channelIds)).min(1).optional(),
  })
  .strict();

const ZONE = 'Europe/Warsaw';
const wallClock = (ms) =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
    .format(new Date(ms))
    .replace(' ', 'T');

/** Default publication time: the playbook's day offset from the event, at its Warsaw hour (a preview 60 h before a 14:40 match goes out on Friday at 18:00, not at 02:40). */
export function scheduleAt(def, date) {
  if (!date || !Number.isFinite(Date.parse(date))) return null;
  const shifted = Date.parse(date) + def.offsetHours * 3600_000;
  if (!def.at) return new Date(shifted);
  const wall = Date.parse(`${wallClock(shifted).slice(0, 10)}T${def.at}:00Z`);
  let real = wall;
  for (let i = 0; i < 3; i++) real += wall - Date.parse(`${wallClock(real)}Z`);
  return new Date(real);
}

export async function createPublication(db, owner, input) {
  const data = createInput.parse(input);
  const def = playbook(data.playbook);
  if (!def) fail(404, 'Nieznany schemat publikacji');
  const fromSource = data.source ? await matchFacts(db, data.source.seasonId, data.source.id) : null;
  const facts = factsSchema.parse({ ...(fromSource?.facts || {}), ...(data.facts || {}), kind: def.factsKind });
  const settings = { ...(await getSettings(db, owner)), ...(def.items.facebook ? { sponsorFooter: await currentSponsorFooter() } : {}) };
  const partnerIds = def.category === 'Partnerzy' ? (await db.studioPartner.findMany({ where: { ownerId: owner, status: 'approved' }, select: { id: true } })).map((p) => p.id) : [];
  const title = (data.title || [facts.opponent || facts.title || facts.person || facts.partner, facts.date ? when(facts.date).split(',')[1]?.trim() : ''].filter(Boolean).join(' · ') || def.label).slice(0, 180);
  const anchor = scheduleAt(def, facts.date);
  const plannedAt = data.plannedAt ? new Date(data.plannedAt) : anchor;
  const copy = schematicCopy(def, facts, settings);
  const wanted = Object.keys(def.items).filter((c) => !data.channels || data.channels.includes(c));
  return db.$transaction(async (tx) => {
    const projects = {};
    for (const [key, definition] of Object.entries(def.graphics)) {
      if (!wanted.some((c) => itemGraphicKeys(def.items[c]).includes(key))) continue;
      // A set graphic the facts cannot fill (no box score yet) is left out instead of shipping empty rows.
      if (definition.role && definition.role !== 'poster' && !setContent(definition.role, facts)) continue;
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
            extraProjectIds: (def.items[channel].extra || []).map((key) => projects[key]).filter(Boolean),
            format: def.items[channel].format,
            copy: copy[channel],
            copyOrigin: 'template',
            promptVersion: `template:${TEMPLATE_VERSION}`,
            plannedAt,
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
  const target = data.plannedAt ? new Date(data.plannedAt) : null;
  await db.$transaction(async (tx) => {
    await bump(tx, owner, id, data.expectedRevision, {
      ...(data.title ? { title: data.title } : {}),
      ...(data.plannedAt !== undefined ? { plannedAt: target } : {}),
      ...(facts ? { facts, factsHash: hash(facts) } : {}),
    });
    // The calendar shows channels, so the publication date is the date of every channel not yet published.
    // A single channel can still be moved on its own afterwards.
    if (target)
      await tx.studioPublicationItem.updateMany({
        where: { publicationId: id, status: { notIn: ['published', 'skipped'] } },
        data: { plannedAt: target, revision: { increment: 1 } },
      });
  });
  return publicationView(db, owner, id);
}

// Fields the stats system owns; owner-entered facts (notes, person, link…) stay untouched.
const sourceKeys = ['competition', 'seasonLabel', 'round', 'opponent', 'date', 'venue', 'scoreUs', 'scoreThem', 'leaders', 'report'];
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
  const sponsorFooter = channelList.includes('facebook') ? await currentSponsorFooter() : '';
  const copy = schematicCopy(def, factsSchema.parse(p.facts), { ...(await getSettings(db, owner)), sponsorFooter });
  await db.$transaction(async (tx) => {
    for (const item of p.items.filter((i) => channelList.includes(i.channel) && ['draft', 'skipped'].includes(i.status) && copy[i.channel])) {
      await tx.studioPublicationItem.update({ where: { id: item.id }, data: { copy: copy[item.channel], copyOrigin: 'template', promptVersion: `template:${TEMPLATE_VERSION}`, revision: { increment: 1 } } });
      await event(tx, item.id, 'copy', 'owner', { origin: 'template' });
    }
  });
  return publicationView(db, owner, pubId);
}

export async function approveItem(db, owner, pubId, itemId, expectedRevision, acceptRepetition = false) {
  const view = await publicationView(db, owner, pubId);
  const item = view.items.find((i) => i.id === itemId);
  if (!item) fail(404, 'Wariant publikacji nie istnieje');
  if (item.status !== 'draft') fail(409, 'Zatwierdzić można tylko roboczy wariant');
  if (item.ready.length) fail(422, 'Wariant nie jest gotowy', item.ready.map((message) => ({ field: item.channel, message })));
  const repetition = item.variety?.warnings || [];
  if (repetition.length && !acceptRepetition)
    fail(422, 'Siatka się powtarza. Zmień grafikę albo zaznacz „Akceptuję powtórzenie”.', repetition.map((w) => ({ field: 'variety', message: w.message })));
  await db.$transaction(async (tx) => {
    await bumpItem(tx, item, expectedRevision, { status: 'approved', approvedHash: approvalHash(item, item.graphic, item.extraGraphics) });
    await event(tx, item.id, 'approved', 'owner', {
      graphicRevision: item.graphic?.revision ?? null,
      ...(item.extraGraphics.length ? { extraGraphicRevisions: item.extraGraphics.map((g) => g?.revision ?? null) } : {}),
      signature: item.graphic?.signature ?? null,
      ...(repetition.length ? { acceptedRepetition: repetition.map((w) => w.message) } : {}),
    });
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
    await event(tx, item.id, 'published', 'owner', { url: data.url || null, manual: true, signature: item.graphic?.signature ?? null });
  });
  return publicationView(db, owner, pubId);
}

// A post published outside Studio (Business Suite, CMS, phone) still belongs in its history and in the grid.
// It skips readiness on purpose and stays marked as unapproved; the images are what actually went out.
const externalInput = z
  .object({
    expectedRevision: z.number().int().min(1),
    url: z.string().trim().url().max(500).or(z.literal('')).default(''),
    publishedAt: z.string().datetime({ offset: true }),
    note: z.string().trim().max(500).default(''),
  })
  .strict();
export async function recordExternalPublication(db, owner, pubId, itemId, input, images = []) {
  const data = externalInput.parse(input);
  const item = await findItem(db, owner, pubId, itemId);
  if (item.status === 'published') fail(409, 'Wariant jest już opublikowany');
  if (item.status === 'skipped') fail(409, 'Kanał jest pominięty');
  const publishedAt = new Date(data.publishedAt);
  // Scheduled posts are recorded once they are live, so the grid never shows a post that has not happened.
  if (publishedAt.getTime() > Date.now() + 5 * 60 * 1000) fail(422, 'Zapisz publikację, gdy już się ukaże');
  await db.$transaction(async (tx) => {
    await bumpItem(tx, item, data.expectedRevision, { status: 'published', publishedAt, externalUrl: data.url || null, approvedHash: null });
    await event(tx, item.id, 'published', 'owner', { url: data.url || null, manual: true, external: true, unapproved: true, note: data.note || null, images, signature: { composition: 'external' } });
  });
  return publicationView(db, owner, pubId);
}

/** Images recorded with an external publication (newest published event first). */
export async function externalImage(db, owner, pubId, itemId, index) {
  const item = await db.studioPublicationItem.findFirst({ where: { id: itemId, publicationId: pubId, publication: { ownerId: owner } } });
  if (!item) fail(404, 'Wariant publikacji nie istnieje');
  const published = await db.studioPublishEvent.findFirst({ where: { itemId: item.id, action: 'published' }, orderBy: { createdAt: 'desc' } });
  const image = published?.payload?.images?.[index];
  if (!image) fail(404, 'Brak grafiki tej publikacji');
  return image;
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
    const set = [item.graphic, ...item.extraGraphics].filter(Boolean);
    for (const [index, graphic] of set.entries()) {
      const job = await db.studioJob.findUnique({ where: { id: graphic.exportJobId } });
      if (!job || new Date(job.result?.expiresAt || 0) <= new Date()) fail(409, `Eksport grafiki „${graphic.name}” wygasł. Wygeneruj go ponownie.`);
      // A set keeps its order in the file names (01-…, 02-…): the cover goes first in the carousel or album.
      const prefix = set.length > 1 ? `${String(index + 1).padStart(2, '0')}-` : '';
      if (prefix && index > 0 && graphic.altText) contents[`${folder}/tekst-alternatywny-${prefix.slice(0, 2)}.txt`] = strToU8(graphic.altText);
      for (const file of filesFor(job, item.format)) {
        const bytes = await fs.readFile(filePath(file.storageKey));
        total += bytes.length;
        if (total > 128 * 1024 * 1024) fail(413, 'Paczka przekracza 128 MB');
        contents[`${folder}/${prefix}${file.name}`] = new Uint8Array(bytes);
      }
    }
  }
  contents['manifest.json'] = strToU8(
    JSON.stringify(
      {
        publication: { id: view.id, title: view.title, playbook: view.playbook, factsHash: view.factsHash },
        items: items.map((i) => ({ channel: i.channel, status: i.status, copyOrigin: i.copyOrigin, promptVersion: i.promptVersion, graphic: i.graphic && { projectId: i.graphic.projectId, revision: i.graphic.revision, exportJobId: i.graphic.exportJobId, format: i.format }, ...(i.extraGraphics.length ? { extraGraphics: i.extraGraphics.filter(Boolean).map((g) => ({ projectId: g.projectId, revision: g.revision, exportJobId: g.exportJobId })) } : {}) })),
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
