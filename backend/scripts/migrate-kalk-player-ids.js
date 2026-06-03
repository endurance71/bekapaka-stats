#!/usr/bin/env node
/**
 * Migracja legacy KalkPlayer.id → `{seasonSlug}__{externalId}`.
 * Przenosi KalkPlayerGameLog i RosterPlayer.kalkPlayerId, usuwa duplikat legacy.
 *
 *   node backend/scripts/migrate-kalk-player-ids.js
 *   node backend/scripts/migrate-kalk-player-ids.js --dry-run
 */
import { PrismaClient } from '@prisma/client';
import { buildKalkPlayerDbId } from '../lib/kalkSeason.js';
import { ensureDefaultSeason, getActiveSeason } from '../seasonService.js';

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');

await ensureDefaultSeason();
const season = await getActiveSeason();
if (!season) {
  console.error('Brak aktywnego sezonu');
  process.exit(1);
}

const players = await prisma.kalkPlayer.findMany({
  where: { seasonId: season.id }
});

const byId = new Map(players.map((p) => [p.id, p]));
let migrated = 0;
let deleted = 0;
let skipped = 0;

for (const legacy of players) {
  if (legacy.id.includes('__')) continue;

  const canonicalId = buildKalkPlayerDbId(season.slug, legacy.id);
  if (!canonicalId || canonicalId === legacy.id) {
    skipped += 1;
    continue;
  }

  const canonical = byId.get(canonicalId);
  if (!canonical) {
    console.log(`[skip] Brak kanonicznego rekordu dla ${legacy.id} → ${canonicalId}`);
    skipped += 1;
    continue;
  }

  const logs = await prisma.kalkPlayerGameLog.count({
    where: { seasonId: season.id, kalkPlayerId: legacy.id }
  });
  const rosterLinks = await prisma.rosterPlayer.count({
    where: { kalkPlayerId: legacy.id }
  });

  console.log(
    `Migrate ${legacy.name}: ${legacy.id} → ${canonicalId} (logs=${logs}, roster=${rosterLinks})`
  );

  if (!dryRun) {
    if (logs > 0) {
      await prisma.kalkPlayerGameLog.updateMany({
        where: { seasonId: season.id, kalkPlayerId: legacy.id },
        data: { kalkPlayerId: canonicalId }
      });
    }
    if (rosterLinks > 0) {
      await prisma.rosterPlayer.updateMany({
        where: { kalkPlayerId: legacy.id },
        data: { kalkPlayerId: canonicalId }
      });
    }
    await prisma.kalkPlayer.delete({ where: { id: legacy.id } });
  }

  migrated += 1;
  deleted += 1;
}

console.log(
  JSON.stringify(
    { dryRun, season: season.slug, migrated, deleted, skipped },
    null,
    2
  )
);

await prisma.$disconnect();
process.exit(0);
