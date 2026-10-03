import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { saveImage, filePath, hash } from './storage.js';
const packageDir = fileURLToPath(new URL('./backgrounds/', import.meta.url));
const manifestSchema = z.object({
  version: z.string().min(1), generator: z.string().min(1), note: z.string(),
  assets: z.array(z.object({
    file: z.string().regex(/^\d{2}-[a-z-]+\.png$/), name: z.string().min(1).max(180),
    status: z.enum(['approved', 'draft']), prompt: z.string().min(1),
    generatedAt: z.string().datetime(), sha256: z.string().regex(/^[a-f0-9]{64}$/),
  }).strict()).min(1),
}).strict();

export async function readBackgroundPack() {
  const manifest = manifestSchema.parse(JSON.parse(await fs.readFile(path.join(packageDir, 'manifest.json'), 'utf8')));
  if (new Set(manifest.assets.map(a => a.file)).size !== manifest.assets.length) throw new Error('Duplicate background filename');
  const assets = [];
  for (const entry of manifest.assets) {
    const buffer = await fs.readFile(path.join(packageDir, entry.file));
    if (hash(buffer) !== entry.sha256) throw new Error(`Background integrity failed: ${entry.file}`);
    assets.push({ ...entry, buffer });
  }
  return { ...manifest, assets };
}

// Explicit operator import; no implicit seed on login or worker startup.
// Existing publication decisions are never reset by a release or a repeat import.
export async function importBackgroundPack(db, ownerId) {
  if (!ownerId || !await db.rosterPlayer.findUnique({ where: { id: ownerId }, select: { id: true } })) throw new Error('Studio owner does not exist');
  const pack = await readBackgroundPack();
  const written = [];
  try {
    return await db.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`studio-background-import:${ownerId}`}))`;
      const result = [];
      for (const entry of pack.assets) {
        const image = await saveImage(entry.buffer);
        written.push(image.storageKey);
        const existing = await tx.studioAsset.findFirst({ where: { ownerId, kind: 'background', contentHash: image.contentHash } });
        if (existing) {
          await fs.unlink(filePath(image.storageKey));
          written.pop();
          result.push({ id: existing.id, name: existing.name, status: existing.status, created: false });
          continue;
        }
        const asset = await tx.studioAsset.create({ data: {
          ownerId, ...image, name: entry.name, kind: 'background', status: entry.status, consent: 'not_required',
          origin: 'OpenAI image_gen / Codex · ilustracja AI · poza budżetem Gemini Studio',
          provenance: { model: pack.generator, prompt: entry.prompt, promptHash: hash(entry.prompt), generatedAt: entry.generatedAt,
            chargedMicros: 0, billingSource: 'external', externalCostKnown: false, packageVersion: pack.version,
            importBatch: `background-pack:${pack.version}:${entry.file}`, sourceSha256: entry.sha256,
            approvalSource: entry.status === 'approved' ? 'Użytkownik zaakceptował podglądy w rozmowie' : null },
        } });
        result.push({ id: asset.id, name: asset.name, status: asset.status, created: true });
      }
      return result;
    }, { timeout: 120_000 });
  } catch (err) {
    await Promise.all(written.map(key => fs.unlink(filePath(key)).catch(() => {})));
    throw err;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { prisma } = await import('../lib/prisma.js');
  try { console.log(JSON.stringify(await importBackgroundPack(prisma, process.env.STUDIO_OWNER_ID))); }
  finally { await prisma.$disconnect(); }
}
