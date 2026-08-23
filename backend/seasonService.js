import { prisma } from './lib/prisma.js';
import {
  DEFAULT_SEASON_SLUG,
  seasonRowId,
  buildKalkPlayerDbId,
  parseKalkExternalId,
  isDateInSeason,
  resolveSeasonIdForDate
} from './lib/kalkSeason.js';


let defaultSeasonEnsured = false;

export async function ensureDefaultSeason() {
  if (defaultSeasonEnsured) return;
  const id = seasonRowId(DEFAULT_SEASON_SLUG);
  await prisma.kalkSeason.upsert({
    where: { id },
    create: {
      id,
      slug: DEFAULT_SEASON_SLUG,
      label: 'Sezon 2025/2026',
      divisionPath: 'dzial,dywizja-2,4.html',
      isActive: true,
      startsAt: new Date('2025-09-01T00:00:00Z'),
      endsAt: new Date('2026-08-31T23:59:59Z')
    },
    update: {}
  });
  defaultSeasonEnsured = true;
}

export async function listSeasons() {
  await ensureDefaultSeason();
  return prisma.kalkSeason.findMany({
    orderBy: { startsAt: 'desc' }
  });
}

export async function getActiveSeason() {
  await ensureDefaultSeason();
  const active = await prisma.kalkSeason.findFirst({ where: { isActive: true } });
  if (active) return active;
  return prisma.kalkSeason.findFirst({ orderBy: { startsAt: 'desc' } });
}

export async function getSeasonById(seasonId) {
  if (!seasonId) return getActiveSeason();
  return prisma.kalkSeason.findUnique({ where: { id: seasonId } });
}

export async function getSeasonBySlug(slug) {
  return prisma.kalkSeason.findUnique({ where: { slug } });
}

/**
 * seasonId z query lub aktywny sezon.
 * @param {string | undefined} querySeasonId
 */
export async function resolveSeasonId(querySeasonId) {
  if (querySeasonId) {
    const s = await getSeasonById(querySeasonId);
    if (s) return s.id;
  }
  const active = await getActiveSeason();
  return active?.id ?? seasonRowId(DEFAULT_SEASON_SLUG);
}

/**
 * Sezon widoku profilu: query > zapisana preferencja > aktywny.
 */
export async function resolvePlayerViewSeasonId(rosterPlayerId, querySeasonId) {
  if (querySeasonId) {
    const s = await getSeasonById(querySeasonId);
    if (s) return s.id;
  }
  const pref = await prisma.playerSeasonPreference.findUnique({
    where: { rosterPlayerId }
  });
  if (pref?.seasonId) return pref.seasonId;
  return resolveSeasonId();
}

export async function setPlayerSeasonPreference(rosterPlayerId, seasonId) {
  const season = await getSeasonById(seasonId);
  if (!season) throw new Error('Nieznany sezon');
  return prisma.playerSeasonPreference.upsert({
    where: { rosterPlayerId },
    create: { rosterPlayerId, seasonId: season.id },
    update: { seasonId: season.id }
  });
}

export async function findKalkPlayerForRoster(player, seasonId) {
  const season = await getSeasonById(seasonId);
  if (!season) return null;

  const candidates = [];
  if (player.kalkPlayerId) {
    candidates.push(player.kalkPlayerId);
    const ext = parseKalkExternalId(player.kalkPlayerId);
    candidates.push(buildKalkPlayerDbId(season.slug, ext));
  }

  for (const id of candidates) {
    const row = await prisma.kalkPlayer.findFirst({
      where: { id, seasonId: season.id }
    });
    if (row) return row;
  }

  return prisma.kalkPlayer.findFirst({
    where: {
      seasonId: season.id,
      name: { contains: player.lastName, mode: 'insensitive' }
    }
  });
}

export async function filterGamesBySeason(allGames, seasonId) {
  const season = await getSeasonById(seasonId);
  if (!season) return allGames;

  return allGames.filter((game) => {
    if (game.seasonId) return game.seasonId === season.id;
    return isDateInSeason(game.date, season);
  });
}

export async function createSeason({
  slug,
  label,
  divisionPath = 'dzial,dywizja-2,4.html',
  startsAt,
  endsAt,
  activateNow = false
}) {
  if (!slug || !label) {
    throw new Error('Slug i etykieta sezonu są wymagane');
  }

  const normalizedSlug = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const id = seasonRowId(normalizedSlug);

  const existing = await prisma.kalkSeason.findUnique({ where: { id } });
  if (existing) {
    throw new Error(`Sezon o identyfikatorze "${id}" już istnieje.`);
  }

  return prisma.$transaction(async (tx) => {
    if (activateNow) {
      await tx.kalkSeason.updateMany({
        data: { isActive: false }
      });
    }

    return tx.kalkSeason.create({
      data: {
        id,
        slug: normalizedSlug,
        label: label.trim(),
        divisionPath: divisionPath?.trim() || 'dzial,dywizja-2,4.html',
        isActive: Boolean(activateNow),
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null
      }
    });
  });
}

export async function updateSeason(seasonId, data) {
  const existing = await prisma.kalkSeason.findUnique({ where: { id: seasonId } });
  if (!existing) {
    throw new Error('Sezon nie istnieje');
  }

  const updateData = {};
  if (data.label !== undefined) updateData.label = data.label.trim();
  if (data.divisionPath !== undefined) updateData.divisionPath = data.divisionPath.trim();
  if (data.startsAt !== undefined) updateData.startsAt = data.startsAt ? new Date(data.startsAt) : null;
  if (data.endsAt !== undefined) updateData.endsAt = data.endsAt ? new Date(data.endsAt) : null;

  if (data.isActive === true) {
    return prisma.$transaction(async (tx) => {
      await tx.kalkSeason.updateMany({
        where: { id: { not: seasonId } },
        data: { isActive: false }
      });
      return tx.kalkSeason.update({
        where: { id: seasonId },
        data: { ...updateData, isActive: true }
      });
    });
  }

  if (data.isActive === false) {
    updateData.isActive = false;
  }

  return prisma.kalkSeason.update({
    where: { id: seasonId },
    data: updateData
  });
}

export async function activateSeason(seasonId) {
  const existing = await prisma.kalkSeason.findUnique({ where: { id: seasonId } });
  if (!existing) {
    throw new Error('Sezon nie istnieje');
  }

  return prisma.$transaction(async (tx) => {
    await tx.kalkSeason.updateMany({
      where: { id: { not: seasonId } },
      data: { isActive: false }
    });
    return tx.kalkSeason.update({
      where: { id: seasonId },
      data: { isActive: true }
    });
  });
}

export async function archiveSeason(seasonId) {
  const existing = await prisma.kalkSeason.findUnique({ where: { id: seasonId } });
  if (!existing) {
    throw new Error('Sezon nie istnieje');
  }

  return prisma.kalkSeason.update({
    where: { id: seasonId },
    data: {
      isActive: false,
      endsAt: existing.endsAt || new Date()
    }
  });
}

const BEKAPAKA_SUMMARY_MATCH_OR = [
  { homeTeamName: { contains: 'BeKaPaKa', mode: 'insensitive' } },
  { guestTeamName: { contains: 'BeKaPaKa', mode: 'insensitive' } },
  { homeTeamName: { contains: 'BOBOLICE', mode: 'insensitive' } },
  { guestTeamName: { contains: 'BOBOLICE', mode: 'insensitive' } }
];

export async function getSeasonSummary(seasonId) {
  const season = await getSeasonById(seasonId);
  if (!season) return null;

  const [
    bekapakaMatchesCount,
    leagueMatchesCount,
    finishedMatchesCount,
    kalkPlayersCount,
    kalkTeamsCount
  ] = await Promise.all([
    prisma.kalkMatch.count({
      where: {
        seasonId: season.id,
        OR: BEKAPAKA_SUMMARY_MATCH_OR
      }
    }),
    prisma.leagueMatch.count({ where: { seasonId: season.id } }),
    prisma.kalkMatch.count({ where: { seasonId: season.id, isFinished: true } }),
    prisma.kalkPlayer.count({ where: { seasonId: season.id } }),
    prisma.kalkTeam.count({ where: { seasonId: season.id } })
  ]);

  return {
    season,
    stats: {
      bekapakaMatchesCount,
      gamesCount: bekapakaMatchesCount,
      leagueMatchesCount,
      finishedMatchesCount,
      kalkPlayersCount,
      kalkTeamsCount
    }
  };
}

export async function rolloverRoster({ targetSeasonId, activePlayerIds = [], resetGoals = false }) {
  const targetSeason = await getSeasonById(targetSeasonId);
  if (!targetSeason) {
    throw new Error('Docelowy sezon nie istnieje');
  }

  const allPlayers = await prisma.rosterPlayer.findMany();

  return prisma.$transaction(async (tx) => {
    const results = [];

    for (const player of allPlayers) {
      const isSelected = activePlayerIds.includes(player.id);

      const updatePayload = {};
      if (resetGoals) {
        updatePayload.goals = null;
      }

      // Aktualizujemy preferencję sezonu gracza na nowy sezon
      await tx.playerSeasonPreference.upsert({
        where: { rosterPlayerId: player.id },
        create: { rosterPlayerId: player.id, seasonId: targetSeason.id },
        update: { seasonId: targetSeason.id }
      });

      if (Object.keys(updatePayload).length > 0) {
        await tx.rosterPlayer.update({
          where: { id: player.id },
          data: updatePayload
        });
      }

      results.push({ id: player.id, name: `${player.firstName} ${player.lastName}`, active: isSelected });
    }

    return {
      targetSeason,
      playersCount: results.length,
      activeInNewSeason: results.filter((p) => p.active).length
    };
  });
}

export {
  buildKalkPlayerDbId,
  parseKalkExternalId,
  seasonRowId,
  DEFAULT_SEASON_SLUG
};

