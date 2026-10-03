import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { zipSync, strToU8 } from 'fflate';
import { brandDir, studioDir } from './config.js';
import { filePath, hash } from './storage.js';
import { context, projectView, validation } from './service.js';
import { BRAND_VERSION, RENDERER_VERSION } from './contracts.js';
const exec = promisify(execFile);
export async function renderJob(db, job) {
  const view = await projectView(db, job.ownerId, job.projectId, job.revision);
  if (view.revision.contentHash !== job.payload.projectHash) throw new Error('Niezgodna rewizja zadania');
  const ctx = await context(db, job.ownerId, view);
  if (job.kind === 'export') { const v = await validation(db, job.ownerId, view); if (!v.valid) throw new Error(v.errors.map(e => `${e.field}: ${e.message}`).join('; ')); }
  const dirKey = `jobs/${job.id}`; const dir = filePath(dirKey); await fs.mkdir(dir, { recursive: true });
  const assets = Object.fromEntries(ctx.assets.map(a => [a.id, { path: filePath(a.storageKey), width: a.width, height: a.height, provenance: a.provenance }]));
  const partners = ctx.partners.map(p => ({ ...p, logoPath: /^logo-\d\d\.png$/.test(p.seedLogo || '') ? path.join(brandDir, '02_system/partnerzy', p.seedLogo) : null }));
  const requested = job.kind === 'preview' ? [job.payload.format] : view.payload.formats;
  const files = []; const checks = [];
  for (const format of requested) {
    const req = path.join(dir, `${format}-request.json`);
    await fs.writeFile(req, JSON.stringify({ project: view.payload, format, output: dir, mode: job.kind, assets, partners }), { mode: 0o600 });
    let out;
    try { out = await exec(process.env.STUDIO_PYTHON || path.join(studioDir, '.venv/bin/python'), [path.join(studioDir, 'renderer/render.py'), req], { timeout: 120_000, maxBuffer: 3 * 1024 * 1024 }); }
    catch (err) { const message = (() => { try { return JSON.parse(err.stdout).error; } catch { return 'Renderowanie nie powiodło się. Sprawdź pola i długość tekstów.'; } })(); throw new Error(message); }
    const rendered = JSON.parse(out.stdout); checks.push(...rendered.checks);
    for (const f of rendered.files) {
      const name = `bekapaka-${view.family}-${f.key}.png`; const key = `${dirKey}/${name}`;
      const png = await sharp(await fs.readFile(f.svg), { limitInputPixels: 8_000_000 }).toColourspace('srgb').withIccProfile('srgb').png().toBuffer();
      await fs.writeFile(filePath(key), png, { mode: 0o600 });
      files.push({ key: f.key, name, mime: 'image/png', storageKey: key, width: f.width, height: f.height, sha256: hash(png) });
    }
  }
  const expiresAt = new Date(Date.now() + (job.kind === 'preview' ? 1 : 30) * 86400_000).toISOString();
  if (job.kind === 'export') {
    const manifest = { projectId: view.id, name: view.name, family: view.family, revision: job.revision, contentHash: view.revision.contentHash, project: view.payload, brandVersion: BRAND_VERSION, templateVersion: view.revision.templateVersion, rendererVersion: RENDERER_VERSION, createdAt: new Date().toISOString(), source: view.payload.content.source, assets: ctx.assets.map(a => ({ id: a.id, name: a.name, hash: a.contentHash, origin: a.origin, consent: a.consent, provenance: a.provenance })), partners: ctx.partners.map(p => ({ id: p.id, name: p.name, assetId: p.assetId, contractNote: p.contractNote })), files: files.map(({ storageKey, ...f }) => f), checks };
    const ai = ctx.assets.some(a => a.provenance); const d = view.payload.content;
    const texts = { caption: `${d.caption}${d.link ? '\n' + d.link : ''}${ai ? '\nIlustracja tła wygenerowana przy użyciu AI.' : ''}`, altText: `${d.altText}${ai ? ' Tło jest ilustracją AI.' : ''}`, aiDisclosure: ai ? 'Ilustracja tła wygenerowana przy użyciu AI.' : '' };
    const altTexts = files.map(f => ({ file: f.name, text: view.family === 'report' && view.payload.variant === 'carousel' ? d.slides[Number(f.key.split('-').at(-1)) - 1]?.altText || texts.altText : texts.altText }));
    const contents = { 'teksty-alternatywne.json': strToU8(JSON.stringify(altTexts, null, 2)), 'manifest.json': strToU8(JSON.stringify(manifest, null, 2)), 'opis-posta.txt': strToU8(texts.caption), 'tekst-alternatywny.txt': strToU8(texts.altText), 'oznaczenie-ai.txt': strToU8(texts.aiDisclosure) };
    let total = 0;
    for (const f of files) { const bytes = await fs.readFile(filePath(f.storageKey)); total += bytes.length; if (total > 128 * 1024 * 1024) throw new Error('Paczka przekracza 128 MB. Zmniejsz liczbę wybranych formatów lub slajdów.'); contents[f.name] = new Uint8Array(bytes); }
    const zipName = `bekapaka-${view.family}-r${job.revision}.zip`; const key = `${dirKey}/${zipName}`;
    const zip = zipSync(contents, { level: 0 }); await fs.writeFile(filePath(key), zip, { mode: 0o600 });
    files.push({ key: 'zip', name: zipName, mime: 'application/zip', storageKey: key, sha256: hash(zip) });
    await db.studioExport.upsert({ where: { jobId: job.id }, update: { manifest, files, storageKey: key, expiresAt: new Date(expiresAt) }, create: { ownerId: job.ownerId, projectId: view.id, revision: job.revision, jobId: job.id, manifest, files, storageKey: key, expiresAt: new Date(expiresAt) } });
  }
  // Source SVGs and request files are internal, never exposed by the file endpoint.
  return { files, checks, resourceHash: ctx.resourceHash, revision: job.revision, expiresAt, brandVersion: BRAND_VERSION };
}
