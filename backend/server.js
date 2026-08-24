import express from 'express';
import cors from 'cors';
import { loginUser, getLoginLogs, touchUserActivity } from './dataStore.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'node:fs/promises';
import { promisify } from 'node:util';
import { execFile as execFileCb } from 'node:child_process';
import {
  getDB,
  saveGame,
  updateCoachNote,
  addTag,
  getGameById,
  listGames,
  upsertRoster,
  ingestLeagueTable,
  ingestLeagueSchedule,
  ingestKalkPlayers,
  ingestKalkTeams,
  ingestKalkMatches,
  ingestKalkPlayerGameLogs,
  logKalkScrapeRun,
  getLatestKalkScrapeRun,
  getKalkIngestSummary,
  getKalkDataAuditReport,
  listKalkPlayers,
  resetData,
  syncPlayersFromKalk,
  getRoster,
  listAllPlayers,
  getPlayerById,
  getPlayerStats,
  getTeamTrends,
  getLeagueComparison,
  updatePlayerGoals,
  createGame,
  updateGame,
  deleteGame,
  listAllPlays,
  createPlay,
  updatePlay,
  getLeagueTable,
  getLeagueSchedule,
  getTopScorers,
  getLeagueLeaders,
  getNextOpponentScouting,
  getDetailedScouting,
  getLeagueTrends,
  getTeamStatsSummary,
  listSeasons,
  setPlayerSeasonPreference,
  getActiveSeason
} from './dataStore.js';
import {
  createSeason,
  updateSeason,
  activateSeason,
  archiveSeason,
  getSeasonSummary,
  rolloverRoster,
  getSeasonById
} from './seasonService.js';
import {
  generateGameAnalysis,
  generatePlayerDevelopment,
  generateScoutingReport,
  generateTeamBriefing,
  getTeamBriefingCached
} from './ai/generate.js';
import { getAiAnalysesCatalog } from './ai/catalog.js';
import { isGeminiConfigured } from './ai/geminiClient.js';
import { AiConfigError, AiValidationError, AiBusyError } from './ai/errors.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from './lib/prisma.js';
import { getJwtSecret, getEnvMinLength } from './lib/requireEnv.js';

const execFile = promisify(execFileCb);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KALK_SCRAPLING_SCRIPT = path.join(__dirname, 'scripts', 'kalk_scraper.py');
const KALK_GAP_SCRAPE_SCRIPT = path.join(__dirname, 'scripts', 'kalk_scrape_gaps.py');
const KALK_SCRAPLING_OUTPUT = path.join(__dirname, 'kalk_stats.json');
const app = express();
app.use(cors({
  origin: true, // Reflect request origin
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/ping', (req, res) => res.send('pong'));

// --- AUTHENTICATION ---
// Imports moved to top

const SECRET_KEY = getJwtSecret();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.warn(`[AUTH] Missing token for ${req.url}. Headers:`, req.headers);
    return res.sendStatus(401);
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      console.warn(`[AUTH] Token verification failed for ${req.url}: ${err.message}. Token prefix: ${token.substring(0, 10)}...`);
      return res.sendStatus(403);
    }
    req.user = user;

    const skipActivityPaths = ['/api/scrape/kalk/div2/status', '/scrape/kalk/div2/status'];
    if (!skipActivityPaths.some((p) => req.path === p || req.url.startsWith(p))) {
      void touchUserActivity(user.id, req.ip);
    }

    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') return res.sendStatus(403);
  next();
};

app.post(['/api/auth/login', '/auth/login'], async (req, res) => {
  console.log(`[AUTH] Login attempt for: ${req.body.username}`);
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Brak danych logowania' });

  const result = await loginUser(username, password, req.ip);
  if (!result) return res.status(401).json({ error: 'Błędny login lub hasło' });

  res.json(result);
});

app.get(['/api/auth/me', '/auth/me'], authenticateToken, async (req, res) => {
  try {
    const user = await prisma.rosterPlayer.findUnique({
      where: { id: req.user.id }
    });

    if (!user) return res.status(404).json({ error: 'Użytkownik nie istnieje' });

    // Omit sensitive data
    const { password, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (e) {
    console.error('Failed to fetch user in /me:', e);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

app.get(['/api/admin/logs', '/admin/logs'], authenticateToken, requireAdmin, async (req, res) => {
  const { page, limit, username, success } = req.query;
  const result = await getLoginLogs({ page, limit, username, success });
  res.json(result);
});

const isBekapaka = (name) => {
  if (!name) return false;
  const n = name.toLowerCase();
  return n.includes('bekapaka') || n.includes('bobolice');
};

const findBekapaka = (teams) => {
  if (!Array.isArray(teams)) return null;
  return teams.find(t => t.isBekapaka || isBekapaka(t.name));
};

// --- DASHBOARD ---
app.get(['/api/dashboard', '/dashboard'], async (req, res) => {
  try {
    const db = await getDB();
    const games = db.games || [];
    const lastGame = games.find(g => g.result) || games[0];

    if (!lastGame) {
      return res.json({ lastGame: null, fourFactors: null, shootingForm: [] });
    }

    const team = findBekapaka(lastGame.teams || lastGame.teamStats);

    res.json({
      lastGame,
      fourFactors: team?.fourFactors || null,
      shootingForm: games.slice(0, 5).map((g) => {
        const t = findBekapaka(g.teams || g.teamStats);
        return {
          id: g.id,
          opponent: g.opponent,
          efg: t?.fourFactors?.efg || 0
        };
      })
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Błąd dashboardu' });
  }
});

// --- GAMES API ---
app.get(['/api/games', '/games'], async (req, res) => {
  try {
    const filters = {
      result: req.query.result,
      homeAway: req.query.homeAway
    };
    const games = await listGames(filters, req.query.seasonId);
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania meczów' });
  }
});

app.get(['/api/games/:id', '/games/:id'], async (req, res) => {
  try {
    const game = await getGameById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Mecz nie znaleziony' });
    res.json(game);
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania meczu' });
  }
});

app.post(['/api/games', '/games'], async (req, res) => {
  try {
    const game = await createGame(req.body);
    res.status(201).json(game);
  } catch (err) {
    res.status(500).json({ error: 'Błąd tworzenia meczu' });
  }
});

app.put(['/api/games/:id', '/games/:id'], async (req, res) => {
  try {
    const updated = await updateGame(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Błąd aktualizacji' });
  }
});

app.delete(['/api/games/:id', '/games/:id'], async (req, res) => {
  try {
    await deleteGame(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Błąd usuwania' });
  }
});

// --- PLAYERS API ---
app.get(['/api/roster', '/roster'], async (req, res) => {
  try {
    const roster = await getRoster(req.query.seasonId);
    res.json(roster);
  } catch (err) {
    console.error('Roster error:', err);
    res.status(500).json({ error: 'Błąd pobierania składu' });
  }
});

app.get(['/api/players', '/players'], async (req, res) => {
  try {
    const players = await listAllPlayers(req.query.seasonId);
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania zawodników' });
  }
});

app.get(['/api/players/:id', '/players/:id'], async (req, res) => {
  try {
    const player = await getPlayerById(req.params.id);
    if (!player) return res.status(404).json({ error: 'Zawodnik nie znaleziony' });
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania danych zawodnika' });
  }
});

app.get(['/api/players/:id/stats', '/players/:id/stats'], async (req, res) => {
  try {
    const stats = await getPlayerStats(req.params.id, req.query.seasonId);
    if (!stats) return res.status(404).json({ error: 'Zawodnik nie znaleziony' });
    res.json(stats);
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Błąd statystyk' });
  }
});

app.get(['/api/seasons', '/seasons'], async (req, res) => {
  try {
    const seasons = await listSeasons();
    res.json(seasons);
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania sezonów' });
  }
});

app.put(['/api/players/:id/season', '/players/:id/season'], authenticateToken, async (req, res) => {
  try {
    const targetId = req.params.id;
    const isAdmin = req.user?.role === 'ADMIN';
    if (!isAdmin && req.user?.id !== targetId) {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }
    const seasonId = req.body?.seasonId;
    if (!seasonId) return res.status(400).json({ error: 'Wymagane pole seasonId' });
    await setPlayerSeasonPreference(targetId, seasonId);
    res.json({ success: true, seasonId });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Nie udało się zapisać sezonu' });
  }
});

// --- ADMIN SEASONS MANAGEMENT ---
app.get(['/api/admin/seasons', '/admin/seasons'], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const seasons = await listSeasons();
    const summaries = await Promise.all(seasons.map((s) => getSeasonSummary(s.id)));
    res.json(summaries.map((s) => ({ ...s.season, ...s.stats })));
  } catch (err) {
    console.error('Admin seasons error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post(['/api/admin/seasons', '/admin/seasons'], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const newSeason = await createSeason(req.body);
    res.status(201).json(newSeason);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put(['/api/admin/seasons/:id', '/admin/seasons/:id'], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const updated = await updateSeason(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post(['/api/admin/seasons/:id/activate', '/admin/seasons/:id/activate'], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const activated = await activateSeason(req.params.id);
    res.json({ success: true, season: activated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post(['/api/admin/seasons/:id/archive', '/admin/seasons/:id/archive'], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const archived = await archiveSeason(req.params.id);
    res.json({ success: true, season: archived });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post(['/api/admin/seasons/rollover', '/admin/seasons/rollover'], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { targetSeasonId, activePlayerIds, resetGoals } = req.body;
    const result = await rolloverRoster({ targetSeasonId, activePlayerIds, resetGoals });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- TRENDS & ANALYTICS ---
app.get(['/api/trends/team', '/trends/team'], async (req, res) => {
  try {
    const trends = await getTeamTrends(req.query.seasonId);
    res.json(trends);
  } catch (err) {
    res.status(500).json({ error: 'Błąd trendów' });
  }
});

app.get(['/api/trends/league', '/trends/league'], async (req, res) => {
  try {
    const comparison = await getLeagueComparison(req.query.seasonId);
    res.json(comparison);
  } catch (err) {
    res.status(500).json({ error: 'Błąd porównania' });
  }
});

app.get(['/api/team/stats', '/team/stats'], async (req, res) => {
  try {
    const stats = await getTeamStatsSummary(req.query.seasonId);
    res.json(stats);
  } catch (err) {
    console.error('Team stats error:', err);
    res.status(500).json({ error: 'Błąd statystyk zespołu' });
  }
});

app.get(['/api/scouting/next', '/scouting/next'], async (req, res) => {
  try {
    const scouting = await getNextOpponentScouting(req.query.seasonId);
    res.json(scouting);
  } catch (err) {
    res.status(500).json({ error: 'Błąd scoutingu' });
  }
});

app.get(['/api/scouting/detailed', '/scouting/detailed'], async (req, res) => {
  try {
    const opponent = req.query.opponent;
    const scouting = await getDetailedScouting(opponent, req.query.seasonId);
    res.json(scouting);
  } catch (err) {
    console.error('Detailed scouting error:', err);
    res.status(500).json({ error: 'Błąd szczegółowego scoutingu' });
  }
});

// --- AI (Gemini) ---
const handleAiRouteError = (err, res) => {
  if (err instanceof AiConfigError) {
    return res.status(503).json({ error: err.message });
  }
  if (err instanceof AiValidationError) {
    return res.status(400).json({ error: err.message });
  }
  if (err instanceof AiBusyError) {
    return res.status(409).json({ error: err.message });
  }
  console.error('[AI]', err);
  return res.status(500).json({ error: err.message || 'Błąd generacji AI' });
};

app.get(['/api/ai/status', '/ai/status'], authenticateToken, (req, res) => {
  res.json({
    configured: isGeminiConfigured(),
    model: process.env.GEMINI_MODEL || 'gemini-3.5-flash'
  });
});

app.get(['/api/ai/catalog', '/ai/catalog'], authenticateToken, async (req, res) => {
  try {
    const catalog = await getAiAnalysesCatalog();
    res.json(catalog);
  } catch (err) {
    handleAiRouteError(err, res);
  }
});

app.get(['/api/ai/briefing', '/ai/briefing'], authenticateToken, async (req, res) => {
  try {
    const briefing = await getTeamBriefingCached();
    let stale = false;
    if (briefing?.contentMd && briefing.sourceHash) {
      const { buildBriefingContext } = await import('./ai/buildBriefingContext.js');
      const ctx = await buildBriefingContext();
      stale = briefing.sourceHash !== ctx.hash;
    }
    res.json({
      contentMd: briefing?.contentMd || null,
      generatedAt: briefing?.generatedAt || null,
      model: briefing?.model || null,
      stale
    });
  } catch (err) {
    handleAiRouteError(err, res);
  }
});

app.post(['/api/ai/briefing/generate', '/ai/briefing/generate'], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await generateTeamBriefing({ force: Boolean(req.body?.force) });
    res.json(result);
  } catch (err) {
    handleAiRouteError(err, res);
  }
});

app.post(['/api/games/:id/analyze', '/games/:id/analyze'], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await generateGameAnalysis(req.params.id, { force: Boolean(req.body?.force) });
    res.json(result);
  } catch (err) {
    handleAiRouteError(err, res);
  }
});

app.post(['/api/players/:id/analyze', '/players/:id/analyze'], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await generatePlayerDevelopment(req.params.id, { force: Boolean(req.body?.force) });
    res.json(result);
  } catch (err) {
    handleAiRouteError(err, res);
  }
});

app.post(['/api/scouting/analyze', '/scouting/analyze'], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const opponent = req.query.opponent || req.body?.opponent;
    const result = await generateScoutingReport(opponent, { force: Boolean(req.body?.force) });
    res.json(result);
  } catch (err) {
    handleAiRouteError(err, res);
  }
});

// --- SCRAPER ---
let scraperRunning = false;
const scraperState = {
  running: false,
  step: 'idle',
  message: 'Gotowy',
  lastFinishedAt: null,
  lastLog: '',
  progressCurrent: 0,
  progressTotal: 0
};

const updateScraperLog = (msg) => {
  const timestamp = new Date().toLocaleTimeString();
  const logLine = `[${timestamp}] ${msg}`;
  scraperState.lastLog = (scraperState.lastLog || '') + logLine + '\n';
  // Keep only last 1000 lines
  const lines = scraperState.lastLog.split('\n');
  if (lines.length > 1000) {
    scraperState.lastLog = lines.slice(-1000).join('\n');
  }
};

app.get(['/api/scrape/kalk/div2/status', '/scrape/kalk/div2/status'], authenticateToken, requireAdmin, (req, res) => res.json(scraperState));

app.get(['/api/kalk/ingest-summary', '/kalk/ingest-summary'], authenticateToken, requireAdmin, async (_req, res) => {
  try {
    const summary = await getKalkIngestSummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get(['/api/kalk/audit', '/kalk/audit'], authenticateToken, requireAdmin, async (_req, res) => {
  try {
    const report = await getKalkDataAuditReport();
    res.json(report);
  } catch (err) {
    console.error('KALK audit error:', err);
    res.status(500).json({ error: err.message });
  }
});
/**
 * Ensures default admin account exists. Never overwrites password on existing users
 * (password reset on scrape/restart was causing intermittent login failures).
 */
async function ensureDefaultAdminUser() {
  const username = (process.env.ADMIN_USERNAME || 'motylinski').toLowerCase().trim();

  const existing = await prisma.rosterPlayer.findFirst({
    where: { username }
  });

  if (existing) {
    await prisma.rosterPlayer.update({
      where: { id: existing.id },
      data: {
        firstName: existing.firstName || 'Damian',
        lastName: existing.lastName || 'Motylinski',
        role: 'ADMIN'
      }
    });
    return;
  }

  const password = getEnvMinLength('ADMIN_PASSWORD', 12);
  if (!password) {
    console.warn(
      `[AUTH] Admin user "${username}" does not exist and ADMIN_PASSWORD is not set (min 12 chars). Skipping account creation.`
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.rosterPlayer.create({
    data: {
      firstName: 'Damian',
      lastName: 'Motylinski',
      username,
      role: 'ADMIN',
      password: passwordHash,
      starter: false
    }
  });
  console.log(`[AUTH] Created default admin user: ${username}`);
}

async function runScrapeImportPipeline(triggerLabel = 'manual', targetSeasonId = undefined) {
  if (scraperRunning) {
    throw new Error('Scraper już działa.');
  }

  const activeSeason = targetSeasonId
    ? await getSeasonById(targetSeasonId)
    : await getActiveSeason();
  const divisionPath = activeSeason?.divisionPath || 'dzial,dywizja-2,4.html';
  const seasonSlug = activeSeason?.slug || '2025-2026';

  scraperRunning = true;
  scraperState.running = true;
  scraperState.lastLog = `[${new Date().toLocaleTimeString()}] System: Inicjalizacja dla sezonu ${seasonSlug}...` + '\n';
  scraperState.step = 'inicjalizacja';
  scraperState.message = `Uruchamianie scrapera (${seasonSlug})...`;
  scraperState.progressCurrent = 0;
  scraperState.progressTotal = 0;

  updateScraperLog(`Rozpoczynanie pełnego importu danych (sezon: ${seasonSlug}, ścieżka: ${divisionPath})...`);

  try {
    scraperState.step = 'pobieranie';
    scraperState.message = 'Pobieranie danych przez Scrapling...';
    updateScraperLog(`Trigger: ${triggerLabel}`);
    updateScraperLog(`Uruchamiam scrapling script dla ${divisionPath}...`);

    const child = execFileCb(
      'python3',
      [KALK_SCRAPLING_SCRIPT, '--division-path', divisionPath, '--season', seasonSlug],
      {
        cwd: __dirname,
        timeout: 15 * 60 * 1000,
        maxBuffer: 10 * 1024 * 1024,
        env: {
          ...process.env,
          KALK_DIVISION_PATH: divisionPath,
          KALK_SEASON_SLUG: seasonSlug
        }
      }
    );

    child.stdout.on('data', (data) => {
      const text = data.toString();
      const lines = text.split('\n');
      for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        const progressMatch = line.match(/^::PROGRESS::\s*(\d+)\/(\d+)/);
        if (progressMatch) {
          scraperState.progressCurrent = parseInt(progressMatch[1], 10);
          scraperState.progressTotal = parseInt(progressMatch[2], 10);
        } else {
          updateScraperLog(line);
        }
      }
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      const lines = text.split('\n');
      for (let line of lines) {
        line = line.trim();
        if (line) {
          updateScraperLog(`STDERR: ${line}`);
        }
      }
    });

    await new Promise((resolve, reject) => {
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Proces zakończył się kodem: ${code}`));
        }
      });
      child.on('error', (err) => {
        reject(err);
      });
    });

    scraperState.step = 'import-bazy';
    scraperState.message = 'Import danych ze scrapingu do bazy...';

    const statsRaw = await fs.readFile(KALK_SCRAPLING_OUTPUT, 'utf-8');
    const stats = JSON.parse(statsRaw);
    await ingestLeagueTable(stats.table || [], 'regular');
    if (stats.playout_table) {
      await ingestLeagueTable(stats.playout_table, 'playout');
    }
    await ingestLeagueSchedule(stats.schedule || []);
    const playersIngest = await ingestKalkPlayers(stats.players || []);
    const teamsIngest = await ingestKalkTeams(stats.teams || []);
    const matchesIngest = await ingestKalkMatches(stats.matches || []);
    const logsIngest = await ingestKalkPlayerGameLogs(stats.playerGameLogs || []);

    const activeSeason = await getActiveSeason();
    if (activeSeason) {
      await prisma.kalkSyncRun.create({
        data: {
          seasonId: activeSeason.id,
          mode: 'full',
          trigger: triggerLabel,
          status: 'success',
          httpEstimate: stats.scrapeManifest?.httpCount ?? null,
          sectionsChanged: stats.scrapeManifest?.sections || [],
          probeHashes: stats.scrapeManifest || null,
          finishedAt: new Date()
        }
      });
    }

    scraperState.step = 'synchronizacja';
    scraperState.message = 'Synchronizacja zawodników...';
    await syncPlayersFromKalk();
    await ensureDefaultAdminUser();

    scraperState.progressCurrent = scraperState.progressTotal;
    scraperRunning = false;
    scraperState.running = false;
    scraperState.step = 'idle';
    scraperState.message = 'Zakończono pomyślnie';
    scraperState.lastFinishedAt = new Date().toISOString();

    updateScraperLog('Import zakończony sukcesem.');
    return {
      success: true,
      source: 'scrapling',
      version: stats.version || 1,
      teams: teamsIngest?.total ?? (Array.isArray(stats.table) ? stats.table.length : 0),
      schedule: Array.isArray(stats.schedule) ? stats.schedule.length : 0,
      kalkMatches: matchesIngest?.total || 0,
      kalkMatchesLinked: matchesIngest?.linked || 0,
      playerGameLogs: logsIngest?.total || 0,
      playerGameLogsSkipped: logsIngest?.skipped || 0,
      players: playersIngest?.total || 0
    };
  } catch (err) {
    scraperRunning = false;
    scraperState.running = false;
    scraperState.step = 'error';
    scraperState.message = `Błąd: ${err.message}`;
    updateScraperLog(`FATAL ERROR: ${err.message}`);
    throw err;
  }
}

app.post(['/api/scrape/kalk/div2/run', '/scrape/kalk/div2/run'], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await runScrapeImportPipeline('manual-admin');
    res.json(result);
  } catch (err) {
    if (err.message === 'Scraper już działa.') {
      return res.status(409).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * Targeted scrape brakujących meczów (URL-e z body lub audytu).
 */
app.post(['/api/scrape/kalk/gaps', '/scrape/kalk/gaps'], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const urls = Array.isArray(req.body?.urls)
      ? req.body.urls.filter((u) => typeof u === 'string' && u.startsWith('http'))
      : [];

    if (!urls.length) {
      const summary = await getKalkIngestSummary();
      for (const row of summary?.bekapakaMissingBoxScore || []) {
        if (row.scrapeUrl) urls.push(row.scrapeUrl);
      }
    }

    if (!urls.length) {
      return res.status(400).json({ error: 'Brak URL-i meczów do pobrania (podaj urls[] lub uzupełnij terminarz).' });
    }

    await new Promise((resolve, reject) => {
      const child = execFileCb(
        'python3',
        [KALK_GAP_SCRAPE_SCRIPT, ...urls],
        { cwd: __dirname, timeout: 5 * 60 * 1000, maxBuffer: 5 * 1024 * 1024 },
        (err) => (err ? reject(err) : resolve())
      );
      child.stdout?.on('data', (d) => updateScraperLog(String(d).trim()));
      child.stderr?.on('data', (d) => updateScraperLog(`GAP: ${String(d).trim()}`));
    });

    const statsRaw = await fs.readFile(KALK_SCRAPLING_OUTPUT, 'utf-8');
    const stats = JSON.parse(statsRaw);
    const matchesIngest = await ingestKalkMatches(stats.matches || []);

    res.json({
      success: true,
      urlsScraped: urls.length,
      kalkMatches: matchesIngest?.total || 0,
      kalkMatchesLinked: matchesIngest?.linked || 0
    });
  } catch (err) {
    console.error('KALK gap scrape error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- ADMIN API ---
app.post(['/api/admin/reset-data', '/admin/reset-data'], authenticateToken, requireAdmin, async (req, res) => {
  try {
    await resetData();
    res.json({ message: 'Dane zostały wyczyszczone.' });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ error: 'Błąd resetowania danych' });
  }
});

app.get(['/api/admin/users', '/admin/users'], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.rosterPlayer.findMany({
      orderBy: [
        { role: 'asc' },
        { lastName: 'asc' }
      ]
    });
    // Omit passwords
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json(safeUsers);
  } catch (err) {
    console.error('Failed to list admin users:', err);
    res.status(500).json({ error: 'Błąd pobierania użytkowników' });
  }
});

app.post(['/api/admin/users', '/admin/users'], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { firstName, lastName, number, position, username, password, role, photo } = req.body;
    
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'Imię i nazwisko są wymagane' });
    }

    let passwordHash = null;
    let cleanUsername = null;

    if (username && username.trim() !== '') {
      cleanUsername = username.toLowerCase().trim();
      const existing = await prisma.rosterPlayer.findUnique({
        where: { username: cleanUsername }
      });
      if (existing) {
        return res.status(400).json({ error: 'Nazwa użytkownika jest już zajęta' });
      }
      
      if (!password || password.trim() === '') {
        return res.status(400).json({ error: 'Hasło jest wymagane w przypadku tworzenia konta logowania' });
      }
      passwordHash = await bcrypt.hash(password, 10);
    }

    const newUser = await prisma.rosterPlayer.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        number: number !== undefined && number !== null && number !== '' ? parseInt(number) : null,
        position: position || null,
        username: cleanUsername,
        password: passwordHash,
        role: role || 'USER',
        starter: false,
        data: photo ? { photo } : null
      }
    });

    const { password: _, ...safeUser } = newUser;
    res.status(201).json(safeUser);
  } catch (err) {
    console.error('Failed to create user:', err);
    res.status(500).json({ error: 'Błąd tworzenia użytkownika' });
  }
});

app.put(['/api/admin/users/:id', '/admin/users/:id'], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, number, position, username, password, role, photo } = req.body;

    const existingUser = await prisma.rosterPlayer.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Użytkownik nie istnieje' });
    }

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();
    if (number !== undefined) {
      updateData.number = number !== null && number !== '' ? parseInt(number) : null;
    }
    if (position !== undefined) updateData.position = position || null;
    if (role !== undefined) updateData.role = role;

    if (username !== undefined) {
      if (username === null || username.trim() === '') {
        updateData.username = null;
        updateData.password = null;
      } else {
        const cleanUsername = username.toLowerCase().trim();
        if (cleanUsername !== existingUser.username) {
          const uniqueCheck = await prisma.rosterPlayer.findUnique({
            where: { username: cleanUsername }
          });
          if (uniqueCheck) {
            return res.status(400).json({ error: 'Nazwa użytkownika jest już zajęta' });
          }
        }
        updateData.username = cleanUsername;
      }
    }

    if (password && password.trim() !== '') {
      const activeUsername = updateData.username !== undefined ? updateData.username : existingUser.username;
      if (!activeUsername) {
        return res.status(400).json({ error: 'Nie można ustawić hasła bez nazwy użytkownika' });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (photo !== undefined) {
      const existingData = existingUser.data || {};
      updateData.data = {
        ...existingData,
        photo: photo || null
      };
    }

    const updatedUser = await prisma.rosterPlayer.update({
      where: { id },
      data: updateData
    });

    const { password: _, ...safeUser } = updatedUser;
    res.json(safeUser);
  } catch (err) {
    console.error('Failed to update user:', err);
    res.status(500).json({ error: 'Błąd aktualizacji użytkownika' });
  }
});

// --- USER PROFILE API (SELF SERVICE) ---
app.put(['/api/profile', '/profile'], authenticateToken, async (req, res) => {
  try {
    const { photo } = req.body;
    const existingUser = await prisma.rosterPlayer.findUnique({
      where: { id: req.user.id }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Użytkownik nie istnieje' });
    }

    const updated = await prisma.rosterPlayer.update({
      where: { id: req.user.id },
      data: {
        data: {
          ...(existingUser.data || {}),
          photo: photo !== undefined ? photo : (existingUser.data?.photo || null)
        }
      }
    });

    const { password: _, ...safeUser } = updated;
    res.json(safeUser);
  } catch (err) {
    console.error('Failed to update profile photo:', err);
    res.status(500).json({ error: 'Błąd aktualizacji zdjęcia profilowego' });
  }
});

app.put(['/api/profile/password', '/profile/password'], authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Oba hasła są wymagane' });
    }

    const user = await prisma.rosterPlayer.findUnique({
      where: { id: req.user.id }
    });

    if (!user || !user.password) {
      return res.status(404).json({ error: 'Konto logowania nie istnieje lub nie posiada hasła' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Aktualne hasło jest niepoprawne' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.rosterPlayer.update({
      where: { id: req.user.id },
      data: { password: newPasswordHash }
    });

    res.json({ success: true, message: 'Hasło zostało pomyślnie zmienione' });
  } catch (err) {
    console.error('Failed to update profile password:', err);
    res.status(500).json({ error: 'Błąd zmiany hasła' });
  }
});

app.delete(['/api/admin/users/:id', '/admin/users/:id'], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user?.id === id) {
      return res.status(400).json({ error: 'Nie możesz usunąć własnego konta administratora.' });
    }

    const existingUser = await prisma.rosterPlayer.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Użytkownik nie istnieje' });
    }

    await prisma.rosterPlayer.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Użytkownik został pomyślnie usunięty' });
  } catch (err) {
    console.error('Failed to delete user:', err);
    res.status(500).json({ error: 'Błąd usuwania użytkownika' });
  }
});

// --- REMAINING ROUTES ---
app.get(['/api/plays', '/plays'], async (req, res) => res.json(await listAllPlays(req.query.category)));
app.get(['/api/league/table', '/league/table'], async (req, res) => {
  const phase = req.query.phase || 'regular';
  res.json(await getLeagueTable(phase, req.query.seasonId));
});
app.get(['/api/league/schedule', '/league/schedule'], async (req, res) => {
  res.json(await getLeagueSchedule(req.query.seasonId));
});
app.get(['/api/league/scorers', '/league/scorers'], async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  res.json(await getTopScorers(limit, req.query.seasonId));
});
app.get(['/api/league/leaders', '/league/leaders'], async (req, res) => {
  const category = req.query.category || 'points';
  const limit = parseInt(req.query.limit) || 20;
  res.json(await getLeagueLeaders(category, limit, req.query.seasonId));
});

/** Sync KALK — wyłącznie z hosta (cron) lub Hermes; nagłówek X-Cron-Secret. */
app.post(['/api/internal/kalk/sync', '/internal/kalk/sync'], async (req, res) => {
  const secret = process.env.KALK_CRON_SECRET;
  const provided = req.get('X-Cron-Secret') || req.get('x-cron-secret');
  if (!secret || provided !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const mode = req.query.mode || 'auto';
  if (mode === 'probe') {
    return res.json({
      success: true,
      mode: 'probe',
      message: 'Probe — pełny import w kolejnej fazie (Faza 2 planu). Uruchom mode=full.'
    });
  }
  try {
    const result = await runScrapeImportPipeline(`cron-${mode}`);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post(['/api/coach-notes/:gameId', '/coach-notes/:gameId'], async (req, res) => {
  res.json(await updateCoachNote(req.params.gameId, req.body.note || ''));
});

app.post(['/api/tags/:gameId', '/tags/:gameId'], async (req, res) => {
  res.json(await addTag(req.params.gameId, req.body.tag));
});


app.use((req, res) => {
  console.log(`[404] Unmatched: ${req.method} ${req.url}`);
  res.status(404).json({ error: `Not Found: ${req.url}` });
});

async function bootstrapScrapingIfEmpty() {
  try {
    const [teamsCount, matchesCount, playersCount] = await Promise.all([
      prisma.leagueTeam.count(),
      prisma.leagueMatch.count(),
      prisma.kalkPlayer.count()
    ]);

    if (teamsCount > 0 && matchesCount > 0 && playersCount > 0) {
      console.log('[Bootstrap] Scraping bootstrap skipped - data already present.');
      return;
    }

    console.log('[Bootstrap] Empty scraping tables detected. Running initial scrape...');
    await runScrapeImportPipeline('startup-bootstrap');
    console.log('[Bootstrap] Initial scrape completed.');
  } catch (error) {
    console.error('[Bootstrap] Initial scrape failed:', error.message);
  }
}

setTimeout(() => {
  bootstrapScrapingIfEmpty().catch((error) => {
    console.error('[Bootstrap] Unexpected error:', error.message);
  });
}, 5000);

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => console.log(`API running on ${PORT}`));
