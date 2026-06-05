/**
 * Audyt wszystkich analiz AI w bazie — wykrywa ucięte / niekompletne raporty.
 *
 * Uruchomienie (VPS):
 *   docker compose -f docker-compose.prod.yml exec -T bkpk-backend node scripts/audit-ai-analyses.js
 */
import { prisma } from '../lib/prisma.js';
import { auditMatchAnalysisMarkdown } from '../ai/matchAnalysisMarkdown.js';
import { auditBriefingMarkdown, hasCompleteBriefingMarkdown } from '../ai/briefingMarkdown.js';
import { hasDetailedPlayerPlanMarkdown } from '../ai/playerDevelopmentMarkdown.js';
import { getActiveSeason } from '../seasonService.js';

function printSection(title, rows) {
  console.log(`\n=== ${title} (${rows.length}) ===`);
  for (const row of rows) {
    console.log(JSON.stringify(row));
  }
}

async function main() {
  const season = await getActiveSeason();
  const kalkMatches = season
    ? await prisma.kalkMatch.findMany({
        where: { seasonId: season.id, aiSummary: { not: null } },
        select: { id: true, homeTeamName: true, guestTeamName: true, aiSummary: true, aiSummaryAt: true }
      })
    : [];

  const legacyGames = await prisma.game.findMany({
    where: { aiSummary: { not: null } },
    select: { id: true, opponent: true, aiSummary: true, aiSummaryAt: true }
  });

  const players = await prisma.rosterPlayer.findMany({
    where: { aiDevelopmentSummary: { not: null } },
    select: { id: true, firstName: true, lastName: true, aiDevelopmentSummary: true, aiDevelopmentAt: true }
  });

  const scouting = await prisma.scoutingAiReport.findMany({
    select: { opponentKey: true, opponentName: true, summaryMd: true, generatedAt: true }
  });

  const briefing = await prisma.teamBriefing.findUnique({ where: { id: 'default' } });

  const matchRows = [
    ...kalkMatches.map((m) => ({
      source: 'kalk',
      id: m.id,
      label: `${m.homeTeamName} vs ${m.guestTeamName}`,
      generatedAt: m.aiSummaryAt?.toISOString() ?? null,
      tail: m.aiSummary?.slice(-80) ?? '',
      ...auditMatchAnalysisMarkdown(m.aiSummary)
    })),
    ...legacyGames.map((g) => ({
      source: 'legacy',
      id: g.id,
      label: g.opponent,
      generatedAt: g.aiSummaryAt?.toISOString() ?? null,
      tail: g.aiSummary?.slice(-80) ?? '',
      ...auditMatchAnalysisMarkdown(g.aiSummary)
    }))
  ];

  const playerRows = players.map((p) => {
    const text = p.aiDevelopmentSummary ?? '';
    return {
      id: p.id,
      name: `${p.firstName} ${p.lastName}`.trim(),
      generatedAt: p.aiDevelopmentAt?.toISOString() ?? null,
      length: text.length,
      complete: hasDetailedPlayerPlanMarkdown(text),
      tail: text.slice(-60)
    };
  });

  const scoutingRows = scouting.map((s) => {
    const text = s.summaryMd ?? '';
    const endsCleanly = text.trim() ? /[.!?)\]]\s*$/.test(text.trim()) : false;
    return {
      opponentKey: s.opponentKey,
      name: s.opponentName,
      generatedAt: s.generatedAt?.toISOString() ?? null,
      length: text.length,
      complete: text.length >= 400 && endsCleanly,
      tail: text.slice(-60)
    };
  });

  printSection('MECZE', matchRows);
  printSection('ZAWODNICY', playerRows);
  printSection('SCOUTING', scoutingRows);

  if (briefing?.contentMd) {
    printSection('BRIEFING', [
      {
        generatedAt: briefing.generatedAt?.toISOString() ?? null,
        tail: briefing.contentMd.slice(-80),
        ...auditBriefingMarkdown(briefing.contentMd)
      }
    ]);
  }

  const broken =
    matchRows.filter((r) => !r.complete).length +
    playerRows.filter((r) => !r.complete).length +
    scoutingRows.filter((r) => !r.complete).length +
    (briefing?.contentMd && !hasCompleteBriefingMarkdown(briefing.contentMd) ? 1 : 0);

  console.log(`\nPodsumowanie: ${broken} niekompletnych analiz`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
