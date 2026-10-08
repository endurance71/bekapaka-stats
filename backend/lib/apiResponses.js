/**
 * Only fields intended for the public roster API. Legacy `data` and Prisma
 * records may contain account fields, so never spread them into a response.
 */
export function toPublicRosterPlayer(player) {
  return {
    id: player.id,
    firstName: player.firstName,
    lastName: player.lastName,
    number: player.number,
    position: player.position,
    starter: player.starter,
    birthDate: player.birthDate,
    // Tożsamość KALK (publiczna) — panel łączy nią box score z profilem zawodnika
    kalkSlug: player.kalkSlug ?? null,
    heightCm: player.heightCm,
    photo: player.photo || player.data?.photo || null,
    photo_url: player.photo_url || null,
    ppg: player.ppg,
    rpg: player.rpg,
    apg: player.apg,
    eval: player.eval,
    fgPercentage: player.fgPercentage,
    threePercentage: player.threePercentage,
    ftPercentage: player.ftPercentage,
    tsPercentage: player.tsPercentage,
    eFgPercentage: player.eFgPercentage,
    plusMinus: player.plusMinus,
    gamesPlayed: player.gamesPlayed,
    seasonId: player.seasonId,
    seasonLabel: player.seasonLabel,
    fgm: player.fgm,
    fga: player.fga,
    threePa: player.threePa,
    fta: player.fta,
    twoPm: player.twoPm,
    threePm: player.threePm,
    ftm: player.ftm,
    games: player.games,
    kalkPlayer: player.kalkPlayer
      ? {
          id: player.kalkPlayer.id,
          name: player.kalkPlayer.name,
          raw: { photo_url: player.kalkPlayer.raw?.photo_url || null }
        }
      : null
  };
}

/** An authenticated player profile; AI development notes belong to the player and admins. */
export function toPlayerProfileResponse(player, { includeDevelopment = false } = {}) {
  return {
    id: player.id,
    firstName: player.firstName,
    lastName: player.lastName,
    number: player.number,
    position: player.position,
    starter: player.starter,
    birthDate: player.birthDate,
    heightCm: player.heightCm,
    photo: player.data?.photo || null,
    kalkPlayer: player.kalkPlayer
      ? {
          id: player.kalkPlayer.id,
          name: player.kalkPlayer.name,
          raw: { photo_url: player.kalkPlayer.raw?.photo_url || null }
        }
      : null,
    ...(includeDevelopment
      ? {
          aiDevelopmentSummary: player.aiDevelopmentSummary,
          aiDevelopmentAt: player.aiDevelopmentAt,
          aiDevelopmentModel: player.aiDevelopmentModel
        }
      : {})
  };
}
