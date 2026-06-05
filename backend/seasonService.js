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

export async function assignSeasonToGameData(gameData) {
  const seasons = await listSeasons();
  const date = gameData.date ? new Date(gameData.date) : new Date();
  const seasonId = resolveSeasonIdForDate(date, seasons);
  return { ...gameData, seasonId };
}

export {
  buildKalkPlayerDbId,
  parseKalkExternalId,
  seasonRowId,
  DEFAULT_SEASON_SLUG
};
