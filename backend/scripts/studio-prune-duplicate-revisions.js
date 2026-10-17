#!/usr/bin/env node
/**
 * Usuwa duplikaty rewizji projektu Studio powstałe w pętli autozapisu (ta sama treść zapisana wiele razy z rzędu).
 * Jednorazowe sprzątanie po 2026-10-18 (projekt 3d4ef0a5-dd20-4f05-ae2e-ad5f9151f59c: rewizje 6 → 492).
 *
 *   node scripts/studio-prune-duplicate-revisions.js --project <uuid> [--apply]
 *   docker exec bkpk-backend-prod node scripts/studio-prune-duplicate-revisions.js --project <uuid>
 *
 * Bez --apply tylko pokazuje plan. Duplikat = rewizja z tym samym contentHash, templateVersion i brandVersion
 * co rewizja bezpośrednio przed nią. Z każdej serii zostaje najnowsza. Ta sama treść po innej zmianie
 * (A → B → A, np. przywrócenie z historii) nie jest duplikatem. Nigdy nie usuwa rewizji bieżącej ani takich,
 * do których odwołują się zatwierdzenia, eksporty lub zakończone zadania renderu.
 * Przed --apply zrób backup bazy zgodnie z docs/vps-runbook.md.
 */
import { pathToFileURL } from 'node:url';

// revisions: [{ id, number, contentHash, templateVersion, brandVersion }]; protectedNumbers: Set<number>.
export function duplicateRevisions(revisions, protectedNumbers) {
  const sorted = [...revisions].sort((a, b) => a.number - b.number);
  const sameAs = (a, b) => a.contentHash === b.contentHash && a.templateVersion === b.templateVersion && a.brandVersion === b.brandVersion;
  return sorted.filter((r, i) => i < sorted.length - 1 && sameAs(r, sorted[i + 1]) && !protectedNumbers.has(r.number));
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const projectId = args.includes('--project') ? args[args.indexOf('--project') + 1] : null;
  if (!projectId || !/^[0-9a-f-]{36}$/.test(projectId)) {
    console.error('Użycie: node scripts/studio-prune-duplicate-revisions.js --project <uuid> [--apply]');
    process.exit(1);
  }
  const { prisma } = await import('../lib/prisma.js');
  try {
    const project = await prisma.studioProject.findUnique({ where: { id: projectId }, select: { id: true, name: true, currentRevision: true } });
    if (!project) throw new Error(`Brak projektu ${projectId}`);
    const revisions = await prisma.studioRevision.findMany({
      where: { projectId },
      select: { id: true, number: true, contentHash: true, templateVersion: true, brandVersion: true, _count: { select: { approvals: true } } },
    });
    const [exports, jobs] = await Promise.all([
      prisma.studioExport.findMany({ where: { projectId }, select: { revision: true } }),
      prisma.studioJob.findMany({ where: { projectId, status: 'completed', revision: { not: null } }, select: { revision: true } }),
    ]);
    const protectedNumbers = new Set([
      project.currentRevision,
      ...revisions.filter((r) => r._count.approvals > 0).map((r) => r.number),
      ...exports.map((e) => e.revision),
      ...jobs.map((j) => j.revision),
    ]);
    const doomed = duplicateRevisions(revisions, protectedNumbers);
    console.log(`${project.name} (${projectId}): ${revisions.length} rewizji, bieżąca ${project.currentRevision}, chronione: ${[...protectedNumbers].sort((a, b) => a - b).join(', ')}`);
    console.log(`Duplikaty do usunięcia: ${doomed.length}${doomed.length ? ` (rewizje ${doomed[0].number}–${doomed.at(-1).number}, z przerwami na chronione)` : ''}`);
    if (!apply || !doomed.length) {
      if (doomed.length) console.log('Tryb podglądu. Dodaj --apply, aby usunąć.');
      return;
    }
    const deleted = await prisma.$transaction(async (tx) => {
      const current = await tx.studioProject.findUnique({ where: { id: projectId }, select: { currentRevision: true } });
      if (current.currentRevision !== project.currentRevision) throw new Error('Projekt zmienił się w trakcie — uruchom ponownie.');
      return tx.studioRevision.deleteMany({ where: { projectId, id: { in: doomed.map((r) => r.id) } } });
    });
    console.log(`Usunięto ${deleted.count} rewizji.`);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
