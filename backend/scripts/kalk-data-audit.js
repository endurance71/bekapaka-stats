#!/usr/bin/env node
/**
 * Audyt spójności danych KALK — uruchomienie:
 *   node backend/scripts/kalk-data-audit.js
 *   docker exec bkpk-backend-prod node scripts/kalk-data-audit.js
 */
import { runKalkDataAudit, formatKalkAuditMarkdown } from '../kalk/kalkDataAudit.js';

const jsonOnly = process.argv.includes('--json');
const report = await runKalkDataAudit();

if (jsonOnly) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(formatKalkAuditMarkdown(report));
  console.log('\n--- JSON (skrót) ---');
  console.log(
    JSON.stringify(
      {
        matches: {
          bekapakaScheduleFinished: report.matches?.bekapakaScheduleFinished,
          bekapakaWithValidBoxScore: report.matches?.bekapakaWithValidBoxScore,
          missingCount: report.matches?.bekapakaMissingBoxScore?.length
        },
        players: {
          duplicateGroups: report.players?.duplicateGroups,
          orphanLegacyCount: report.players?.orphanLegacyCount
        }
      },
      null,
      2
    )
  );
}

process.exit(report.error ? 1 : 0);
