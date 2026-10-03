// Run only against a separate restored database. It does not restore into production.
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { renderJob } from './render.js';
import { filePath, hash } from './storage.js';
import fs from 'node:fs/promises';
const restoredUrl = process.env.STUDIO_RESTORE_DATABASE_URL;
if (!restoredUrl || restoredUrl === process.env.DATABASE_URL) throw new Error('Podaj STUDIO_RESTORE_DATABASE_URL osobnej bazy odtworzeniowej, różny od produkcyjnego DATABASE_URL');
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: restoredUrl }) });
try {
 const job = await db.studioJob.findFirst({ where: { kind: 'preview', status: { in: ['completed', 'expired'] } }, orderBy: { createdAt: 'desc' } });
 if (!job) throw new Error('Kopia nie zawiera projektu z podglądem');
 const one = await renderJob(db, job); const before = await fs.readFile(filePath(one.files[0].storageKey));
 const two = await renderJob(db, job); const after = await fs.readFile(filePath(two.files[0].storageKey));
 if (hash(before) !== hash(after)) throw new Error('Render po odtworzeniu jest niedeterministyczny');
 console.log(JSON.stringify({ restored: true, projectId: job.projectId, revision: job.revision, pngSHA256: hash(after) }));
} finally { await db.$disconnect(); }
