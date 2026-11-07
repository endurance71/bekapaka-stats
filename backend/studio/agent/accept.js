// Agent side of „the owner checks everything once and says akceptuję”: the agent fixes the graphic fields it can
// (headline, photo, composition), sends the owner every doubt with the graphics and texts, and on the owner's
// verbatim OK carries out the rest: facts, graphics, variants, export and the website publication.
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { z } from 'zod';
import { fail } from '../config.js';
import { filePath } from '../storage.js';
import { designFormats, postType } from '../post-types.js';
import { projectView, updateProject, validation } from '../service.js';
import { approveItem, approveItemGraphics, confirmFacts, publicationView } from '../publications/service.js';
import { publishWebsite, websiteConfigured } from '../publications/website.js';
import { signedLink } from './graphics.js';

const PHOTO_KINDS = ['photo', 'portrait', 'cutout'];
const publishable = (a) => a.status === 'approved' && ['granted', 'not_required'].includes(a.consent);

/** Photos the owner may publish (approved, consent granted or not required), optionally filtered by name or people. */
export async function listPhotos(db, owner, { query = '', limit = 8 } = {}) {
  const q = query.trim().toLowerCase();
  const rows = (await db.studioAsset.findMany({ where: { ownerId: owner, kind: { in: PHOTO_KINDS }, status: 'approved' }, orderBy: { createdAt: 'desc' }, take: 300 }))
    .filter(publishable)
    .filter((a) => !q || `${a.name} ${a.people} ${a.jerseyNumber}`.toLowerCase().includes(q))
    .slice(0, Math.min(limit, 12));
  const images = [];
  for (const a of rows) {
    const data = await sharp(await fs.readFile(filePath(a.storageKey))).resize({ width: 360, withoutEnlargement: true }).jpeg({ quality: 75 }).toBuffer();
    images.push({ type: 'image', mimeType: 'image/jpeg', data: data.toString('base64') });
  }
  return {
    summary: { photos: rows.map((a, i) => ({ image: i + 1, id: a.id, name: a.name, kind: a.kind, people: a.people, jerseyNumber: a.jerseyNumber, width: a.width, height: a.height })) },
    images,
  };
}

const graphicInput = z
  .object({
    publicationId: z.string().uuid(),
    channel: z.string(),
    index: z.number().int().min(1).max(10).default(1),
    title: z.string().trim().max(180).optional(),
    photoAssetId: z.string().max(128).nullable().optional(),
    visualStyle: z.string().max(40).optional(),
  })
  .strict();

/** Sets the headline, photo or composition of one graphic of a channel; returns what still blocks it. */
export async function updateChannelGraphic(db, owner, input) {
  const a = graphicInput.parse(input);
  const p = await publicationView(db, owner, a.publicationId);
  if (p.status === 'archived') fail(409, 'Publikacja jest zarchiwizowana');
  const item = p.items.find((i) => i.channel === a.channel);
  if (!item) fail(404, 'Publikacja nie ma tego kanału');
  const g = [item.graphic, ...item.extraGraphics][a.index - 1];
  if (!g) fail(404, 'Ten kanał nie ma grafiki o takim numerze');
  const view = await projectView(db, owner, g.projectId);
  if (view.status !== 'draft') fail(409, `Grafika „${view.name}” jest zarchiwizowana`);
  const payload = structuredClone(view.payload);
  if (a.title !== undefined) payload.content.title = a.title;
  if (a.photoAssetId !== undefined) {
    if (a.photoAssetId) {
      const asset = await db.studioAsset.findFirst({ where: { id: a.photoAssetId, ownerId: owner } });
      if (!asset || !PHOTO_KINDS.includes(asset.kind) || !publishable(asset)) fail(422, 'To zdjęcie nie jest dopuszczone do publikacji. Wybierz je z list_photos.');
    }
    payload.content.photoAssetId = a.photoAssetId;
  }
  if (a.visualStyle) {
    const type = postType(payload.postType);
    if (!type?.styles.includes(a.visualStyle)) fail(422, `Dostępne kompozycje: ${(type?.styles || []).join(', ')}`);
    if (payload.formats.some((f) => !designFormats(type, a.visualStyle).includes(f))) fail(422, 'Ta kompozycja nie ma wszystkich formatów tej grafiki');
    payload.visualStyle = a.visualStyle;
  }
  const updated = await updateProject(db, owner, view.id, view.currentRevision, payload);
  const report = await validation(db, owner, updated);
  // Approvals are what accept_publication records after the owner's OK; the rest is the agent's to fix.
  const left = report.errors.filter((e) => !['approval', 'template'].includes(e.field)).map((e) => e.message);
  const type = postType(updated.payload.postType);
  return {
    name: updated.name,
    revision: updated.currentRevision,
    title: updated.payload.content.title,
    photoAssetId: updated.payload.content.photoAssetId,
    visualStyle: updated.payload.visualStyle,
    compositions: type?.styles || [],
    stillToFix: left,
    note: left.length ? 'Popraw pozostałe pola, potem render_graphics.' : 'Gotowe do pokazania właścicielowi: render_graphics.',
  };
}

const isGraphicStep = (r) => r.startsWith('Zatwierdź grafikę') || r.startsWith('Wygeneruj eksport grafiki');
const pngFiles = (g, format, agent) =>
  (g?.exportFiles || []).filter((f) => f.key === format || f.key.startsWith(`${format}-`)).map((f) => ({ name: f.name, url: signedLink(agent, g.exportJobId, f.key) }));

/**
 * After the owner's verbatim OK on everything the agent sent: confirms the facts, approves graphics and every
 * draft channel, exports, publishes the website article when its time has come (later ones go live by themselves
 * at the planned time) and returns the final PNG files for Facebook and Instagram.
 */
export async function acceptPublication(db, owner, agent, { publicationId, ownerApproval, acceptRepetition = false }, wait = {}) {
  let p = await publicationView(db, owner, publicationId);
  if (p.status === 'archived') fail(409, 'Publikacja jest zarchiwizowana');
  const actor = `agent:${agent.name}`.slice(0, 120);
  if (!p.factsConfirmed) p = await confirmFacts(db, owner, p.id, p.revision);
  for (const item of p.items.filter((i) => i.status === 'draft')) {
    await db.studioPublishEvent.create({ data: { itemId: item.id, action: 'owner-accepted', actor, payload: { ownerApproval } } });
  }

  const channels = [];
  for (const id of p.items.filter((i) => i.status === 'draft').map((i) => i.id)) {
    p = await publicationView(db, owner, publicationId);
    let item = p.items.find((i) => i.id === id);
    const repeated = (item.variety?.warnings.length ?? 0) > 0;
    try {
      if (item.graphic && item.ready.some(isGraphicStep)) {
        const r = await approveItemGraphics(db, owner, publicationId, item.id, { expectedRevision: item.revision, approveVariant: true, acceptRepetition }, wait, actor);
        p = r.publication;
      } else if (!item.ready.length && (!repeated || acceptRepetition)) {
        p = await approveItem(db, owner, publicationId, item.id, item.revision, acceptRepetition, actor);
      }
    } catch (err) {
      channels.push({ channel: item.channel, status: item.status, problem: err.message, details: err.details?.map((d) => d.message) });
      continue;
    }
    item = p.items.find((i) => i.id === id);
    const out = { channel: item.channel, status: item.status };
    if (item.status !== 'approved') {
      out.problem = item.ready.length ? item.ready.join(' · ') : repeated ? 'Siatka się powtarza — pokaż ostrzeżenie właścicielowi i wywołaj ponownie z acceptRepetition: true' : 'Wariant nie został zatwierdzony';
    } else if (item.channel === 'website') {
      const due = !item.plannedAt || new Date(item.plannedAt) <= new Date();
      if (!websiteConfigured().draft) out.website = 'Zapis do CMS nie jest skonfigurowany — artykuł czeka w Studio.';
      else if (due) {
        try {
          p = await publishWebsite(db, owner, publicationId, item.id, item.revision, actor);
          const done = p.items.find((i) => i.id === id);
          Object.assign(out, { status: done.status, url: done.externalUrl });
        } catch (err) {
          out.problem = `Publikacja na stronie nie udała się: ${err.message}. Studio ponowi ją automatycznie.`;
        }
      } else out.website = `Opublikuje się automatycznie ${new Date(item.plannedAt).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' })}.`;
    } else {
      out.files = [item.graphic, ...item.extraGraphics].flatMap((g) => pngFiles(g, item.format, agent));
      out.note = 'Opublikuj te pliki z tekstem kanału (Business Suite); potem Studio oznaczy kanał jako opublikowany po wpisaniu linku.';
    }
    channels.push(out);
  }
  const problems = channels.filter((c) => c.problem);
  return {
    publicationId,
    title: p.title,
    factsConfirmed: true,
    channels,
    note: problems.length
      ? 'Część kanałów wymaga poprawek — przekaż właścicielowi listę problemów w jednej wiadomości.'
      : 'Wszystko zatwierdzone. Pliki PNG z linków są ważne godzinę.',
  };
}
