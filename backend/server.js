import { runKalkV2Sync } from './kalk/v2/runSync.js';
import { leagueMetadata } from './leagueMetadata.js';
import { Prisma } from '@prisma/client';
import { updateMatchPresentation, invalidateMatchPages } from './matchPresentation.js';
import express from 'express';
import { createStudioRouter } from './studio/routes.js';
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
  logKalkScrapeRun,
  getLatestKalkScrapeRun,
  getKalkIngestSummary,
  getKalkDataAuditReport,
  listKalkPlayers,
  resetData,
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
  getMatchup,
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
import { runAiAudit, summarizeAiAudit } from './ai/audit.js';
import { getMatchAiStaleness } from './ai/buildMatchContext.js';
import { AiTimeoutError, isGeminiConfigured } from './ai/geminiClient.js';
import { AiConfigError, AiValidationError, AiBusyError } from './ai/errors.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from './lib/prisma.js';
import { getJwtSecret, getEnvMinLength } from './lib/requireEnv.js';
import { tacticsRouter } from './routes/tactics.js';
import { toPlayerProfileResponse, toPublicRosterPlayer } from './lib/apiResponses.js';
import { createLoginThrottle } from './lib/loginThrottle.js';
import { getGameInfo, getGamePlayByPlay, getPlayerCareer, getTeamsAllTime } from './kalk/v2/readModels.js';

const execFile = promisify(execFileCb);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const loginThrottle = createLoginThrottle();
const allowedOrigins = new Set([
  'https://panel.bekapaka.pl',
  'https://bekapaka.pl',
  ...(process.env.CORS_ALLOWED_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean),
  ...(process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173', 'http://127.0.0.1:5173'])
]);
app.use(cors({
  origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin))
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

app.use('/api/studio/v1', createStudioRouter({ db: prisma, loginUser }));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/ping', (req, res) => res.send('pong'));
app.get('/api/ping', (req, res) => res.send('pong'));

// --- AUTHENTICATION ---
// Imports moved to top

const SECRET_KEY = getJwtSecret();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
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

app.use(['/api/tactics', '/tactics'], authenticateToken, (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return requireAdmin(req, res, next);
  }
  next();
}, tacticsRouter);

app.post(['/api/auth/login', '/auth/login'], async (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string'
    || !username || !password || username.length > 128 || password.length > 1024) {
    return res.status(400).json({ error: 'Brak danych logowania' });
  }
  if (!loginThrottle.check(req.ip, username)) {
    return res.status(429).json({ error: 'Zbyt wiele prób logowania. Spróbuj później.' });
  }

  const result = await loginUser(username, password, req.ip);
  if (!result) return res.status(401).json({ error: 'Błędny login lub hasło' });

  loginThrottle.clear(req.ip, username);
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
    const game = await getGameById(req.params.id, req.query.seasonId);
    if (!game) return res.status(404).json({ error: 'Mecz nie znaleziony' });
    // Mecze KALK: aktualność analizy AI liczona z pełnego kontekstu (typowane sumy, PBP, wersja promptu).
    if (game.aiSummary && (game.isFromKalkMatch || game.dataSource === 'kalk')) {
      const st = await getMatchAiStaleness({
        gameId: String(game.kalkMatchId || game.id),
        seasonId: game.seasonId,
        aiSummary: game.aiSummary,
        aiSummaryHash: game.aiSummaryHash
      });
      game.aiSummaryStale = st.stale;
    }
    res.json(game);
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania meczu' });
  }
});

/** seasonId z query (opcjonalny) → id sezonu; brak = szukaj po ID meczu we wszystkich sezonach. */
async function querySeasonId(req) {
  const raw = typeof req.query.seasonId === 'string' ? req.query.seasonId.trim() : '';
  if (!raw) return null;
  const season = await getSeasonById(raw);
  return season?.id ?? null;
}

// KALK v2: akcja po akcji (publiczne jak GET /api/games/:id — dane ligi).
app.get(['/api/games/:id/play-by-play', '/games/:id/play-by-play'], async (req, res) => {
  try {
    const data = await getGamePlayByPlay(prisma, req.params.id, { seasonId: await querySeasonId(req) });
    if (!data) return res.status(404).json({ error: 'Mecz nie znaleziony' });
    res.json(data);
  } catch (err) {
    console.error('Play-by-play error:', err);
    res.status(500).json({ error: 'Błąd pobierania akcji po akcji' });
  }
});

// KALK v2: info meczu (MVP, sędziowie, liderzy, przebieg, źródła punktów, H2H, rekordy).
app.get(['/api/games/:id/info', '/games/:id/info'], async (req, res) => {
  try {
    const data = await getGameInfo(prisma, req.params.id, { seasonId: await querySeasonId(req) });
    if (!data) return res.status(404).json({ error: 'Mecz nie znaleziony' });
    res.json(data);
  } catch (err) {
    console.error('Game info error:', err);
    res.status(500).json({ error: 'Błąd pobierania informacji o meczu' });
  }
});

app.patch('/api/admin/matches/:source/:seasonId/:id/presentation', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await updateMatchPresentation({ game: prisma.game, kalkMatch: prisma.kalkMatch, jsonNull: Prisma.DbNull }, { ...req.params, presentation: req.body.presentation });
    if (!result) return res.status(404).json({ error: 'Nie znaleziono meczu w tym sezonie' });
    let revalidated = false;
    try { revalidated = await invalidateMatchPages(); } catch (error) { revalidated = false; console.error(error.message); }
    return res.json({ presentation: result.presentation, updatedAt: result.presentationUpdatedAt, revalidated });
  } catch (error) {
    return res.status(error.code ? 500 : 400).json({ error: error.code ? 'Nie udało się zapisać prezentacji' : error.message });
  }
});

app.post(['/api/games', '/games'], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const game = await createGame(req.body);
    res.status(201).json(game);
  } catch (err) {
    res.status(500).json({ error: 'Błąd tworzenia meczu' });
  }
});

app.put(['/api/games/:id', '/games/:id'], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const updated = await updateGame(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Błąd aktualizacji' });
  }
});

app.delete(['/api/games/:id', '/games/:id'], authenticateToken, requireAdmin, async (req, res) => {
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
    res.json(roster.map(toPublicRosterPlayer));
  } catch (err) {
    console.error('Roster error:', err);
    res.status(500).json({ error: 'Błąd pobierania składu' });
  }
});

app.get(['/api/players', '/players'], async (req, res) => {
  try {
    const players = await listAllPlayers(req.query.seasonId);
    res.json(players.map(toPublicRosterPlayer));
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania zawodników' });
  }
});

app.get(['/api/players/:id', '/players/:id'], authenticateToken, async (req, res) => {
  try {
    const player = await getPlayerById(req.params.id);
    if (!player) return res.status(404).json({ error: 'Zawodnik nie znaleziony' });
    res.json(toPlayerProfileResponse(player, {
      includeDevelopment: req.user?.role === 'ADMIN' || req.user?.id === player.id
    }));
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania danych zawodnika' });
  }
});

// Kariera zawodnika (KALK v2): profil + sezony od 2023/24 + podsumowanie logów meczowych.
app.get(['/api/players/:id/career', '/players/:id/career'], authenticateToken, async (req, res) => {
  try {
    const data = await getPlayerCareer(prisma, req.params.id);
    if (!data) return res.status(404).json({ error: 'Zawodnik nie znaleziony' });
    res.json(data);
  } catch (err) {
    console.error('Career error:', err);
    res.status(500).json({ error: 'Błąd pobierania kariery zawodnika' });
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
  if (err instanceof AiTimeoutError) {
    return res.status(504).json({ error: err.message });
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
    const catalog = await getAiAnalysesCatalog(req.query.seasonId);
    res.json(catalog);
  } catch (err) {
    handleAiRouteError(err, res);
  }
});

app.get(['/api/ai/briefing', '/ai/briefing'], authenticateToken, async (req, res) => {
  try {
    const seasonId = req.query.seasonId;
    const briefing = await getTeamBriefingCached(seasonId);
    let stale = false;
    if (briefing?.contentMd && briefing.sourceHash) {
      const { buildBriefingContext } = await import('./ai/buildBriefingContext.js');
      const ctx = await buildBriefingContext(seasonId);
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
    const seasonId = req.body?.seasonId || req.query.seasonId;
    const result = await generateTeamBriefing({ force: Boolean(req.body?.force), seasonId });
    res.json(result);
  } catch (err) {
    handleAiRouteError(err, res);
  }
});

app.post(['/api/games/:id/analyze', '/games/:id/analyze'], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await generateGameAnalysis(req.params.id, {
      force: Boolean(req.body?.force),
      seasonId: req.body?.seasonId || req.query.seasonId
    });
    res.json(result);
  } catch (err) {
    handleAiRouteError(err, res);
  }
});

app.post(['/api/players/:id/analyze', '/players/:id/analyze'], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await generatePlayerDevelopment(req.params.id, {
      force: Boolean(req.body?.force),
      seasonId: req.body?.seasonId || req.query.seasonId
    });
    res.json(result);
  } catch (err) {
    handleAiRouteError(err, res);
  }
});

app.post(['/api/scouting/analyze', '/scouting/analyze'], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const opponent = req.query.opponent || req.body?.opponent;
    const result = await generateScoutingReport(opponent, {
      force: Boolean(req.body?.force),
      seasonId: req.body?.seasonId || req.query.seasonId
    });
    res.json(result);
  } catch (err) {
    handleAiRouteError(err, res);
  }
});

// Audyt analiz AI (aktualność, szablon vs Gemini, kontrola faktów) — lista „Do regeneracji” w hubie AI.
app.get(['/api/ai/audit', '/ai/audit'], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const report = await runAiAudit({
      seasonId: req.query.seasonId ? String(req.query.seasonId) : undefined,
      factCheck: req.query.factCheck !== 'false'
    });
    res.json(summarizeAiAudit(report));
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

app.get(['/api/kalk/ingest-summary', '/kalk/ingest-summary'], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const summary = await getKalkIngestSummary(req.query.seasonId);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get(['/api/kalk/audit', '/kalk/audit'], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const report = await getKalkDataAuditReport(req.query.seasonId);
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

async function runScrapeImportPipeline(triggerLabel = 'manual', targetSeasonId = undefined, options = {}) {
  if (scraperRunning) {
    throw new Error('Scraper już działa.');
  }

  const activeSeason = targetSeasonId ? await getSeasonById(targetSeasonId) : await getActiveSeason();
  if (!activeSeason) {
    throw new Error('Brak aktywnego sezonu KALK.');
  }
  if (!activeSeason.kalkNumber && activeSeason.sourceSite !== 'v2') {
    throw new Error(
      `Sezon ${activeSeason.slug} pochodzi ze starej strony KALK — uzupełnij go backfillem (scripts/kalk-backfill.js), nie synchronizacją.`
    );
  }
  const mode = options.mode || 'incremental';

  scraperRunning = true;
  scraperState.running = true;
  scraperState.lastLog = `[${new Date().toLocaleTimeString()}] System: Inicjalizacja dla sezonu ${activeSeason.slug}...` + '\n';
  scraperState.step = 'pobieranie';
  scraperState.message = `Pobieranie danych KALK (${activeSeason.slug}, ${options.matches?.length ? 'wybrane mecze' : mode})...`;
  scraperState.progressCurrent = 0;
  scraperState.progressTotal = 0;
  updateScraperLog(`Trigger: ${triggerLabel}`);

  try {
    const sync = await runKalkV2Sync({
      prisma,
      seasonId: activeSeason.id,
      mode,
      matches: options.matches || null,
      trigger: triggerLabel,
      onProgress: (current, total) => {
        scraperState.progressCurrent = current;
        scraperState.progressTotal = total;
        if (current >= total) {
          scraperState.step = 'import-bazy';
          scraperState.message = 'Import danych do bazy...';
        }
      },
      onLog: (line) => updateScraperLog(line)
    });

    await ensureDefaultAdminUser();

    const r = sync.result;
    scraperState.progressCurrent = scraperState.progressTotal;
    scraperRunning = false;
    scraperState.running = false;
    scraperState.step = 'idle';
    scraperState.message =
      sync.status === 'partial'
        ? `Zakończono z pominięciami (${sync.manifest.failures?.length || 0}) — szczegóły w logu`
        : 'Zakończono pomyślnie';
    scraperState.lastFinishedAt = new Date().toISOString();
    for (const failure of sync.manifest.failures || []) {
      updateScraperLog(`POMINIĘTO: ${failure.url || failure.section} — ${failure.error}`);
    }
    updateScraperLog(
      `Import zakończony (${sync.status}): mecze +${r.matches.created} ~${r.matches.updated}, logi ${r.gameLogs.written}, PBP ${r.pbp.eventsWritten}, zapytania ${sync.manifest.httpCount}.`
    );
    return {
      success: true,
      status: sync.status,
      source: 'kalk-v2',
      version: 3,
      season: sync.season,
      httpCount: sync.manifest.httpCount,
      failures: sync.manifest.failures || [],
      teams: r.leagueTeams.created + r.leagueTeams.updated + r.leagueTeams.unchanged,
      schedule: r.leagueMatches.created + r.leagueMatches.updated + r.leagueMatches.unchanged,
      kalkMatches: r.matches.created + r.matches.updated + r.matches.unchanged,
      kalkMatchesLinked: r.matches.created + r.matches.updated + r.matches.unchanged,
      playerGameLogs: r.gameLogs.written,
      playerGameLogsSkipped: 0,
      players: r.kalkPlayers.created + r.kalkPlayers.updated + r.kalkPlayers.unchanged
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
    const fromBody = Array.isArray(req.body?.matchIds)
      ? req.body.matchIds
      : (Array.isArray(req.body?.urls) ? req.body.urls : []).map((u) => String(u).match(/\/mecz\/(\d+)/)?.[1]);
    const ids = new Set(fromBody.filter((id) => /^\d+$/.test(String(id || ''))).map(String));

    if (!ids.size) {
      const summary = await getKalkIngestSummary();
      for (const row of summary?.bekapakaMissingBoxScore || []) {
        if (row.kalkMatchId && /^\d+$/.test(String(row.kalkMatchId))) ids.add(String(row.kalkMatchId));
      }
    }

    if (!ids.size) {
      return res.status(400).json({ error: 'Brak meczów do pobrania (podaj matchIds[] lub uzupełnij terminarz).' });
    }

    const result = await runScrapeImportPipeline('manual-gaps', undefined, { matches: [...ids] });
    res.json({ ...result, urlsScraped: ids.size });
  } catch (err) {
    if (err.message === 'Scraper już działa.' || err.code === 'KALK_LOCKED') {
      return res.status(409).json({ error: err.message });
    }
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
app.get(['/api/plays', '/plays'], authenticateToken, async (req, res) => res.json(await listAllPlays(req.query.category)));
app.get(['/api/league/table', '/league/table'], async (req, res) => {
  const phase = req.query.phase || 'regular';
  const rows = await getLeagueTable(phase, req.query.seasonId);
  if (req.query.includeMeta !== '1') return res.json(rows);
  const season = req.query.seasonId ? await getSeasonById(req.query.seasonId) : await getActiveSeason();
  res.json({ data: rows, meta: leagueMetadata(season, rows) });
});
// Bilans wszech czasów drużyn Dywizji II (KALK) + bilans bezpośredni z BeKaPaKa (publiczne, dane ligi).
app.get(['/api/league/all-time', '/league/all-time'], async (_req, res) => {
  try {
    res.json(await getTeamsAllTime(prisma));
  } catch (err) {
    console.error('All-time error:', err);
    res.status(500).json({ error: 'Błąd pobierania bilansu wszech czasów' });
  }
});
// Zapowiedź meczu: porównanie BeKaPaKa i rywala w sezonie (publiczne, dane ligi).
app.get(['/api/league/matchup', '/league/matchup'], async (req, res) => {
  const opponent = typeof req.query.opponent === 'string' ? req.query.opponent.trim() : '';
  if (!opponent || opponent.length > 80) return res.status(400).json({ error: 'Podaj nazwę rywala (do 80 znaków).' });
  try {
    const matchup = await getMatchup(opponent, req.query.seasonId);
    if (!matchup) return res.status(404).json({ error: 'Nie znaleziono rywala w tabeli ligi.' });
    res.json(matchup);
  } catch (error) {
    console.error('Matchup failed:', error);
    res.status(500).json({ error: 'Nie udało się przygotować porównania.' });
  }
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
  // KALK v2: cron zawsze przyrostowo (sonda tabeli/terminarza → tylko nowe/zmienione mecze).
  // Pełna resynchronizacja sezonu tylko jawnie: mode=resync.
  const mode = req.query.mode || 'auto';
  const syncMode = mode === 'resync' ? 'full' : 'incremental';
  try {
    const result = await runScrapeImportPipeline(`cron-${mode}`, undefined, { mode: syncMode });
    res.json(result);
  } catch (err) {
    const status = err.message === 'Scraper już działa.' || err.code === 'KALK_LOCKED' ? 409 : 500;
    res.status(status).json({ error: err.message });
  }
});

app.post(['/api/coach-notes/:gameId', '/coach-notes/:gameId'], authenticateToken, requireAdmin, async (req, res) => {
  res.json(await updateCoachNote(req.params.gameId, req.body.note || ''));
});

app.post(['/api/tags/:gameId', '/tags/:gameId'], authenticateToken, requireAdmin, async (req, res) => {
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

export { app };

if (process.env.NODE_ENV !== 'test') {
  setTimeout(() => {
    bootstrapScrapingIfEmpty().catch((error) => {
      console.error('[Bootstrap] Unexpected error:', error.message);
    });
  }, 5000);

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, '0.0.0.0', () => console.log(`API running on ${PORT}`));
}
