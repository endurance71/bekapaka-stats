import { createHash } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { buildKalkPlayerDbId } from '../lib/kalkSeason.js';
import { ensureDefaultSeason, getActiveSeason } from '../seasonService.js';
import { boxScoreToLeagueDetails, hashBoxScore } from './parseMatchBoxScore.js';
import { normalizePlayerGameLogRow } from './parseMatchBoxScore.js';

const prisma = new PrismaClient();

function parseScheduleDate(dateStr) {
  if (!dateStr) return new Date();
  const match = String(dateStr).match(/^(\d{2})[-.](\d{2})[-.](\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
  if (match) {
    return new Date(
      parseInt(match[3], 10),
      parseInt(match[2], 10) - 1,
      parseInt(match[1], 10),
      match[4] ? parseInt(match[4], 10) : 0,
      match[5] ? parseInt(match[5], 10) : 0
    );
  }
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function parseMatchDate(raw) {
  if (!raw) return new Date();
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

/**
 * @param {object} entry
 */
function mapPlayerCategoryFields(entry) {
  const map = {
    rebounds_suma: 'reboundsTotal',
    rebounds_srednia: 'reboundsAverage',
    assists_suma: 'assistsTotal',
    assists_srednia: 'assistsAverage',
    steals_suma: 'stealsTotal',
    steals_srednia: 'stealsAverage',
    blocks_suma: 'blocksTotal',
    blocks_srednia: 'blocksAverage',
    str_suma: 'turnoversTotal',
    str_srednia: 'turnoversAverage',
    f_suma: 'foulsTotal',
    f_srednia: 'foulsAverage',
    czas_gry_suma: 'minutesTotal',
    czas_gry_srednia: 'minutesAverage',
    proc2_srednia: 'twoPointsPct',
    proc1_srednia: 'ftPct',
    proc3_srednia: 'threePointsPct',
    atak_srednia: 'attackIndex',
    obrona_srednia: 'defenseIndex',
    eval_srednia: 'eval',
    zbiorki_suma: 'reboundsTotal',
    zbiorki_srednia: 'reboundsAverage',
    asysty_suma: 'assistsTotal',
    asysty_srednia: 'assistsAverage',
    prz_suma: 'stealsTotal',
    prz_srednia: 'stealsAverage',
    bl_suma: 'blocksTotal',
    bl_srednia: 'blocksAverage'
  };

  const out = {};
  for (const [src, dest] of Object.entries(map)) {
    if (entry[src] != null) out[dest] = entry[src];
  }
  if (entry.three_made != null) out.threePointsMade = entry.three_made;
  if (entry.three_attempted != null) out.threePointsAttempted = entry.three_attempted;
  if (entry.three_pct != null) out.threePointsPct = entry.three_pct;
  return out;
}

/**
 * @param {object[]} teams
 */
export async function ingestKalkTeams(teams) {
  await ensureDefaultSeason();
  const activeSeason = await getActiveSeason();
  if (!activeSeason || !Array.isArray(teams)) return { total: 0 };

  for (const t of teams) {
    if (!t?.id) continue;
    const record = {
      id: String(t.id),
      seasonId: activeSeason.id,
      slug: t.slug || String(t.id),
      name: t.name,
      captain: t.captain || null,
      colors: t.colors || null,
      sponsors: t.sponsors || null,
      profileUrl: t.profile_url || t.profileUrl || null,
      playerIds: (t.playerIds || []).map(String),
      raw: t
    };
    await prisma.kalkTeam.upsert({
      where: { seasonId_id: { seasonId: activeSeason.id, id: record.id } },
      create: record,
      update: record
    });
  }
  return { total: teams.length };
}

/**
 * @param {object[]} matches
 */
export async function ingestKalkMatches(matches) {
  await ensureDefaultSeason();
  const activeSeason = await getActiveSeason();
  if (!activeSeason || !Array.isArray(matches)) return { total: 0, linked: 0 };

  let linked = 0;
  for (const m of matches) {
    if (!m?.id) continue;
    const boxScore = m.boxScore || { teams: [] };
    const contentHash = hashBoxScore(boxScore);
    const date = parseMatchDate(m.date || m.scheduleDate);

    const record = {
      id: String(m.id),
      seasonId: activeSeason.id,
      slug: m.slug || '',
      date,
      roundCode: m.roundCode || null,
      matchNumber: m.meta?.matchNumber ?? m.matchNumber ?? null,
      homeTeamId: m.homeTeamId ? String(m.homeTeamId) : null,
      guestTeamId: m.guestTeamId ? String(m.guestTeamId) : null,
      homeTeamName: m.homeTeamName,
      guestTeamName: m.guestTeamName,
      scoreHome: m.scoreHome,
      scoreAway: m.scoreAway,
      isFinished: Boolean(m.isFinished),
      referees: m.referees || null,
      statistician: m.statistician || null,
      boxScore,
      meta: m.meta || null,
      contentHash,
      scrapedAt: new Date()
    };

    await prisma.kalkMatch.upsert({
      where: { seasonId_id: { seasonId: activeSeason.id, id: record.id } },
      create: record,
      update: record
    });

    const details = boxScoreToLeagueDetails(boxScore);
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const lm = await prisma.leagueMatch.findFirst({
      where: {
        seasonId: activeSeason.id,
        homeTeam: record.homeTeamName,
        guestTeam: record.guestTeamName,
        date: { gte: start, lte: end }
      }
    });

    if (lm) {
      await prisma.leagueMatch.update({
        where: { id: lm.id },
        data: {
          kalkMatchId: record.id,
          roundUrl: m.roundUrl || null,
          scoreHome: record.scoreHome,
          scoreAway: record.scoreAway,
          isFinished: record.isFinished,
          details
        }
      });
      linked += 1;
    }
  }

  return { total: matches.length, linked };
}

/**
 * @param {object[]} logs
 */
export async function ingestKalkPlayerGameLogs(logs) {
  await ensureDefaultSeason();
  const activeSeason = await getActiveSeason();
  if (!activeSeason || !Array.isArray(logs)) return { total: 0 };

  const seasonSlug = activeSeason.slug;
  let count = 0;
  let skipped = 0;

  for (const row of logs) {
    const externalId = row.id_zawodnika || row.kalk_player_id;
    const matchId = row.kalk_match_id || row.kalkMatchId;
    if (!externalId || !matchId) continue;

    const kalkPlayerId = buildKalkPlayerDbId(seasonSlug, externalId);
    const kalkMatchId = String(matchId);

    const [matchRow, playerRow] = await Promise.all([
      prisma.kalkMatch.findUnique({
        where: { seasonId_id: { seasonId: activeSeason.id, id: kalkMatchId } }
      }),
      prisma.kalkPlayer.findUnique({ where: { id: kalkPlayerId } })
    ]);

    if (!matchRow || !playerRow) {
      skipped += 1;
      continue;
    }

    const stats = normalizePlayerGameLogRow(row);

    const isWin = (() => {
      const score = row.score || '';
      const parts = score.match(/(\d+)\s*:\s*(\d+)/);
      if (!parts) return null;
      const us = parseInt(parts[1], 10);
      const them = parseInt(parts[2], 10);
      return us > them;
    })();

    await prisma.kalkPlayerGameLog.upsert({
      where: {
        seasonId_kalkPlayerId_kalkMatchId: {
          seasonId: activeSeason.id,
          kalkPlayerId,
          kalkMatchId
        }
      },
      create: {
        seasonId: activeSeason.id,
        kalkPlayerId,
        kalkMatchId,
        teamName: row.team_name || 'BeKaPaKa',
        opponentName: stats.opponent || row.opponent || '',
        isWin,
        stats
      },
      update: {
        teamName: row.team_name || 'BeKaPaKa',
        opponentName: stats.opponent || row.opponent || '',
        isWin,
        stats
      }
    });
    count += 1;
  }

  return { total: count, skipped };
}

/**
 * Rozszerza ingestKalkPlayers o nowe kategorie.
 * @param {object[]} entries
 */
export async function ingestKalkPlayersExtended(entries) {
  await ensureDefaultSeason();
  const activeSeason = await getActiveSeason();
  if (!activeSeason || !Array.isArray(entries) || !entries.length) {
    return { newPlayers: [], total: 0 };
  }

  const normalizedEntries = entries.filter((e) => e && (e.id_zawodnika || e.id));
  const newPlayers = [];

  for (const entry of normalizedEntries) {
    const externalId = entry.id_zawodnika || entry.id;
    const playerId = buildKalkPlayerDbId(activeSeason.slug, externalId);
    if (!playerId) continue;

    const extra = mapPlayerCategoryFields(entry);
    const record = {
      id: playerId,
      name: entry.imie_nazwisko || entry.name || playerId,
      team: entry.druzyna || entry.team || null,
      pointsTotal: entry.punkty_suma ?? entry.pointsTotal,
      pointsAverage: entry.srednia_punktow ?? entry.pointsAverage,
      matchesPlayed: entry.mecze_rozegrane != null ? Math.round(entry.mecze_rozegrane) : null,
      eval: entry.eval_srednia ?? entry.eval,
      profileUrl: entry.profile_url || entry.profileUrl || null,
      stealsTotal: extra.stealsTotal,
      stealsAverage: extra.stealsAverage,
      blocksTotal: extra.blocksTotal,
      blocksAverage: extra.blocksAverage,
      reboundsTotal: extra.reboundsTotal,
      reboundsAverage: extra.reboundsAverage,
      assistsTotal: extra.assistsTotal,
      assistsAverage: extra.assistsAverage,
      threePointsMade: entry.three_made ?? extra.threePointsMade,
      threePointsAttempted: entry.three_attempted ?? extra.threePointsAttempted,
      threePointsPct: entry.three_pct ?? extra.threePointsPct,
      turnoversTotal: extra.turnoversTotal,
      turnoversAverage: extra.turnoversAverage,
      foulsTotal: extra.foulsTotal,
      foulsAverage: extra.foulsAverage,
      minutesTotal: extra.minutesTotal,
      minutesAverage: extra.minutesAverage,
      twoPointsPct: extra.twoPointsPct,
      ftPct: extra.ftPct,
      attackIndex: extra.attackIndex,
      defenseIndex: extra.defenseIndex,
      threePointStats: entry.three_made
        ? `${entry.three_made}/${entry.three_attempted} (${entry.three_pct}%)`
        : null,
      seasonId: activeSeason.id,
      raw: entry
    };

    const existing = await prisma.kalkPlayer.findUnique({ where: { id: playerId } });
    await prisma.kalkPlayer.upsert({
      where: { id: playerId },
      create: record,
      update: record
    });
    if (!existing) newPlayers.push(record.name);
  }

  return { newPlayers, total: normalizedEntries.length };
}

/**
 * @param {object[]} scheduleData
 */
export async function ingestLeagueScheduleKalk(scheduleData) {
  await ensureDefaultSeason();
  const activeSeason = await getActiveSeason();
  if (!activeSeason || !Array.isArray(scheduleData)) return;

  for (const match of scheduleData) {
    const matchDate = parseScheduleDate(match.date);
    const startOfDay = new Date(matchDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(matchDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingMatch = await prisma.leagueMatch.findFirst({
      where: {
        seasonId: activeSeason.id,
        homeTeam: match.homeTeam,
        guestTeam: match.guestTeam,
        date: { gte: startOfDay, lte: endOfDay }
      }
    });

    const data = {
      seasonId: activeSeason.id,
      date: matchDate,
      homeTeam: match.homeTeam,
      guestTeam: match.guestTeam,
      scoreHome: match.scoreHome,
      scoreAway: match.scoreAway,
      isFinished: !!match.isFinished,
      kalkMatchId: match.meczId ? String(match.meczId) : null,
      roundUrl: match.roundUrl || null
    };

    if (existingMatch) {
      await prisma.leagueMatch.update({ where: { id: existingMatch.id }, data });
    } else {
      await prisma.leagueMatch.create({ data });
    }
  }
}

export function sectionContentHash(payload) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}
