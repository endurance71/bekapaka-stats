#!/usr/bin/env node
/**
 * Zamiana sezonu ze starej strony KALK (legacy) na dane KALK v2 — np. 2025/2026.
 *
 *   node scripts/kalk-replace-season.js --season 2025-2026 --bundle <plik v3 z kalk_sync.py> [--dry-run] [--force]
 *
 * Kroki:
 *   1. Mapowanie starych meczów (stare ID) na nowe (KALK v2) po dacie ±1 dzień + wyniku (+ nazwach drużyn).
 *      Każdy mecz BeKaPaKa musi się zmapować, inaczej przerwanie (chyba że --force).
 *   2. Transakcja: zapamiętanie analiz AI i prezentacji, usunięcie danych KALK sezonu
 *      (mecze z logami/PBP, drużyny, zawodnicy, terminarz, tabela, snapshoty), sezon → sourceSite v2.
 *      Wiersze `Game` (archiwum) i skład nie są usuwane.
 *   3. Import pliku v2 (`ingestKalkV2Bundle`, idempotentny — można powtórzyć z --resume).
 *   4. Przeniesienie analiz AI / prezentacji na nowe ID + aliasy stare → nowe (`KalkMatchIdAlias`).
 *
 * Najpierw zrób kopię bazy (pg_dump). Kody wyjścia: 0 = OK, 1 = błąd / niepełne mapowanie, 2 = argumenty.
 */
import fs from 'fs/promises';
import { validateKalkV2Bundle } from '../kalk/v2/validateBundle.js';

function argValue(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

const seasonSlug = argValue('--season');
const bundlePath = argValue('--bundle');
const dryRun = process.argv.includes('--dry-run');
const force = process.argv.includes('--force');
const resume = process.argv.includes('--resume');
if (!seasonSlug || !bundlePath) {
  console.error('Użycie: node scripts/kalk-replace-season.js --season 2025-2026 --bundle plik.json [--dry-run] [--force] [--resume]');
  process.exit(2);
}

import { matchLegacyToV2, isBkpk } from '../kalk/v2/legacyMapping.js';

let bundle;
try {
  bundle = JSON.parse(await fs.readFile(bundlePath, 'utf-8'));
} catch (err) {
  console.error(`Nie można odczytać ${bundlePath}: ${err.message}`);
  process.exit(2);
}
const validation = validateKalkV2Bundle(bundle);
if (!validation.ok) {
  console.error(`Walidacja pliku: ${validation.errors.join('; ')}`);
  process.exit(1);
}
if (bundle.manifest.seasonSlug !== seasonSlug) {
  console.error(`Plik dotyczy sezonu ${bundle.manifest.seasonSlug}, a nie ${seasonSlug}.`);
  process.exit(1);
}

const { prisma } = await import('../lib/prisma.js');
const { ingestKalkV2Bundle } = await import('../kalk/v2/ingestSeason.js');
const { withKalkSyncLock } = await import('../kalk/v2/lock.js');

const STASH_PATH = `${bundlePath}.replace-stash.json`;

try {
  const season = await prisma.kalkSeason.findUnique({ where: { slug: seasonSlug } });
  if (!season) throw new Error(`Brak sezonu ${seasonSlug} w bazie.`);
  if (season.isActive && !force) throw new Error('Sezon jest aktywny — zamiana dotyczy sezonów archiwalnych (użyj --force świadomie).');

  let stash;
  if (resume) {
    stash = JSON.parse(await fs.readFile(STASH_PATH, 'utf-8'));
    console.log(`Wznowienie: ${stash.mapping.length} mapowań z ${STASH_PATH}`);
  } else {
    if (season.sourceSite === 'v2') throw new Error(`Sezon ${seasonSlug} jest już v2 — użyj kalk-sync-v2.js lub --resume.`);
    const legacy = await prisma.kalkMatch.findMany({
      where: { seasonId: season.id },
      select: {
        id: true, date: true, homeTeamName: true, guestTeamName: true, scoreHome: true, scoreAway: true, isFinished: true,
        aiSummary: true, aiSummaryAt: true, aiSummaryModel: true, aiSummaryHash: true,
        presentation: true, presentationUpdatedAt: true
      }
    });
    const mapping = [];
    const unmapped = [];
    const used = new Set();
    for (const m of legacy.filter((x) => x.isFinished)) {
      const g = matchLegacyToV2(m, bundle.schedule);
      if (g && !used.has(g.kalkMatchId)) {
        used.add(g.kalkMatchId);
        mapping.push({ legacyId: m.id, kalkMatchId: g.kalkMatchId, bkpk: isBkpk(m.homeTeamName) || isBkpk(m.guestTeamName) });
      } else {
        unmapped.push({ id: m.id, date: m.date, pair: `${m.homeTeamName} – ${m.guestTeamName}`, score: `${m.scoreHome}:${m.scoreAway}` });
      }
    }
    const carry = legacy.filter((m) => m.aiSummary || m.presentation);
    const bkpkUnmapped = unmapped.filter((u) => isBkpk(u.pair));
    console.log(`Stare mecze: ${legacy.length} (zakończone ${legacy.filter((x) => x.isFinished).length}); zmapowane ${mapping.length}; niezmapowane ${unmapped.length} (BeKaPaKa: ${bkpkUnmapped.length})`);
    console.log(`Analizy AI / prezentacje do przeniesienia: ${carry.length}`);
    for (const u of unmapped) console.log(`  NIEZMAPOWANY ${u.id} ${new Date(u.date).toISOString().slice(0, 10)} ${u.pair} ${u.score}`);
    const counts = Object.fromEntries(
      await Promise.all(
        ['kalkMatch', 'kalkTeam', 'kalkPlayer', 'leagueMatch', 'leagueTeam', 'kalkPlayerGameLog'].map(async (model) => [
          model,
          await prisma[model].count({ where: { seasonId: season.id } })
        ])
      )
    );
    console.log(`Do usunięcia: ${JSON.stringify(counts)}`);
    if (bkpkUnmapped.length && !force) throw new Error('Nie wszystkie mecze BeKaPaKa się zmapowały — przerwano bez zmian (sprawdź listę, ewentualnie --force).');
    if (dryRun) {
      console.log('Dry-run: bez zmian w bazie.');
      await prisma.$disconnect();
      process.exit(0);
    }

    stash = {
      season: seasonSlug,
      createdAt: new Date().toISOString(),
      mapping,
      carry: carry.map((m) => ({
        legacyId: m.id,
        aiSummary: m.aiSummary, aiSummaryAt: m.aiSummaryAt, aiSummaryModel: m.aiSummaryModel, aiSummaryHash: m.aiSummaryHash,
        presentation: m.presentation, presentationUpdatedAt: m.presentationUpdatedAt
      }))
    };
    await fs.writeFile(STASH_PATH, JSON.stringify(stash, null, 2));
    console.log(`Zapisano kopię analiz i mapowania: ${STASH_PATH}`);

    await withKalkSyncLock(() =>
      prisma.$transaction(
        async (tx) => {
          await tx.kalkMatch.deleteMany({ where: { seasonId: season.id } }); // logi, PBP, sumy drużyn — kaskadowo
          await tx.kalkPlayer.deleteMany({ where: { seasonId: season.id } });
          await tx.kalkTeam.deleteMany({ where: { seasonId: season.id } });
          await tx.leagueMatch.deleteMany({ where: { seasonId: season.id } });
          await tx.leagueTeam.deleteMany({ where: { seasonId: season.id } });
          await tx.kalkSectionSnapshot.deleteMany({ where: { seasonId: season.id } });
          await tx.kalkPlayerSeasonStat.deleteMany({ where: { seasonId: season.id } });
          await tx.kalkSeason.update({
            where: { id: season.id },
            data: { sourceSite: 'v2', kalkNumber: bundle.manifest.kalkNumber, divisionPath: 'liga/dywizja-ii' }
          });
        },
        { timeout: 120_000 }
      )
    );
    console.log('Usunięto dane starej strony; sezon oznaczony jako v2.');
  }

  const result = await withKalkSyncLock(() => ingestKalkV2Bundle(bundle, { prisma, pruneSchedule: true }));
  console.log(`Import v2: mecze +${result.matches.created} ~${result.matches.updated} =${result.matches.unchanged}, logi ${result.gameLogs.written}, zawodnicy +${result.kalkPlayers.created}`);

  const byLegacy = new Map(stash.mapping.map((m) => [m.legacyId, m.kalkMatchId]));
  let moved = 0;
  for (const c of stash.carry) {
    const target = byLegacy.get(c.legacyId);
    if (!target) continue;
    await prisma.kalkMatch.update({
      where: { seasonId_id: { seasonId: season.id, id: target } },
      data: {
        aiSummary: c.aiSummary, aiSummaryAt: c.aiSummaryAt ? new Date(c.aiSummaryAt) : null, aiSummaryModel: c.aiSummaryModel,
        aiSummaryHash: c.aiSummaryHash, presentation: c.presentation ?? undefined,
        presentationUpdatedAt: c.presentationUpdatedAt ? new Date(c.presentationUpdatedAt) : null
      }
    });
    moved++;
  }
  for (const m of stash.mapping) {
    if (m.legacyId === m.kalkMatchId) continue;
    await prisma.kalkMatchIdAlias.upsert({
      where: { legacyId: m.legacyId },
      create: { legacyId: m.legacyId, seasonId: season.id, kalkMatchId: m.kalkMatchId },
      update: { seasonId: season.id, kalkMatchId: m.kalkMatchId }
    });
  }
  console.log(`Przeniesiono analizy/prezentacje: ${moved}; aliasy ID: ${stash.mapping.length}. Analizy AI tego sezonu będą oznaczone jako nieaktualne (nowe dane) — regeneracja ręcznie w panelu.`);
  await prisma.$disconnect();
  process.exit(0);
} catch (err) {
  console.error(`Zamiana sezonu nieudana: ${err.message}`);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
}
