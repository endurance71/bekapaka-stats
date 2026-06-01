import express from 'express';
import cors from 'cors';
import { loginUser, getLoginLogs } from './dataStore.js';
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
  logKalkScrapeRun,
  getLatestKalkScrapeRun,
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
  listAllTrainings,
  createTraining,
  updateTraining,
  listAllPlays,
  createPlay,
  updatePlay,
  getLeagueTable,
  getLeagueSchedule,
  getTopScorers,
  getLeagueLeaders,
  getTrainingPriorities,
  getNextOpponentScouting,
  getDetailedScouting,
  getLeagueTrends,
  getTeamStatsSummary,
  listSeasons,
  setPlayerSeasonPreference
} from './dataStore.js';
import { parseImportPayload } from './parser.js';
import { withShootingMetrics } from './metrics.js';
import {
  generateGameAnalysis,
  generatePlayerDevelopment,
  generateScoutingReport,
  generateTeamBriefing,
  getTeamBriefingCached
} from './ai/generate.js';
import { isGeminiConfigured } from './ai/geminiClient.js';
import { AiConfigError, AiValidationError, AiBusyError } from './ai/errors.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const execFile = promisify(execFileCb);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KALK_SCRAPLING_SCRIPT = path.join(__dirname, 'scripts', 'kalk_scraper.py');
const KALK_SCRAPLING_OUTPUT = path.resolve(__dirname, '../kalk_stats.json');
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

const SECRET_KEY = process.env.JWT_SECRET || 'bekapaka-secret-key-2026';

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

// --- IMPORT ---
app.post(['/api/import', '/import'], async (req, res) => {
  try {
    const parsed = parseImportPayload(req.body);

    if (parsed.source === 'markdown') {
      return res.json({
        message: 'Wykryto Markdown.',
        preview: parsed.game,
        validation: parsed.validation
      });
    }

    const game = parsed.game;
    if (!game || !game.id) {
      return res.status(400).json({ error: 'Brak danych meczu.' });
    }

    // Dodaj metryki do zawodników
    const bekapaka = game.teams?.find((t) => t.isBekapaka) || game.teams?.[0];
    if (bekapaka && bekapaka.players) {
      bekapaka.players = bekapaka.players.map((p) => ({
        ...p,
        metrics: withShootingMetrics({
          fgm: p.fgm,
          fga: p.fga,
          three_pm: p.three_pm,
          fta: p.fta,
          pts: p.pts,
          tov: p.tov
        })
      }));
    }

    await saveGame(game);
    res.json({ message: 'Mecz zaimportowany pomyślnie.', game });
  } catch (err) {
    console.error('Import error:', err);
    res.status(400).json({ error: err.message });
  }
});

// --- GAMES API ---
app.get(['/api/games', '/games'], async (req, res) => {
  try {
    const filters = {
      result: req.query.result,
      homeAway: req.query.homeAway
    };
    const games = await listGames(filters);
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
    const roster = await getRoster();
    res.json(roster);
  } catch (err) {
    console.error('Roster error:', err);
    res.status(500).json({ error: 'Błąd pobierania składu' });
  }
});

app.get(['/api/players', '/players'], async (req, res) => {
  try {
    const players = await listAllPlayers();
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

// --- TRENDS \u0026 ANALYTICS ---
app.get(['/api/trends/team', '/trends/team'], async (req, res) => {
  try {
    const trends = await getTeamTrends();
    res.json(trends);
  } catch (err) {
    res.status(500).json({ error: 'Błąd trendów' });
  }
});

app.get(['/api/trends/league', '/trends/league'], async (req, res) => {
  try {
    const comparison = await getLeagueComparison();
    res.json(comparison);
  } catch (err) {
    res.status(500).json({ error: 'Błąd porównania' });
  }
});

app.get(['/api/team/stats', '/team/stats'], async (req, res) => {
  try {
    const stats = await getTeamStatsSummary();
    res.json(stats);
  } catch (err) {
    console.error('Team stats error:', err);
    res.status(500).json({ error: 'Błąd statystyk zespołu' });
  }
});

app.get(['/api/training/priorities', '/training/priorities'], async (req, res) => {
  try {
    const priorities = await getTrainingPriorities();
    res.json(priorities);
  } catch (err) {
    res.status(500).json({ error: 'Błąd priorytetów' });
  }
});

app.get(['/api/scouting/next', '/scouting/next'], async (req, res) => {
  try {
    const scouting = await getNextOpponentScouting();
    res.json(scouting);
  } catch (err) {
    res.status(500).json({ error: 'Błąd scoutingu' });
  }
});

app.get(['/api/scouting/detailed', '/scouting/detailed'], async (req, res) => {
  try {
    const opponent = req.query.opponent;
    const scouting = await getDetailedScouting(opponent);
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
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  });
});

app.get(['/api/ai/briefing', '/ai/briefing'], authenticateToken, async (req, res) => {
  try {
    const briefing = await getTeamBriefingCached();
    res.json({
      contentMd: briefing?.contentMd || null,
      generatedAt: briefing?.generatedAt || null,
      model: briefing?.model || null
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
  lastLog: ''
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
async function ensureDefaultAdminUser() {
  const username = (process.env.ADMIN_USERNAME || 'motylinski').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || 'BeKaPaKa!2026';
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.rosterPlayer.findFirst({
    where: { username }
  });

  if (existing) {
    await prisma.rosterPlayer.update({
      where: { id: existing.id },
      data: {
        firstName: existing.firstName || 'Damian',
        lastName: existing.lastName || 'Motylinski',
        role: 'ADMIN',
        password: passwordHash
      }
    });
    return;
  }

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
}

async function runScrapeImportPipeline(triggerLabel = 'manual') {
  if (scraperRunning) {
    throw new Error('Scraper już działa.');
  }

  scraperRunning = true;
  scraperState.running = true;
  scraperState.lastLog = `[${new Date().toLocaleTimeString()}] System: Inicjalizacja...` + '\n';
  scraperState.step = 'inicjalizacja';
  scraperState.message = 'Uruchamianie scrapera...';

  updateScraperLog('Rozpoczynanie pełnego importu danych...');
  const originalLog = console.log;
  const originalError = console.error;

  try {
    // Intercept console.log temporarily
    console.log = (...args) => {
      updateScraperLog(args.join(' '));
      originalLog.apply(console, args);
    };
    console.error = (...args) => {
      updateScraperLog(`ERROR: ${args.join(' ')}`);
      originalError.apply(console, args);
    };

    scraperState.step = 'pobieranie';
    scraperState.message = 'Pobieranie danych przez Scrapling...';
    updateScraperLog(`Trigger: ${triggerLabel}`);
    updateScraperLog('Uruchamiam scrapling script (Python)...');

    const { stdout, stderr } = await execFile('python3', [KALK_SCRAPLING_SCRIPT], {
      cwd: __dirname,
      timeout: 15 * 60 * 1000,
      maxBuffer: 10 * 1024 * 1024
    });

    if (stdout?.trim()) updateScraperLog(stdout.trim());
    if (stderr?.trim()) updateScraperLog(`STDERR: ${stderr.trim()}`);

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

    scraperState.step = 'synchronizacja';
    scraperState.message = 'Synchronizacja zawodników...';
    await syncPlayersFromKalk();
    await ensureDefaultAdminUser();

    // Restore console
    console.log = originalLog;
    console.error = originalError;

    scraperRunning = false;
    scraperState.running = false;
    scraperState.step = 'idle';
    scraperState.message = 'Zakończono pomyślnie';
    scraperState.lastFinishedAt = new Date().toISOString();

    updateScraperLog('Import zakończony sukcesem.');
    return {
      success: true,
      source: 'scrapling',
      teams: Array.isArray(stats.table) ? stats.table.length : 0,
      matches: Array.isArray(stats.schedule) ? stats.schedule.length : 0,
      players: playersIngest?.total || 0
    };
  } catch (err) {
    scraperRunning = false;
    scraperState.running = false;
    scraperState.step = 'error';
    scraperState.message = `Błąd: ${err.message}`;
    updateScraperLog(`FATAL ERROR: ${err.message}`);
    throw err;
  } finally {
    console.log = originalLog;
    console.error = originalError;
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

// --- ADMIN API ---
app.post(['/api/admin/reset-data', '/admin/reset-data'], authenticateToken, requireAdmin, async (req, res) => {
  try {
    await resetData(); // Note: imported as resetData, but exported as resetDatabase in dataStore.js? Wait, check imports.
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
app.get(['/api/trainings', '/trainings'], async (req, res) => res.json(await listAllTrainings()));
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


app.use('*', (req, res) => {
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
      await ensureDefaultAdminUser();
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
