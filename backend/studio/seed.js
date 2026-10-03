import fs from 'node:fs/promises';
import path from 'node:path';
import { templates, BRAND_VERSION } from './contracts.js';
import { brandDir, ownerId } from './config.js';
export async function seedStudio(db, owner = ownerId()) {
  if (!owner) return;
  for (const t of templates) {
    const id = `${owner}:${t.id}:${t.version}:${BRAND_VERSION}`;
    await db.studioTemplate.upsert({ where: { id }, create: { id, ownerId: owner, family: t.id, version: t.version, brandVersion: BRAND_VERSION }, update: {} });
  }
  const source = JSON.parse(await fs.readFile(path.join(brandDir, '02_system/partnerzy/partnerzy.json'), 'utf8'));
  for (const p of source.logo) {
    const id = `${owner}:${p.id}`;
    await db.studioPartner.upsert({ where: { id }, create: { id, ownerId: owner, name: p.nazwa, seedLogo: p.id === 'pompui' ? null : p.plik }, update: {} });
  }
}
if (process.argv[1]?.endsWith('/seed.js')) {
  const { prisma } = await import('../lib/prisma.js');
  if (!ownerId()) throw new Error('Ustaw STUDIO_OWNER_ID');
  await seedStudio(prisma); await prisma.$disconnect();
}
