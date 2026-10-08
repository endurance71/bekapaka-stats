#!/usr/bin/env node
/**
 * Import pliku KALK v2 (kontrakt version 3) do bazy.
 *
 *   node scripts/kalk-import-v2.js <bundle.json> [--dry-run] [--prune-schedule] [--json]
 *
 * --dry-run         walidacja + plan zapisów (odczyty z bazy, bez zapisu, bez syncu składu)
 * --prune-schedule  usuń wiersze LeagueMatch sezonu spoza terminarza źródła (tylko tryb full)
 * --json            wynik jako JSON
 *
 * Kody wyjścia: 0 = OK, 1 = błąd walidacji/importu, 2 = złe argumenty / plik.
 */
import fs from 'fs/promises';
import { validateKalkV2Bundle } from '../kalk/v2/validateBundle.js';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const file = args.find((a) => !a.startsWith('--'));
const jsonOut = flags.has('--json');
const dryRun = flags.has('--dry-run');
const known = new Set(['--dry-run', '--prune-schedule', '--json']);

function out(obj, text) {
  if (jsonOut) console.log(JSON.stringify(obj, null, 2));
  else console.log(text ?? JSON.stringify(obj, null, 2));
}

if (!file || [...flags].some((f) => !known.has(f))) {
  console.error('Użycie: node scripts/kalk-import-v2.js <bundle.json> [--dry-run] [--prune-schedule] [--json]');
  process.exit(2);
}

let bundle;
try {
  bundle = JSON.parse(await fs.readFile(file, 'utf-8'));
} catch (err) {
  console.error(`Nie można odczytać ${file}: ${err.message}`);
  process.exit(2);
}

const validation = validateKalkV2Bundle(bundle);
if (!validation.ok) {
  out({ ok: false, validation }, `Walidacja nieudana:\n- ${validation.errors.join('\n- ')}`);
  process.exit(1);
}
for (const w of validation.warnings) console.error(`UWAGA: ${w}`);

const { prisma } = await import('../lib/prisma.js');
const { ingestKalkV2Bundle } = await import('../kalk/v2/ingestSeason.js');
const manifest = bundle.manifest;

try {
  if (dryRun) {
    const { createDryRunPrisma } = await import('../kalk/v2/dryRunPrisma.js');
    const { client, writes } = createDryRunPrisma(prisma);
    const result = await ingestKalkV2Bundle(bundle, { prisma: client, syncPlayers: null });
    out({ ok: true, dryRun: true, result, plannedWrites: writes }, formatResult(result, writes));
  } else {
    const { withKalkSyncLock } = await import('../kalk/v2/lock.js');
    const startedAt = new Date();
    let result;
    try {
      result = await withKalkSyncLock(() =>
        ingestKalkV2Bundle(bundle, { prisma, pruneSchedule: flags.has('--prune-schedule') })
      );
    } catch (err) {
      await recordRun({ status: 'error', startedAt, errorMessage: err.message }).catch(() => {});
      throw err;
    }
    const partial = Boolean(manifest.truncated) || (manifest.failures || []).length > 0;
    await recordRun({ status: partial ? 'partial' : 'success', startedAt, seasonId: result.seasonId, counts: result });
    out({ ok: true, result }, formatResult(result));
  }
  await prisma.$disconnect();
  process.exit(0);
} catch (err) {
  console.error(`Import KALK v2 nieudany: ${err.message}`);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
}

async function recordRun({ status, startedAt, seasonId = null, counts = null, errorMessage = null }) {
  let sid = seasonId;
  if (!sid) {
    const season = await prisma.kalkSeason.findUnique({ where: { slug: String(manifest.seasonSlug) } });
    sid = season?.id ?? null;
  }
  await prisma.kalkSyncRun.create({
    data: {
      seasonId: sid,
      mode: manifest.mode || 'full',
      trigger: 'cli-import-v2',
      status,
      httpCount: manifest.httpCount ?? null,
      requestBudget: manifest.requestBudget ?? null,
      parserVersion: manifest.parserVersion ?? null,
      sectionsChanged: Array.isArray(manifest.sections) ? manifest.sections : [],
      manifest,
      failures: manifest.failures ?? null,
      counts,
      errorMessage,
      startedAt,
      finishedAt: new Date()
    }
  });
}

function formatResult(r, writes = null) {
  const c = (x) => `+${x.created} ~${x.updated} =${x.unchanged}`;
  const lines = [
    `Sezon ${r.seasonSlug} (${r.seasonId})${r.isActiveSeason ? ' [aktywny]' : ''}: ${r.season?.outcome}`,
    `Profile drużyn ${c(r.teamProfiles)} | KalkTeam ${c(r.kalkTeams)} | Tabela ${c(r.leagueTeams)} -${r.leagueTeams.deleted}`,
    `Terminarz ${c(r.leagueMatches)} (duplikaty usunięte: ${r.leagueMatches.deduplicated}, spoza źródła: ${r.leagueMatches.stale})`,
    `Profile zawodników ${c(r.profiles)} | KalkPlayer ${c(r.kalkPlayers)}`,
    `Mecze ${c(r.matches)} (pominięte: ${r.matches.skipped}) | logi ${r.gameLogs.written} (-${r.gameLogs.deleted}) | PBP ${r.pbp.eventsWritten} zdarzeń w ${r.pbp.matchesReplaced} meczach`,
    `Statystyki sezonowe ${c(r.seasonStats)} | agregaty KalkPlayer ~${r.playerAggregates.updated}`,
    `Skład: ${r.rosterSync ? JSON.stringify(r.rosterSync) : 'bez zmian (sezon nieaktywny lub dry-run)'}`
  ];
  if (r.warnings?.length) lines.push(`Ostrzeżenia (${r.warnings.length}):`, ...r.warnings.slice(0, 20).map((w) => `- ${w}`));
  if (writes) lines.push('Planowane zapisy (dry-run):', JSON.stringify(writes, null, 2));
  return lines.join('\n');
}
