/**
 * Rozwiązywanie meczu KALK po ID z uwzględnieniem sezonu i aliasów (stare ID 2025/26 → v2).
 * Używane przez getGameById; ten sam helper powinien wywoływać AI (findMatchAiTarget),
 * żeby analiza trafiała do tego samego wiersza KalkMatch.
 */

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {string|number} id
 * @param {{ seasonId?: string|null, activeSeasonId?: string|null, select?: object, logger?: Pick<Console,'warn'> }} [opts]
 * @returns {Promise<object|null>} wiersz KalkMatch (lub wybrane pola) — z `seasonId`
 */
export async function resolveKalkMatchById(prisma, id, opts = {}) {
  const matchId = String(id);
  const { seasonId = null, select, logger = console } = opts;
  const query = (where) => ({ where, ...(select ? { select: { ...select, id: true, seasonId: true } } : {}) });

  if (seasonId) {
    const row = await prisma.kalkMatch.findFirst(query({ id: matchId, seasonId }));
    if (row) return row;
  } else {
    const rows = (await prisma.kalkMatch.findMany(query({ id: matchId }))) || [];
    if (rows.length === 1) return rows[0];
    if (rows.length > 1) {
      let activeSeasonId = opts.activeSeasonId ?? null;
      if (!activeSeasonId) {
        const active = await prisma.kalkSeason.findFirst({ where: { isActive: true } });
        activeSeasonId = active?.id ?? null;
      }
      const preferred = rows.find((r) => r.seasonId === activeSeasonId) || rows[0];
      logger?.warn?.(
        `[kalk] Mecz ${matchId} istnieje w ${rows.length} sezonach (${rows.map((r) => r.seasonId).join(', ')}); wybrano ${preferred.seasonId}`
      );
      return preferred;
    }
  }

  const alias = await prisma.kalkMatchIdAlias?.findUnique?.({ where: { legacyId: matchId } });
  if (alias && (!seasonId || alias.seasonId === seasonId)) {
    const row = await prisma.kalkMatch.findFirst(query({ id: alias.kalkMatchId, seasonId: alias.seasonId }));
    if (row) return row;
  }
  return null;
}
