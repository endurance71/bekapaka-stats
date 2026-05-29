import { PrismaClient } from '@prisma/client';
import { buildBriefingContext } from './buildBriefingContext.js';
import { buildMatchContext } from './buildMatchContext.js';
import { buildPlayerContext } from './buildPlayerContext.js';
import { buildScoutingContext } from './buildScoutingContext.js';
import { generateText, getGeminiModelName } from './geminiClient.js';
import { withAiLock } from './locks.js';
import { MATCH_ANALYSIS_SYSTEM, buildMatchAnalysisUser } from './prompts/matchAnalysis.pl.js';
import { PLAYER_DEVELOPMENT_SYSTEM, buildPlayerDevelopmentUser } from './prompts/playerDevelopment.pl.js';
import { SCOUTING_SYSTEM, buildScoutingUser } from './prompts/scoutingOpponent.pl.js';
import { BRIEFING_SYSTEM, buildBriefingUser } from './prompts/teamBriefing.pl.js';

const prisma = new PrismaClient();

function parseScoutingJson(text) {
  try {
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.summary && parsed.offense && parsed.defense && parsed.verdict) {
      return parsed;
    }
  } catch {
    // fall through
  }
  return {
    summary: text.slice(0, 500),
    offense: '',
    defense: '',
    verdict: 'Zobacz pełny raport w Markdown.',
    lockerRoom: []
  };
}

/**
 * @param {string} gameId
 * @param {{ force?: boolean }} options
 */
export async function generateGameAnalysis(gameId, options = {}) {
  return withAiLock(`game:${gameId}`, async () => {
    const ctx = await buildMatchContext(gameId);
    const existing = await prisma.game.findUnique({
      where: { id: gameId },
      select: { aiSummary: true, aiSummaryHash: true, aiSummaryAt: true, aiSummaryModel: true }
    });

    if (
      !options.force &&
      existing?.aiSummary &&
      existing.aiSummaryHash === ctx.hash
    ) {
      return {
        cached: true,
        aiSummary: existing.aiSummary,
        aiSummaryAt: existing.aiSummaryAt,
        model: existing.aiSummaryModel
      };
    }

    const text = await generateText({
      system: MATCH_ANALYSIS_SYSTEM,
      user: buildMatchAnalysisUser(ctx.payload, ctx.ruleInsights)
    });

    const model = getGeminiModelName();
    const now = new Date();
    await prisma.game.update({
      where: { id: gameId },
      data: {
        aiSummary: text,
        aiSummaryAt: now,
        aiSummaryModel: model,
        aiSummaryHash: ctx.hash
      }
    });

    return { cached: false, aiSummary: text, aiSummaryAt: now, model };
  });
}

/**
 * @param {string} playerId
 * @param {{ force?: boolean }} options
 */
export async function generatePlayerDevelopment(playerId, options = {}) {
  return withAiLock(`player:${playerId}`, async () => {
    const ctx = await buildPlayerContext(playerId);
    const existing = await prisma.rosterPlayer.findUnique({
      where: { id: playerId },
      select: {
        aiDevelopmentSummary: true,
        aiDevelopmentHash: true,
        aiDevelopmentAt: true,
        aiDevelopmentModel: true
      }
    });

    if (
      !options.force &&
      existing?.aiDevelopmentSummary &&
      existing.aiDevelopmentHash === ctx.hash
    ) {
      return {
        cached: true,
        aiDevelopmentSummary: existing.aiDevelopmentSummary,
        aiDevelopmentAt: existing.aiDevelopmentAt,
        model: existing.aiDevelopmentModel
      };
    }

    const text = await generateText({
      system: PLAYER_DEVELOPMENT_SYSTEM,
      user: buildPlayerDevelopmentUser(ctx.payload)
    });

    const model = getGeminiModelName();
    const now = new Date();
    await prisma.rosterPlayer.update({
      where: { id: playerId },
      data: {
        aiDevelopmentSummary: text,
        aiDevelopmentAt: now,
        aiDevelopmentModel: model,
        aiDevelopmentHash: ctx.hash
      }
    });

    return {
      cached: false,
      aiDevelopmentSummary: text,
      aiDevelopmentAt: now,
      model
    };
  });
}

/**
 * @param {string | undefined} opponentQuery
 * @param {{ force?: boolean }} options
 */
export async function generateScoutingReport(opponentQuery, options = {}) {
  const ctx = await buildScoutingContext(opponentQuery);
  return withAiLock(`scouting:${ctx.opponentKey}`, async () => {
    const existing = await prisma.scoutingAiReport.findUnique({
      where: { opponentKey: ctx.opponentKey }
    });

    if (!options.force && existing?.sourceHash === ctx.hash && existing.summaryMd) {
      return {
        cached: true,
        opponentKey: ctx.opponentKey,
        opponentName: ctx.opponentName,
        aiAnalysis: existing.analysisJson,
        summaryMd: existing.summaryMd,
        generatedAt: existing.generatedAt,
        model: existing.model
      };
    }

    const raw = await generateText({
      system: SCOUTING_SYSTEM,
      user: buildScoutingUser(ctx.payload),
      jsonMode: true
    });

    const analysisJson = parseScoutingJson(raw);
    const summaryMd = [
      `## Podsumowanie\n${analysisJson.summary}`,
      `## Ofensywa\n${analysisJson.offense}`,
      `## Defensywa\n${analysisJson.defense}`,
      `## Klucz\n${analysisJson.verdict}`,
      analysisJson.lockerRoom?.length
        ? `## Szatnia\n${analysisJson.lockerRoom.map((l) => `- ${l}`).join('\n')}`
        : ''
    ].filter(Boolean).join('\n\n');

    const model = getGeminiModelName();
    const now = new Date();
    await prisma.scoutingAiReport.upsert({
      where: { opponentKey: ctx.opponentKey },
      create: {
        opponentKey: ctx.opponentKey,
        opponentName: ctx.opponentName,
        summaryMd,
        analysisJson,
        model,
        sourceHash: ctx.hash,
        generatedAt: now
      },
      update: {
        opponentName: ctx.opponentName,
        summaryMd,
        analysisJson,
        model,
        sourceHash: ctx.hash,
        generatedAt: now
      }
    });

    return {
      cached: false,
      opponentKey: ctx.opponentKey,
      opponentName: ctx.opponentName,
      aiAnalysis: analysisJson,
      summaryMd,
      generatedAt: now,
      model
    };
  });
}

/**
 * @param {{ force?: boolean }} options
 */
export async function generateTeamBriefing(options = {}) {
  return withAiLock('briefing:default', async () => {
    const ctx = await buildBriefingContext();
    const existing = await prisma.teamBriefing.findUnique({ where: { id: 'default' } });

    if (!options.force && existing?.sourceHash === ctx.hash && existing.contentMd) {
      return {
        cached: true,
        contentMd: existing.contentMd,
        generatedAt: existing.generatedAt,
        model: existing.model
      };
    }

    const text = await generateText({
      system: BRIEFING_SYSTEM,
      user: buildBriefingUser(ctx.payload)
    });

    const model = getGeminiModelName();
    const now = new Date();
    await prisma.teamBriefing.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        contentMd: text,
        model,
        sourceHash: ctx.hash,
        generatedAt: now
      },
      update: {
        contentMd: text,
        model,
        sourceHash: ctx.hash,
        generatedAt: now
      }
    });

    return { cached: false, contentMd: text, generatedAt: now, model };
  });
}

export async function getTeamBriefingCached() {
  return prisma.teamBriefing.findUnique({ where: { id: 'default' } });
}
