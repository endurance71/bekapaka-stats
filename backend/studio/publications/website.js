// Website channel → Strapi news-post. Studio keeps one CMS document per publication variant:
// draft first (preview on bekapaka.pl in draft mode), published only after the owner approved the variant.
// IMPORTANT: Strapi 5 REST create/update without `?status=draft` PUBLISHES immediately — every draft call sets it.
import fs from 'node:fs/promises';
import { fail } from '../config.js';
import { filePath, hash } from '../storage.js';
import { hasErrors, lintCopy } from './brand-lint.js';
import { publicationView } from './service.js';

export const websiteConfig = () => ({
  cmsUrl: process.env.STUDIO_CMS_URL || '',
  writeToken: process.env.STUDIO_CMS_WRITE_TOKEN || '',
  siteUrl: (process.env.STUDIO_SITE_URL || 'https://bekapaka.pl').replace(/\/$/, ''),
  previewSecret: process.env.STUDIO_SITE_PREVIEW_SECRET || '',
  revalidateUrl: process.env.SITE_BASE_URL || '',
  revalidateSecret: process.env.SITE_REVALIDATE_SECRET || '',
});
export const websiteConfigured = () => {
  const c = websiteConfig();
  return { draft: !!(c.cmsUrl && c.writeToken), preview: !!c.previewSecret, revalidate: !!(c.revalidateUrl && c.revalidateSecret) };
};

const polish = { ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' };
export function slugify(title) {
  const base = String(title)
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (ch) => polish[ch])
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
  return base || 'aktualnosc';
}

async function cms(path, { method = 'GET', query, body, form } = {}) {
  const c = websiteConfig();
  if (!c.cmsUrl || !c.writeToken) fail(503, 'Zapis do CMS nie jest skonfigurowany (STUDIO_CMS_WRITE_TOKEN).');
  const url = new URL(path, c.cmsUrl);
  for (const [k, v] of Object.entries(query || {})) url.searchParams.set(k, v);
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${c.writeToken}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: form || (body ? JSON.stringify(body) : undefined),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    fail(502, 'CMS nie odpowiada. Spróbuj ponownie za chwilę.');
  }
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = json?.error?.message ? `: ${String(json.error.message).slice(0, 200)}` : '';
    fail(502, `CMS odrzucił żądanie (${response.status})${detail}`);
  }
  return json;
}
const asDraft = { status: 'draft' };

async function uniqueSlug(title, documentId) {
  const base = slugify(title);
  for (let n = 1; n < 50; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const taken = await Promise.all(
      ['draft', 'published'].map((status) =>
        cms('/api/news-posts', { query: { 'filters[slug][$eq]': slug, status, 'fields[0]': 'slug' } }),
      ),
    );
    if (!taken.some((r) => (r.data || []).some((d) => d.documentId !== documentId))) return slug;
  }
  fail(409, 'Nie udało się dobrać wolnego adresu artykułu');
}

// Studio graphics combine brand material and approved photos; the export already enforced consent.
function consentFor(graphicManifestAssets = []) {
  const photos = graphicManifestAssets.filter((a) => a.consent && a.consent !== 'not_required');
  return photos.length ? 'granted' : 'not_required';
}
function authorFor(assets = []) {
  const origins = [...new Set(assets.map((a) => a.origin).filter((o) => o && !/^Gemini|pakiet marki/i.test(o)))];
  return ['BeKaPaKa Studio', ...origins].join(' · ').slice(0, 250);
}

async function context(db, owner, pubId, itemId) {
  const view = await publicationView(db, owner, pubId);
  const item = view.items.find((i) => i.id === itemId);
  if (!item || item.channel !== 'website') fail(404, 'Ta publikacja nie ma wariantu strony');
  return { view, item };
}
async function lastSync(db, itemId) {
  const event = await db.studioPublishEvent.findFirst({ where: { itemId, action: 'cms-draft' }, orderBy: { createdAt: 'desc' } });
  return event?.payload || null;
}

async function coverFile(db, owner, item) {
  if (!item.graphic?.exportJobId) fail(422, 'Wygeneruj eksport grafiki — okładka artykułu pochodzi z eksportu.');
  const job = await db.studioJob.findFirst({ where: { id: item.graphic.exportJobId, ownerId: owner } });
  if (!job || new Date(job.result?.expiresAt || 0) <= new Date()) fail(409, 'Eksport grafiki wygasł. Wygeneruj go ponownie.');
  const file = (job.result.files || []).find((f) => f.mime === 'image/png' && (f.key === item.format || f.key.startsWith(`${item.format}-`)));
  if (!file) fail(422, `Eksport nie zawiera formatu ${item.format}`);
  const exportRow = await db.studioExport.findUnique({ where: { jobId: job.id } });
  return { file, assets: exportRow?.manifest?.assets || [] };
}

function newsData(view, item, slug, coverId) {
  const c = item.copy;
  const date = Number.isFinite(Date.parse(view.facts.date)) ? view.facts.date : null;
  return {
    title: c.title,
    slug,
    excerpt: c.excerpt,
    content: item.graphic?.aiAssets ? `${c.content}\n\n_Ilustracja tła wygenerowana przy użyciu AI._` : c.content,
    tags: c.tags,
    coverImage: coverId,
    // Portrait covers (4:5) are shown whole on the site; landscape fills the frame.
    imageFit: item.format === 'landscape' ? 'cover' : 'contain',
    ...(date ? { eventDate: date } : {}),
  };
}

// One CMS operation per variant at a time: a double click must not create two articles.
const locks = new Map();
async function exclusive(key, fn) {
  const previous = locks.get(key) || Promise.resolve();
  const current = previous.catch(() => undefined).then(fn);
  locks.set(key, current);
  try {
    return await current;
  } finally {
    if (locks.get(key) === current) locks.delete(key);
  }
}

/** Creates or refreshes the CMS draft of the website variant. Never publishes. */
export const syncWebsiteDraft = (db, owner, pubId, itemId) => exclusive(itemId, () => syncDraft(db, owner, pubId, itemId));
async function syncDraft(db, owner, pubId, itemId) {
  const { view, item } = await context(db, owner, pubId, itemId);
  if (item.status === 'published') fail(409, 'Artykuł jest już opublikowany');
  if (item.status === 'skipped') fail(409, 'Kanał strony jest pominięty');
  if (hasErrors(lintCopy('website', item.copy, view.facts))) fail(422, 'Popraw błędy w tekście artykułu przed zapisem do CMS');
  const previous = await lastSync(db, item.id);
  const { file, assets } = await coverFile(db, owner, item);

  let cover = previous && previous.coverSha === file.sha256 ? { id: previous.coverFileId, url: previous.coverUrl } : null;
  if (!cover) {
    const form = new FormData();
    const bytes = await fs.readFile(filePath(file.storageKey));
    form.append('files', new Blob([bytes], { type: 'image/png' }), `bekapaka-${slugify(item.copy.title)}.png`);
    form.append('fileInfo', JSON.stringify({ alternativeText: item.copy.coverAlt || item.copy.title, caption: '' }));
    const [uploaded] = await cms('/api/upload', { method: 'POST', form });
    cover = { id: uploaded.id, url: uploaded.url };
  }
  // The site shows a cover only with a published media record (alt, author, consent).
  const record = { url: cover.url, media: cover.id, alt: (item.copy.coverAlt || item.copy.title).slice(0, 250), author: authorFor(assets), consentStatus: consentFor(assets) };
  const mediaRecordId =
    previous?.mediaRecordId && previous.coverUrl === cover.url
      ? (await cms(`/api/media-records/${previous.mediaRecordId}`, { method: 'PUT', query: { status: 'published' }, body: { data: record } })).data.documentId
      : (await cms('/api/media-records', { method: 'POST', query: { status: 'published' }, body: { data: record } })).data.documentId;

  const slug = previous?.slug || (await uniqueSlug(item.copy.title, item.externalId));
  const data = newsData(view, item, slug, cover.id);
  const documentId = item.externalId
    ? (await cms(`/api/news-posts/${item.externalId}`, { method: 'PUT', query: asDraft, body: { data } })).data.documentId
    : (await cms('/api/news-posts', { method: 'POST', query: asDraft, body: { data } })).data.documentId;

  await db.$transaction(async (tx) => {
    await tx.studioPublicationItem.update({ where: { id: item.id }, data: { externalId: documentId, error: null, revision: { increment: 1 } } });
    await tx.studioPublishEvent.create({
      data: {
        itemId: item.id,
        action: 'cms-draft',
        actor: 'owner',
        payload: { documentId, slug, coverFileId: cover.id, coverUrl: cover.url, coverSha: file.sha256, mediaRecordId, copyHash: hash(item.copy) },
      },
    });
  });
  return publicationView(db, owner, pubId);
}

/** Draft-mode preview on bekapaka.pl, the same mechanism as the CMS preview button. */
export async function websitePreviewUrl(db, owner, pubId, itemId) {
  const { item } = await context(db, owner, pubId, itemId);
  const synced = await lastSync(db, item.id);
  if (!synced) fail(409, 'Najpierw utwórz szkic na stronie');
  const c = websiteConfig();
  if (!c.previewSecret) fail(503, 'Podgląd strony nie jest skonfigurowany (STUDIO_SITE_PREVIEW_SECRET).');
  const params = new URLSearchParams({ url: `/aktualnosci/${synced.slug}`, secret: c.previewSecret, status: item.status === 'published' ? 'published' : 'draft' });
  return `${c.siteUrl}/api/preview?${params}`;
}

async function revalidateSite() {
  const c = websiteConfig();
  if (!c.revalidateUrl || !c.revalidateSecret) return false;
  try {
    const response = await fetch(new URL('/api/revalidate', c.revalidateUrl), {
      method: 'POST',
      headers: { 'x-revalidate-secret': c.revalidateSecret, 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'studio' }),
      signal: AbortSignal.timeout(8000),
    });
    return response.ok;
  } catch {
    // The site also refreshes on its own within about 60 s.
    return false;
  }
}

/** Publishes the approved variant: refreshes the draft if copy or cover changed, publishes, revalidates. */
export const publishWebsite = (db, owner, pubId, itemId, expectedRevision) =>
  exclusive(itemId, () => publish(db, owner, pubId, itemId, expectedRevision));
async function publish(db, owner, pubId, itemId, expectedRevision) {
  let { view, item } = await context(db, owner, pubId, itemId);
  if (item.revision !== expectedRevision) fail(409, 'Wariant zmienił się na innym urządzeniu. Odśwież widok.');
  if (item.status !== 'approved' || item.stale) fail(422, 'Opublikować można tylko aktualnie zatwierdzony wariant strony');
  const synced = await lastSync(db, item.id);
  const { file } = await coverFile(db, owner, item);
  if (!synced || synced.copyHash !== hash(item.copy) || synced.coverSha !== file.sha256 || !item.externalId) {
    view = await syncDraft(db, owner, pubId, itemId);
    item = view.items.find((i) => i.id === itemId);
  }
  const { slug } = await lastSync(db, item.id);
  await cms(`/api/news-posts/${item.externalId}`, { method: 'PUT', query: { status: 'published' }, body: { data: { publishedAtCustom: new Date().toISOString() } } });
  const revalidated = await revalidateSite();
  const url = `${websiteConfig().siteUrl}/aktualnosci/${slug}`;
  await db.$transaction(async (tx) => {
    // Approval stays valid: syncing the draft only stored the CMS ids, not a copy change.
    await tx.studioPublicationItem.update({ where: { id: item.id }, data: { status: 'published', publishedAt: new Date(), externalUrl: url, revision: { increment: 1 } } });
    await tx.studioPublishEvent.create({ data: { itemId: item.id, action: 'published', actor: 'owner', payload: { url, cms: true, documentId: item.externalId, revalidated } } });
  });
  return publicationView(db, owner, pubId);
}
