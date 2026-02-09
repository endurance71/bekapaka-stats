import express from 'express';
import cors from 'cors';
import { loginUser, getLoginLogs } from './dataStore.js';
import jwt from 'jsonwebtoken';
import {
  getDB,
  saveGame,
  updateCoachNote,
  addTag,
  getGameById,
  listGames,
  upsertRoster,
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
  getTrainingPriorities,
  getNextOpponentScouting,
  getDetailedScouting,
  getLeagueTrends,
  getTeamStatsSummary
} from './dataStore.js';
import { parseImportPayload } from './parser.js';
import { withShootingMetrics } from './metrics.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
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
    const stats = await getPlayerStats(req.params.id);
    res.json(stats);
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Błąd statystyk' });
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
app.post(['/api/scrape/kalk/div2/run', '/scrape/kalk/div2/run'], authenticateToken, requireAdmin, async (req, res) => {
  if (scraperRunning) return res.status(409).json({ error: 'Scraper już działa.' });

  scraperRunning = true;
  scraperState.running = true;
  scraperState.lastLog = `[${new Date().toLocaleTimeString()}] System: Inicjalizacja...` + '\n';
  scraperState.step = 'inicjalizacja';
  scraperState.message = 'Uruchamianie scrapera...';

  updateScraperLog('Rozpoczynanie pełnego importu danych...');

  try {
    const { runFullScrape } = await import('./scrapers/kalkScraper.js');

    // Intercept console.log temporarily
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args) => {
      updateScraperLog(args.join(' '));
      originalLog.apply(console, args);
    };
    console.error = (...args) => {
      updateScraperLog(`ERROR: ${args.join(' ')}`);
      originalError.apply(console, args);
    };

    scraperState.step = 'pobieranie';
    scraperState.message = 'Pobieranie danych z kalk-koszalin.com...';

    const result = await runFullScrape();

    scraperState.step = 'synchronizacja';
    scraperState.message = 'Synchronizacja zawodników...';
    await syncPlayersFromKalk();

    // Restore console
    console.log = originalLog;
    console.error = originalError;

    scraperRunning = false;
    scraperState.running = false;
    scraperState.step = 'idle';
    scraperState.message = 'Zakończono pomyślnie';
    scraperState.lastFinishedAt = new Date().toISOString();

    updateScraperLog('Import zakończony sukcesem.');
    res.json(result);
  } catch (err) {
    scraperRunning = false;
    scraperState.running = false;
    scraperState.step = 'error';
    scraperState.message = `Błąd: ${err.message}`;
    updateScraperLog(`FATAL ERROR: ${err.message}`);
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

// --- REMAINING ROUTES ---
app.get(['/api/trainings', '/trainings'], async (req, res) => res.json(await listAllTrainings()));
app.get(['/api/plays', '/plays'], async (req, res) => res.json(await listAllPlays(req.query.category)));
app.get(['/api/league/table', '/league/table'], async (req, res) => res.json(await getLeagueTable()));
app.get(['/api/league/schedule', '/league/schedule'], async (req, res) => res.json(await getLeagueSchedule()));
app.get(['/api/league/scorers', '/league/scorers'], async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  res.json(await getTopScorers(limit));
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

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => console.log(`API running on ${PORT}`));
