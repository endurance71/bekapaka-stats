import { PrismaClient } from '@prisma/client';
import { listGames } from '../dataStore.js';
import { kalkMatchToGameDetail } from '../kalk/kalkGameView.js';
import { isBekapakaTeamName } from '../kalk/parseMatchBoxScore.js';
import { getActiveSeason } from '../seasonService.js';
import { buildBriefingContext } from './buildBriefingContext.js';
import { buildPersonnelMdFromAnalysis } from './scoutingPersonnel.js';
import { hasDetailedPlayerPlanMarkdown } from './playerDevelopmentMarkdown.js';
import { getGeminiModelName, isGeminiConfigured } from './geminiClient.js';
import { normalizeOpponentKey } from './normalizeOpponent.js';

const prisma = new PrismaClient();

const BEKAPAKA_KALK_MATCH_OR = [
  { homeTeamName: { contains: 'BeKaPaKa', mode: 'insensitive' } },
  { guestTeamName: { contains: 'BeKaPaKa', mode: 'insensitive' } },
  { homeTeamName: { contains: 'BOBOLICE', mode: 'insensitive' } },
  { guestTeamName: { contains: 'BOBOLICE', mode: 'insensitive' } }
];

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
 * Katalog wszystkich analiz AI w panelu (hub + admin).
 * @returns {Promise<{
 *   configured: boolean;
 *   model: string;
 *   items: Array<{
 *     id: string;
 *     type: string;
 *     category: string;
 *     title: string;
 *     subtitle: string | null;
 *     generatedAt: string | null;
 *     model: string | null;
 *     hasContent: boolean;
 *     stale: boolean;
 *     canGenerate: boolean;
 *     viewPath: string;
 *     generateKind: string;
 *     generateTarget: string | null;
 *   }>;
 * }>}
 */
export async function getAiAnalysesCatalog() {
  const configured = isGeminiConfigured();
  const defaultModel = getGeminiModelName();
  /** @type {Awaited<ReturnType<typeof getAiAnalysesCatalog>>['items']} */
  const items = [];

  const briefing = await prisma.teamBriefing.findUnique({ where: { id: 'default' } });
  let briefingStale = false;
  if (briefing?.contentMd?.trim() && briefing.sourceHash) {
    try {
      const ctx = await buildBriefingContext();
      briefingStale = briefing.sourceHash !== ctx.hash;
    } catch {
      briefingStale = false;
    }
  }

  items.push({
    id: 'briefing:default',
    type: 'briefing',
    category: 'Zespół',
    title: 'Briefing tygodniowy (AI)',
    subtitle: 'Pulpit — podsumowanie tygodnia',
    generatedAt: briefing?.generatedAt?.toISOString() ?? null,
    model: briefing?.model ?? null,
    hasContent: Boolean(briefing?.contentMd?.trim()),
    stale: briefingStale,
    canGenerate: configured,
    viewPath: '/dashboard',
    generateKind: 'briefing',
    generateTarget: null
  });

  const season = await getActiveSeason();
  const games = await listGames();
  /** @type {Map<string, import('@prisma/client').KalkMatch>} */
  const kalkById = new Map();

  if (season) {
    const kalkRows = await prisma.kalkMatch.findMany({
      where: { seasonId: season.id, OR: BEKAPAKA_KALK_MATCH_OR },
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

  for (const g of games) {
    const gameId = String(g.id);
    const km = kalkById.get(gameId);
    const legacy = legacyById.get(gameId);
    const dateLabel = g.date ? new Date(g.date).toLocaleDateString('pl-PL') : '';
    const scoreLabel =
      g.scoreUs != null && g.scoreThem != null ? `${g.scoreUs}:${g.scoreThem}` : null;
    const subtitle = [dateLabel, g.opponent, scoreLabel, g.result].filter(Boolean).join(' · ');

    let generatedAt = null;
    let model = null;
    let hasContent = false;
    let stale = false;
    let canGenerate = false;

    if (km) {
      hasContent = Boolean(km.aiSummary?.trim());
      generatedAt = km.aiSummaryAt?.toISOString() ?? null;
      model = km.aiSummaryModel ?? null;
      canGenerate = kalkMatchHasBoxScore(km);
      if (hasContent && km.aiSummaryHash) {
        try {
          const view = kalkMatchToGameDetail(km);
          stale = Boolean(view.aiSummaryStale);
        } catch {
          stale = false;
        }
      }
    } else if (legacy) {
      hasContent = Boolean(legacy.aiSummary?.trim());
      generatedAt = legacy.aiSummaryAt?.toISOString() ?? null;
      model = legacy.aiSummaryModel ?? null;
      canGenerate = Boolean(legacy.data);
      if (hasContent && legacy.aiSummaryHash) {
        stale = false;
      }
    } else {
      canGenerate = false;
    }

    if (g.dataSource === 'league' && g.hasBoxScore === false) {
      canGenerate = false;
    }

    items.push({
      id: `match:${gameId}`,
      type: 'match',
      category: 'Mecze',
      title: `Analiza meczu — ${g.opponent || 'Mecz'}`,
      subtitle: subtitle || null,
      generatedAt,
      model,
      hasContent,
      stale,
      canGenerate: canGenerate && configured,
      viewPath: `/games/${gameId}`,
      generateKind: 'match',
      generateTarget: gameId
    });
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
      aiDevelopmentModel: true
    }
  });

  for (const p of players) {
    const name = `${p.firstName} ${p.lastName}`.trim();
    const hasContent = hasDetailedPlayerPlanMarkdown(p.aiDevelopmentSummary);
    items.push({
      id: `player:${p.id}`,
      type: 'player',
      category: 'Zawodnicy',
      title: `Plan rozwoju — ${name}`,
      subtitle: [p.position, p.number != null ? `#${p.number}` : null].filter(Boolean).join(' · ') || null,
      generatedAt: p.aiDevelopmentAt?.toISOString() ?? null,
      model: p.aiDevelopmentModel ?? null,
      hasContent,
      stale: false,
      canGenerate: configured,
      viewPath: `/players/${p.id}`,
      generateKind: 'player',
      generateTarget: p.id
    });
  }

  const opponentNames = new Set();
  if (season) {
    const leagueTeams = await prisma.leagueTeam.findMany({
      where: { seasonId: season.id, phase: 'regular' },
      select: { name: true }
    });
    for (const t of leagueTeams) {
      if (!isBekapakaTeamName(t.name)) {
        opponentNames.add(t.name);
      }
    }
  }

  const scoutingReports = await prisma.scoutingAiReport.findMany({
    orderBy: { opponentName: 'asc' }
  });
  for (const r of scoutingReports) {
    opponentNames.add(r.opponentName);
  }

  const reportByKey = new Map(scoutingReports.map((r) => [r.opponentKey, r]));

  const sortedOpponents = [...opponentNames].sort((a, b) => a.localeCompare(b, 'pl'));

  for (const opponentName of sortedOpponents) {
    const opponentKey = normalizeOpponentKey(opponentName);
    const report = reportByKey.get(opponentKey);
    const generatedAt = report?.generatedAt?.toISOString() ?? null;
    const model = report?.model ?? null;
    const planHasContent = Boolean(report?.summaryMd?.trim());
    const personnelMd = report?.analysisJson
      ? buildPersonnelMdFromAnalysis(report.analysisJson)
      : null;
    const personnelHasContent = Boolean(personnelMd?.trim());
    const viewPath = `/scouting?opponent=${encodeURIComponent(opponentName)}`;

    items.push({
      id: `scouting-plan:${opponentKey}`,
      type: 'scouting_plan',
      category: 'Scouting',
      title: `Plan meczowy (AI) — ${opponentName}`,
      subtitle: 'Raport przed meczem ligowym',
      generatedAt,
      model,
      hasContent: planHasContent,
      stale: false,
      canGenerate: configured,
      viewPath,
      generateKind: 'scouting',
      generateTarget: opponentName
    });

    items.push({
      id: `scouting-personnel:${opponentKey}`,
      type: 'scouting_personnel',
      category: 'Scouting',
      title: `Analiza kadry (AI) — ${opponentName}`,
      subtitle: 'Sekcja kadry w raporcie scoutingu',
      generatedAt,
      model,
      hasContent: personnelHasContent,
      stale: false,
      canGenerate: configured,
      viewPath,
      generateKind: 'scouting',
      generateTarget: opponentName
    });
  }

  return {
    configured,
    model: defaultModel,
    items
  };
}
