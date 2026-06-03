#!/usr/bin/env node
/**
 * Import z istniejącego kalk_stats.json (bez ponownego scrape).
 * Użycie na VPS: docker exec -w /app bkpk-backend-prod node /app/scripts/kalk-import-json.js
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ingestLeagueTable,
  ingestLeagueSchedule,
  ingestKalkPlayers,
  syncPlayersFromKalk
} from '../dataStore.js';
import {
  ingestKalkTeams,
  ingestKalkMatches,
  ingestKalkPlayerGameLogs
} from '../kalk/kalkIngest.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.join(__dirname, '..', 'kalk_stats.json');

async function main() {
  const raw = await fs.readFile(OUTPUT, 'utf-8');
  const stats = JSON.parse(raw);

  await ingestLeagueTable(stats.table || [], 'regular');
  if (stats.playout_table?.length) {
    await ingestLeagueTable(stats.playout_table, 'playout');
  }
  await ingestLeagueSchedule(stats.schedule || []);
  const players = await ingestKalkPlayers(stats.players || []);
  const teams = await ingestKalkTeams(stats.teams || []);
  const matches = await ingestKalkMatches(stats.matches || []);
  const logs = await ingestKalkPlayerGameLogs(stats.playerGameLogs || []);
  await syncPlayersFromKalk();

  console.log(
    JSON.stringify(
      {
        schedule: stats.schedule?.length ?? 0,
        matchesScraped: stats.matches?.length ?? 0,
        players: players?.total ?? 0,
        teams: teams?.total ?? 0,
        kalkMatches: matches?.total ?? 0,
        linked: matches?.linked ?? 0,
        playerGameLogs: logs?.total ?? 0,
        skipped: logs?.skipped ?? 0
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
