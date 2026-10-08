/**
 * Synchronizacja KALK v2: stan z bazy → `scripts/kalk_sync.py` → import (`ingestKalkV2Bundle`).
 *
 * Jedna ścieżka dla przycisku w panelu, crona (`/api/internal/kalk/sync`), uzupełniania braków
 * (`--matches`) i backfillu (CLI). Całość pod blokadą advisory (jeden sync naraz) i z wpisem `KalkSyncRun`.
 */
import { spawn } from 'child_process';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { ingestKalkV2Bundle } from './ingestSeason.js';
import { validateKalkV2Bundle } from './validateBundle.js';
import { withKalkSyncLock } from './lock.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const KALK_SYNC_SCRIPT = path.join(__dirname, '..', '..', 'scripts', 'kalk_sync.py');
const SCRAPER_TIMEOUT_MS = 40 * 60 * 1000;

/** Katalog roboczy: wolumen `/data/kalk` w kontenerze, lokalnie katalog tymczasowy. */
export async function resolveKalkDataDir() {
  const candidates = [process.env.KALK_DATA_DIR, '/data/kalk', path.join(os.tmpdir(), 'kalk')].filter(Boolean);
  for (const dir of candidates) {
    try {
      await fs.mkdir(path.join(dir, 'runs'), { recursive: true });
      await fs.mkdir(path.join(dir, 'cache'), { recursive: true });
      await fs.mkdir(path.join(dir, 'state'), { recursive: true });
      return dir;
    } catch {
      // brak uprawnień — następny kandydat
    }
  }
  throw new Error('Brak zapisywalnego katalogu danych KALK (KALK_DATA_DIR).');
}

/** Stan dla trybu incremental: co już mamy w bazie (mecze, zawodnicy, hashe sekcji). */
export async function buildSyncState(prisma, season) {
  const [matches, profiles, lastRun] = await Promise.all([
    prisma.kalkMatch.findMany({
      where: { seasonId: season.id },
      select: { id: true, isFinished: true, scoreHome: true, scoreAway: true, scrapedAt: true, parserVersion: true, sectionHashes: true }
    }),
    prisma.kalkPlayerProfile.findMany({ select: { slug: true } }),
    prisma.kalkSyncRun.findFirst({
      where: { seasonId: season.id, status: { in: ['success', 'partial'] } },
      orderBy: { startedAt: 'desc' },
      select: { manifest: true }
    })
  ]);
  const state = {
    matches: Object.fromEntries(
      matches.map((m) => [
        m.id,
        {
          isFinished: m.isFinished,
          scoreHome: m.scoreHome,
          scoreAway: m.scoreAway,
          scrapedAt: m.scrapedAt?.toISOString?.() ?? null,
          parserVersion: m.parserVersion,
          sectionHashes: m.sectionHashes || {}
        }
      ])
    ),
    knownPlayerSlugs: profiles.map((p) => p.slug),
    sectionSnapshots: lastRun?.manifest?.sectionSnapshots ? { [season.slug]: lastRun.manifest.sectionSnapshots } : {}
  };
  return state;
}

function runScraper(args, { onProgress, onLog, pythonBin = 'python3' }) {
  return new Promise((resolve, reject) => {
    const child = spawn(pythonBin, [KALK_SYNC_SCRIPT, ...args], {
      cwd: path.dirname(KALK_SYNC_SCRIPT),
      env: process.env
    });
    const outputs = [];
    let stdoutBuf = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`Skraper KALK przekroczył limit ${SCRAPER_TIMEOUT_MS / 60000} min`));
    }, SCRAPER_TIMEOUT_MS);

    child.stdout.on('data', (chunk) => {
      stdoutBuf += chunk.toString();
      const lines = stdoutBuf.split('\n');
      stdoutBuf = lines.pop();
      for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;
        const progress = line.match(/^::PROGRESS::\s*(\d+)\/(\d+)/);
        const output = line.match(/^::OUTPUT::\s*(.+)$/);
        if (progress) onProgress?.(Number(progress[1]), Number(progress[2]));
        else if (output) outputs.push(output[1].trim());
        else onLog?.(line);
      }
    });
    child.stderr.on('data', (chunk) => {
      for (const line of chunk.toString().split('\n')) {
        if (line.trim()) onLog?.(line.trim());
      }
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(outputs);
      else if (code === 2) reject(new Error('Skraper KALK: nie udało się pobrać stron ligi (tabela/terminarz) — bez zmian w bazie.'));
      else reject(new Error(`Skraper KALK zakończył się kodem ${code}`));
    });
  });
}

/**
 * @param {object} opts
 * @param {import('@prisma/client').PrismaClient} opts.prisma
 * @param {string} [opts.seasonId]   domyślnie aktywny sezon
 * @param {'incremental'|'full'} [opts.mode]
 * @param {string[]} [opts.matches]  tylko te mecze (uzupełnianie braków)
 * @param {string} [opts.trigger]
 * @param {number} [opts.budget]
 * @param {'refresh'|'read'|'off'} [opts.cacheMode]  sync = refresh (zawsze świeże strony)
 * @param {(n:number,total:number)=>void} [opts.onProgress]
 * @param {(line:string)=>void} [opts.onLog]
 */
export async function runKalkV2Sync(opts) {
  const {
    prisma,
    mode = 'incremental',
    matches = null,
    trigger = 'manual',
    budget = 900,
    cacheMode = 'refresh',
    onProgress,
    onLog = () => {}
  } = opts;

  const season = opts.seasonId
    ? await prisma.kalkSeason.findUnique({ where: { id: opts.seasonId } })
    : await prisma.kalkSeason.findFirst({ where: { isActive: true } });
  if (!season) throw new Error('Brak sezonu KALK do synchronizacji.');
  const seasonArg = season.kalkNumber ? String(season.kalkNumber) : season.slug;

  return withKalkSyncLock(async () => {
    const run = await prisma.kalkSyncRun.create({
      data: { seasonId: season.id, mode, trigger, status: 'running', requestBudget: budget }
    });
    try {
      const dataDir = await resolveKalkDataDir();
      const statePath = path.join(dataDir, 'state', `${season.slug}.json`);
      await fs.writeFile(statePath, JSON.stringify(await buildSyncState(prisma, season)));

      const args = [
        '--season', seasonArg,
        '--mode', matches?.length ? 'full' : mode,
        '--state', statePath,
        '--output', path.join(dataDir, 'runs'),
        '--cache-dir', path.join(dataDir, 'cache'),
        '--cache-mode', cacheMode,
        '--budget', String(budget)
      ];
      if (matches?.length) args.push('--matches', matches.join(','));
      onLog(`KALK v2: sezon ${season.slug} (${seasonArg}), tryb ${matches?.length ? `mecze ${matches.join(',')}` : mode}`);

      const outputs = await runScraper(args, { onProgress, onLog });
      if (outputs.length !== 1) throw new Error(`Skraper zwrócił ${outputs.length} plików (oczekiwano 1).`);
      const bundle = JSON.parse(await fs.readFile(outputs[0], 'utf-8'));

      const validation = validateKalkV2Bundle(bundle);
      if (!validation.ok) throw new Error(`Walidacja pliku KALK: ${validation.errors.join('; ')}`);
      if (bundle.manifest.seasonSlug !== season.slug) {
        throw new Error(`Plik KALK dotyczy sezonu ${bundle.manifest.seasonSlug}, oczekiwano ${season.slug}.`);
      }

      const result = await ingestKalkV2Bundle(bundle, {
        prisma,
        pruneSchedule: mode === 'full' && !matches?.length
      });
      const m = bundle.manifest;
      const partial = Boolean(m.truncated) || (m.failures || []).length > 0;
      await prisma.kalkSyncRun.update({
        where: { id: run.id },
        data: {
          status: partial ? 'partial' : 'success',
          httpCount: m.httpCount ?? null,
          httpEstimate: m.httpCount ?? null,
          parserVersion: m.parserVersion ?? null,
          sectionsChanged: Array.isArray(m.sections) ? m.sections : [],
          manifest: m,
          failures: m.failures?.length ? m.failures : null,
          counts: result,
          finishedAt: new Date()
        }
      });
      return { runId: run.id, status: partial ? 'partial' : 'success', season: season.slug, manifest: m, result, file: outputs[0] };
    } catch (err) {
      await prisma.kalkSyncRun
        .update({ where: { id: run.id }, data: { status: 'error', errorMessage: String(err.message).slice(0, 2000), finishedAt: new Date() } })
        .catch(() => {});
      throw err;
    }
  });
}
