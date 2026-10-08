#!/usr/bin/env node
/**
 * Synchronizacja / backfill KALK v2 (Dywizja II) z linii poleceń.
 *
 *   node scripts/kalk-sync-v2.js --season <slug|nr KALK|history|active> [--mode full|incremental]
 *        [--matches 4116,4120] [--budget 1500] [--cache-mode read|refresh|off] [--json]
 *
 *   --season history   sezony BeKaPaKa od 2023/24 (47..aktywny), kolejno
 *   --season active    aktywny sezon (domyślnie)
 *   --cache-mode read  backfill: strony z cache bez ponownego pobierania (wznowienie po błędzie)
 *
 * Nowy sezon (np. 2023-2024) jest tworzony jako nieaktywny. Sezony ze starej strony
 * (sourceSite=legacy, np. lokalny 2025-2026) wymagają zamiany: scripts/kalk-replace-season.js.
 * Kody wyjścia: 0 = OK, 1 = błąd importu/scrapingu, 2 = złe argumenty.
 */
import { seasonLabelFromSlug, seasonRangeFromSlug } from '../kalk/v2/util.js';

const FIRST_BEKAPAKA_SEASON = 47; // 2023/2024
const CURRENT_KALK_NUMBER = 50; // 2026/2027 (punkt odniesienia dla mapowania numer → rok)

function argValue(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

export function slugFromKalkNumber(n) {
  const start = 2026 - (CURRENT_KALK_NUMBER - n);
  return `${start}-${start + 1}`;
}

export function kalkNumberFromSlug(slug) {
  const m = String(slug).match(/^(\d{4})-(\d{4})$/);
  if (!m) return null;
  return CURRENT_KALK_NUMBER - (2026 - Number(m[1]));
}

const seasonArg = argValue('--season', 'active');
const mode = argValue('--mode', 'full');
const matches = argValue('--matches')?.split(',').map((s) => s.trim()).filter(Boolean) || null;
const budget = Number(argValue('--budget', '1500'));
const cacheMode = argValue('--cache-mode', 'read');
const json = process.argv.includes('--json');

if (!['full', 'incremental'].includes(mode) || !['read', 'refresh', 'off'].includes(cacheMode) || !Number.isFinite(budget)) {
  console.error('Złe argumenty. Zobacz nagłówek pliku.');
  process.exit(2);
}

const { prisma } = await import('../lib/prisma.js');
const { runKalkV2Sync } = await import('../kalk/v2/runSync.js');

async function ensureSeason(kalkNumber) {
  const slug = slugFromKalkNumber(kalkNumber);
  const existing = await prisma.kalkSeason.findUnique({ where: { slug } });
  if (existing) {
    if (existing.sourceSite !== 'v2' && existing.kalkNumber == null) {
      await prisma.kalkSeason.update({ where: { id: existing.id }, data: { kalkNumber } });
    }
    return prisma.kalkSeason.findUnique({ where: { slug } });
  }
  const { startsAt, endsAt } = seasonRangeFromSlug(slug);
  return prisma.kalkSeason.create({
    data: {
      id: `season_${slug}`,
      slug,
      label: seasonLabelFromSlug(slug),
      kalkNumber,
      sourceSite: 'v2',
      isActive: false,
      divisionPath: 'liga/dywizja-ii',
      startsAt,
      endsAt
    }
  });
}

async function targets() {
  const active = await prisma.kalkSeason.findFirst({ where: { isActive: true } });
  if (seasonArg === 'active') {
    if (!active) throw new Error('Brak aktywnego sezonu.');
    return [active.kalkNumber ?? kalkNumberFromSlug(active.slug)];
  }
  if (seasonArg === 'history') {
    const last = active?.kalkNumber ?? kalkNumberFromSlug(active?.slug) ?? CURRENT_KALK_NUMBER;
    return Array.from({ length: last - FIRST_BEKAPAKA_SEASON + 1 }, (_, i) => FIRST_BEKAPAKA_SEASON + i);
  }
  const n = /^\d+$/.test(seasonArg) ? Number(seasonArg) : kalkNumberFromSlug(seasonArg);
  if (!n) throw new Error(`Nieznany sezon: ${seasonArg}`);
  return [n];
}

let exitCode = 0;
const summary = [];
try {
  for (const n of await targets()) {
    const season = await ensureSeason(n);
    if (season.sourceSite !== 'v2' && !process.argv.includes('--allow-legacy')) {
      const msg = `Sezon ${season.slug} ma dane ze starej strony (legacy) — użyj scripts/kalk-replace-season.js.`;
      console.error(msg);
      summary.push({ season: season.slug, status: 'skipped-legacy', message: msg });
      exitCode = 1;
      continue;
    }
    const started = Date.now();
    try {
      const r = await runKalkV2Sync({
        prisma,
        seasonId: season.id,
        mode,
        matches,
        budget,
        cacheMode,
        trigger: 'cli-sync-v2',
        onProgress: (c, t) => {
          if (!json && (c % 25 === 0 || c === t)) process.stderr.write(`  ${season.slug}: ${c}/${t}\n`);
        },
        onLog: (line) => {
          if (!json && /POMINI|ERROR|Błąd|failed|KALK v2/i.test(line)) process.stderr.write(`  ${line}\n`);
        }
      });
      const res = r.result;
      summary.push({
        season: season.slug,
        status: r.status,
        seconds: Math.round((Date.now() - started) / 1000),
        httpCount: r.manifest.httpCount,
        failures: r.manifest.failures?.length || 0,
        matches: res.matches,
        gameLogs: res.gameLogs,
        pbp: res.pbp,
        players: res.kalkPlayers,
        rosterSync: res.rosterSync ?? null
      });
      if (r.status !== 'success') exitCode = Math.max(exitCode, 1);
    } catch (err) {
      console.error(`Sezon ${season.slug}: ${err.message}`);
      summary.push({ season: season.slug, status: 'error', message: err.message });
      exitCode = 1;
    }
  }
} catch (err) {
  console.error(err.message);
  exitCode = 2;
}

console.log(json ? JSON.stringify(summary, null, 2) : summary.map((s) => JSON.stringify(s)).join('\n'));
await prisma.$disconnect();
process.exit(exitCode);
