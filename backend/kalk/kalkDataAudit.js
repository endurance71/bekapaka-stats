import { prisma } from '../lib/prisma.js';
import { buildKalkPlayerDbId, parseKalkExternalId } from '../lib/kalkSeason.js';
import { ensureDefaultSeason, getActiveSeason } from '../seasonService.js';
import { isBekapakaTeamName } from './parseMatchBoxScore.js';
import { matchPairDayKey, normalizeTeamNameForMatch } from '../lib/kalkTeamNames.js';


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

/**
 * @param {object} boxScore
 */
function boxScoreHasTeamTotals(boxScore) {
  const teams = boxScore?.teams;
  if (!Array.isArray(teams) || teams.length < 2) return false;
  return teams.some((t) => {
    const ff = t.fourFactors || t;
    return (ff.fga ?? t.fga ?? 0) > 0 || (t.players?.length ?? 0) > 5;
  });
}

/**
 * @param {import('@prisma/client').LeagueMatch} lm
 */
function opponentLabel(lm) {
  return isBekapakaTeamName(lm.homeTeam) ? lm.guestTeam : lm.homeTeam;
}

/**
 * Kompleksowy audyt spójności danych KALK dla aktywnego sezonu.
 * @param {{ seasonId?: string }} [opts]
 */
export async function runKalkDataAudit(opts = {}) {
  await ensureDefaultSeason();
  const activeSeason = opts.seasonId
    ? await prisma.kalkSeason.findUnique({ where: { id: opts.seasonId } })
    : await getActiveSeason();

  if (!activeSeason) {
    return { error: 'Brak aktywnego sezonu KALK' };
  }

  const seasonId = activeSeason.id;
  const seasonSlug = activeSeason.slug;

  const [
    leagueFinished,
    kalkBekapaka,
    allKalkMatches,
    players,
    gameLogs,
    gameCount,
    lastSync
  ] = await Promise.all([
    prisma.leagueMatch.findMany({
      where: { seasonId, OR: BEKAPAKA_LEAGUE_MATCH_OR, isFinished: true },
      orderBy: { date: 'desc' }
    }),
    prisma.kalkMatch.findMany({
      where: { seasonId, OR: BEKAPAKA_KALK_MATCH_OR },
      orderBy: { date: 'desc' }
    }),
    prisma.kalkMatch.count({ where: { seasonId } }),
    prisma.kalkPlayer.findMany({ where: { seasonId } }),
    prisma.kalkPlayerGameLog.findMany({
      where: { seasonId },
      select: { kalkPlayerId: true, kalkMatchId: true }
    }),
    prisma.game.count(),
    prisma.kalkSyncRun.findFirst({
      where: { seasonId },
      orderBy: { startedAt: 'desc' }
    })
  ]);

  const kalkById = new Map(kalkBekapaka.map((km) => [km.id, km]));
  const kalkByDayKey = new Map();
  for (const km of kalkBekapaka) {
    kalkByDayKey.set(
      matchPairDayKey(km.homeTeamName, km.guestTeamName, km.date),
      km
    );
  }

  const missingBoxScore = [];
  const scoreMismatches = [];
  const linkNameMismatches = [];

  for (const lm of leagueFinished) {
    const km =
      (lm.kalkMatchId && kalkById.get(lm.kalkMatchId)) ||
      kalkByDayKey.get(matchPairDayKey(lm.homeTeam, lm.guestTeam, lm.date));

    const hasKalkRow = Boolean(km);
    const hasValidBox = hasKalkRow && boxScoreHasTeamTotals(km.boxScore);

    if (!hasValidBox) {
      missingBoxScore.push({
        leagueMatchId: lm.id,
        kalkMatchId: lm.kalkMatchId || km?.id || null,
        date: lm.date.toISOString().split('T')[0],
        opponent: opponentLabel(lm),
        score: `${lm.scoreHome ?? '–'}:${lm.scoreAway ?? '–'}`,
        homeTeam: lm.homeTeam,
        guestTeam: lm.guestTeam,
        scrapeUrl: lm.kalkMatchId
          ? `https://www.kalk-koszalin.com/mecz,x,${lm.kalkMatchId},0.html`
          : null
      });
    }

    if (km && lm.kalkMatchId && lm.kalkMatchId !== km.id) {
      linkNameMismatches.push({
        leagueMatchId: lm.id,
        leagueKalkMatchId: lm.kalkMatchId,
        actualKalkId: km.id
      });
    }

    if (km && lm.scoreHome != null && lm.scoreAway != null) {
      const homeBk = isBekapakaTeamName(km.homeTeamName);
      const kalkUs = homeBk ? km.scoreHome : km.scoreAway;
      const kalkThem = homeBk ? km.scoreAway : km.scoreHome;
      const lmUs = isBekapakaTeamName(lm.homeTeam) ? lm.scoreHome : lm.scoreAway;
      const lmThem = isBekapakaTeamName(lm.homeTeam) ? lm.scoreAway : lm.scoreHome;
      if (kalkUs !== lmUs || kalkThem !== lmThem) {
        scoreMismatches.push({
          kalkMatchId: km.id,
          kalk: `${kalkUs}:${kalkThem}`,
          league: `${lmUs}:${lmThem}`,
          date: lm.date.toISOString().split('T')[0]
        });
      }
    }
  }

  const playerKeyGroups = new Map();
  for (const p of players) {
    const key = `${normalizeTeamNameForMatch(p.team)}|${(p.name || '').toLowerCase().trim()}`;
    if (!playerKeyGroups.has(key)) playerKeyGroups.set(key, []);
    playerKeyGroups.get(key).push(p);
  }

  const duplicatePlayers = [];
  for (const [key, group] of playerKeyGroups) {
    if (group.length < 2) continue;
    duplicatePlayers.push({
      key,
      ids: group.map((p) => p.id),
      legacyWithoutPrefix: group.filter((p) => !p.id.includes('__')).map((p) => p.id)
    });
  }

  const logsByPlayer = new Map();
  for (const log of gameLogs) {
    logsByPlayer.set(log.kalkPlayerId, (logsByPlayer.get(log.kalkPlayerId) || 0) + 1);
  }

  const orphanLegacyPlayers = players.filter((p) => {
    if (p.id.includes('__')) return false;
    const canonical = buildKalkPlayerDbId(seasonSlug, p.id);
    return players.some((other) => other.id === canonical && other.id !== p.id);
  });

  const playersWithLogsNoCanonical = players.filter((p) => {
    if (!p.id.includes('__')) return false;
    const ext = parseKalkExternalId(p.id);
    const legacyId = ext;
    const hasLegacy = players.some((o) => o.id === legacyId);
    return hasLegacy && (logsByPlayer.get(p.id) || 0) === 0 && (logsByPlayer.get(legacyId) || 0) > 0;
  });

  return {
    generatedAt: new Date().toISOString(),
    seasonId,
    seasonSlug,
    matches: {
      bekapakaScheduleFinished: leagueFinished.length,
      bekapakaWithKalkRow: kalkBekapaka.length,
      bekapakaWithValidBoxScore: kalkBekapaka.filter((km) => boxScoreHasTeamTotals(km.boxScore)).length,
      bekapakaMissingBoxScore: missingBoxScore,
      divisionKalkMatchesTotal: allKalkMatches,
      scoreMismatches,
      linkNameMismatches
    },
    players: {
      total: players.length,
      duplicateGroups: duplicatePlayers.length,
      duplicatePlayers: duplicatePlayers.slice(0, 30),
      orphanLegacyCount: orphanLegacyPlayers.length,
      orphanLegacyIds: orphanLegacyPlayers.slice(0, 20).map((p) => p.id),
      logsOnLegacyOnly: playersWithLogsNoCanonical.length
    },
    gameLogs: {
      total: gameLogs.length
    },
    apiReadiness: {
      legacyGameRows: gameCount,
      usesGameModel: gameCount > 0
    },
    lastSync: lastSync
      ? {
          mode: lastSync.mode,
          status: lastSync.status,
          startedAt: lastSync.startedAt,
          finishedAt: lastSync.finishedAt,
          probeHashes: lastSync.probeHashes
        }
      : null
  };
}

/**
 * Markdown podsumowanie audytu (stdout / Admin).
 * @param {Awaited<ReturnType<typeof runKalkDataAudit>>} report
 */
export function formatKalkAuditMarkdown(report) {
  if (report.error) return `## Audyt KALK\n\n${report.error}\n`;

  const m = report.matches;
  const lines = [
    `## Audyt KALK — ${report.seasonSlug}`,
    '',
    `Wygenerowano: ${report.generatedAt}`,
    '',
    '### Mecze BeKaPaKa',
    `- Rozegrane (terminarz): **${m.bekapakaScheduleFinished}**`,
    `- Wiersze KalkMatch: **${m.bekapakaWithKalkRow}**`,
    `- Z pełnym box score: **${m.bekapakaWithValidBoxScore}**`,
    `- Brak box score: **${m.bekapakaMissingBoxScore.length}**`,
    `- Mecze całej dywizji w KalkMatch: **${m.divisionKalkMatchesTotal}**`,
    ''
  ];

  if (m.bekapakaMissingBoxScore.length) {
    lines.push('#### Brakujące box score');
    for (const row of m.bekapakaMissingBoxScore) {
      lines.push(`- ${row.date} vs ${row.opponent} (${row.score}) id=${row.kalkMatchId || '—'}`);
    }
    lines.push('');
  }

  lines.push('### Zawodnicy');
  lines.push(`- Rekordów KalkPlayer: **${report.players.total}**`);
  lines.push(`- Grup duplikatów (name+team): **${report.players.duplicateGroups}**`);
  lines.push(`- Legacy ID do migracji: **${report.players.orphanLegacyCount}**`);
  lines.push(`- Logi meczowe: **${report.gameLogs.total}**`);
  lines.push('');
  lines.push('### API');
  lines.push(`- Pozostałe wiersze Game (legacy): **${report.apiReadiness.legacyGameRows}**`);

  return lines.join('\n');
}
