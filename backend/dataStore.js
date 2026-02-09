import { PrismaClient } from '@prisma/client';
import { withShootingMetrics } from './metrics.js';
import { generateGameInsights } from './insights.js';
import { scrapePlayerDetailedStats, scrapeMatchProtocol } from './scrapers/kalkScraper.js';

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'bekapaka-secret-key-2026';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

let seeded = false;
let seeding = false;

async function ensureSeeded() {
  // W produkcji (lub gdy nie ma flagi), nie seeduj automatycznie
  const isDev = process.env.NODE_ENV === 'development';
  const forceSeed = process.env.ENABLE_AUTO_SEED === 'true';

  if (!isDev && !forceSeed) {
    if (!seeded) console.log('Auto-seeding skipped. Set ENABLE_AUTO_SEED=true to enable.');
    seeded = true; // Zapobiegamy ponownym próbom
    return;
  }

  if (seeded || seeding) return;
  seeding = true;

  try {
    const count = await prisma.rosterPlayer.count();
    if (count > 0) {
      await restoreMetadataFromSeed();
      seeded = true;
      return;
    }

    console.log('Seeding database from sample-data.json...');
    const dataPath = path.join(__dirname, 'tests/fixtures/sample-data.json');
    const raw = await fs.readFile(dataPath, 'utf-8');
    const data = JSON.parse(raw);

    if (data.roster) {
      for (const p of data.roster) {
        await upsertRoster(p);
      }
    }

    if (data.games) {
      for (const g of data.games) {
        await saveGame(g);
      }
    }

    console.log('Seeding complete.');
    seeded = true;
    seeding = false;
  } catch (err) {
    console.error('Seeding error:', err);
    seeding = false;
  }
}

async function restoreMetadataFromSeed() {
  try {
    const dataPath = path.join(__dirname, 'tests/fixtures/sample-data.json');
    const raw = await fs.readFile(dataPath, 'utf-8');
    const data = JSON.parse(raw);

    if (data.roster) {
      for (const p of data.roster) {
        const existing = await prisma.rosterPlayer.findFirst({
          where: {
            OR: [
              { AND: [{ firstName: { equals: p.firstName, mode: 'insensitive' } }, { lastName: { equals: p.lastName, mode: 'insensitive' } }] },
              { AND: [{ firstName: { equals: p.lastName, mode: 'insensitive' } }, { lastName: { equals: p.firstName, mode: 'insensitive' } }] }
            ]
          }
        });

        if (existing) {
          const updateData = {};
          if ((!existing.position || existing.position.trim() === "") && p.position) {
            updateData.position = p.position;
          }
          if (!existing.number && p.number) updateData.number = p.number;
          if (!existing.birthDate && p.birthDate) updateData.birthDate = p.birthDate;
          if (!existing.heightCm && p.heightCm) updateData.heightCm = p.heightCm;

          if (Object.keys(updateData).length > 0) {
            await prisma.rosterPlayer.update({
              where: { id: existing.id },
              data: updateData
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Metadata restoration error:', err);
  }
}

function parseStat(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  const cleaned = value.toString().replace(',', '.').trim();
  const match = cleaned.match(/^-?\d+(\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function getDB() {
  await ensureSeeded();
  const games = await listGames();
  const roster = await prisma.rosterPlayer.findMany();
  return {
    games,
    roster
  };
}

export async function saveGame(game) {
  await ensureSeeded();
  await prisma.game.create({
    data: {
      id: game.id,
      date: game.date || '',
      opponent: game.opponent || '',
      data: game
    }
  });
  return game;
}

export async function seedDatabase() {
  await ensureSeeded();
}

export async function resetDatabase() {
  console.log('Resetting database...');
  await prisma.game.deleteMany();
  await prisma.leagueMatch.deleteMany();
  await prisma.leagueTeam.deleteMany();
  await prisma.kalkPlayer.deleteMany();
  await prisma.rosterPlayer.deleteMany();
  seeded = false; // Allow re-seeding if enabled
  console.log('Database reset complete.');
}
export const resetData = resetDatabase;

export async function updateCoachNote(gameId, note) {
  await ensureSeeded();
  const found = await prisma.game.findUnique({ where: { id: gameId } });
  if (!found) return null;

  // Update both the column (new) and the JSON data (for backward compatibility if needed)
  const nextData = { ...found.data, coachNotes: note };

  return await prisma.game.update({
    where: { id: gameId },
    data: {
      notes: note,
      data: nextData
    }
  });
}

export async function addTag(gameId, tag) {
  await ensureSeeded();
  const found = await prisma.game.findUnique({ where: { id: gameId } });
  if (!found) return null;
  const tags = Array.isArray(found.data.tags) ? found.data.tags : [];
  const nextTags = tags.includes(tag) ? tags : [...tags, tag];
  const next = { ...found.data, tags: nextTags };
  await prisma.game.update({ where: { id: gameId }, data: { data: next } });
  return next;
}

export async function getRoster() {
  await ensureSeeded();
  // Fetch all games for game logs
  const allGames = await prisma.game.findMany({
    where: { playerStats: { not: null } },
    orderBy: { date: 'desc' }
  });

  const rows = await prisma.rosterPlayer.findMany({
    include: { kalkPlayer: true },
    orderBy: { number: 'asc' }
  });

  return rows.map((r) => {
    const base = r.data || {};

    // Build Game Log
    const playerGames = [];
    for (const game of allGames) {
      const boxScore = Array.isArray(game.playerStats) ? game.playerStats : [];
      const pStats = boxScore.find(p => {
        if (!p.name) return false;
        return p.name.includes(r.lastName) && (p.name.includes(r.firstName) || p.name.includes(r.firstName.charAt(0)));
      });

      if (pStats) {
        const fga = pStats.fga || 0;
        const fgm = pStats.fgm || 0;
        const threePm = pStats.three_pm || 0;
        const fta = pStats.fta || 0;
        const pts = pStats.pts || 0;

        const efg = fga > 0 ? ((fgm + 0.5 * threePm) / fga) * 100 : 0;
        const tsDivisor = 2 * (fga + 0.44 * fta);
        const ts = tsDivisor > 0 ? (pts / tsDivisor) * 100 : 0;

        playerGames.push({
          date: game.date,
          opponent: game.opponent,
          min: pStats.min || 0,
          pts: pts,
          reb: pStats.reb || 0,
          ast: pStats.ast || 0,
          stl: pStats.stl || 0,
          blk: pStats.blk || 0,
          tov: pStats.tov || 0,
          pf: pStats.pf || 0,
          fgm: fgm,
          fga: fga,
          threePm: threePm,
          threePa: pStats.three_pa || 0,
          ftm: pStats.ftm || 0,
          fta: fta,
          eval: pStats.eval || 0,
          eFgPercentage: parseFloat(efg.toFixed(1)),
          tsPercentage: parseFloat(ts.toFixed(1)),
          plusMinus: pStats.plusMinus || 0
        });
      }
    }

    return {
      ...base,
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      number: r.number,
      position: r.position,
      starter: r.starter,
      ppg: r.ppg,
      rpg: r.rpg,
      apg: r.apg,
      fgPercentage: r.fgPercentage,
      threePercentage: r.threePercentage,
      ftPercentage: r.ftPercentage,
      tsPercentage: r.tsPercentage,
      eFgPercentage: r.eFgPercentage,
      plusMinus: r.plusMinus,
      gamesPlayed: r.gamesPlayed,

      // Raw stats for Shot Selection
      twoPm: (r.fgm || 0) - (r.threePm || 0),
      threePm: r.threePm || 0,
      ftm: r.ftm || 0,

      // Game Log
      games: playerGames,

      kalkPlayer: r.kalkPlayer
    };
  });
}

/**
 * Agreguje statystyki zawodnika na podstawie wszystkich meczów w bazie.
 */
export async function getPlayerStats(playerId) {
  await ensureSeeded();
  const player = await prisma.rosterPlayer.findUnique({
    where: { id: playerId },
    include: { kalkPlayer: true }
  });
  if (!player) return null;

  const fullName = `${player.firstName} ${player.lastName}`.trim();
  const allGames = await prisma.game.findMany({
    orderBy: { date: 'asc' }
  });

  const gameLog = [];
  let totalPoints = 0;
  let totalRebounds = 0;
  let totalAssists = 0;
  let totalFgm = 0;
  let totalFga = 0;
  let totalThreePm = 0;
  let totalThreePa = 0;
  let totalFtm = 0;
  let totalFta = 0;
  let totalPlusMinus = 0;
  let gamesCount = 0;

  for (const game of allGames) {
    const pStats = game.playerStats || game.data?.teams?.flatMap(t => t.players) || [];
    const stats = pStats.find(ps =>
      ps.name === fullName ||
      ps.name === player.lastName ||
      (player.kalkPlayer && ps.name === player.kalkPlayer.name)
    );

    if (stats) {
      gamesCount++;
      const pts = parseStat(stats.pts) || 0;
      const reb = parseStat(stats.reb) || 0;
      const ast = parseStat(stats.ast) || 0;
      const stl = parseStat(stats.stl) || 0;
      const blk = parseStat(stats.blk) || 0;
      const tov = parseStat(stats.tov) || 0;
      const pf = parseStat(stats.pf) || 0;
      const fgm = parseStat(stats.fgm) || 0;
      const fga = parseStat(stats.fga) || 0;
      const tpm = parseStat(stats.three_pm) || 0;
      const tpa = parseStat(stats.three_pa) || 0;
      const ftm = parseStat(stats.ftm) || 0;
      const fta = parseStat(stats.fta) || 0;
      const pm = parseStat(stats.plusMinus) || 0;
      const min = stats.min || "00:00";

      totalPoints += pts;
      totalRebounds += reb;
      totalAssists += ast;
      totalFgm += fgm;
      totalFga += fga;
      totalThreePm += tpm;
      totalThreePa += tpa;
      totalFtm += ftm;
      totalFta += fta;
      totalPlusMinus += pm;

      // eFG% = (FGM + 0.5 * 3PM) / FGA
      const efg = fga > 0 ? (fgm + 0.5 * tpm) / fga : 0;
      // TS% = PTS / (2 * (FGA + 0.44 * FTA))
      const ts = (fga + 0.44 * fta) > 0 ? pts / (2 * (fga + 0.44 * fta)) : 0;

      gameLog.push({
        gameId: game.id,
        date: game.date.toISOString().split('T')[0],
        opponent: game.opponent,
        pts,
        reb,
        ast,
        stl,
        blk,
        tov,
        pf,
        min,
        fgm,
        fga,
        three_pm: tpm,
        three_pa: tpa,
        ftm,
        fta,
        efg,
        ts,
        plusMinus: pm
      });
    }
  }

  const averages = {
    ppg: gamesCount > 0 ? totalPoints / gamesCount : 0,
    rpg: gamesCount > 0 ? totalRebounds / gamesCount : 0,
    apg: gamesCount > 0 ? totalAssists / gamesCount : 0,
    efg: totalFga > 0 ? (totalFgm + 0.5 * totalThreePm) / totalFga : 0,
    ts: (totalFga + 0.44 * totalFta) > 0 ? totalPoints / (2 * (totalFga + 0.44 * totalFta)) : 0,
    plusMinusAvg: gamesCount > 0 ? totalPlusMinus / gamesCount : 0,
    gamesPlayed: gamesCount
  };

  return {
    player: {
      id: player.id,
      firstName: player.firstName,
      lastName: player.lastName,
      number: player.number,
      position: player.position
    },
    averages,
    gameLog: gameLog.reverse() // Ostatnie mecze na górze
  };
}

/**
 * Agreguje trendy zespołowe (Four Factors) na przestrzeni sezonu.
 */
export async function getTeamTrends() {
  await ensureSeeded();
  const allGames = await prisma.game.findMany({
    orderBy: { date: 'asc' }
  });

  return allGames.map(game => {
    // Znajdź statystyki BeKaPaKa
    const bekapaka = game.teamStats?.find(t => t.isBekapaka || t.name?.toLowerCase().includes('bekapaka') || t.name?.toLowerCase().includes('bobolice'))
      || game.data?.teams?.find(t => t.isBekapaka || t.name?.toLowerCase().includes('bekapaka') || t.name?.toLowerCase().includes('bobolice'));

    if (!bekapaka) return null;

    const source = bekapaka.fourFactors || bekapaka;
    let stats = {
      fgm: source.fgm || 0,
      fga: source.fga || 0,
      three_pm: source.three_pm || 0,
      fta: source.fta || 0,
      pts: source.pts || game.scoreUs || 0,
      tov: source.tov || 0,
      orb: source.orb || 0,
      min: source.min || "40:00",
      opp_pts: game.scoreThem || 0
    };

    if (stats.fga === 0 && bekapaka.players) {
      bekapaka.players.forEach(p => {
        stats.fgm += (p.fgm || 0);
        stats.fga += (p.fga || 0);
        stats.three_pm += (p.three_pm || 0);
        stats.fta += (p.fta || 0);
        stats.pts += (p.pts || 0);
        stats.tov += (p.tov || 0);
        stats.orb += (p.orb || 0);
      });
    }

    const ff = withShootingMetrics(stats);

    return {
      gameId: game.id,
      date: game.date.toISOString().split('T')[0],
      opponent: game.opponent,
      efg: parseStat(ff.efg) || 0,
      tovPct: parseStat(ff.tovPct) || 0,
      orbPct: parseStat(ff.orbPct) || 0,
      ftRate: parseStat(ff.ftRate) || 0,
      offRtg: parseStat(ff.offRtg) || 0,
      pace: parseStat(ff.pace) || 0,
      scoreUs: game.scoreUs,
      scoreThem: game.scoreThem,
      // Dodatkowe statystyki trendów
      fastBreakPoints: bekapaka.teamStats?.['Punkty po szybkim ataku']?.home || 0,
      pointsOffTO: bekapaka.teamStats?.['Punkty po stratach']?.home || 0,
      benchPoints: (bekapaka.teamStats?.['Punkty zmienników']?.home) || (bekapaka.players ? bekapaka.players.filter(p => !p.starter).reduce((sum, p) => sum + (p.pts || 0), 0) : 0),
      secondChancePoints: bekapaka.teamStats?.['Punkty drugiej szansy']?.home || 0
    };
  }).filter(Boolean);
}

// --- AUTHENTICATION ---

export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

export async function loginUser(username, password, ipAddress) {
  await ensureSeeded();

  // Normalize username
  const cleanUsername = username.toLowerCase().trim();

  // Find user
  const user = await prisma.rosterPlayer.findFirst({
    where: { username: cleanUsername }
  });

  if (!user || !user.password) {
    await logLogin(cleanUsername, false, ipAddress);
    return null;
  }

  const isValid = await verifyPassword(password, user.password);

  await logLogin(cleanUsername, isValid, ipAddress);

  if (!isValid) return null;

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    SECRET_KEY,
    { expiresIn: '24h' }
  );

  return {
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      role: user.role,
      number: user.number,
      position: user.position
    },
    token
  };
}

async function logLogin(username, success, ipAddress) {
  try {
    await prisma.loginLog.create({
      data: {
        username,
        success,
        ipAddress,
        timestamp: new Date()
      }
    });
  } catch (e) {
    console.error('Failed to log login:', e);
  }
}

export async function getLoginLogs(filters = {}) {
  const { page = 1, limit = 20, username, success } = filters;
  const skip = (page - 1) * limit;

  const where = {};
  if (username) {
    where.username = { contains: username, mode: 'insensitive' };
  }
  if (success !== undefined && success !== "" && success !== null) {
    where.success = success === 'true' || success === true;
  }

  const [logs, total] = await Promise.all([
    prisma.loginLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit),
      skip: parseInt(skip)
    }),
    prisma.loginLog.count({ where })
  ]);

  return {
    logs,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Zwraca historię logowań
 */
/**
 * Zwraca podsumowanie statystyk zespołu do kafelków na Dashboardzie.
 */
export async function getTeamStatsSummary() {
  const trends = await getTeamTrends();
  if (trends.length === 0) {
    return {
      ppg: 0,
      trend: 0,
      offRating: 0,
      defRating: 0,
      netRating: 0
    };
  }

  const seasonAvg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const allPpg = trends.map(t => t.scoreUs || 0);
  const ppg = seasonAvg(allPpg);

  // Trend: ostatnie 3 mecze vs sezon
  const recentPpg = seasonAvg(allPpg.slice(-3));
  const trend = ppg > 0 ? ((recentPpg - ppg) / ppg) * 100 : 0;

  const offRating = seasonAvg(trends.map(t => t.offRtg || 0));

  // Obliczamy DefRating na podstawie OppPts we wszystkich meczach
  // getTeamTrends liczy OffRtg, musimy wyciągnąć DefRtg (którą liczymy w withShootingMetrics)
  const defRatings = [];
  for (const t of trends) {
    // Ponownie liczymy advanced metrics dla każdego meczu, bo getTeamTrends zwraca tylko OffRtg
    const game = await prisma.game.findUnique({ where: { id: t.gameId } });
    const bekapaka = game.teamStats?.find(ts => ts.isBekapaka || ts.name?.toLowerCase().includes('bekapaka') || ts.name?.toLowerCase().includes('bobolice'));
    if (bekapaka) {
      const source = bekapaka.fourFactors || bekapaka;
      const stats = {
        fga: source.fga || 0, fta: source.fta || 0, tov: source.tov || 0, orb: source.orb || 0,
        pts: source.pts || game.scoreUs || 0,
        opp_pts: game.scoreThem || 0
      };
      const ff = withShootingMetrics(stats);
      if (ff.defRtg) defRatings.push(ff.defRtg);
    }
  }
  const defRating = defRatings.length > 0 ? seasonAvg(defRatings) : 0;

  return {
    ppg: Number(ppg.toFixed(1)),
    trend: Number(trend.toFixed(1)),
    offRating: Number(offRating.toFixed(1)),
    defRating: Number(defRating.toFixed(1)),
    netRating: Number((offRating - defRating).toFixed(1))
  };
}

/**
 * Calculates training priorities based on team stats vs league average (approximated by opponent stats).
 */
export async function getTrainingPriorities() {
  await ensureSeeded();

  // 1. Fetch all finished games with stats
  const games = await prisma.game.findMany({
    where: {
      result: { not: null },
      teamStats: { not: null }
    },
    orderBy: { date: 'desc' },
    take: 10 // Last 10 games for relevance
  });

  if (games.length === 0) {
    return {
      team: { ftPercentage: 0, turnovers: 0, assists: 0 },
      league: { ftPercentage: 0, turnovers: 0, assists: 0 }
    };
  }

  let teamStatsSum = { ftm: 0, fta: 0, tov: 0, ast: 0, fga: 0, fgm: 0, three_pm: 0, orb: 0, oppDrb: 0, pf: 0, ptsAgainst: 0, count: 0 };
  let oppStatsSum = { ftm: 0, fta: 0, tov: 0, ast: 0, fga: 0, fgm: 0, three_pm: 0, orb: 0, oppDrb: 0, pf: 0, ptsAgainst: 0, count: 0 };

  for (const game of games) {
    const stats = Array.isArray(game.teamStats) ? game.teamStats : [];
    const team = stats.find(t => t.isBekapaka || t.name?.toLowerCase().includes('bekapaka') || t.name?.toLowerCase().includes('bobolice'));
    const opp = stats.find(t => t !== team);

    if (team && team.fourFactors && opp && opp.fourFactors) {
      const teamTotalPF = (team.players || []).reduce((sum, p) => sum + (p.pf || 0), 0);
      const oppTotalPF = (opp.players || []).reduce((sum, p) => sum + (p.pf || 0), 0);

      // Team
      teamStatsSum.ftm += (team.fourFactors.ftm || 0);
      teamStatsSum.fta += (team.fourFactors.fta || 0);
      teamStatsSum.tov += (team.fourFactors.tov || 0);
      teamStatsSum.ast += (team.fourFactors.ast || 0);
      teamStatsSum.fga += (team.fourFactors.fga || 0);
      teamStatsSum.fgm += (team.fourFactors.fgm || 0);
      teamStatsSum.three_pm += (team.fourFactors.three_pm || 0);
      teamStatsSum.orb += (team.fourFactors.orb || 0);
      teamStatsSum.oppDrb += (opp.fourFactors.drb || 0);
      teamStatsSum.pf += teamTotalPF;
      teamStatsSum.ptsAgainst += (opp.fourFactors.pts || 0);
      teamStatsSum.count++;

      // League (Opponent proxy)
      oppStatsSum.ftm += (opp.fourFactors.ftm || 0);
      oppStatsSum.fta += (opp.fourFactors.fta || 0);
      oppStatsSum.tov += (opp.fourFactors.tov || 0);
      oppStatsSum.ast += (opp.fourFactors.ast || 0);
      oppStatsSum.fga += (opp.fourFactors.fga || 0);
      oppStatsSum.fgm += (opp.fourFactors.fgm || 0);
      oppStatsSum.three_pm += (opp.fourFactors.three_pm || 0);
      oppStatsSum.orb += (opp.fourFactors.orb || 0);
      oppStatsSum.oppDrb += (team.fourFactors.drb || 0);
      oppStatsSum.pf += oppTotalPF;
      oppStatsSum.ptsAgainst += (team.fourFactors.pts || 0);
      oppStatsSum.count++;
    }
  }

  const calcAvg = (sum) => ({
    ftPercentage: sum.fta > 0 ? Math.round((sum.ftm / sum.fta) * 100) : 0,
    turnovers: sum.count > 0 ? Number((sum.tov / sum.count).toFixed(1)) : 0,
    assists: sum.count > 0 ? Number((sum.ast / sum.count).toFixed(1)) : 0,
    efg: sum.fga > 0 ? Math.round(((sum.fgm + 0.5 * sum.three_pm) / sum.fga) * 100) : 0,
    rebounds: (sum.orb + sum.oppDrb) > 0 ? Math.round((sum.orb / (sum.orb + sum.oppDrb)) * 100) : 0,
    fouls: sum.count > 0 ? Number((sum.pf / sum.count).toFixed(1)) : 0,
    defense: sum.count > 0 ? Math.round(sum.ptsAgainst / sum.count) : 0
  });

  return {
    team: calcAvg(teamStatsSum),
    league: calcAvg(oppStatsSum) // Using opponents as proxy for league average
  };
}

/**
 * Pobiera dane do porównania z ligą.
 */
export async function getLeagueComparison() {
  await ensureSeeded();

  // 1. Get real league table data
  const allTeams = await prisma.leagueTeam.findMany();

  if (allTeams.length === 0) {
    return null;
  }

  // Find BeKaPaKa
  const bekapaka = allTeams.find(t =>
    t.name.toLowerCase().includes('bekapaka') ||
    t.name.toLowerCase().includes('bobolice')
  ) || { pointsFor: 0, matches: 0, pointsAgainst: 0, wins: 0 };

  const others = allTeams.filter(t => t.id !== bekapaka.id);

  // Helper to calc metrics
  const calcMetrics = (teams) => {
    if (!teams || teams.length === 0) return { ppg: 0, oppg: 0, winPct: 0 };

    // Aggregates
    const totalMatches = teams.reduce((sum, t) => sum + (t.matches || 0), 0);
    const totalPts = teams.reduce((sum, t) => sum + (t.pointsFor || 0), 0);
    const totalOpp = teams.reduce((sum, t) => sum + (t.pointsAgainst || 0), 0);
    const totalWins = teams.reduce((sum, t) => sum + (t.wins || 0), 0);

    if (totalMatches === 0) return { ppg: 0, oppg: 0, winPct: 0 };

    return {
      ppg: totalPts / totalMatches,
      oppg: totalOpp / totalMatches,
      winPct: totalWins / totalMatches
    };
  };

  const bkMetrics = bekapaka.matches > 0 ? {
    ppg: bekapaka.pointsFor / bekapaka.matches,
    oppg: bekapaka.pointsAgainst / bekapaka.matches,
    winPct: bekapaka.wins / bekapaka.matches
  } : { ppg: 0, oppg: 0, winPct: 0 };

  const lgMetrics = calcMetrics(others);

  return {
    bekapaka: bkMetrics,
    league: lgMetrics,
    rankings: {
      points: bkMetrics.ppg > lgMetrics.ppg ? 'Powyżej średniej' : 'Poniżej średniej',
      defense: bkMetrics.oppg < lgMetrics.oppg ? 'Lepsza niż średnia' : 'Gorsza niż średnia'
    }
  };
}

export async function upsertRoster(player) {
  await ensureSeeded();
  const data = {
    id: player.id,
    firstName: player.firstName,
    lastName: player.lastName,
    number: player.number,
    position: player.position || null,
    birthDate: player.birthDate || null,
    heightCm: player.heightCm || null,
    starter: !!player.starter,
    data: player
  };
  await prisma.rosterPlayer.upsert({
    where: { id: player.id },
    create: data,
    update: data
  });
  return player;
}

// MECZE - Lista wszystkich meczów
export async function listGames(filters = {}) {
  await ensureSeeded();

  // 1. Pobierz mecze z zaimportowanymi statystykami (tabela Game)
  const where = {};
  if (filters.result) where.result = filters.result;
  if (filters.homeAway) where.homeAway = filters.homeAway;

  const rowGames = await prisma.game.findMany({
    where,
    orderBy: { date: 'desc' }
  });

  const games = rowGames.map(r => ({
    ...r,
    id: r.id,
    date: r.date.toISOString(),
    teams: r.teamStats || r.data?.teams,
    coachNotes: r.notes || r.data?.coachNotes
  }));

  // 2. Pobierz mecze z terminarza (tabela LeagueMatch) dla BeKaPaKa
  const leagueMatches = await prisma.leagueMatch.findMany({
    where: {
      OR: [
        { homeTeam: { contains: 'BeKaPaKa', mode: 'insensitive' } },
        { guestTeam: { contains: 'BeKaPaKa', mode: 'insensitive' } },
        { homeTeam: { contains: 'BOBOLICE', mode: 'insensitive' } },
        { guestTeam: { contains: 'BOBOLICE', mode: 'insensitive' } }
      ]
    },
    orderBy: { date: 'desc' }
  });

  const processedGameIds = new Set();
  const mergedGames = [...games];

  games.forEach(g => {
    const d = typeof g.date === 'string' ? g.date : g.date.toISOString();
    const dateStr = d.split('T')[0];
    const key = `${dateStr}_${g.opponent?.toLowerCase()}`;
    processedGameIds.add(key);
  });

  for (const lm of leagueMatches) {
    const isHome = lm.homeTeam.toLowerCase().includes('bekapaka') || lm.homeTeam.toLowerCase().includes('bobolice');
    const opponent = isHome ? lm.guestTeam : lm.homeTeam;
    const dateStr = lm.date.toISOString().split('T')[0];
    const key = `${dateStr}_${opponent.toLowerCase()}`;

    if (!processedGameIds.has(key)) {
      let innerResult = null;
      if (lm.isFinished && lm.scoreHome !== null && lm.scoreAway !== null) {
        const scoreUs = isHome ? lm.scoreHome : lm.scoreAway;
        const scoreThem = isHome ? lm.scoreAway : lm.scoreHome;
        innerResult = scoreUs > scoreThem ? 'W' : 'L';
      }

      mergedGames.push({
        id: lm.id,
        date: lm.date.toISOString(),
        opponent: opponent,
        result: innerResult,
        scoreUs: isHome ? lm.scoreHome : lm.scoreAway,
        scoreThem: isHome ? lm.scoreAway : lm.scoreHome,
        homeAway: isHome ? 'home' : 'away',
        isFromLeagueMatch: true
      });
    }
  }

  return mergedGames.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getGameById(id) {
  await ensureSeeded();

  const game = await prisma.game.findUnique({
    where: { id }
  });

  if (game) {
    const bekapaka = game.teamStats?.find(t => t.isBekapaka) ||
      game.data?.teams?.find(t => t.isBekapaka);

    const opponent = game.teamStats?.find(t => !t.isBekapaka) ||
      game.data?.teams?.find(t => !t.isBekapaka);

    if (bekapaka) {
      const source = bekapaka.fourFactors || bekapaka;
      const oppPts = opponent?.pts || opponent?.fourFactors?.pts || game.scoreThem || 0;

      let statsForMetrics = {
        fgm: source.fgm || 0,
        fga: source.fga || 0,
        three_pm: source.three_pm || 0,
        fta: source.fta || 0,
        pts: source.pts || game.scoreUs || 0,
        tov: source.turnovers || source.tov || 0,
        orb: source.oreb || source.orb || 0,
        min: source.min || "40:00",
        opp_pts: oppPts
      };

      if (statsForMetrics.fga === 0 && bekapaka.players) {
        bekapaka.players.forEach(p => {
          statsForMetrics.fgm += (p.fgm || 0);
          statsForMetrics.fga += (p.fga || 0);
          statsForMetrics.three_pm += (p.three_pm || 0);
          statsForMetrics.fta += (p.fta || 0);
          statsForMetrics.pts += (p.pts || 0);
          statsForMetrics.tov += (p.tov || 0);
          statsForMetrics.orb += (p.orb || 0);
        });
      }

      bekapaka.fourFactors = {
        ...(bekapaka.fourFactors || {}),
        ...withShootingMetrics(statsForMetrics)
      };

      game.insights = generateGameInsights(game, bekapaka.fourFactors, opponent);
    }

    if (game.teamStats && !game.teams) {
      game.teams = game.teamStats;
    }
    return game;
  }

  const lm = await prisma.leagueMatch.findUnique({
    where: { id }
  });

  if (lm) {
    const isHome = lm.homeTeam.toLowerCase().includes('bekapaka') || lm.homeTeam.toLowerCase().includes('bobolice');
    const opponent = isHome ? lm.guestTeam : lm.homeTeam;
    const scoreUs = isHome ? lm.scoreHome : lm.scoreAway;
    const scoreThem = isHome ? lm.scoreAway : lm.scoreHome;

    return {
      id: lm.id,
      date: lm.date,
      opponent: opponent,
      scoreUs: scoreUs,
      scoreThem: scoreThem,
      finalScore: lm.isFinished ? `${scoreUs}:${scoreThem}` : null,
      result: lm.isFinished ? (scoreUs > scoreThem ? 'W' : 'L') : null,
      homeAway: isHome ? 'home' : 'away',
      teams: [
        { name: 'BeKaPaKa', isBekapaka: true, players: [] },
        { name: opponent, isBekapaka: false, players: [] }
      ],
      isFromLeagueMatch: true
    };
  }

  return null;
}

export async function deleteGame(id) {
  await ensureSeeded();
  return await prisma.game.delete({
    where: { id }
  });
}

export async function updateGame(id, gameData) {
  await ensureSeeded();
  return await prisma.game.update({
    where: { id },
    data: {
      date: gameData.date ? new Date(gameData.date) : undefined,
      opponent: gameData.opponent,
      homeAway: gameData.homeAway,
      result: gameData.result,
      scoreUs: gameData.scoreUs,
      scoreThem: gameData.scoreThem,
      teamStats: gameData.teamStats,
      playerStats: gameData.playerStats,
      notes: gameData.notes,
      mvp: gameData.mvp
    }
  });
}

export async function ingestKalkPlayers(entries) {
  await ensureSeeded();
  if (!Array.isArray(entries) || !entries.length) {
    return { newPlayers: [], total: 0 };
  }

  const normalizedEntries = entries.filter((entry) => entry && entry.id_zawodnika);
  const ids = [...new Set(normalizedEntries.map((entry) => entry.id_zawodnika))];
  const existing = await prisma.kalkPlayer.findMany({
    where: { id: { in: ids } },
    select: { id: true }
  });
  const existingIds = new Set(existing.map((p) => p.id));
  const newPlayers = [];
  let savedCount = 0;

  for (const entry of normalizedEntries) {
    if (normalizedEntries.indexOf(entry) === 0) {
      console.log('[DEBUG Ingest] First entry:', JSON.stringify(entry));
    }
    const playerId = entry.id_zawodnika;
    if (!playerId) continue;
    const matchesValue = parseStat(entry.mecze_rozegrane);
    const record = {
      id: playerId,
      name: entry.imie_nazwisko || playerId,
      team: entry.druzyna || null,
      pointsTotal: parseStat(entry.punkty_suma),
      pointsAverage: parseStat(entry.srednia_punktow),
      matchesPlayed: matchesValue === null ? null : Math.round(matchesValue),
      eval: parseStat(entry.eval),
      raw: entry
    };
    await prisma.kalkPlayer.upsert({
      where: { id: playerId },
      create: record,
      update: record
    });
    savedCount += 1;
    if (!existingIds.has(playerId)) {
      existingIds.add(playerId);
      newPlayers.push(record.name);
    }
  }

  return { newPlayers, total: savedCount };
}

export async function ingestLeagueTable(tableData) {
  await ensureSeeded();
  if (!Array.isArray(tableData)) return;

  for (const team of tableData) {
    if (!team.name) continue;

    await prisma.leagueTeam.upsert({
      where: { name: team.name },
      create: team,
      update: team
    });
  }
}

export async function ingestLeagueSchedule(scheduleData) {
  await ensureSeeded();
  if (!Array.isArray(scheduleData)) return;

  // Najpierw czyścimy stare wpisy, żeby uniknąć duplikatów lub nieaktualnych danych?
  // W tym przypadku lepiej upsertować po unikalnym kluczu, ale mecze nie mają ID ze scrapera.
  // Użyjemy kombinacji data + gospodarz jako "unikalny" klucz lub po prostu usuniemy wszystko i wstawimy nowe.
  // Strategia: Usunięcie i wstawienie nowych jest bezpieczniejsze przy pełnym scrapie.
  await prisma.leagueMatch.deleteMany();

  const parseScheduleDate = (dateStr) => {
    if (!dateStr) return new Date();
    // Format: "21-09-2025 14:40"
    // Format: "YYYY-MM-DD" is also possible if scraped differently

    // Try standard date first
    let d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;

    // Try custom format parsing
    try {
      // "DD-MM-YYYY HH:mm"
      const [dayStr, timeStr] = dateStr.split(' ');
      if (!dayStr) return new Date();

      const parts = dayStr.split('-'); // 21, 09, 2025
      if (parts.length === 3) {
        // Javascript Date(year, monthIndex, day, hours, minutes)
        // Month is 0-indexed
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);

        let hours = 0;
        let minutes = 0;

        if (timeStr) {
          const timeParts = timeStr.split(':');
          if (timeParts.length === 2) {
            hours = parseInt(timeParts[0], 10);
            minutes = parseInt(timeParts[1], 10);
          }
        }

        d = new Date(year, month, day, hours, minutes);
        if (!isNaN(d.getTime())) return d;
      }
    } catch (e) {
      console.error('Date parsing error', e);
    }

    return new Date(); // Fallback to now? Or invalid date
  };

  for (const match of scheduleData) {
    await prisma.leagueMatch.create({
      data: {
        date: parseScheduleDate(match.date),
        homeTeam: match.homeTeam,
        guestTeam: match.guestTeam,
        scoreHome: match.scoreHome,
        scoreAway: match.scoreAway,
        isFinished: !!match.isFinished
      }
    });
  }
}

export async function logKalkScrapeRun(run) {
  await ensureSeeded();
  return prisma.kalkScrapeRun.create({ data: run });
}

export async function getLatestKalkScrapeRun() {
  await ensureSeeded();
  return prisma.kalkScrapeRun.findFirst({ orderBy: { createdAt: 'desc' } });
}

// ============================================
// NOWE FUNKCJE DLA FAZY 1 REFAKTORYZACJI
// ============================================

// ZAWODNICY - Synchronizacja KalkPlayer z RosterPlayer
export async function syncPlayersFromKalk() {
  await ensureSeeded();

  // Pobierz wszystkich zawodników KALK
  const kalkPlayers = await prisma.kalkPlayer.findMany();

  // Filtrujemy tylko naszych zawodników
  const ourKalkPlayers = kalkPlayers.filter(kp =>
    kp.team && (kp.team.toLowerCase().includes('bekapaka') || kp.team.toLowerCase().includes('bobolice'))
  );

  const ourKalkIds = new Set(ourKalkPlayers.map(p => p.id));
  const synced = [];
  const errors = [];

  // 1. USUWANIE: Usuń z RosterPlayer wszystkich, którzy nie są w naszej drużynie (a mają kalkPlayerId)
  try {
    const allRosterWithKalk = await prisma.rosterPlayer.findMany({
      where: { NOT: { kalkPlayerId: null } }
    });

    for (const rp of allRosterWithKalk) {
      if (!ourKalkIds.has(rp.kalkPlayerId)) {
        await prisma.rosterPlayer.delete({ where: { id: rp.id } });
      }
    }
  } catch (error) {
    console.error('Error cleaning roster:', error);
  }

  // 2. SYNCHRONIZACJA: Dodaj/Aktualizuj tylko naszych
  for (const kalkPlayer of ourKalkPlayers) {
    try {
      // FIX: Kalk name is often "Surname Name"
      const nameParts = kalkPlayer.name.trim().split(/\s+/);
      let firstName = kalkPlayer.name;
      let lastName = "";

      if (nameParts.length >= 2) {
        // Assume format: Surname Name
        firstName = nameParts[nameParts.length - 1];
        lastName = nameParts.slice(0, nameParts.length - 1).join(' ');
      }

      // Proboj znalezc po kalkPlayerId
      let existing = await prisma.rosterPlayer.findFirst({
        where: { kalkPlayerId: kalkPlayer.id }
      });

      // Jesli nie ma po ID, sprawdz po imieniu i nazwisku (case-insensitive)
      if (!existing) {
        existing = await prisma.rosterPlayer.findFirst({
          where: {
            OR: [
              {
                AND: [
                  { firstName: { equals: firstName, mode: 'insensitive' } },
                  { lastName: { equals: lastName, mode: 'insensitive' } }
                ]
              },
              {
                AND: [
                  { firstName: { equals: lastName, mode: 'insensitive' } },
                  { lastName: { equals: firstName, mode: 'insensitive' } }
                ]
              }
            ]
          }
        });

        if (existing && !existing.kalkPlayerId) {
          // Polacz istniejacego zawodnika z KALK ID
          await prisma.rosterPlayer.update({
            where: { id: existing.id },
            data: { kalkPlayerId: kalkPlayer.id }
          });
        }
      }

      if (!existing) {
        // FIX: Kalk name is "Surname Name" (e.g. "Karpiński Filip")
        const nameParts = kalkPlayer.name.trim().split(/\s+/);
        // If 2 parts, assume Surname Firstname -> Firstname Surname
        // If more/less, fallback to split1=First, rest=Last (or strict swap if known format)
        let firstName = nameParts[0] || '';
        let lastName = nameParts.slice(1).join(' ') || '';

        if (nameParts.length === 2) {
          firstName = nameParts[1];
          lastName = nameParts[0];
        }

        const newPlayer = await prisma.rosterPlayer.create({
          data: {
            firstName,
            lastName,
            kalkPlayerId: kalkPlayer.id,
          }
        });
        synced.push(newPlayer);
      } else {
        // Zawsze upewnij sie, ze imie i nazwisko sa w dobrej kolejnosci z KALK
        await prisma.rosterPlayer.update({
          where: { id: existing.id },
          data: {
            firstName,
            lastName
          }
        });
      }
    } catch (e) {
      errors.push({ id: kalkPlayer.id, error: e.message });
    }
  }

  // 3. AGREGACJA STATYSTYK Z MECZÓW
  await updateRosterStats();

  return { synced, errors, total: ourKalkPlayers.length };
}

// Nowa funkcja do przeliczania statystyk na bazie tabeli Game
export async function updateRosterStats() {
  console.log('[Info] Updating roster stats from Game data...');
  const allGames = await prisma.game.findMany({
    where: { playerStats: { not: null } }
  });

  const roster = await prisma.rosterPlayer.findMany({
    include: { kalkPlayer: true }
  });

  for (const player of roster) {
    let stats = {
      pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, tov: 0,
      fgm: 0, fga: 0, threePm: 0, threePa: 0, ftm: 0, fta: 0,
      gamesPlayed: 0, plusMinus: 0
    };

    for (const game of allGames) {
      const boxScore = Array.isArray(game.playerStats) ? game.playerStats : [];
      // Try to find player in box score
      const pStats = boxScore.find(p => {
        if (!p.name) return false;
        return p.name.includes(player.lastName) && (p.name.includes(player.firstName) || p.name.includes(player.firstName.charAt(0)));
      });

      if (pStats) {
        // Update number if found and valid
        if (pStats.number && pStats.number.length > 0 && pStats.number !== '0' && pStats.number !== '-') {
          stats.number = parseInt(pStats.number);
        }

        stats.gamesPlayed++;
        stats.pts += (pStats.pts || 0);
        stats.reb += (pStats.reb || 0);
        stats.ast += (pStats.ast || 0);
        stats.stl += (pStats.stl || 0);
        stats.blk += (pStats.blk || 0);
        stats.tov += (pStats.tov || 0);
        stats.plusMinus += (pStats.plusMinus || 0);
        stats.fgm += (pStats.fgm || 0);
        stats.fga += (pStats.fga || 0);
        stats.threePm += (pStats.three_pm || 0);
        stats.threePa += (pStats.three_pa || 0);
        stats.ftm += (pStats.ftm || 0);
        stats.fta += (pStats.fta || 0);
      }
    }

    // Calculate averages
    const gp = stats.gamesPlayed || 1;
    const ppg = stats.gamesPlayed > 0 ? parseFloat((stats.pts / gp).toFixed(1)) : 0;
    const rpg = stats.gamesPlayed > 0 ? parseFloat((stats.reb / gp).toFixed(1)) : 0;
    const apg = stats.gamesPlayed > 0 ? parseFloat((stats.ast / gp).toFixed(1)) : 0;

    const fgPct = stats.fga > 0 ? parseFloat(((stats.fgm / stats.fga) * 100).toFixed(1)) : 0;
    const threePct = stats.threePa > 0 ? parseFloat(((stats.threePm / stats.threePa) * 100).toFixed(1)) : 0;
    const ftPct = stats.fta > 0 ? parseFloat(((stats.ftm / stats.fta) * 100).toFixed(1)) : 0;

    // Advanced
    // eFG% = (FGM + 0.5 * 3PM) / FGA
    const eFgPct = stats.fga > 0 ? parseFloat((((stats.fgm + 0.5 * stats.threePm) / stats.fga) * 100).toFixed(1)) : 0;

    // TS% = PTS / (2 * (FGA + 0.44 * FTA))
    // TS% = PTS / (2 * (FGA + 0.44 * FTA))
    const tsDivisor = 2 * (stats.fga + 0.44 * stats.fta);
    const tsPct = tsDivisor > 0 ? parseFloat(((stats.pts / tsDivisor) * 100).toFixed(1)) : 0;

    const updateData = {
      gamesPlayed: stats.gamesPlayed,
      ppg, rpg, apg,
      fgPercentage: fgPct,
      threePercentage: threePct,
      ftPercentage: ftPct,
      eFgPercentage: eFgPct,
      tsPercentage: tsPct,
      plusMinus: stats.plusMinus,
      pts: stats.pts,
      fgm: stats.fgm, fga: stats.fga,
      threePm: stats.threePm, threePa: stats.threePa,
      ftm: stats.ftm, fta: stats.fta,
      reb: stats.reb, ast: stats.ast, stl: stats.stl, blk: stats.blk, tov: stats.tov
    };

    if (stats.number) {
      updateData.number = stats.number;
    }

    await prisma.rosterPlayer.update({
      where: { id: player.id },
      data: updateData
    });
  }
  console.log('[Info] Roster stats updated.');
}

export async function listAllPlayers() {
  await ensureSeeded();
  return await prisma.rosterPlayer.findMany({
    include: {
      kalkPlayer: true
    },
    orderBy: { lastName: 'asc' }
  });
}

// ZAWODNICY - Pobierz pojedynczego zawodnika
export async function getPlayerById(id) {
  await ensureSeeded();
  return await prisma.rosterPlayer.findUnique({
    where: { id },
    include: { kalkPlayer: true }
  });
}

// ZAWODNICY - Aktualizuj cele zawodnika
export async function updatePlayerGoals(id, goals) {
  await ensureSeeded();
  return await prisma.rosterPlayer.update({
    where: { id },
    data: { goals }
  });
}

export async function createGame(gameData) {
  await ensureSeeded();
  return await prisma.game.create({
    data: {
      date: new Date(gameData.date),
      opponent: gameData.opponent,
      homeAway: gameData.homeAway || 'home',
      result: gameData.result || null,
      scoreUs: gameData.scoreUs || null,
      scoreThem: gameData.scoreThem || null,
      teamStats: gameData.teamStats || null,
      playerStats: gameData.playerStats || null,
      notes: gameData.notes || null,
      mvp: gameData.mvp || null,
      videoUrl: gameData.videoUrl || null,
      tags: gameData.tags || []
    }
  });
}


// TRENINGI - Lista wszystkich treningów
export async function listAllTrainings() {
  await ensureSeeded();
  return await prisma.training.findMany({
    orderBy: { date: 'desc' }
  });
}

// TRENINGI - Utwórz nowy trening
export async function createTraining(trainingData) {
  await ensureSeeded();
  return await prisma.training.create({
    data: {
      date: new Date(trainingData.date),
      focus: trainingData.focus || [],
      attendance: trainingData.attendance || null,
      notes: trainingData.notes || null,
      duration: trainingData.duration || null
    }
  });
}

// TRENINGI - Aktualizuj trening
export async function updateTraining(id, trainingData) {
  await ensureSeeded();
  return await prisma.training.update({
    where: { id },
    data: {
      ...(trainingData.date && { date: new Date(trainingData.date) }),
      ...(trainingData.focus !== undefined && { focus: trainingData.focus }),
      ...(trainingData.attendance !== undefined && { attendance: trainingData.attendance }),
      ...(trainingData.notes !== undefined && { notes: trainingData.notes }),
      ...(trainingData.duration !== undefined && { duration: trainingData.duration })
    }
  });
}

// PLAYBOOK - Lista wszystkich zagrywek
export async function listAllPlays(category = null) {
  await ensureSeeded();
  const where = category ? { category } : {};
  return await prisma.play.findMany({
    where,
    orderBy: { name: 'asc' }
  });
}

// LIGA - Pobierz tabelę
export async function getLeagueTable() {
  await ensureSeeded();
  return await prisma.leagueTeam.findMany({
    orderBy: [
      { points: 'desc' },
      { matches: 'asc' }, // Mniej meczów przy tych samych punktach = wyżej (teoretycznie)
      { pointsFor: 'desc' }
    ]
  });
}

// LIGA - Pobierz terminarz
export async function getLeagueSchedule() {
  await ensureSeeded();
  return await prisma.leagueMatch.findMany({
    orderBy: { date: 'asc' }
  });
}

// LIGA - Top Strzelcy (używamy istniejącej tabeli KalkPlayer)
export async function getTopScorers(limit = 20) {
  await ensureSeeded();
  return await prisma.kalkPlayer.findMany({
    orderBy: { pointsAverage: 'desc' },
    take: limit
  });
}

// PLAYBOOK - Utwórz nową zagrywkę
export async function createPlay(playData) {
  await ensureSeeded();
  return await prisma.play.create({
    data: {
      name: playData.name,
      category: playData.category,
      diagram: playData.diagram || null,
      description: playData.description || null,
      videoUrl: playData.videoUrl || null,
      attempts: playData.attempts || 0,
      successes: playData.successes || 0
    }
  });
}

// PLAYBOOK - Aktualizuj zagrywkę
export async function updatePlay(id, playData) {
  await ensureSeeded();
  return await prisma.play.update({
    where: { id },
    data: {
      ...(playData.name && { name: playData.name }),
      ...(playData.category && { category: playData.category }),
      ...(playData.diagram !== undefined && { diagram: playData.diagram }),
      ...(playData.description !== undefined && { description: playData.description }),
      ...(playData.videoUrl !== undefined && { videoUrl: playData.videoUrl }),
      ...(playData.attempts !== undefined && { attempts: playData.attempts }),
      ...(playData.successes !== undefined && { successes: playData.successes })
    }
  });
}

export async function listKalkPlayers({ limit } = {}) {
  await ensureSeeded();
  const take = typeof limit === 'number' && limit > 0 ? limit : undefined;
  return prisma.kalkPlayer.findMany({
    orderBy: [
      { pointsAverage: 'desc' },
      { pointsTotal: 'desc' },
      { eval: 'desc' }
    ],
    take
  });
}



export async function getLeagueTrends() {
  await ensureSeeded();
  // Return averages from LeagueTeam
  const teams = await prisma.leagueTeam.findMany();
  if (teams.length === 0) return [];

  const totalMatches = teams.reduce((sum, t) => sum + (t.matches || 0), 0);
  const totalPoints = teams.reduce((sum, t) => sum + (t.pointsFor || 0), 0);
  const totalOppPoints = teams.reduce((sum, t) => sum + (t.pointsAgainst || 0), 0);

  return [{
    avgPpg: totalPoints / (totalMatches || 1),
    avgOppg: totalOppPoints / (totalMatches || 1)
  }];
}

export async function getNextOpponentScouting() {
  await ensureSeeded();
  const now = new Date();

  const nextMatch = await prisma.leagueMatch.findFirst({
    where: {
      OR: [
        { homeTeam: { contains: 'BeKaPaKa', mode: 'insensitive' } },
        { guestTeam: { contains: 'BeKaPaKa', mode: 'insensitive' } },
        { homeTeam: { contains: 'BOBOLICE', mode: 'insensitive' } },
        { guestTeam: { contains: 'BOBOLICE', mode: 'insensitive' } }
      ],
      isFinished: false,
      date: { gt: now }
    },
    orderBy: { date: 'asc' }
  });

  if (!nextMatch) return null;

  const isHome = nextMatch.homeTeam.toLowerCase().includes('bekapaka') || nextMatch.homeTeam.toLowerCase().includes('bobolice');
  const opponentName = isHome ? nextMatch.guestTeam : nextMatch.homeTeam;

  const opponentTableData = await prisma.leagueTeam.findFirst({
    where: { name: { contains: opponentName, mode: 'insensitive' } }
  });

  const oppMatches = await prisma.leagueMatch.findMany({
    where: {
      OR: [
        { homeTeam: { contains: opponentName, mode: 'insensitive' } },
        { guestTeam: { contains: opponentName, mode: 'insensitive' } }
      ],
      isFinished: true
    },
    orderBy: { date: 'desc' },
    take: 3
  });

  // Calculate rank
  const allTeams = await prisma.leagueTeam.findMany({
    orderBy: [
      { points: 'desc' },
      { matches: 'asc' }
    ]
  });
  const rank = allTeams.findIndex(t => t.name.toLowerCase().includes(opponentName.toLowerCase())) + 1;

  const resForm = oppMatches.map(m => {
    const isOppHome = m.homeTeam.toLowerCase().includes(opponentName.toLowerCase());
    const scoreUs = isOppHome ? m.scoreHome : m.scoreAway;
    const scoreThem = isOppHome ? m.scoreAway : m.scoreHome;
    const result = (scoreUs || 0) > (scoreThem || 0) ? 'W' : 'L';
    const otherTeam = isOppHome ? m.guestTeam : m.homeTeam;

    return {
      result,
      scoreUs,
      scoreThem,
      opponent: otherTeam,
      date: m.date && !isNaN(m.date.getTime()) ? m.date.toISOString().split('T')[0] : 'Unknown'
    };
  });

  const keyPlayers = await prisma.kalkPlayer.findMany({
    where: {
      team: { contains: opponentName, mode: 'insensitive' },
      name: { not: '' }
    },
    orderBy: { pointsAverage: 'desc' },
    take: 3
  });

  return {
    opponent: opponentName,
    rank: rank > 0 ? rank : null,
    wins: opponentTableData?.wins || 0,
    losses: opponentTableData?.losses || 0,
    ppg: opponentTableData && opponentTableData.matches > 0 ? (opponentTableData.pointsFor / opponentTableData.matches) : 0,
    oppg: opponentTableData && opponentTableData.matches > 0 ? (opponentTableData.pointsAgainst / opponentTableData.matches) : 0,
    form: resForm,
    keyPlayers: keyPlayers
      .map(p => {
        const name = (() => {
          const trimmed = (p.name || '').trim();
          if (!trimmed) return null;
          const parts = trimmed.split(/\s+/);
          if (parts.length === 2) return `${parts[1]} ${parts[0]}`; // Surname Name -> Name Surname
          return trimmed;
        })();

        return name ? { name, ppg: p.pointsAverage } : null;
      })
      .filter(Boolean)
  };
}


// Helper: Get Advanced Stats for Opponent (Last 5 Games)
async function getOpponentAdvancedStats(opponentName) {
  if (!opponentName) return null;

  // Simplify name: "GLAZURIX-Salon Łazienek" -> "GLAZURIX"
  const simplifiedName = opponentName.split('-')[0].trim();

  // Find last 5 matches
  const matches = await prisma.leagueMatch.findMany({
    where: {
      OR: [
        { homeTeam: { contains: simplifiedName, mode: 'insensitive' } },
        { guestTeam: { contains: simplifiedName, mode: 'insensitive' } }
      ],
      isFinished: true,
      protocolUrl: { not: null }
    },
    orderBy: { date: 'desc' },
    take: 5
  });

  const stats = {
    matchesScraped: 0,
    pace: 0,
    shotProfile: { two: 0, three: 0, ft: 0 },
    fourFactors: { efg: 0, tov: 0, orb: 0, ftr: 0 },
    situational: { fourthQuarterDiff: 0, clutchPlay: '?' },
    personnel: { shooters: [], paintProtectors: [], playmakers: [] } // Names
  };

  let totalPoss = 0;
  let totalPts = 0;
  let total2PM = 0, total3PM = 0, totalFTM = 0;
  let totalFGA = 0, totalFGM = 0, totalFTA = 0, totalTOV = 0, totalORB = 0, totalOppDRB = 0;
  let total3PA = 0; // New
  let q4DiffSum = 0;

  const playerStatsMap = {}; // name -> stats

  for (const match of matches) {
    let details = match.details;

    // Lazy Load
    if (!details || Object.keys(details).length === 0) {
      console.log(`[DataStore] Deep scraping protocol for match: ${match.homeTeam} vs ${match.guestTeam}`);
      try {
        details = await scrapeMatchProtocol(match.protocolUrl);
        if (details) {
          await prisma.leagueMatch.update({
            where: { id: match.id },
            data: { details }
          });
        }
      } catch (e) {
        console.error(`[DataStore] Failed to scrape protocol: ${e.message}`);
        continue;
      }
    }

    if (!details || !details.teams) continue;

    stats.matchesScraped++;

    // Identify which team is the opponent
    const isHome = match.homeTeam.toLowerCase().includes(simplifiedName.toLowerCase());
    const oppTeamData = isHome ? details.teams[0] : details.teams[1];
    const enemyTeamData = isHome ? details.teams[1] : details.teams[0]; // The team they played AGAINST

    if (!oppTeamData || !enemyTeamData) continue;

    const ff = oppTeamData.fourFactors || {};

    // Possessions (Basic estimation)
    // Formula: FGA + 0.44*FTA + TOV - ORB
    const poss = ff.fga + 0.44 * ff.fta + ff.tov - ff.orb;
    totalPoss += poss;

    // Shot Profile
    totalPts += ff.pts;
    total2PM += (ff.fgm - ff.three_pm);
    total3PM += ff.three_pm;
    totalFTM += ff.ftm;

    // Four Factors Aggregation
    totalFGM += ff.fgm;
    totalFGA += ff.fga;
    totalFTA += ff.fta;
    totalTOV += ff.tov;
    totalORB += ff.orb;
    total3PA += (ff.three_pa || 0); // New
    totalOppDRB += enemyTeamData.fourFactors.drb;

    // Aggregating Player Stats
    if (oppTeamData.players) {
      oppTeamData.players.forEach(p => {
        if (!playerStatsMap[p.name]) {
          playerStatsMap[p.name] = { gp: 0, pts: 0, treys: 0, treyA: 0, ast: 0, blk: 0, reb: 0 };
        }
        const s = playerStatsMap[p.name];
        s.gp++;
        s.pts += (p.pts || 0);
        s.treys += (p.three_pm || 0);
        s.treyA += (p.three_pa || 0);
        s.ast += (p.ast || 0);
        s.blk += (p.blk || 0);
        s.reb += (p.reb || 0);
      });
    }

    // Situational: 4th Quarter Diff
    if (details.quarters && details.quarters.length >= 4) {
      const q4 = details.quarters[3]; // { home: X, away: Y }
      const q4ScoreUs = isHome ? q4.home : q4.away;
      const q4ScoreThem = isHome ? q4.away : q4.home;
      q4DiffSum += (q4ScoreUs - q4ScoreThem);
    }
  }

  if (stats.matchesScraped === 0) return null;

  // Averages
  stats.pace = Number((totalPoss / stats.matchesScraped).toFixed(2));

  if (totalPts > 0) {
    stats.shotProfile.two = Math.round(((total2PM * 2) / totalPts) * 100);
    stats.shotProfile.three = Math.round(((total3PM * 3) / totalPts) * 100);
    stats.shotProfile.ft = Math.round((totalFTM / totalPts) * 100);
  }

  // Four Factors (Manual recalc for better accuracy across games)
  if (totalFGA > 0) {
    stats.fourFactors.efg = Number((((totalFGM + 0.5 * total3PM) / totalFGA) * 100).toFixed(2));
    stats.fourFactors.ftr = Number(((totalFTA / totalFGA) * 100).toFixed(2));
  }
  const denominatorTOV = totalFGA + 0.44 * totalFTA + totalTOV;
  if (denominatorTOV > 0) {
    stats.fourFactors.tov = Number(((totalTOV / denominatorTOV) * 100).toFixed(2));
  }
  const denominatorORB = totalORB + totalOppDRB;
  if (denominatorORB > 0) {
    stats.fourFactors.orb = Number(((totalORB / denominatorORB) * 100).toFixed(2));
  }

  stats.situational.fourthQuarterDiff = Number((q4DiffSum / stats.matchesScraped).toFixed(2));

  // 3PT Accuracy
  stats.threePointAccuracy = total3PA > 0 ? Number(((total3PM / total3PA) * 100).toFixed(2)) : 0;

  // Process Personnel
  Object.entries(playerStatsMap).forEach(([name, s]) => {
    // @ts-ignore
    const gp = s.gp;
    if (gp < 2) return; // Ignore if played only 1 game out of 5

    // @ts-ignore
    const ppg = s.pts / gp;
    // @ts-ignore
    const apg = s.ast / gp;
    // @ts-ignore
    const rpg = s.reb / gp;
    // @ts-ignore
    const bpg = s.blk / gp;
    // @ts-ignore
    const treysPg = s.treys / gp;
    // @ts-ignore
    const treyPct = s.treyA > 0 ? (s.treys / s.treyA) * 100 : 0;
    // @ts-ignore
    const treyAPg = s.treyA / gp;

    if (treysPg >= 1.5 || (treyPct >= 30 && treyAPg >= 3)) stats.personnel.shooters.push(`${name} (${treyPct.toFixed(0)}%)`);
    if (rpg >= 6 || bpg >= 0.5) stats.personnel.paintProtectors.push(`${name} (${rpg.toFixed(1)} zb)`);
    if (apg >= 3.0) stats.personnel.playmakers.push(`${name} (${apg.toFixed(1)} as)`);
  });

  return stats;
}

export async function getDetailedScouting(opponentName) {
  await ensureSeeded();

  if (!opponentName) {
    const nextMatch = await getNextOpponentScouting();
    if (!nextMatch) return null;
    opponentName = nextMatch.opponent;
  }

  // 1. Team Data
  const [opponent, bekapaka, allTeams] = await Promise.all([
    prisma.leagueTeam.findFirst({ where: { name: { contains: opponentName, mode: 'insensitive' } } }),
    prisma.leagueTeam.findFirst({ where: { name: { contains: 'BeKaPaKa', mode: 'insensitive' } } }) ||
    prisma.leagueTeam.findFirst({ where: { name: { contains: 'BOBOLICE', mode: 'insensitive' } } }),
    prisma.leagueTeam.findMany({ orderBy: [{ points: 'desc' }, { matches: 'asc' }] })
  ]);

  const getRank = (name) => {
    if (!name) return null;
    const idx = allTeams.findIndex(t => t.name.toLowerCase().includes(name.toLowerCase()));
    return idx >= 0 ? idx + 1 : null;
  };

  const oppRank = getRank(opponentName);
  const bkRank = bekapaka ? getRank(bekapaka.name) : null;

  // 2. Opponent Players (Top 5)
  const keyPlayers = await prisma.kalkPlayer.findMany({
    where: {
      team: { contains: opponentName, mode: 'insensitive' },
      name: { not: '' }
    },
    orderBy: { pointsAverage: 'desc' },
    take: 5
  });

  // 3. Recent Matches (Opponent)
  const oppMatches = await prisma.leagueMatch.findMany({
    where: {
      OR: [
        { homeTeam: { contains: opponentName, mode: 'insensitive' } },
        { guestTeam: { contains: opponentName, mode: 'insensitive' } }
      ],
      isFinished: true
    },
    orderBy: { date: 'desc' },
    take: 5
  });

  // Get Advanced Stats (Moved UP)
  const [advancedStats, bekapakaAdvancedStats] = await Promise.all([
    getOpponentAdvancedStats(opponentName),
    getOpponentAdvancedStats(bekapaka?.name || 'BeKaPaKa')
  ]);

  // 4. Generate AI Analysis (Comprehensive Summary)
  const aiAnalysis = {
    summary: '',
    offense: '',
    defense: '',
    verdict: ''
  };

  const oppPpg = opponent?.matches > 0 ? (opponent.pointsFor / opponent.matches) : 0;
  const oppOppg = opponent?.matches > 0 ? (opponent.pointsAgainst / opponent.matches) : 0;
  const bkPpg = bekapaka?.matches > 0 ? (bekapaka.pointsFor / bekapaka.matches) : 0;
  const bkOppg = bekapaka?.matches > 0 ? (bekapaka.pointsAgainst / bekapaka.matches) : 0;

  // Basic Identity
  const pace = advancedStats?.pace || 0;
  const paceDesc = pace > 84 ? 'grająca bardzo szybko (run & gun)' : (pace < 78 ? 'preferująca wolne, pozycyjne tempo' : 'grająca w zrównoważonym tempie');

  const shotProfile = advancedStats?.shotProfile;
  const styleDesc = shotProfile?.three > 35 ? 'i opierająca siłę ataku na rzutach za 3 punkty' : (shotProfile?.two > 60 ? 'i dominująca w strefie podkoszowej' : 'z uniwersalnym stylem gry');

  const recentWins = oppMatches.filter(m => {
    const isHome = m.homeTeam.toLowerCase().includes(opponentName.toLowerCase());
    const scoreUs = isHome ? m.scoreHome : m.scoreAway;
    const scoreThem = isHome ? m.scoreAway : m.scoreHome;
    return scoreUs > scoreThem;
  }).length;

  const formDesc = recentWins >= 3 ? 'Są obecnie na fali wznoszącej (seria zwycięstw).' : (recentWins === 0 ? 'Przeżywają obecnie kryzys formy.' : 'Grają w kratkę, przeplatając dobre mecze słabymi.');

  aiAnalysis.summary = `Zespół ${opponentName} to drużyna ${paceDesc} ${styleDesc}. ${formDesc}`;

  // Offense Analysis
  const keyPlayerNames = keyPlayers.slice(0, 2).map(p => p.name.split(' ')[1] || p.name).join(' i ');
  const offenseStrength = oppPpg > 60 ? 'Potrafią seryjnie zdobywać punkty' : 'Miewają przestoje w ataku';
  aiAnalysis.offense = `${offenseStrength}. Głównym motorem napędowym są ${keyPlayerNames}. Generują średnio ${oppPpg.toFixed(1)} pkt/mecz.`;

  // Defense Analysis
  const defenseStrength = oppOppg < 50 ? 'Dysponują szczelną defensywą' : 'Tracą sporo punktów';
  const weakPoint = advancedStats?.fourFactors?.tov > 20 ? 'Często gubią piłkę pod presją' : (advancedStats?.fourFactors?.orb < 20 ? 'Słabo zbierają w ataku' : 'Można ich skontrować');
  aiAnalysis.defense = `${defenseStrength} (śr. ${oppOppg.toFixed(1)} straconych). Ich słabością może być to, że ${weakPoint.toLowerCase()}.`;

  // Verdict / Key
  aiAnalysis.verdict = pace > 84
    ? 'KLUCZ: Zwolnić grę, nie wdawać się w wymianę ciosów, zamknąć trumnę.'
    : 'KLUCZ: Narzucić własne, szybkie tempo i zmusić ich do błędów w kozłowaniu.';

  // Enrich key players with 3-point stats (Deep Scrape on demand)
  const enrichedKeyPlayers = await Promise.all(keyPlayers.map(async (p) => {
    let stats3pt = p.threePointStats;

    // Only scrape if missing AND we have a URL
    if (!stats3pt && p.profileUrl) {
      console.log(`[DataStore] Missing 3pt stats for ${p.name}, scraping...`);
      const deepStats = await scrapePlayerDetailedStats(p.profileUrl);
      if (deepStats && deepStats.threePt) {
        stats3pt = deepStats.threePt;
        // Save to DB
        await prisma.kalkPlayer.update({
          where: { id: p.id },
          data: { threePointStats: stats3pt }
        }).catch(e => console.error('[DataStore] Failed to save 3pt stats:', e));
      }
    }

    return {
      name: p.name.split(/\s+/).length === 2 ? `${p.name.split(/\s+/)[1]} ${p.name.split(/\s+/)[0]}` : p.name,
      ppg: p.pointsAverage,
      totalPoints: p.pointsTotal || 0,
      matches: p.matchesPlayed || 0,
      threePointStats: stats3pt || '-'
    };
  }));

  // Get Advanced Stats (Moved UP)

  return {
    advancedStats, // Opponent Data
    bekapakaAdvancedStats, // BeKaPaKa Data
    teamInfo: {
      opponent: {
        name: opponentName,
        rank: oppRank,
        record: `${opponent?.wins || 0}-${opponent?.losses || 0}`,
        ppg: oppPpg,
        oppg: oppOppg
      },
      bekapaka: {
        name: bekapaka?.name || 'BeKaPaKa',
        rank: bkRank,
        record: `${bekapaka?.wins || 0}-${bekapaka?.losses || 0}`,
        ppg: bkPpg,
        oppg: bekapaka?.matches > 0 ? (bekapaka.pointsAgainst / bekapaka.matches) : 0
      }
    },
    keyPlayers: enrichedKeyPlayers,
    form: oppMatches.map(m => {
      const isHome = m.homeTeam.toLowerCase().includes(opponentName.toLowerCase());
      return {
        opponent: isHome ? m.guestTeam : m.homeTeam,
        score: `${m.scoreHome}:${m.scoreAway}`,
        result: (isHome ? m.scoreHome : m.scoreAway) > (isHome ? m.scoreAway : m.scoreHome) ? 'W' : 'L',
        date: m.date.toISOString().split('T')[0]
      };
    }),
    aiAnalysis
  };
}


export async function wipeGamesTable() {
  await prisma.game.deleteMany();
  console.log('[DataStore] Game table wiped.');
}
