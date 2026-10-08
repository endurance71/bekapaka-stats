/**
 * Audyt wszystkich analiz AI w bazie: mecze (KalkMatch + Game), plany zawodników, scouting per sezon,
 * briefingi per sezon (nie tylko `default`), odprawy, zagrywki AI.
 * Sprawdza: kompletność, aktualność (hash bieżących danych + wersja promptu), szablon vs Gemini,
 * kontrolę faktów (liczby i nazwiska z tekstu muszą być w aktualnym payloadzie).
 * Nie generuje niczego — regeneracja tylko ręcznie (przyciski w panelu AI).
 *
 * Uruchomienie:
 *   npm run audit:ai
 *   node scripts/audit-ai-analyses.js --season season_2026-2027 --json
 *   node scripts/audit-ai-analyses.js --types match,player --no-fact-check
 * VPS:
 *   docker compose -f docker-compose.prod.yml exec -T bkpk-backend node scripts/audit-ai-analyses.js
 *
 * Kod wyjścia: 1 gdy jest analiza niekompletna lub z podejrzanymi faktami, 0 w przeciwnym razie.
 */
import { prisma } from '../lib/prisma.js';
import { auditHasFailures, runAiAudit, summarizeAiAudit } from '../ai/audit.js';

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  const args = { json: false, seasonId: undefined, factCheck: true, types: undefined };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') args.json = true;
    else if (a === '--no-fact-check') args.factCheck = false;
    else if (a === '--season') args.seasonId = argv[++i];
    else if (a.startsWith('--season=')) args.seasonId = a.slice('--season='.length);
    else if (a === '--types') args.types = argv[++i]?.split(',').filter(Boolean);
    else if (a.startsWith('--types=')) args.types = a.slice('--types='.length).split(',').filter(Boolean);
  }
  return args;
}

/**
 * @param {Awaited<ReturnType<typeof runAiAudit>>['rows'][number]} r
 */
function formatRow(r) {
  const flags = [
    r.complete ? null : 'NIEKOMPLETNA',
    r.stale === true ? 'NIEAKTUALNA' : r.stale === null ? `aktualność?(${r.staleReason || '—'})` : null,
    r.isTemplate ? 'SZABLON' : null,
    r.factCheck?.suspicious ? 'PODEJRZANE' : null
  ].filter(Boolean);
  const lines = [`- [${r.type}] ${r.label} (${r.id}) ${r.seasonId ? `· ${r.seasonId}` : ''} · ${r.model || '—'} · ${r.generatedAt || '—'}${flags.length ? `  → ${flags.join(', ')}` : '  → OK'}`];
  for (const issue of r.issues) lines.push(`    • ${issue}`);
  for (const n of r.factCheck?.suspiciousNumbers || []) lines.push(`    ? liczba ${n.value}: „${n.context}”`);
  for (const n of r.factCheck?.suspiciousNames || []) lines.push(`    ? nazwisko ${n.name}: „${n.context}”`);
  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const report = await runAiAudit({ seasonId: args.seasonId, factCheck: args.factCheck, types: args.types });
  const summary = summarizeAiAudit(report);
  const failed = auditHasFailures(report);

  if (args.json) {
    console.log(JSON.stringify({ ...summary, rows: report.rows, failed }, null, 2));
  } else {
    const byType = new Map();
    for (const r of report.rows) {
      if (!byType.has(r.type)) byType.set(r.type, []);
      byType.get(r.type).push(r);
    }
    for (const [type, rows] of byType) {
      console.log(`\n=== ${type.toUpperCase()} (${rows.length}) ===`);
      for (const r of rows) console.log(formatRow(r));
    }
    const c = summary.counts;
    console.log(
      `\nPodsumowanie: ${c.total} analiz · do regeneracji ${c.needsRegeneration} · nieaktualne ${c.stale} · niekompletne ${c.incomplete} · szablony ${c.templates} · podejrzane fakty ${c.suspicious}`
    );
  }

  process.exitCode = failed ? 1 : 0;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
