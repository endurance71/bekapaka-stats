import { prisma } from '../lib/prisma.js';
import { listGames } from '../dataStore.js';
import { kalkMatchToGameDetail } from '../kalk/kalkGameView.js';
import { isBekapakaTeamName } from '../kalk/parseMatchBoxScore.js';
import { resolveSeasonId } from '../seasonService.js';
import { buildBriefingContext } from './buildBriefingContext.js';
import { getMatchAiStaleness } from './buildMatchContext.js';
import { buildPlayerContext } from './buildPlayerContext.js';
import { buildScoutingContext } from './buildScoutingContext.js';
import { getTeamBriefingCached } from './generate.js';
import { buildPersonnelMdFromAnalysis } from './scoutingPersonnel.js';
import { hasDetailedPlayerPlanMarkdown } from './playerDevelopmentMarkdown.js';
import { hasCompleteBriefingMarkdown } from './briefingMarkdown.js';
import { TEMPLATE_MODEL_NAME, getGeminiModelName, isGeminiConfigured } from './geminiClient.js';
import { normalizeOpponentKey } from './normalizeOpponent.js';
import { legacyReportMatchesSeason, parseScoutingReportKey } from './scoutingData.js';

const BEKAPAKA_KALK_MATCH_OR = [
  { homeTeamName: { contains: 'BeKaPaKa', mode: 'insensitive' } },
  { guestTeamName: { contains: 'BeKaPaKa', mode: 'insensitive' } },
  { homeTeamName: { contains: 'BOBOLICE', mode: 'insensitive' } },
  { guestTeamName: { contains: 'BOBOLICE', mode: 'insensitive' } }
];

/**
 * Równoległość ograniczona (liczenie hashy wymaga kilku zapytań na pozycję).
 * @template T, R
 * @param {T[]} items
 * @param {number} limit
 * @param {(item: T) => Promise<R>} fn
 * @returns {Promise<R[]>}
 */
export async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const idx = next++;
      results[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return results;
}

/**
 * @param {import('@prisma/client').KalkMatch} km
 * @returns {boolean}
 */
function kalkMatchHasBoxScore(km) {
  try {
    const view = kalkMatchToGameDetail(km);
    const teams = view.teams || view.teamStats || [];
    const bekapaka = teams.find((t) => t.isBekapaka) || teams[0];
    return (bekapaka?.players?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * Aktualność planu zawodnika (hash bieżących danych + wersji promptu vs zapisany).
 * @param {{ id: string, aiDevelopmentSummary?: string | null, aiDevelopmentHash?: string | null }} p
 * @param {string | null | undefined} seasonId
 * @returns {Promise<{ stale: boolean, reason: string | null, currentHash: string | null }>}
 */
export async function getPlayerPlanStaleness(p, seasonId) {
  if (!p.aiDevelopmentSummary?.trim()) return { stale: false, reason: null, currentHash: null };
  if (!hasDetailedPlayerPlanMarkdown(p.aiDevelopmentSummary)) {
    return { stale: true, reason: 'incomplete', currentHash: null };
  }
  try {
    const ctx = await buildPlayerContext(p.id, { seasonId });
    if (!p.aiDevelopmentHash) return { stale: true, reason: 'no-hash', currentHash: ctx.hash };
    const changed = ctx.hash !== p.aiDevelopmentHash;
    return { stale: changed, reason: changed ? 'hash-changed' : null, currentHash: ctx.hash };
  } catch {
    return { stale: false, reason: 'unavailable', currentHash: null };
  }
}

/**
 * Aktualność raportu scoutingu dla sezonu.
 * @param {{ summaryMd?: string | null, sourceHash?: string | null }} report
 * @param {string} opponentName
 * @param {string | null | undefined} seasonId
 * @returns {Promise<{ stale: boolean, reason: string | null, currentHash: string | null }>}
 */
export async function getScoutingStaleness(report, opponentName, seasonId) {
  if (!report?.summaryMd?.trim()) return { stale: false, reason: null, currentHash: null };
  try {
    const ctx = await buildScoutingContext(opponentName, seasonId);
    if (!report.sourceHash) return { stale: true, reason: 'no-hash', currentHash: ctx.hash };
    const changed = ctx.hash !== report.sourceHash;
    return { stale: changed, reason: changed ? 'hash-changed' : null, currentHash: ctx.hash };
  } catch {
    return { stale: false, reason: 'unavailable', currentHash: null };
  }
}

/**
 * Raporty scoutingu należące do sezonu: klucze `{seasonId}::…` + stare klucze pasujące datą.
 * Gdy dla rywala jest wiersz sezonowy i stary — wygrywa sezonowy.
 * @param {Array<Record<string, any>>} reports
 * @param {{ id: string, startsAt?: Date | null, endsAt?: Date | null, isActive?: boolean } | null} season
 * @returns {Map<string, Record<string, any>>} klucz = normalizeOpponentKey(nazwa)
 */
export function scoutingReportsForSeason(reports, season) {
  /** @type {Map<string, Record<string, any>>} */
  const out = new Map();
  for (const r of reports) {
    const parsed = parseScoutingReportKey(r.opponentKey);
    if (parsed.seasonId && season && parsed.seasonId === season.id) {
      out.set(parsed.opponentKey, { ...r, legacy: false });
    }
  }
  for (const r of reports) {
    const parsed = parseScoutingReportKey(r.opponentKey);
    if (parsed.seasonId) continue;
    if (out.has(parsed.opponentKey)) continue;
    if (legacyReportMatchesSeason(r, season)) out.set(parsed.opponentKey, { ...r, legacy: true });
  }
  return out;
}

/**
 * Katalog wszystkich analiz AI w panelu (hub + admin).
 * Pozycje, których nie da się wygenerować (mecze z terminarza w przyszłości), nie trafiają do `items`
 * — są liczone w `summary.upcomingExcluded`.
 * @param {string} [querySeasonId]
 */
export async function getAiAnalysesCatalog(querySeasonId = undefined) {
  const configured = isGeminiConfigured();
  const defaultModel = getGeminiModelName();
  const targetSeasonId = await resolveSeasonId(querySeasonId);
  const season = targetSeasonId
    ? await Promise.resolve()
        .then(() => prisma.kalkSeason.findUnique({ where: { id: targetSeasonId } }))
        .catch(() => null)
    : null;
  /** @type {Array<Record<string, any>>} */
  const items = [];
  let upcomingExcluded = 0;

  const briefing = await getTeamBriefingCached(targetSeasonId);
  let briefingStale = false;
  let briefingReason = null;
  if (briefing?.contentMd?.trim()) {
    try {
      const ctx = await buildBriefingContext(targetSeasonId);
      const complete = hasCompleteBriefingMarkdown(briefing.contentMd, {
        requireUpcomingOpponent: Boolean(ctx.payload.hasUpcomingMatch)
      });
      briefingStale = !briefing.sourceHash || briefing.sourceHash !== ctx.hash || !complete;
      briefingReason = !complete ? 'incomplete' : briefingStale ? 'hash-changed' : null;
    } catch {
      briefingStale = !hasCompleteBriefingMarkdown(briefing.contentMd);
      briefingReason = briefingStale ? 'incomplete' : null;
    }
  }

  items.push({
    id: `briefing:${targetSeasonId || 'default'}`,
    type: 'briefing',
    category: 'Zespół',
    title: 'Briefing tygodniowy (AI)',
    subtitle: 'Pulpit — podsumowanie tygodnia',
    generatedAt: briefing?.generatedAt?.toISOString() ?? null,
    model: briefing?.model ?? null,
    hasContent: Boolean(briefing?.contentMd?.trim()),
    stale: briefingStale,
    staleReason: briefingReason,
    isTemplate: false,
    canGenerate: configured,
    viewPath: '/dashboard',
    generateKind: 'briefing',
    generateTarget: null,
    seasonId: targetSeasonId ?? null
  });

  const games = await listGames({}, targetSeasonId);
  /** @type {Map<string, import('@prisma/client').KalkMatch>} */
  const kalkById = new Map();

  if (targetSeasonId) {
    const kalkRows = await prisma.kalkMatch.findMany({
      where: { seasonId: targetSeasonId, OR: BEKAPAKA_KALK_MATCH_OR },
      orderBy: { date: 'desc' }
    });
    for (const row of kalkRows) {
      kalkById.set(row.id, row);
    }
  }

  const legacyIds = games
    .filter((g) => g.dataSource === 'legacy')
    .map((g) => String(g.id));

  const legacyGames =
    legacyIds.length > 0
      ? await prisma.game.findMany({
          where: { id: { in: legacyIds } },
          select: {
            id: true,
            opponent: true,
            date: true,
            aiSummary: true,
            aiSummaryAt: true,
            aiSummaryModel: true,
            aiSummaryHash: true,
            data: true
          }
        })
      : [];
  const legacyById = new Map(legacyGames.map((g) => [g.id, g]));
  const now = Date.now();

  const matchItems = await mapLimit(games, 4, async (g) => {
    const gameId = String(g.id);
    const km = kalkById.get(gameId);
    const legacy = legacyById.get(gameId);
    const isFuture = !g.result && g.date && new Date(g.date).getTime() > now;
    if (!km && !legacy && isFuture) return null;
    if (km && !km.isFinished && !km.aiSummary && isFuture) return null;

    const dateLabel = g.date ? new Date(g.date).toLocaleDateString('pl-PL') : '';
    const scoreLabel =
      g.scoreUs != null && g.scoreThem != null ? `${g.scoreUs}:${g.scoreThem}` : null;
    const subtitle = [dateLabel, g.opponent, scoreLabel, g.result].filter(Boolean).join(' · ');

    let generatedAt = null;
    let model = null;
    let hasContent = false;
    let stale = false;
    let staleReason = null;
    let canGenerate = false;

    if (km) {
      hasContent = Boolean(km.aiSummary?.trim());
      generatedAt = km.aiSummaryAt?.toISOString() ?? null;
      model = km.aiSummaryModel ?? null;
      canGenerate = kalkMatchHasBoxScore(km);
      if (hasContent) {
        const st = await getMatchAiStaleness({
          gameId,
          seasonId: km.seasonId,
          aiSummary: km.aiSummary,
          aiSummaryHash: km.aiSummaryHash
        });
        stale = st.stale;
        staleReason = st.reason;
      }
    } else if (legacy) {
      hasContent = Boolean(legacy.aiSummary?.trim());
      generatedAt = legacy.aiSummaryAt?.toISOString() ?? null;
      model = legacy.aiSummaryModel ?? null;
      canGenerate = Boolean(legacy.data);
      if (hasContent) {
        const st = await getMatchAiStaleness({
          gameId,
          aiSummary: legacy.aiSummary,
          aiSummaryHash: legacy.aiSummaryHash
        });
        stale = st.stale;
        staleReason = st.reason;
      }
    }

    if (g.dataSource === 'league' && g.hasBoxScore === false) {
      canGenerate = false;
    }

    return {
      id: `match:${gameId}`,
      type: 'match',
      category: 'Mecze',
      title: `Analiza meczu — ${g.opponent || 'Mecz'}`,
      subtitle: subtitle || null,
      generatedAt,
      model,
      hasContent,
      stale,
      staleReason,
      isTemplate: false,
      canGenerate: canGenerate && configured,
      viewPath: `/games/${gameId}`,
      generateKind: 'match',
      generateTarget: gameId,
      seasonId: km?.seasonId ?? targetSeasonId ?? null
    };
  });
  for (const item of matchItems) {
    if (item) items.push(item);
    else upcomingExcluded += 1;
  }

  const players = await prisma.rosterPlayer.findMany({
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      number: true,
      position: true,
      aiDevelopmentSummary: true,
      aiDevelopmentAt: true,
      aiDevelopmentModel: true,
      aiDevelopmentHash: true
    }
  });

  const playerItems = await mapLimit(players, 4, async (p) => {
    const name = `${p.firstName} ${p.lastName}`.trim();
    const hasContent = hasDetailedPlayerPlanMarkdown(p.aiDevelopmentSummary);
    const st = await getPlayerPlanStaleness(p, targetSeasonId);
    const isTemplate = p.aiDevelopmentModel === TEMPLATE_MODEL_NAME;
    return {
      id: `player:${p.id}`,
      type: 'player',
      category: 'Zawodnicy',
      title: `Plan rozwoju — ${name}`,
      subtitle: [p.position, p.number != null ? `#${p.number}` : null].filter(Boolean).join(' · ') || null,
      generatedAt: p.aiDevelopmentAt?.toISOString() ?? null,
      model: p.aiDevelopmentModel ?? null,
      hasContent,
      stale: st.stale,
      staleReason: st.reason,
      isTemplate,
      canGenerate: configured,
      viewPath: `/players/${p.id}`,
      generateKind: 'player',
      generateTarget: p.id,
      seasonId: targetSeasonId ?? null
    };
  });
  items.push(...playerItems);

  /** @type {Map<string, string>} klucz → nazwa wyświetlana */
  const opponentNames = new Map();
  if (targetSeasonId) {
    const leagueTeams = await prisma.leagueTeam.findMany({
      where: { seasonId: targetSeasonId, phase: 'regular' },
      select: { name: true }
    });
    for (const t of leagueTeams) {
      if (!isBekapakaTeamName(t.name)) {
        opponentNames.set(normalizeOpponentKey(t.name), t.name);
      }
    }
  }

  const scoutingReports = await prisma.scoutingAiReport.findMany({
    orderBy: { opponentName: 'asc' }
  });
  const reportByKey = scoutingReportsForSeason(scoutingReports, season);
  for (const [key, r] of reportByKey) {
    if (!opponentNames.has(key)) opponentNames.set(key, r.opponentName);
  }

  const sortedOpponents = [...opponentNames.entries()].sort(([, a], [, b]) => a.localeCompare(b, 'pl'));

  const scoutingItems = await mapLimit(sortedOpponents, 3, async ([opponentKey, opponentName]) => {
    const report = reportByKey.get(opponentKey);
    const st = report ? await getScoutingStaleness(report, opponentName, targetSeasonId) : { stale: false, reason: null };
    const generatedAt = report?.generatedAt?.toISOString() ?? null;
    const model = report?.model ?? null;
    const planHasContent = Boolean(report?.summaryMd?.trim());
    const personnelMd = report?.analysisJson
      ? buildPersonnelMdFromAnalysis(report.analysisJson)
      : null;
    const personnelHasContent = Boolean(personnelMd?.trim());
    const viewPath = `/scouting?opponent=${encodeURIComponent(opponentName)}`;
    const common = {
      generatedAt,
      model,
      stale: st.stale,
      staleReason: st.reason,
      isTemplate: false,
      canGenerate: configured,
      viewPath,
      generateKind: 'scouting',
      generateTarget: opponentName,
      seasonId: targetSeasonId ?? null
    };
    return [
      {
        id: `scouting-plan:${opponentKey}`,
        type: 'scouting_plan',
        category: 'Scouting',
        title: `Plan meczowy (AI) — ${opponentName}`,
        subtitle: report?.legacy ? 'Raport przed meczem ligowym (stary klucz bez sezonu)' : 'Raport przed meczem ligowym',
        hasContent: planHasContent,
        ...common
      },
      {
        id: `scouting-personnel:${opponentKey}`,
        type: 'scouting_personnel',
        category: 'Scouting',
        title: `Analiza kadry (AI) — ${opponentName}`,
        subtitle: 'Sekcja kadry w raporcie scoutingu',
        hasContent: personnelHasContent,
        ...common
      }
    ];
  });
  for (const pair of scoutingItems) items.push(...pair);

  const actionable = items.filter((i) => i.hasContent || i.canGenerate);

  return {
    configured,
    model: defaultModel,
    seasonId: targetSeasonId ?? null,
    items,
    summary: {
      total: actionable.length,
      withContent: items.filter((i) => i.hasContent).length,
      stale: items.filter((i) => i.hasContent && i.stale).length,
      templates: items.filter((i) => i.isTemplate).length,
      unavailable: items.length - actionable.length,
      upcomingExcluded
    }
  };
}
