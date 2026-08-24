import { prisma } from './lib/prisma.js';
import { hashGameForAi } from './ai/buildMatchContext.js';
import { hasCompleteMatchAnalysisMarkdown } from './ai/matchAnalysisMarkdown.js';
import { hashPayload } from './ai/hash.js';
import { normalizeOpponentKey } from './ai/normalizeOpponent.js';
import { buildPersonnelMdFromAnalysis } from './ai/scoutingPersonnel.js';
import {
  analysisFromSummaryMdField,
  buildScoutingSummaryMd,
  isScoutingAnalysisSparse,
  mergeScoutingAnalysis,
  normalizeScoutingAnalysis
} from './ai/scoutingMarkdown.js';
import { withShootingMetrics } from './metrics.js';
import { generateGameInsights } from './insights.js';
import {
  ensureDefaultSeason,
  getActiveSeason,
  listSeasons,
  resolveSeasonId,
  resolvePlayerViewSeasonId,
  setPlayerSeasonPreference,
  findKalkPlayerForRoster,
  filterGamesBySeason,
  buildKalkPlayerDbId,
  getSeasonById
} from './seasonService.js';
import { resolveSeasonIdForDate } from './lib/kalkSeason.js';
import {
  LEAGUE_TABLE_ORDER_BY,
  resolveLeagueTeamFromList
} from './lib/leagueTeamResolve.js';
import { kalkMatchToGameDetail, kalkMatchToListItem } from './kalk/kalkGameView.js';
import { enrichKalkTeamStats, isBekapakaTeamName } from './kalk/parseMatchBoxScore.js';

const BEKAPAKA_LEAGUE_MATCH_OR = [
  { homeTeam: { contains: 'BeKaPaKa', mode: 'insensitive' } },
  { guestTeam: { contains: 'BeKaPaKa', mode: 'insensitive' } },
  { homeTeam: { contains: 'BOBOLICE', mode: 'insensitive' } },
  { guestTeam: { contains: 'BOBOLICE', mode: 'insensitive' } }
];

const BEKAPAKA_KALK_MATCH_OR = [
  { homeTeamName: { contains: 'BeKaPaKa', mode: 'insensitive' } },
  { guestTeamName: { contains: 'BeKaPaKa', mode: 'insensitive' } },
  { homeTeamName: { contains: 'BOBOLICE', mode: 'insensitive' } },
  { guestTeamName: { contains: 'BOBOLICE', mode: 'insensitive' } }
];

/** @deprecated alias — terminarz LeagueMatch */
const BEKAPAKA_MATCH_OR = BEKAPAKA_LEAGUE_MATCH_OR;
import {
  ingestKalkTeams,
  ingestKalkMatches,
  ingestKalkPlayerGameLogs,
  ingestLeagueScheduleKalk
} from './kalk/kalkIngest.js';
import { boxScoreToLeagueDetails } from './kalk/parseMatchBoxScore.js';

export { ingestKalkTeams, ingestKalkMatches, ingestKalkPlayerGameLogs };

export {
  ensureDefaultSeason,
  listSeasons,
  getActiveSeason,
  resolveSeasonId,
  setPlayerSeasonPreference
};

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from './lib/requireEnv.js';

const SECRET_KEY = getJwtSecret();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


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
  await prisma.kalkPlayerGameLog.deleteMany();
  await prisma.kalkMatch.deleteMany();
  await prisma.kalkTeam.deleteMany();
  await prisma.kalkSectionSnapshot.deleteMany();
  await prisma.kalkSyncRun.deleteMany();
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

/**
 * Mapuje wpis KalkPlayerGameLog na format game log w składzie.
 * @param {ReturnType<typeof gameLogEntryFromKalkStats>} entry
 * @param {object} stats
 */
function rosterGameFromKalkLog(entry, stats) {
  const fga = entry.fga || 0;
  const fgm = entry.fgm || 0;
  const threePm = entry.three_pm || 0;
  const fta = entry.fta || 0;
  const pts = entry.pts || 0;
  const efg = fga > 0 ? ((fgm + 0.5 * threePm) / fga) * 100 : 0;
  const tsDivisor = 2 * (fga + 0.44 * fta);
  const ts = tsDivisor > 0 ? (pts / tsDivisor) * 100 : 0;

  return {
    date: entry.date,
    opponent: entry.opponent,
    min: entry.min || '00:00',
    pts,
    reb: entry.reb || 0,
    ast: entry.ast || 0,
    stl: entry.stl || 0,
    blk: entry.blk || 0,
    tov: entry.tov || 0,
    pf: entry.pf || 0,
    fgm,
    fga,
    threePm,
    threePa: entry.three_pa || 0,
    ftm: entry.ftm || 0,
    fta,
    eval: stats.eval ?? entry.eval ?? 0,
    eFgPercentage: parseFloat(efg.toFixed(1)),
    tsPercentage: parseFloat(ts.toFixed(1)),
    plusMinus: entry.plusMinus || 0
  };
}

export async function getRoster(querySeasonId = undefined) {
  await ensureSeeded();
  await ensureDefaultSeason();
  const targetSeasonId = await resolveSeasonId(querySeasonId);
  const targetSeason = await getSeasonById(targetSeasonId);

  const rows = await prisma.rosterPlayer.findMany({
    include: { kalkPlayer: true },
    orderBy: { number: 'asc' }
  });

  return Promise.all(
    rows.map(async (r) => {
    const base = r.data || {};

    const playerGames = [];
    const kalkPlayer = await findKalkPlayerForRoster(r, targetSeason?.id);
    const kalkPlayerId = r.kalkPlayerId || kalkPlayer?.id;

    if (kalkPlayerId && targetSeason?.id) {
      const kalkLogs = await prisma.kalkPlayerGameLog.findMany({
        where: { seasonId: targetSeason.id, kalkPlayerId },
        include: { kalkMatch: true },
        orderBy: { kalkMatch: { date: 'desc' } }
      });

      for (const row of kalkLogs) {
        const stats = row.stats && typeof row.stats === 'object' ? row.stats : {};
        const entry = gameLogEntryFromKalkStats(stats, {
          kalkMatchId: row.kalkMatchId,
          date: row.kalkMatch?.date
            ? row.kalkMatch.date.toISOString().split('T')[0]
            : null,
          opponent: row.opponentName || stats.opponent
        });
        playerGames.push(rosterGameFromKalkLog(entry, stats));
      }
    }

    let evalAvg = r.kalkPlayer?.eval ?? kalkPlayer?.eval ?? null;
    if (evalAvg == null) {
      const gamesWithEval = playerGames.filter((g) => g.eval != null && g.eval !== 0);
      if (gamesWithEval.length > 0) {
        evalAvg =
          gamesWithEval.reduce((sum, g) => sum + g.eval, 0) / gamesWithEval.length;
      }
    }

    const plusMinusAvg = resolveSeasonPlusMinusAverage(playerGames, r);

    return {
      ...base,
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      number: r.number,
      position: r.position,
      starter: r.starter,
      ppg: r.ppg ?? 0,
      rpg: r.rpg ?? 0,
      apg: r.apg ?? 0,
      eval: evalAvg,
      fgPercentage: r.fgPercentage,
      threePercentage: r.threePercentage,
      ftPercentage: r.ftPercentage,
      tsPercentage: r.tsPercentage,
      eFgPercentage: r.eFgPercentage,
      plusMinus: plusMinusAvg,
      gamesPlayed: r.gamesPlayed,
      birthDate: r.birthDate,
      heightCm: r.heightCm,
      aiDevelopmentSummary: r.aiDevelopmentSummary,

      // Raw stats for Shot Selection
      twoPm: (r.fgm || 0) - (r.threePm || 0),
      threePm: r.threePm || 0,
      ftm: r.ftm || 0,

      // Game Log
      games: playerGames,

      kalkPlayer: r.kalkPlayer || kalkPlayer
    };
    })
  );
}

/**
 * Średni plus/minus sezonu — z logów meczowych (KALK) lub ze starej sumy w RosterPlayer.
 * @param {Array<{ plusMinus?: number }>} playerGames
 * @param {{ plusMinus?: number, gamesPlayed?: number }} rosterRow
 */
function resolveSeasonPlusMinusAverage(playerGames, rosterRow) {
  if (playerGames.length > 0) {
    const total = playerGames.reduce((sum, g) => sum + (g.plusMinus || 0), 0);
    return parseFloat((total / playerGames.length).toFixed(1));
  }

  const gamesPlayed = rosterRow.gamesPlayed || 0;
  if (gamesPlayed > 0 && rosterRow.plusMinus != null) {
    return parseFloat((rosterRow.plusMinus / gamesPlayed).toFixed(1));
  }

  return rosterRow.plusMinus ?? 0;
}

/**
 * Agreguje statystyki zawodnika na podstawie wszystkich meczów w bazie.
 */
function gameLogEntryFromKalkStats(stats, matchMeta) {
  const pts = parseStat(stats.pts) || 0;
  const reb = parseStat(stats.reb) || 0;
  const ast = parseStat(stats.ast) || 0;
  const fgm = parseStat(stats.fgm) || 0;
  const fga = parseStat(stats.fga) || 0;
  const tpm = parseStat(stats.three_pm) || 0;
  const tpa = parseStat(stats.three_pa) || 0;
  const ftm = parseStat(stats.ftm) || 0;
  const fta = parseStat(stats.fta) || 0;
  const efg = fga > 0 ? (fgm + 0.5 * tpm) / fga : 0;
  const ts = (fga + 0.44 * fta) > 0 ? pts / (2 * (fga + 0.44 * fta)) : 0;

  return {
    gameId: matchMeta.kalkMatchId,
    date: matchMeta.date,
    opponent: stats.opponent || matchMeta.opponent || '',
    pts,
    reb,
    ast,
    stl: parseStat(stats.stl) || 0,
    blk: parseStat(stats.blk) || 0,
    tov: parseStat(stats.tov) || 0,
    pf: parseStat(stats.pf) || 0,
    min: stats.min || '00:00',
    fgm,
    fga,
    three_pm: tpm,
    three_pa: tpa,
    ftm,
    fta,
    efg,
    ts,
    plusMinus: parseStat(stats.plusMinus) || 0,
    dataSource: 'kalk'
  };
}

export async function getPlayerStats(playerId, seasonIdParam) {
  await ensureSeeded();
  await ensureDefaultSeason();
  const player = await prisma.rosterPlayer.findUnique({
    where: { id: playerId },
    include: { kalkPlayer: true }
  });
  if (!player) return null;

  const seasonId = await resolvePlayerViewSeasonId(playerId, seasonIdParam);
  const seasonRow = await prisma.kalkSeason.findUnique({ where: { id: seasonId } });
  const kalkPlayer = await findKalkPlayerForRoster(player, seasonId);

  const kalkPlayerId = player.kalkPlayerId || kalkPlayer?.id;
  if (kalkPlayerId && seasonId) {
    const kalkLogs = await prisma.kalkPlayerGameLog.findMany({
      where: { seasonId, kalkPlayerId },
      include: { kalkMatch: true },
      orderBy: { kalkMatch: { date: 'desc' } }
    });

    if (kalkLogs.length) {
      const gameLog = kalkLogs.map((row) => {
        const stats = row.stats && typeof row.stats === 'object' ? row.stats : {};
        return gameLogEntryFromKalkStats(stats, {
          kalkMatchId: row.kalkMatchId,
          date: row.kalkMatch?.date
            ? row.kalkMatch.date.toISOString().split('T')[0]
            : null,
          opponent: row.opponentName
        });
      });

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
      let totalMinutesSeconds = 0;

      for (const g of gameLog) {
        totalPoints += g.pts;
        totalRebounds += g.reb;
        totalAssists += g.ast;
        totalFgm += g.fgm;
        totalFga += g.fga;
        totalThreePm += g.three_pm;
        totalThreePa += g.three_pa;
        totalFtm += g.ftm;
        totalFta += g.fta;
        totalPlusMinus += g.plusMinus;
        const minParts = String(g.min).split(':');
        totalMinutesSeconds += (Number(minParts[0]) || 0) * 60 + (Number(minParts[1]) || 0);
      }

      const gamesCount = gameLog.length;
      const averages = {
        ppg: gamesCount > 0 ? totalPoints / gamesCount : 0,
        rpg: gamesCount > 0 ? totalRebounds / gamesCount : 0,
        apg: gamesCount > 0 ? totalAssists / gamesCount : 0,
        efg: totalFga > 0 ? (totalFgm + 0.5 * totalThreePm) / totalFga : 0,
        ts: (totalFga + 0.44 * totalFta) > 0 ? totalPoints / (2 * (totalFga + 0.44 * totalFta)) : 0,
        plusMinusAvg: gamesCount > 0 ? totalPlusMinus / gamesCount : 0,
        gamesPlayed: gamesCount,
        minutesPlayed: Math.round(totalMinutesSeconds / 60)
      };

      return {
        season: seasonRow
          ? {
              id: seasonRow.id,
              slug: seasonRow.slug,
              label: seasonRow.label,
              isActive: seasonRow.isActive,
              startsAt: seasonRow.startsAt,
              endsAt: seasonRow.endsAt
            }
          : null,
        player: {
          id: player.id,
          firstName: player.firstName,
          lastName: player.lastName,
          number: player.number,
          position: player.position,
          kalkPlayer: kalkPlayer || null
        },
        leagueKalk: kalkPlayer
          ? {
              pointsTotal: kalkPlayer.pointsTotal,
              pointsAverage: kalkPlayer.pointsAverage,
              matchesPlayed: kalkPlayer.matchesPlayed,
              eval: kalkPlayer.eval,
              stealsAverage: kalkPlayer.stealsAverage,
              reboundsAverage: kalkPlayer.reboundsAverage,
              assistsAverage: kalkPlayer.assistsAverage,
              turnoversAverage: kalkPlayer.turnoversAverage,
              foulsAverage: kalkPlayer.foulsAverage,
              minutesAverage: kalkPlayer.minutesAverage,
              threePointsPct: kalkPlayer.threePointsPct,
              twoPointsPct: kalkPlayer.twoPointsPct,
              ftPct: kalkPlayer.ftPct,
              attackIndex: kalkPlayer.attackIndex,
              defenseIndex: kalkPlayer.defenseIndex,
              threePointStats: kalkPlayer.threePointStats
            }
          : null,
        averages,
        gameLog,
        dataSource: 'kalk'
      };
    }
  }

  const fullName = `${player.firstName} ${player.lastName}`.trim();
  const allGames = await prisma.game.findMany({
    orderBy: { date: 'asc' }
  });
  const gamesInSeason = await filterGamesBySeason(allGames, seasonId);

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
  let totalMinutesSeconds = 0;
  let gamesCount = 0;

  for (const game of gamesInSeason) {
    const pStats = game.playerStats || game.data?.teams?.flatMap(t => t.players) || [];
    const stats = pStats.find(ps =>
      ps.name === fullName ||
      ps.name === player.lastName ||
      (kalkPlayer && ps.name === kalkPlayer.name)
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
      const minParts = String(min).split(':');
      const minutesPart = Number(minParts[0]) || 0;
      const secondsPart = Number(minParts[1]) || 0;
      totalMinutesSeconds += (minutesPart * 60) + secondsPart;

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
    gamesPlayed: gamesCount,
    minutesPlayed: Math.round(totalMinutesSeconds / 60)
  };

  return {
    season: seasonRow
      ? {
          id: seasonRow.id,
          slug: seasonRow.slug,
          label: seasonRow.label,
          isActive: seasonRow.isActive,
          startsAt: seasonRow.startsAt,
          endsAt: seasonRow.endsAt
        }
      : null,
    player: {
      id: player.id,
      firstName: player.firstName,
      lastName: player.lastName,
      number: player.number,
      position: player.position,
      kalkPlayer: kalkPlayer || null
    },
    leagueKalk: kalkPlayer
      ? {
          pointsTotal: kalkPlayer.pointsTotal,
          pointsAverage: kalkPlayer.pointsAverage,
          matchesPlayed: kalkPlayer.matchesPlayed,
          eval: kalkPlayer.eval,
          stealsAverage: kalkPlayer.stealsAverage,
          reboundsAverage: kalkPlayer.reboundsAverage,
          assistsAverage: kalkPlayer.assistsAverage,
          threePointsPct: kalkPlayer.threePointsPct,
          threePointStats: kalkPlayer.threePointStats
        }
      : null,
    averages,
    gameLog: gameLog.reverse() // Ostatnie mecze na górze
  };
}

/** Próg (pkt ratingu) od średniej ligi dla tieru Słabo / Średnio / Elita. */
const RATING_LEAGUE_TIER_DELTA = 3;

/**
 * Buduje metryki strzeleckie (ORtg, DefRtg, …) dla dowolnej drużyny z box score.
 * @param {object} team
 * @param {{ pts?: number, oppPts?: number, min?: string }} context
 */
function buildTeamShootingMetrics(team, context = {}) {
  const source = team.fourFactors || team;
  let stats = {
    fgm: source.fgm || 0,
    fga: source.fga || 0,
    three_pm: source.three_pm || 0,
    fta: source.fta || 0,
    pts: source.pts || context.pts || 0,
    tov: source.tov || source.turnovers || 0,
    orb: source.orb || source.oreb || 0,
    min: source.min || context.min || '40:00',
    opp_pts: context.oppPts ?? 0
  };

  if (stats.fga === 0 && team.players?.length) {
    for (const p of team.players) {
      stats.fgm += p.fgm || 0;
      stats.fga += p.fga || 0;
      stats.three_pm += p.three_pm || 0;
      stats.fta += p.fta || 0;
      stats.pts += p.pts || 0;
      stats.tov += p.tov || 0;
      stats.orb += p.orb || 0;
    }
  }

  return withShootingMetrics(stats);
}

/**
 * Tier ratingu względem średniej ligi (elite = lepiej, weak = gorzej).
 * @param {number} teamVal
 * @param {number} leagueVal
 * @param {boolean} higherIsBetter
 */
function ratingLeagueTier(teamVal, leagueVal, higherIsBetter) {
  const delta = higherIsBetter ? teamVal - leagueVal : leagueVal - teamVal;
  if (delta >= RATING_LEAGUE_TIER_DELTA) return 'elite';
  if (delta <= -RATING_LEAGUE_TIER_DELTA) return 'weak';
  return 'average';
}

/**
 * Średnie ORtg / DefRtg / NetRtg dywizji z zakończonych meczów KALK (box score).
 */
export async function getLeagueRatingBenchmarks(querySeasonId = undefined) {
  await ensureSeeded();
  await ensureDefaultSeason();
  const targetSeasonId = await resolveSeasonId(querySeasonId);
  if (!targetSeasonId) return null;

  const kalkMatches = await prisma.kalkMatch.findMany({
    where: { seasonId: targetSeasonId, isFinished: true },
    orderBy: { date: 'asc' }
  });

  const samples = [];

  for (const km of kalkMatches) {
    const view = kalkMatchToGameDetail(km);
    const teams = view.teams || [];
    if (teams.length < 2) continue;

    const scoreHome = view.scoreHome ?? km.scoreHome;
    const scoreAway = view.scoreAway ?? km.scoreAway;

    teams.forEach((team, index) => {
      const opponent = teams[1 - index];
      const teamPts = team.pts ?? (index === 0 ? scoreHome : scoreAway) ?? 0;
      const oppPts = opponent?.pts ?? (index === 0 ? scoreAway : scoreHome) ?? 0;
      const ff = buildTeamShootingMetrics(team, { pts: teamPts, oppPts });
      const offRtg = parseStat(ff.offRtg) || 0;
      const defRtg = parseStat(ff.defRtg) || 0;
      if (offRtg <= 0) return;
      samples.push({ offRtg, defRtg, netRtg: offRtg - defRtg });
    });
  }

  if (samples.length === 0) return null;

  const seasonAvg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const offRating = seasonAvg(samples.map((s) => s.offRtg));
  const defRating = seasonAvg(samples.map((s) => s.defRtg));
  const netRating = seasonAvg(samples.map((s) => s.netRtg));

  return {
    offRating: Number(offRating.toFixed(1)),
    defRating: Number(defRating.toFixed(1)),
    netRating: Number(netRating.toFixed(1)),
    sampleTeamGames: samples.length,
    sampleMatches: kalkMatches.length
  };
}

/**
 * Zwraca podsumowanie statystyk zespołu do kafelków na Dashboardzie.
 */
export async function getTeamStatsSummary(querySeasonId = undefined) {
  const [trends, league] = await Promise.all([
    getTeamTrends(querySeasonId),
    getLeagueRatingBenchmarks(querySeasonId)
  ]);
  if (trends.length === 0) {
    return {
      ppg: 0,
      trend: 0,
      offRating: 0,
      defRating: 0,
      netRating: 0,
      league: league || null,
      tiers: null
    };
  }

  const seasonAvg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const allPpg = trends.map(t => t.scoreUs || 0);
  const ppg = seasonAvg(allPpg);

  // Trend: ostatnie 3 mecze vs sezon
  const recentPpg = seasonAvg(allPpg.slice(-3));
  const trend = ppg > 0 ? ((recentPpg - ppg) / ppg) * 100 : 0;

  const offRating = seasonAvg(trends.map((t) => t.offRtg || 0));
  const defRating = seasonAvg(trends.map((t) => t.defRtg || 0));
  const netRating = offRating - defRating;

  const tiers = league
    ? {
        off: ratingLeagueTier(offRating, league.offRating, true),
        def: ratingLeagueTier(defRating, league.defRating, false),
        net: ratingLeagueTier(netRating, league.netRating, true)
      }
    : null;

  return {
    ppg: Number(ppg.toFixed(1)),
    trend: Number(trend.toFixed(1)),
    offRating: Number(offRating.toFixed(1)),
    defRating: Number(defRating.toFixed(1)),
    netRating: Number(netRating.toFixed(1)),
    league,
    tiers
  };
}

/**
 * Agreguje trendy zespołowe (Four Factors) na przestrzeni sezonu.
 */
function teamTrendFromBekapakaTeam(bekapaka, meta) {
  const ff = buildTeamShootingMetrics(bekapaka, {
    pts: meta.scoreUs,
    oppPts: meta.scoreThem
  });
  return {
    gameId: meta.gameId,
    date: meta.date,
    opponent: meta.opponent,
    scoreUs: meta.scoreUs ?? null,
    scoreThem: meta.scoreThem ?? null,
    efg: parseStat(ff.efg) || 0,
    tov: parseStat(ff.tov) || 0,
    orb: parseStat(ff.orb) || 0,
    ftr: parseStat(ff.ftr) || 0,
    offRtg: parseStat(ff.offRtg) || 0,
    defRtg: parseStat(ff.defRtg) || 0,
    pace: parseStat(ff.pace) || 0,
    dataSource: meta.dataSource || 'kalk'
  };
}

export async function getTeamTrends(querySeasonId = undefined) {
  await ensureSeeded();
  await ensureDefaultSeason();
  const targetSeasonId = await resolveSeasonId(querySeasonId);

  if (targetSeasonId) {
    const kalkMatches = await prisma.kalkMatch.findMany({
      where: {
        seasonId: targetSeasonId,
        isFinished: true,
        OR: BEKAPAKA_KALK_MATCH_OR
      },
      orderBy: { date: 'asc' }
    });

    if (kalkMatches.length) {
      const trends = kalkMatches
        .map((km) => {
          const view = kalkMatchToGameDetail(km);
          const bekapaka = view.teams?.find((t) => t.isBekapaka);
          if (!bekapaka) return null;
          return teamTrendFromBekapakaTeam(bekapaka, {
            gameId: km.id,
            date: km.date.toISOString().split('T')[0],
            opponent: view.opponent,
            scoreUs: view.scoreUs,
            scoreThem: view.scoreThem,
            dataSource: 'kalk'
          });
        })
        .filter(Boolean);
      if (trends.length) return trends;
    }
  }

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

/** Min. odstęp między zapisami lastActivityAt do DB (ms). */
const ACTIVITY_TOUCH_INTERVAL_MS = 10 * 60 * 1000;

/** userId → timestamp ostatniego zapisu do DB (throttling w pamięci procesu). */
const activityTouchCache = new Map();

/**
 * Aktualizuje ostatnią aktywność użytkownika (throttled).
 * @param {string} userId
 * @param {string | undefined} ipAddress
 * @param {{ force?: boolean }} [options] — force=true omija throttling (np. przy logowaniu)
 */
export async function touchUserActivity(userId, ipAddress, options = {}) {
  if (!userId) return;

  const now = Date.now();
  if (!options.force) {
    const lastWritten = activityTouchCache.get(userId) ?? 0;
    if (now - lastWritten < ACTIVITY_TOUCH_INTERVAL_MS) return;
  }

  activityTouchCache.set(userId, now);

  try {
    await prisma.rosterPlayer.update({
      where: { id: userId },
      data: {
        lastActivityAt: new Date(),
        ...(ipAddress ? { lastActivityIp: ipAddress } : {})
      }
    });
  } catch (e) {
    console.error('Failed to touch user activity:', e);
  }
}

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

  await touchUserActivity(user.id, ipAddress, { force: true });

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
 * Calculates training priorities based on team stats vs league average (approximated by opponent stats).
 */
export async function getTrainingPriorities(querySeasonId = undefined) {
  await ensureSeeded();
  await ensureDefaultSeason();
  const targetSeasonId = await resolveSeasonId(querySeasonId);

  const empty = {
    team: { ftPercentage: 0, turnovers: 0, assists: 0 },
    league: { ftPercentage: 0, turnovers: 0, assists: 0 }
  };

  if (!targetSeasonId) return empty;

  const kalkMatches = await prisma.kalkMatch.findMany({
    where: {
      seasonId: targetSeasonId,
      isFinished: true,
      OR: BEKAPAKA_KALK_MATCH_OR
    },
    orderBy: { date: 'desc' },
    take: 10
  });

  if (kalkMatches.length === 0) return empty;

  let teamStatsSum = { ftm: 0, fta: 0, tov: 0, ast: 0, fga: 0, fgm: 0, three_pm: 0, orb: 0, oppDrb: 0, pf: 0, ptsAgainst: 0, count: 0 };
  let oppStatsSum = { ftm: 0, fta: 0, tov: 0, ast: 0, fga: 0, fgm: 0, three_pm: 0, orb: 0, oppDrb: 0, pf: 0, ptsAgainst: 0, count: 0 };

  for (const km of kalkMatches) {
    const box = km.boxScore;
    const teams = box?.teams || [];
    let team = teams.find((t) => t.isBekapaka || isBekapakaTeamName(t.name));
    let opp = teams.find((t) => t !== team);
    if (!team || !opp) continue;

    const oppPts = opp.pts ?? (isBekapakaTeamName(km.homeTeamName) ? km.scoreAway : km.scoreHome) ?? 0;
    const teamPts = team.pts ?? (isBekapakaTeamName(km.homeTeamName) ? km.scoreHome : km.scoreAway) ?? 0;
    team = enrichKalkTeamStats(team, oppPts);
    opp = enrichKalkTeamStats(opp, teamPts);

    if (team.fourFactors && opp.fourFactors) {
      const teamTotalPF = (team.players || []).reduce((sum, p) => sum + (p.pf || 0), 0);
      const oppTotalPF = (opp.players || []).reduce((sum, p) => sum + (p.pf || 0), 0);

      teamStatsSum.ftm += team.fourFactors.ftm;
      teamStatsSum.fta += team.fourFactors.fta;
      teamStatsSum.tov += team.fourFactors.turnovers;
      teamStatsSum.ast += team.fourFactors.ast;
      teamStatsSum.fga += team.fourFactors.fga;
      teamStatsSum.fgm += team.fourFactors.fgm;
      teamStatsSum.three_pm += team.fourFactors.three_pm;
      teamStatsSum.orb += team.fourFactors.oreb;
      teamStatsSum.oppDrb += (opp.fourFactors.reb - opp.fourFactors.oreb);
      teamStatsSum.pf += teamTotalPF;
      teamStatsSum.ptsAgainst += oppPts;
      teamStatsSum.count++;

      oppStatsSum.ftm += opp.fourFactors.ftm;
      oppStatsSum.fta += opp.fourFactors.fta;
      oppStatsSum.tov += opp.fourFactors.turnovers;
      oppStatsSum.ast += opp.fourFactors.ast;
      oppStatsSum.fga += opp.fourFactors.fga;
      oppStatsSum.fgm += opp.fourFactors.fgm;
      oppStatsSum.three_pm += opp.fourFactors.three_pm;
      oppStatsSum.orb += opp.fourFactors.oreb;
      oppStatsSum.oppDrb += (team.fourFactors.reb - team.fourFactors.oreb);
      oppStatsSum.pf += oppTotalPF;
      oppStatsSum.ptsAgainst += teamPts;
      oppStatsSum.count++;
    }
  }

  if (teamStatsSum.count === 0) return empty;

  const calcAvg = (sum) => {
    const fga = sum.fga / sum.count;
    const fta = sum.fta / sum.count;
    const pts = ((sum.fgm * 2) + sum.three_pm + sum.ftm) / sum.count;
    const tsD = 2 * (fga + 0.44 * fta);
    const orbD = (sum.orb + sum.oppDrb) / sum.count;

    return {
      ftPercentage: sum.fta > 0 ? (sum.ftm / sum.fta) * 100 : 0,
      turnovers: sum.tov / sum.count,
      assists: sum.ast / sum.count,
      tsPercentage: tsD > 0 ? (pts / tsD) * 100 : 0,
      orbPercentage: orbD > 0 ? ((sum.orb / sum.count) / orbD) * 100 : 0,
      fouls: sum.pf / sum.count,
      pointsAgainst: sum.ptsAgainst / sum.count
    };
  };

  return {
    team: calcAvg(teamStatsSum),
    league: calcAvg(oppStatsSum) // Using opponents as proxy for league average
  };
}

/**
 * Pobiera dane do porównania z ligą.
 */
export async function getLeagueComparison(querySeasonId = undefined) {
  await ensureSeeded();
  const targetSeasonId = await resolveSeasonId(querySeasonId);

  // 1. Get real league table data for requested season
  const allTeams = await prisma.leagueTeam.findMany({
    where: targetSeasonId ? { seasonId: targetSeasonId } : undefined
  });

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

// MECZE - Lista meczów BeKaPaKa (priorytet KalkMatch)
export async function listGames(filters = {}, querySeasonId = undefined) {
  await ensureSeeded();
  await ensureDefaultSeason();
  const targetSeasonId = await resolveSeasonId(querySeasonId || filters.seasonId);

  if (targetSeasonId) {
    const kalkMatches = await prisma.kalkMatch.findMany({
      where: {
        seasonId: targetSeasonId,
        OR: BEKAPAKA_KALK_MATCH_OR
      },
      orderBy: { date: 'desc' }
    });

    let items = kalkMatches.map(kalkMatchToListItem);

    const scheduleOnly = await prisma.leagueMatch.findMany({
      where: {
        seasonId: activeSeason.id,
        OR: BEKAPAKA_LEAGUE_MATCH_OR,
        isFinished: true,
        kalkMatchId: null
      },
      orderBy: { date: 'desc' }
    });

    for (const lm of scheduleOnly) {
      const isHome = isBekapakaTeamName(lm.homeTeam);
      const opponent = isHome ? lm.guestTeam : lm.homeTeam;
      const scoreUs = isHome ? lm.scoreHome : lm.scoreAway;
      const scoreThem = isHome ? lm.scoreAway : lm.scoreHome;
      let result = null;
      if (scoreUs != null && scoreThem != null) {
        result = scoreUs > scoreThem ? 'W' : scoreThem > scoreUs ? 'L' : null;
      }
      items.push({
        id: lm.id,
        date: lm.date.toISOString(),
        opponent,
        result,
        scoreUs,
        scoreThem,
        homeAway: isHome ? 'home' : 'away',
        dataSource: 'league',
        hasBoxScore: false,
        isFromKalkMatch: false,
        leagueMatchId: lm.id
      });
    }

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (filters.result) {
      items = items.filter((g) => g.result === filters.result);
    }
    if (filters.homeAway) {
      items = items.filter((g) => g.homeAway === filters.homeAway);
    }
    if (items.length) return items;
  }

  const where = {};
  if (filters.result) where.result = filters.result;
  if (filters.homeAway) where.homeAway = filters.homeAway;

  const rowGames = await prisma.game.findMany({
    where,
    orderBy: { date: 'desc' }
  });

  return rowGames.map((r) => ({
    ...r,
    id: r.id,
    date: r.date.toISOString(),
    teams: r.teamStats || r.data?.teams,
    coachNotes: r.notes || r.data?.coachNotes,
    dataSource: 'legacy'
  }));
}

export async function getGameById(id) {
  await ensureSeeded();
  await ensureDefaultSeason();
  const activeSeason = await getActiveSeason();

  if (activeSeason) {
    const kalkMatch = await prisma.kalkMatch.findUnique({
      where: { seasonId_id: { seasonId: activeSeason.id, id: String(id) } }
    });
    if (kalkMatch) {
      return kalkMatchToGameDetail(kalkMatch);
    }

    const leagueRow = await prisma.leagueMatch.findFirst({
      where: {
        seasonId: activeSeason.id,
        OR: [{ id: String(id) }, { kalkMatchId: String(id) }]
      }
    });
    if (leagueRow && (isBekapakaTeamName(leagueRow.homeTeam) || isBekapakaTeamName(leagueRow.guestTeam))) {
      const isHome = isBekapakaTeamName(leagueRow.homeTeam);
      const opponent = isHome ? leagueRow.guestTeam : leagueRow.homeTeam;
      const scoreUs = isHome ? leagueRow.scoreHome : leagueRow.scoreAway;
      const scoreThem = isHome ? leagueRow.scoreAway : leagueRow.scoreHome;
      let result = null;
      if (scoreUs != null && scoreThem != null) {
        result = scoreUs > scoreThem ? 'W' : scoreThem > scoreUs ? 'L' : null;
      }
      return {
        id: leagueRow.kalkMatchId || leagueRow.id,
        leagueMatchId: leagueRow.id,
        dataSource: 'league',
        seasonId: leagueRow.seasonId,
        date: leagueRow.date.toISOString(),
        opponent,
        homeAway: isHome ? 'home' : 'away',
        result,
        scoreUs,
        scoreThem,
        teams: [
          {
            name: leagueRow.homeTeam,
            isBekapaka: isBekapakaTeamName(leagueRow.homeTeam),
            players: [],
            pts: leagueRow.scoreHome
          },
          {
            name: leagueRow.guestTeam,
            isBekapaka: isBekapakaTeamName(leagueRow.guestTeam),
            players: [],
            pts: leagueRow.scoreAway
          }
        ],
        hasBoxScore: false,
        boxScoreMissingHint: 'Brak box score w KALK — uruchom pełny sync w Administracji.'
      };
    }
  }

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

    if (game.aiSummary && game.aiSummaryHash) {
      const currentHash = hashGameForAi(game);
      game.aiSummaryStale =
        !hasCompleteMatchAnalysisMarkdown(game.aiSummary) ||
        Boolean(currentHash && currentHash !== game.aiSummaryHash);
    } else {
      game.aiSummaryStale = false;
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

const stripDiacritics = (str) => {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
};

export async function ingestKalkPlayers(entries) {
  await ensureSeeded();
  await ensureDefaultSeason();
  const activeSeason = await getActiveSeason();
  if (!activeSeason) {
    throw new Error('Brak aktywnego sezonu KALK');
  }
  if (!Array.isArray(entries) || !entries.length) {
    return { newPlayers: [], total: 0 };
  }

  const normalizedEntries = entries.filter((entry) => entry && (entry.id_zawodnika || entry.id));
  const ids = [...new Set(normalizedEntries.map((entry) =>
    buildKalkPlayerDbId(activeSeason.slug, entry.id_zawodnika || entry.id)
  ))];
  const existing = await prisma.kalkPlayer.findMany({
    where: { id: { in: ids } },
    select: { id: true }
  });
  const existingIds = new Set(existing.map((p) => p.id));
  const newPlayers = [];

  const upsertPromises = normalizedEntries.map((entry) => {
    const playerId = buildKalkPlayerDbId(activeSeason.slug, entry.id_zawodnika || entry.id);
    if (!playerId) return null;
    const matchesValue = parseStat(entry.mecze_rozegrane);
    const record = {
      id: playerId,
      name: entry.imie_nazwisko || playerId,
      team: entry.druzyna || null,
      pointsTotal: parseStat(entry.punkty_suma),
      pointsAverage: parseStat(entry.srednia_punktow),
      matchesPlayed: matchesValue === null ? null : Math.round(matchesValue),
      eval: parseStat(entry.eval_srednia || entry.eval),
      profileUrl: entry.profile_url || null,
      
      // Nowe kategorie
      stealsTotal: parseStat(entry.steals_suma),
      stealsAverage: parseStat(entry.steals_srednia),
      blocksTotal: parseStat(entry.blocks_suma),
      blocksAverage: parseStat(entry.blocks_srednia),
      reboundsTotal: parseStat(entry.rebounds_suma),
      reboundsAverage: parseStat(entry.rebounds_srednia),
      assistsTotal: parseStat(entry.assists_suma),
      assistsAverage: parseStat(entry.assists_srednia),
      threePointsMade: entry.three_made ? parseInt(entry.three_made) : null,
      threePointsAttempted: entry.three_attempted ? parseInt(entry.three_attempted) : null,
      threePointsPct: parseStat(entry.three_pct),
      threePointStats: entry.three_made ? `${entry.three_made}/${entry.three_attempted} (${entry.three_pct}%)` : null,
      turnoversTotal: parseStat(entry.str_suma || entry.turnovers_suma),
      turnoversAverage: parseStat(entry.str_srednia || entry.turnovers_srednia),
      foulsTotal: parseStat(entry.f_suma || entry.fouls_suma),
      foulsAverage: parseStat(entry.f_srednia || entry.fouls_srednia),
      minutesTotal: parseStat(entry.czas_gry_suma),
      minutesAverage: parseStat(entry.czas_gry_srednia),
      twoPointsPct: parseStat(entry.proc2_srednia),
      ftPct: parseStat(entry.proc1_srednia),
      attackIndex: parseStat(entry.atak_srednia),
      defenseIndex: parseStat(entry.obrona_srednia),

      seasonId: activeSeason.id,
      raw: entry
    };

    if (normalizedEntries.indexOf(entry) === 0) {
      console.log('[DEBUG Ingest] First entry:', JSON.stringify(entry));
    }

    return prisma.kalkPlayer.upsert({
      where: { id: playerId },
      create: record,
      update: record
    });
  }).filter(Boolean);

  await prisma.$transaction(upsertPromises);

  for (const entry of normalizedEntries) {
    const playerId = buildKalkPlayerDbId(activeSeason.slug, entry.id_zawodnika);
    if (playerId && !existingIds.has(playerId)) {
      existingIds.add(playerId);
      newPlayers.push(entry.imie_nazwisko || playerId);
    }
  }

  return { newPlayers, total: normalizedEntries.length };
}

export async function ingestLeagueTable(tableData, phase = 'regular') {
  await ensureSeeded();
  await ensureDefaultSeason();
  const activeSeason = await getActiveSeason();
  if (!activeSeason || !Array.isArray(tableData)) return;

  for (const team of tableData) {
    if (!team.name) continue;

    const data = {
      seasonId: activeSeason.id,
      name: team.name,
      phase,
      matches: team.matches,
      points: team.points,
      wins: team.wins,
      losses: team.losses,
      pointsFor: team.pointsFor,
      pointsAgainst: team.pointsAgainst
    };

    await prisma.leagueTeam.upsert({
      where: {
        seasonId_name_phase: {
          seasonId: activeSeason.id,
          name: team.name,
          phase
        }
      },
      create: data,
      update: data
    });
  }
}

export async function ingestLeagueSchedule(scheduleData) {
  return ingestLeagueScheduleKalk(scheduleData);
}

export async function logKalkScrapeRun(run) {
  await ensureSeeded();
  return prisma.kalkScrapeRun.create({ data: run });
}

export async function getLatestKalkScrapeRun() {
  await ensureSeeded();
  return prisma.kalkScrapeRun.findFirst({ orderBy: { createdAt: 'desc' } });
}

/** Podsumowanie importu KALK (panel Admin) + KPI braków z audytu. */
export async function getKalkIngestSummary() {
  await ensureSeeded();
  await ensureDefaultSeason();
  const activeSeason = await getActiveSeason();
  if (!activeSeason) return null;

  const { runKalkDataAudit } = await import('./kalk/kalkDataAudit.js');

  const [kalkMatches, finishedMatches, playerGameLogs, kalkTeams, lastSync, audit] =
    await Promise.all([
      prisma.kalkMatch.count({ where: { seasonId: activeSeason.id } }),
      prisma.kalkMatch.count({ where: { seasonId: activeSeason.id, isFinished: true } }),
      prisma.kalkPlayerGameLog.count({ where: { seasonId: activeSeason.id } }),
      prisma.kalkTeam.count({ where: { seasonId: activeSeason.id } }),
      prisma.kalkSyncRun.findFirst({
        where: { seasonId: activeSeason.id },
        orderBy: { startedAt: 'desc' }
      }),
      runKalkDataAudit({ seasonId: activeSeason.id })
    ]);

  const leagueWithDetails = await prisma.leagueMatch.count({
    where: {
      seasonId: activeSeason.id,
      kalkMatchId: { not: null }
    }
  });

  return {
    seasonSlug: activeSeason.slug,
    kalkMatches,
    finishedMatches,
    playerGameLogs,
    kalkTeams,
    leagueMatchesWithBoxScore: leagueWithDetails,
    lastSync,
    bekapakaScheduleFinished: audit.matches?.bekapakaScheduleFinished ?? 0,
    bekapakaWithBoxScore: audit.matches?.bekapakaWithValidBoxScore ?? 0,
    bekapakaMissingBoxScore: audit.matches?.bekapakaMissingBoxScore ?? [],
    duplicatePlayersCount: audit.players?.duplicateGroups ?? 0,
    divisionKalkMatchesTotal: audit.matches?.divisionKalkMatchesTotal ?? 0,
    lastScrapeManifest: audit.lastSync?.probeHashes ?? null
  };
}

/** Pełny raport audytu KALK (ADMIN). */
export async function getKalkDataAuditReport() {
  await ensureSeeded();
  await ensureDefaultSeason();
  const { runKalkDataAudit } = await import('./kalk/kalkDataAudit.js');
  return runKalkDataAudit();
}

// ============================================
// NOWE FUNKCJE DLA FAZY 1 REFAKTORYZACJI
// ============================================

// ZAWODNICY - Synchronizacja KalkPlayer z RosterPlayer
export async function syncPlayersFromKalk() {
  await ensureSeeded();

  const activeSeason = await getActiveSeason();
  const kalkPlayers = await prisma.kalkPlayer.findMany({
    where: activeSeason ? { seasonId: activeSeason.id } : undefined
  });

  // Filtrujemy tylko naszych zawodników
  const ourKalkPlayers = kalkPlayers.filter(kp =>
    kp.team && (kp.team.toLowerCase().includes('bekapaka') || kp.team.toLowerCase().includes('bobolice'))
  );

  const ourKalkIds = new Set(ourKalkPlayers.map(p => p.id));
  const synced = [];
  const errors = [];

  // 1. SYNCHRONIZACJA: Odłącz zawodników z RosterPlayer, którzy nie są już w naszej drużynie na KALK (zamiast usuwać konto)
  try {
    const allRosterWithKalk = await prisma.rosterPlayer.findMany({
      where: { NOT: { kalkPlayerId: null } }
    });

    for (const rp of allRosterWithKalk) {
      if (!ourKalkIds.has(rp.kalkPlayerId)) {
        await prisma.rosterPlayer.update({
          where: { id: rp.id },
          data: { kalkPlayerId: null }
        });
      }
    }
  } catch (error) {
    console.error('Error unlinking roster players:', error);
  }

  // Pobierz wszystkich aktualnych roster graczy, żeby móc wyszukiwać ich w pamięci
  const allRoster = await prisma.rosterPlayer.findMany();

  const findRosterMatch = (fName, lName) => {
    const cleanFirst = stripDiacritics(fName);
    const cleanLast = stripDiacritics(lName);

    return allRoster.find(r => {
      const rFirst = stripDiacritics(r.firstName);
      const rLast = stripDiacritics(r.lastName);

      return (rFirst === cleanFirst && rLast === cleanLast) ||
             (rFirst === cleanLast && rLast === cleanFirst);
    });
  };

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

      // Proboj znalezc po kalkPlayerId w pamięci
      let existing = allRoster.find(r => r.kalkPlayerId === kalkPlayer.id);

      // Jesli nie ma po ID, sprawdz po imieniu i nazwisku (diacritic-insensitive) w pamięci
      if (!existing) {
        existing = findRosterMatch(firstName, lastName);

        if (existing && !existing.kalkPlayerId) {
          // Polacz istniejacego zawodnika z KALK ID
          await prisma.rosterPlayer.update({
            where: { id: existing.id },
            data: { kalkPlayerId: kalkPlayer.id }
          });
          existing.kalkPlayerId = kalkPlayer.id; // update local object reference
        }
      }

      if (!existing) {
        // FIX: Kalk name is "Surname Name" (e.g. "Karpiński Filip")
        const nameParts = kalkPlayer.name.trim().split(/\s+/);
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
        allRoster.push(newPlayer); // Keep local cache updated
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

  await updateRosterStatsFromKalk();

  return { synced, errors, total: ourKalkPlayers.length };
}

/** Statystyki kadry z agregatów KalkPlayer (bez protokołów Game). */
export async function updateRosterStatsFromKalk() {
  const roster = await prisma.rosterPlayer.findMany({
    include: { kalkPlayer: true }
  });

  for (const player of roster) {
    const kp = player.kalkPlayer;
    if (!kp) continue;

    await prisma.rosterPlayer.update({
      where: { id: player.id },
      data: {
        gamesPlayed: kp.matchesPlayed ?? player.gamesPlayed,
        ppg: kp.pointsAverage ?? player.ppg ?? 0,
        rpg: kp.reboundsAverage ?? player.rpg ?? 0,
        apg: kp.assistsAverage ?? player.apg ?? 0,
        threePercentage: kp.threePointsPct ?? player.threePercentage,
        ftPercentage: kp.ftPct ?? player.ftPercentage
      }
    });
  }
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
      gamesPlayed: 0, plusMinus: 0, orb: 0, drb: 0
    };

    for (const game of allGames) {
      const boxScore = Array.isArray(game.playerStats) ? game.playerStats : [];
      // Try to find player in box score using robust name matching
      const pStats = boxScore.find(p => {
        if (!p.name) return false;
        
        const cleanBoxName = stripDiacritics(p.name);
        const playerLast = stripDiacritics(player.lastName);
        const playerFirst = stripDiacritics(player.firstName);
        const playerInitial = playerFirst.charAt(0);

        if (!cleanBoxName.includes(playerLast)) return false;

        const remaining = cleanBoxName.replace(playerLast, '').trim();

        if (remaining === '') return true;
        if (remaining.includes(playerFirst)) return true;

        const regex = new RegExp(`\\b${playerInitial}\\b`);
        return regex.test(remaining);
      });

      if (pStats) {
        // Skip player if they didn't play (DNP)
        if (pStats.didNotPlay === true || pStats.min === 'DNP' || pStats.min === 'dnp') {
          continue;
        }

        // Update number if found and valid
        if (pStats.number && pStats.number.length > 0 && pStats.number !== '0' && pStats.number !== '-') {
          stats.number = parseInt(pStats.number);
        }

        stats.gamesPlayed++;
        stats.pts += (pStats.pts || 0);
        stats.reb += (pStats.reb || 0);
        stats.orb += (pStats.orb || 0);
        stats.drb += (pStats.drb || 0);
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

    const plusMinusAvg = stats.gamesPlayed > 0
      ? parseFloat((stats.plusMinus / stats.gamesPlayed).toFixed(1))
      : 0;

    const updateData = {
      gamesPlayed: stats.gamesPlayed,
      ppg, rpg, apg,
      fgPercentage: fgPct,
      threePercentage: threePct,
      ftPercentage: ftPct,
      eFgPercentage: eFgPct,
      tsPercentage: tsPct,
      plusMinus: plusMinusAvg,
      pts: stats.pts,
      fgm: stats.fgm, fga: stats.fga,
      threePm: stats.threePm, threePa: stats.threePa,
      ftm: stats.ftm, fta: stats.fta,
      orb: stats.orb, drb: stats.drb,
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
  await ensureDefaultSeason();
  const seasons = await listSeasons();
  const gameDate = new Date(gameData.date);
  const seasonId = resolveSeasonIdForDate(gameDate, seasons);

  return await prisma.game.create({
    data: {
      seasonId,
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
export async function getLeagueTable(phase = 'regular', seasonIdParam) {
  await ensureSeeded();
  await ensureDefaultSeason();
  const seasonId = await resolveSeasonId(seasonIdParam);
  return await prisma.leagueTeam.findMany({
    where: { phase, seasonId },
    orderBy: LEAGUE_TABLE_ORDER_BY
  });
}

// LIGA - Pobierz terminarz
export async function getLeagueSchedule(seasonIdParam) {
  await ensureSeeded();
  await ensureDefaultSeason();
  const seasonId = await resolveSeasonId(seasonIdParam);
  return await prisma.leagueMatch.findMany({
    where: { seasonId },
    orderBy: { date: 'desc' }
  });
}

// LIGA - Top Strzelcy (używamy istniejącej tabeli KalkPlayer)
export async function getTopScorers(limit = 20, seasonIdParam) {
  return await getLeagueLeaders('points', limit, seasonIdParam);
}

function normalizeLeaderKey(name, team) {
  const n = (name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const t = (team || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  return `${n}|${t}`;
}

function leaderSortValue(player, category) {
  switch (category) {
    case 'three':
      return player.threePointsMade ?? 0;
    case 'assists':
      return player.assistsAverage ?? 0;
    case 'rebounds':
      return player.reboundsAverage ?? 0;
    case 'steals':
      return player.stealsAverage ?? 0;
    case 'blocks':
      return player.blocksAverage ?? 0;
    default:
      return player.pointsAverage ?? 0;
  }
}

/** Usuwa duplikaty z migracji (stare id bez prefiksu sezonu vs `slug__id`). */
function dedupeKalkLeaderRows(rows, category) {
  const byKey = new Map();
  for (const row of rows) {
    const key = normalizeLeaderKey(row.name, row.team);
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, row);
      continue;
    }
    const preferNew =
      row.id.includes('__') && !prev.id.includes('__');
    const betterStat = leaderSortValue(row, category) > leaderSortValue(prev, category);
    if (preferNew || (!prev.id.includes('__') && betterStat)) {
      byKey.set(key, row);
    }
  }
  return [...byKey.values()].sort(
    (a, b) => leaderSortValue(b, category) - leaderSortValue(a, category)
  );
}

// LIGA - Pobierz liderów w danej kategorii
export async function getLeagueLeaders(category = 'points', limit = 20, seasonIdParam) {
  await ensureSeeded();
  await ensureDefaultSeason();
  const seasonId = await resolveSeasonId(seasonIdParam);

  let orderBy = {};
  const where = { seasonId };

  if (category === 'points') {
    orderBy = { pointsAverage: 'desc' };
    where.pointsAverage = { not: null };
  } else if (category === 'three') {
    orderBy = { threePointsMade: 'desc' };
    where.threePointsMade = { not: null };
  } else if (category === 'assists') {
    orderBy = { assistsAverage: 'desc' };
    where.assistsAverage = { not: null };
  } else if (category === 'rebounds') {
    orderBy = { reboundsAverage: 'desc' };
    where.reboundsAverage = { not: null };
  } else if (category === 'steals') {
    orderBy = { stealsAverage: 'desc' };
    where.stealsAverage = { not: null };
  } else if (category === 'blocks') {
    orderBy = { blocksAverage: 'desc' };
    where.blocksAverage = { not: null };
  } else {
    orderBy = { pointsAverage: 'desc' };
    where.pointsAverage = { not: null };
  }

  const rows = await prisma.kalkPlayer.findMany({
    where,
    orderBy,
    take: Math.min(limit * 3, 120),
    include: {
      rosterPlayer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          starter: true,
          data: true
        }
      }
    }
  });

  return dedupeKalkLeaderRows(rows, category).slice(0, limit);
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

function extractOpponentFromLeagueMatch(match) {
  const isHome =
    match.homeTeam.toLowerCase().includes('bekapaka') ||
    match.homeTeam.toLowerCase().includes('bobolice');
  return isHome ? match.guestTeam : match.homeTeam;
}

/** Nadchodzący mecz BeKaPaKa z terminarza ligowego. */
async function findBekapakaLeagueMatchContext(seasonIdParam) {
  await ensureSeeded();
  const seasonId = await resolveSeasonId(seasonIdParam);

  const upcoming = await prisma.leagueMatch.findFirst({
    where: {
      OR: BEKAPAKA_MATCH_OR,
      isFinished: false,
      ...(seasonId ? { seasonId } : {})
    },
    orderBy: { date: 'asc' }
  });

  if (upcoming) {
    return {
      match: upcoming,
      scoutingMode: 'upcoming',
      opponentName: extractOpponentFromLeagueMatch(upcoming),
      seasonId: upcoming.seasonId
    };
  }

  return null;
}

async function buildOpponentScoutingCard(opponentName, seasonId, meta = {}) {
  const leagueTableTeams = await prisma.leagueTeam.findMany({
    where: { seasonId, phase: 'regular' },
    orderBy: LEAGUE_TABLE_ORDER_BY
  });
  const { team: opponentTableData, rank } = resolveLeagueTeamFromList(
    leagueTableTeams,
    opponentName
  );

  const oppMatches = await prisma.leagueMatch.findMany({
    where: {
      seasonId,
      OR: [
        { homeTeam: { contains: opponentName, mode: 'insensitive' } },
        { guestTeam: { contains: opponentName, mode: 'insensitive' } }
      ],
      isFinished: true
    },
    orderBy: { date: 'desc' },
    take: 3
  });

  const resForm = oppMatches.map((m) => {
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

  const keyPlayers = dedupeKalkLeaderRows(
    await prisma.kalkPlayer.findMany({
      where: {
        seasonId,
        team: { contains: opponentName, mode: 'insensitive' },
        name: { not: '' }
      },
      orderBy: { pointsAverage: 'desc' },
      take: 10
    }),
    'points'
  ).slice(0, 3);

  return {
    opponent: opponentName,
    rank: rank > 0 ? rank : null,
    wins: opponentTableData?.wins || 0,
    losses: opponentTableData?.losses || 0,
    ppg:
      opponentTableData && opponentTableData.matches > 0
        ? opponentTableData.pointsFor / opponentTableData.matches
        : 0,
    oppg:
      opponentTableData && opponentTableData.matches > 0
        ? opponentTableData.pointsAgainst / opponentTableData.matches
        : 0,
    form: resForm,
    keyPlayers: keyPlayers
      .map((p) => {
        const name = (() => {
          const trimmed = (p.name || '').trim();
          if (!trimmed) return null;
          const parts = trimmed.split(/\s+/);
          if (parts.length === 2) return `${parts[1]} ${parts[0]}`;
          return trimmed;
        })();
        return name ? { name, ppg: p.pointsAverage ?? 0 } : null;
      })
      .filter(Boolean),
    ...meta
  };
}

export async function getNextOpponentScouting(seasonIdParam) {
  const ctx = await findBekapakaLeagueMatchContext(seasonIdParam);
  if (!ctx) return null;

  const matchDate =
    ctx.match.date && !isNaN(ctx.match.date.getTime())
      ? ctx.match.date.toISOString().split('T')[0]
      : null;

  return buildOpponentScoutingCard(ctx.opponentName, ctx.seasonId, {
    scoutingMode: ctx.scoutingMode,
    matchDate,
    usingLastMatchFallback: ctx.scoutingMode === 'lastFinished'
  });
}


function hasValidLeagueMatchDetails(match) {
  const details = match?.details;
  if (!details || typeof details !== 'object' || Object.keys(details).length === 0) {
    return false;
  }
  if (!Array.isArray(details.teams) || details.teams.length < 2) {
    return false;
  }
  return details.teams.some(
    (team) => team && (team.fourFactors || (Array.isArray(team.players) && team.players.length > 0))
  );
}

function leagueMatchRowFromKalk(km) {
  return {
    id: `kalk-${km.id}`,
    date: km.date,
    homeTeam: km.homeTeamName,
    guestTeam: km.guestTeamName,
    scoreHome: km.scoreHome,
    scoreAway: km.scoreAway,
    isFinished: km.isFinished,
    details: boxScoreToLeagueDetails(km.boxScore)
  };
}

function teamNameMatchesOpponent(teamName, simplifiedName) {
  if (!teamName || !simplifiedName) return false;
  return teamName.toLowerCase().includes(simplifiedName.toLowerCase());
}

// Helper: statystyki zaawansowane rywala z box score KALK (LeagueMatch.details)
async function getOpponentAdvancedStats(opponentName, seasonIdParam = undefined) {
  if (!opponentName) return null;

  const simplifiedName = opponentName.split('-')[0].trim();
  await ensureDefaultSeason();
  const targetSeasonId = await resolveSeasonId(seasonIdParam);

  let kalkDerived = [];
  if (targetSeasonId) {
    const kalkMatches = await prisma.kalkMatch.findMany({
      where: {
        seasonId: targetSeasonId,
        isFinished: true,
        OR: [
          { homeTeamName: { contains: simplifiedName, mode: 'insensitive' } },
          { guestTeamName: { contains: simplifiedName, mode: 'insensitive' } }
        ]
      },
      orderBy: { date: 'desc' },
      take: 25
    });
    kalkDerived = kalkMatches
      .filter(
        (km) =>
          teamNameMatchesOpponent(km.homeTeamName, simplifiedName) ||
          teamNameMatchesOpponent(km.guestTeamName, simplifiedName)
      )
      .map(leagueMatchRowFromKalk);
  }

  const matches = await prisma.leagueMatch.findMany({
    where: {
      seasonId: targetSeasonId || undefined,
      OR: [
        { homeTeam: { contains: simplifiedName, mode: 'insensitive' } },
        { guestTeam: { contains: simplifiedName, mode: 'insensitive' } }
      ],
      isFinished: true
    },
    orderBy: { date: 'desc' },
    take: 25
  });

  const leagueWithDetails = matches.filter(hasValidLeagueMatchDetails);
  const seenDates = new Set();
  const matchesWithDetails = [];
  for (const row of [...kalkDerived, ...leagueWithDetails]) {
    const key = `${row.date?.toISOString?.() || row.date}_${row.homeTeam}_${row.guestTeam}`;
    if (seenDates.has(key)) continue;
    if (!hasValidLeagueMatchDetails(row)) continue;
    seenDates.add(key);
    matchesWithDetails.push(row);
  }
  matchesWithDetails.sort((a, b) => new Date(b.date) - new Date(a.date));

  const latestFinished = matchesWithDetails[0] || matches[0] || kalkDerived[0];

  if (!matchesWithDetails.length) {
    if (!latestFinished) return null;
    return {
      matchesScraped: 0,
      pace: 0,
      shotProfile: { two: 0, three: 0, ft: 0 },
      fourFactors: { efg: 0, tov: 0, orb: 0, ftr: 0 },
      situational: { fourthQuarterDiff: 0, clutchPlay: '?' },
      personnel: { shooters: [], paintProtectors: [], playmakers: [] },
      fallbackFromPreviousMatch: true,
      fallbackBasicOnly: true,
      dataSource: kalkDerived.length ? 'kalk' : 'schedule',
      sourceMatchDate: latestFinished.date
        ? latestFinished.date.toISOString().split('T')[0]
        : null,
      sourceMatchLabel: `${latestFinished.homeTeam} — ${latestFinished.guestTeam} (${latestFinished.scoreHome ?? '–'}:${latestFinished.scoreAway ?? '–'})`,
      threePointAccuracy: 0
    };
  }

  const fallbackFromPreviousMatch = Boolean(
    latestFinished && !hasValidLeagueMatchDetails(latestFinished)
  );

  const matchesToProcess = matchesWithDetails.slice(0, 5);
  const sourceMatch = matchesToProcess[0];

  const stats = {
    matchesScraped: 0,
    pace: 0,
    shotProfile: { two: 0, three: 0, ft: 0 },
    fourFactors: { efg: 0, tov: 0, orb: 0, ftr: 0 },
    situational: { fourthQuarterDiff: 0, clutchPlay: '?' },
    personnel: { shooters: [], paintProtectors: [], playmakers: [] },
    fallbackFromPreviousMatch,
    sourceMatchDate: sourceMatch?.date
      ? sourceMatch.date.toISOString().split('T')[0]
      : null,
    sourceMatchLabel: sourceMatch
      ? `${sourceMatch.homeTeam} — ${sourceMatch.guestTeam} (${sourceMatch.scoreHome ?? '–'}:${sourceMatch.scoreAway ?? '–'})`
      : null,
    threePointAccuracy: 0,
    dataSource: kalkDerived.length ? 'kalk' : 'league'
  };

  let totalPoss = 0;
  let totalPts = 0;
  let total2PM = 0, total3PM = 0, totalFTM = 0;
  let totalFGA = 0, totalFGM = 0, totalFTA = 0, totalTOV = 0, totalORB = 0, totalOppDRB = 0;
  let total3PA = 0;
  let q4DiffSum = 0;

  const playerStatsMap = {};

  for (const match of matchesToProcess) {
    stats.matchesScraped++;

    const details = match.details || {};
    const teams = details.teams || [];

    const isHome = teamNameMatchesOpponent(match.homeTeam, simplifiedName);
    const oppTeamRaw = teams.find((t) =>
      teamNameMatchesOpponent(t?.name, simplifiedName)
    ) || (isHome ? teams[0] : teams[1]);
    const enemyTeamRaw = teams.find((t) => t !== oppTeamRaw) || (isHome ? teams[1] : teams[0]);

    if (!oppTeamRaw || !enemyTeamRaw) continue;

    const enemyPts = enemyTeamRaw.pts ?? (isHome ? match.scoreAway : match.scoreHome) ?? 0;
    const oppPts = oppTeamRaw.pts ?? (isHome ? match.scoreHome : match.scoreAway) ?? 0;
    const oppTeamData = enrichKalkTeamStats(oppTeamRaw, enemyPts);
    const enemyTeamData = enrichKalkTeamStats(enemyTeamRaw, oppPts);

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
    totalOppDRB += enemyTeamData.drb ?? enemyTeamData.fourFactors?.drb ?? 0;

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

  // Situational Defaults
  stats.situational.fourthQuarterDiff = stats.matchesScraped > 0 ? Number((q4DiffSum / stats.matchesScraped).toFixed(1)) : 0;
  stats.situational.clutchPlay = stats.situational.fourthQuarterDiff > 2 ? 'Dominujący (Mocne końcówki)' : (stats.situational.fourthQuarterDiff < -2 ? 'Wrażliwy (Traci przewagi)' : 'Stabilny (Równa gra)');

  // 3PT Accuracy
  stats.threePointAccuracy = total3PA > 0 ? Number(((total3PM / total3PA) * 100).toFixed(2)) : 0;

  const minGamesForPersonnel =
    stats.fallbackFromPreviousMatch && stats.matchesScraped === 1 ? 1 : 2;

  // Process Personnel
  Object.entries(playerStatsMap).forEach(([name, s]) => {
    // @ts-ignore
    const gp = s.gp;
    if (gp < minGamesForPersonnel) return;

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

export async function getDetailedScouting(opponentName, seasonIdParam = undefined) {
  await ensureSeeded();

  let seasonId = await resolveSeasonId(seasonIdParam);

  if (!opponentName) {
    const ctx = await findBekapakaLeagueMatchContext(seasonId);
    if (!ctx) return null;
    opponentName = ctx.opponentName;
    seasonId = ctx.seasonId;
  }

  const leagueTableTeams = await prisma.leagueTeam.findMany({
    where: { seasonId, phase: 'regular' },
    orderBy: LEAGUE_TABLE_ORDER_BY
  });

  const { team: opponent, rank: oppRank } = resolveLeagueTeamFromList(
    leagueTableTeams,
    opponentName
  );
  const { team: bekapaka, rank: bkRank } = resolveLeagueTeamFromList(
    leagueTableTeams,
    'BeKaPaKa BOBOLICE'
  );

  // 2. Opponent Players (Top 5)
  const keyPlayers = dedupeKalkLeaderRows(
    await prisma.kalkPlayer.findMany({
      where: {
        seasonId,
        team: { contains: opponentName, mode: 'insensitive' },
        name: { not: '' }
      },
      orderBy: { pointsAverage: 'desc' },
      take: 15
    }),
    'points'
  ).slice(0, 5);

  // 3. Recent Matches (Opponent)
  const oppMatches = await prisma.leagueMatch.findMany({
    where: {
      seasonId,
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
    getOpponentAdvancedStats(opponentName, seasonId),
    getOpponentAdvancedStats(bekapaka?.name || 'BeKaPaKa', seasonId)
  ]);

  const oppPpg = opponent?.matches > 0 ? (opponent.pointsFor / opponent.matches) : 0;
  const oppOppg = opponent?.matches > 0 ? (opponent.pointsAgainst / opponent.matches) : 0;
  const bkPpg = bekapaka?.matches > 0 ? (bekapaka.pointsFor / bekapaka.matches) : 0;
  const bkOppg = bekapaka?.matches > 0 ? (bekapaka.pointsAgainst / bekapaka.matches) : 0;

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

  const keyPlayerNames = keyPlayers.slice(0, 2).map(p => p.name.split(' ')[1] || p.name).join(' i ');
  const offenseStrength = oppPpg > 60 ? 'Potrafią seryjnie zdobywać punkty' : 'Miewają przestoje w ataku';
  const defenseStrength = oppOppg < 50 ? 'Dysponują szczelną defensywą' : 'Tracą sporo punktów';
  const weakPoint = advancedStats?.fourFactors?.tov > 20 ? 'Często gubią piłkę pod presją' : (advancedStats?.fourFactors?.orb < 20 ? 'Słabo zbierają w ataku' : 'Można ich skontrować');

  /** Szablon z danych ligi — gdy brak cache lub uzupełnienie ubogiego raportu Gemini */
  const templateAnalysis = {
    summary: `Zespół ${opponentName} to drużyna ${paceDesc} ${styleDesc}. ${formDesc} BeKaPaKa: ${bkPpg.toFixed(1)} PPG przy ${bkOppg.toFixed(1)} straconych — porównaj tempo (${pace.toFixed(0)} vs nasze).`,
    offense: `${offenseStrength}. Głównym motorem są ${keyPlayerNames || 'rotacja bez wyraźnej gwiazdy'}. Średnio ${oppPpg.toFixed(1)} pkt/mecz; profil rzutów i forma w JSON.`,
    defense: `${defenseStrength} (śr. ${oppOppg.toFixed(1)} straconych). Słabość: ${weakPoint.toLowerCase()}. Szukaj kontrataku po zbiórce lub presji na piłce.`,
    verdict: pace > 84
      ? 'KLUCZ: Zwolnić grę, nie wdawać się w wymianę ciosów.\n- Zamknąć trójki i przejścia\n- Kontrolować tablicę po obronie'
      : 'KLUCZ: Narzucić własne tempo i wymusić błędy.\n- Agresywny pick and roll\n- Szybkie wyjścia po zbiórce',
    personnel: {
      keyPlayers: keyPlayers.length
        ? keyPlayers.map((p) => `${p.name}: ${(p.pointsAverage || 0).toFixed(1)} PPG`).join('; ')
        : 'Brak szczegółowych statystyk zawodników w imporcie — uzupełnij scraper KALK.',
      threats: keyPlayerNames ? `Priorytet: ${keyPlayerNames} — ograniczyć swobodę rzutów i wejścia.` : '',
      matchups: 'Dopasuj najlepszego obrońcę do ich lidera punktowego; reszta pomaga przy pick and roll.',
      bench: 'Obserwuj drugą piątkę po pierwszej zmianie — często spadek intensywności obrony.'
    }
  };

  // 4. AI Analysis — Gemini cache (+ merge z szablonem gdy ubogi) lub sam szablon
  let aiAnalysis = templateAnalysis;
  let aiMeta = { fromGemini: false, needsRegeneration: false };

  const opponentKey = normalizeOpponentKey(opponentName);
  const cachedReport = await prisma.scoutingAiReport.findUnique({
    where: { opponentKey }
  });

  if (cachedReport?.analysisJson || cachedReport?.summaryMd) {
    let fromCache = cachedReport.analysisJson
      ? normalizeScoutingAnalysis(cachedReport.analysisJson)
      : analysisFromSummaryMdField(cachedReport.summaryMd);

    if (!fromCache && cachedReport.summaryMd) {
      fromCache = normalizeScoutingAnalysis({ summary: cachedReport.summaryMd });
    }

    if (fromCache) {
      const sparse = isScoutingAnalysisSparse(fromCache);
      aiAnalysis = sparse ? mergeScoutingAnalysis(fromCache, templateAnalysis) : fromCache;
      aiMeta = {
        fromGemini: true,
        generatedAt: cachedReport.generatedAt,
        model: cachedReport.model,
        needsRegeneration: sparse,
        mergedWithTemplate: sparse
      };
    }
  }

  // Use only data available from imported scraping payload.
  const enrichedKeyPlayers = await Promise.all(keyPlayers.map(async (p) => {
    let stats3pt = p.threePointStats;

    return {
      name: p.name.split(/\s+/).length === 2 ? `${p.name.split(/\s+/)[1]} ${p.name.split(/\s+/)[0]}` : p.name,
      ppg: p.pointsAverage ?? 0,
      totalPoints: p.pointsTotal || 0,
      matches: p.matchesPlayed || 0,
      threePointStats: stats3pt || '-'
    };
  }));

  const scoutingPayloadForHash = {
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
    form: oppMatches.map((m) => {
      const isHome = m.homeTeam.toLowerCase().includes(opponentName.toLowerCase());
      return {
        opponent: isHome ? m.guestTeam : m.homeTeam,
        score: `${m.scoreHome}:${m.scoreAway}`,
        result: (isHome ? m.scoreHome : m.scoreAway) > (isHome ? m.scoreAway : m.scoreHome) ? 'W' : 'L',
        date: m.date.toISOString().split('T')[0]
      };
    }),
    advancedStats,
    bekapakaAdvancedStats
  };
  const scoutingCurrentHash = hashPayload(scoutingPayloadForHash);

  if (cachedReport?.sourceHash && cachedReport.sourceHash !== scoutingCurrentHash) {
    aiMeta = {
      ...aiMeta,
      stale: true,
      needsRegeneration: true
    };
  } else if (cachedReport?.sourceHash) {
    aiMeta = { ...aiMeta, stale: false };
  }

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
    aiAnalysis,
    aiMeta,
    scoutingSummaryMd: buildScoutingSummaryMd(aiAnalysis),
    personnelMd: buildPersonnelMdFromAnalysis(aiAnalysis)
  };
}


export async function wipeGamesTable() {
  const result = await prisma.game.deleteMany();
  console.log('[DataStore] Game table wiped.');
  return result.count;
}

