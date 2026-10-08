#!/usr/bin/env node
/**
 * Audyt spójności danych KALK (KPI + kontrole E1–E13 / S1–S7).
 *
 *   node scripts/kalk-data-audit.js [--season <slug|all>] [--strict] [--fail-on error|warn] [--json]
 *   docker exec bkpk-backend-prod node scripts/kalk-data-audit.js --season all --strict
 *
 * --season   slug sezonu (np. 2026-2027) lub `all`; domyślnie aktywny
 * --strict   kod wyjścia 1 przy błędach (= --fail-on error)
 * --fail-on  error | warn — próg kodu wyjścia 1
 * --json     pełny raport JSON
 *
 * Kody wyjścia: 0 = OK (lub tryb raportu bez --strict/--fail-on), 1 = problemy wg progu,
 * 2 = złe argumenty / nieznany sezon / błąd wykonania.
 */
import { auditExitCode } from '../kalk/v2/audit.js';

function parseArgs(argv) {
  const opts = { season: null, strict: false, failOn: null, json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--strict') opts.strict = true;
    else if (a === '--json') opts.json = true;
    else if (a === '--season') opts.season = argv[++i];
    else if (a.startsWith('--season=')) opts.season = a.slice('--season='.length);
    else if (a === '--fail-on') opts.failOn = argv[++i];
    else if (a.startsWith('--fail-on=')) opts.failOn = a.slice('--fail-on='.length);
    else throw new Error(`Nieznany argument: ${a}`);
  }
  if (opts.season === undefined || opts.season === '') throw new Error('--season wymaga wartości');
  if (opts.failOn !== null && !['error', 'warn'].includes(opts.failOn)) throw new Error('--fail-on: error | warn');
  return opts;
}

let opts;
try {
  opts = parseArgs(process.argv.slice(2));
} catch (err) {
  console.error(err.message);
  console.error('Użycie: node scripts/kalk-data-audit.js [--season <slug|all>] [--strict] [--fail-on error|warn] [--json]');
  process.exit(2);
}

let code = 0;
try {
  const { prisma } = await import('../lib/prisma.js');
  const { runKalkDataAudit, formatKalkAuditMarkdown } = await import('../kalk/kalkDataAudit.js');
  const { getActiveSeason } = await import('../seasonService.js');

  let seasons;
  if (!opts.season) {
    const active = await getActiveSeason();
    seasons = active ? [active] : [];
  } else if (opts.season === 'all') {
    seasons = await prisma.kalkSeason.findMany({ orderBy: { startsAt: 'asc' } });
  } else {
    const s = await prisma.kalkSeason.findUnique({ where: { slug: opts.season } });
    seasons = s ? [s] : [];
  }
  if (!seasons.length) {
    console.error(`Nie znaleziono sezonu: ${opts.season || '(aktywny)'}`);
    await prisma.$disconnect();
    process.exit(2);
  }

  const reports = [];
  for (const season of seasons) {
    reports.push(await runKalkDataAudit({ seasonId: season.id, integrity: true }));
  }
  const integrity = reports.map((r) => r.integrity).filter(Boolean);
  code = auditExitCode(integrity, { strict: opts.strict, failOn: opts.failOn });
  const summary = {
    seasons: integrity.map((r) => ({
      season: r.seasonSlug,
      errors: r.counts.errors,
      warnings: r.counts.warnings,
      byCode: r.counts.byCode
    })),
    errors: integrity.reduce((a, r) => a + r.counts.errors, 0),
    warnings: integrity.reduce((a, r) => a + r.counts.warnings, 0),
    exitCode: code
  };

  if (opts.json) {
    console.log(JSON.stringify({ summary, reports }, null, 2));
  } else {
    for (const report of reports) {
      console.log(formatKalkAuditMarkdown(report));
      console.log('');
    }
    console.log('--- Podsumowanie ---');
    console.log(JSON.stringify(summary, null, 2));
  }
  await prisma.$disconnect();
} catch (err) {
  console.error(`Audyt KALK nieudany: ${err.message}`);
  process.exit(2);
}

process.exit(code);
