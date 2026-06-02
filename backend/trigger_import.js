import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import {
  ingestLeagueTable,
  ingestLeagueSchedule,
  ingestKalkPlayers,
  syncPlayersFromKalk
} from './dataStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execFile = promisify(execFileCb);

const KALK_SCRAPLING_SCRIPT = path.join(__dirname, 'scripts/kalk_scraper.py');
const KALK_SCRAPLING_OUTPUT = path.resolve(__dirname, '../kalk_stats.json');

async function main() {
  console.log("Starting full scrape and import manually...");
  
  // 1. Run Python scraper
  console.log(`Running Python scraper (${KALK_SCRAPLING_SCRIPT})...`);
  const { stdout, stderr } = await execFile('python3', [KALK_SCRAPLING_SCRIPT], {
    cwd: __dirname,
    timeout: 15 * 60 * 1000
  });
  console.log("Scraper stdout:\n", stdout);
  if (stderr?.trim()) console.error("Scraper stderr:\n", stderr);

  // 2. Read kalk_stats.json
  console.log(`Reading output from ${KALK_SCRAPLING_OUTPUT}...`);
  const statsRaw = await fs.readFile(KALK_SCRAPLING_OUTPUT, 'utf-8');
  const stats = JSON.parse(statsRaw);

  // 3. Ingest into database
  console.log("Ingesting data into database...");
  await ingestLeagueTable(stats.table || [], 'regular');
  if (stats.playout_table) {
    console.log(`Found playout table with ${stats.playout_table.length} entries.`);
    await ingestLeagueTable(stats.playout_table, 'playout');
  }
  await ingestLeagueSchedule(stats.schedule || []);
  const playersIngest = await ingestKalkPlayers(stats.players || []);
  console.log(`Ingested ${playersIngest.total} players (new: ${playersIngest.newPlayers.length})`);

  console.log("Syncing players from Kalk...");
  await syncPlayersFromKalk();

  console.log("Import completed successfully!");
}

main().catch(console.error);
