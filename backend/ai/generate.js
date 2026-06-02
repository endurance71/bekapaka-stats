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
import { buildPersonnelMdFromAnalysis } from './scoutingPersonnel.js';
import {
  buildScoutingSummaryMd,
  parseScoutingJson
} from './scoutingMarkdown.js';
import { BRIEFING_SYSTEM, buildBriefingUser } from './prompts/teamBriefing.pl.js';

const prisma = new PrismaClient();

function hasDetailedPlayerPlan(text) {
  if (!text) return false;
  const sections = [
    '## Profil',
    '## Priorytety pozycyjne',
    '## Mocne strony',
    '## Do poprawy',
    '## Propozycje treningowe',
    '## Trend',
    '## Fokus na najbliższy trening',
    '## Cele sezonu'
  ];
  const sectionCount = sections.reduce((acc, section) => acc + (text.includes(section) ? 1 : 0), 0);
  const endsCleanly = /[.!?)\]]\s*$/.test(text);
  return sectionCount === sections.length && text.length >= 1800 && endsCleanly;
}

function formatStat(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '0.0';
  return value.toFixed(1);
}

function buildFallbackPlayerPlan(payload) {
  const player = payload?.player || {};
  const positionProfile = payload?.positionProfile || {};
  const averages = payload?.averages || {};
  const signals = Array.isArray(payload?.signals) ? payload.signals : [];
  const recentGames = Array.isArray(payload?.gameLog) ? payload.gameLog.slice(0, 3) : [];

  const improvements = signals
    .filter((signal) => signal?.severity === 'high' || signal?.severity === 'medium')
    .slice(0, 3)
    .map((signal) => `- ${signal.message}`);

  const strengths = [
    `- Średnie sezonowe: ${formatStat(averages.ppg)} PPG, ${formatStat(averages.rpg)} RPG, ${formatStat(averages.apg)} APG.`,
    `- eFG ${formatStat((averages.efg || 0) * 100)}% i TS ${formatStat((averages.ts || 0) * 100)}% wskazują, jakiej selekcji rzutów trzymać się najczęściej.`,
    `- Rozegrał ${Math.round(averages.gamesPlayed || 0)} meczów i ${Math.round(averages.minutesPlayed || 0)} minut, więc mamy reprezentatywną próbkę danych.`
  ];

  const recentTrend = recentGames.length
    ? recentGames.map((game) => `- ${game.date}: ${game.pts || 0} pkt, ${game.reb || 0} zb, ${game.ast || 0} as.`).join('\n')
    : '- Brak szczegółowych danych z ostatnich meczów.';

  const focusPoints = improvements.length
    ? improvements
    : ['- Utrzymaj stabilną liczbę strat i selekcję rzutową pod presją.'];

  const positionalPriorities = Array.isArray(positionProfile?.priorities) && positionProfile.priorities.length
    ? positionProfile.priorities.map((item) => `- ${item}`)
    : ['- Dopasuj zadania treningowe do aktualnej roli w rotacji zespołu.'];

  const keyMetrics = Array.isArray(positionProfile?.keyMetrics) && positionProfile.keyMetrics.length
    ? positionProfile.keyMetrics.join(', ')
    : 'PPG, RPG, APG, eFG';

  return [
    `## Profil\n\n${player.firstName || 'Zawodnik'} ${player.lastName || ''} to ważny element rotacji BeKaPaKa. Plan opiera się na realnych statystykach meczowych i ma przełożyć się na szybką poprawę jakości decyzji boiskowych.`,
    `## Priorytety pozycyjne\n\nPozycja: **${player.position || 'N/D'}** (${positionProfile.roleName || 'rola ogólna'}).\nKluczowe zadania na tej roli:\n${positionalPriorities.join('\n')}\n\nNajważniejsze metryki do monitorowania: **${keyMetrics}**.`,
    `## Mocne strony\n\n${strengths.join('\n')}`,
    `## Do poprawy\n\n${focusPoints.join('\n')}\n- Priorytet: ograniczyć błędy po koźle i poprawić jakość pierwszej decyzji po otrzymaniu piłki.`,
    `## Propozycje treningowe\n\n- **Seria 5x5 rzutów po wyjściu z zasłony**: po każdym niecelnym rzucie natychmiastowa korekta ustawienia stóp.\n- **2x6 min gry 1v1 z limitem 2 kozłów**: nacisk na szybki atak przewagi i decyzję w 2 sekundy.\n- **Obwód podań pod presją (4 stacje x 90 s)**: podanie po zmianie kierunku i kontakcie z obrońcą.\n- **Finishing pod kontaktem (3 serie po 8 wejść)**: kończenie z lewej/prawej strony + wymuszony faul.\n- **Rzuty wolne pod zmęczeniem (5 serii po 4)**: każda seria po sprincie, notujemy skuteczność.`,
    `## Trend\n\n${recentTrend}\n\nW ostatnich występach celem jest utrzymanie stabilności decyzji i ograniczenie pustych posiadań.`,
    `## Fokus na najbliższy trening\n\n1. **Rozgrzewka (10 min):** kozioł + podanie po zmianie tempa.\n2. **Część główna (25 min):** wejścia spod zasłony i decyzje rzut/podanie w pierwszym tempie.\n3. **Cel końcowy (10 min):** 20 rzutów wolnych i minimum 85% skuteczności po obciążeniu.`,
    `## Cele sezonu\n\n- Podnieść stabilność meczową: trzymać wpływ na grę przez pełen mecz.\n- Utrzymać regularny progres w selekcji rzutów i ograniczyć straty.\n- Przełożyć jakość treningu na powtarzalny wkład punktowy i defensywny.`
  ].join('\n\n');
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
      existing.aiDevelopmentHash === ctx.hash &&
      hasDetailedPlayerPlan(existing.aiDevelopmentSummary)
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
      user: buildPlayerDevelopmentUser(ctx.payload),
      maxOutputTokens: 3072
    });
    const finalText = hasDetailedPlayerPlan(text) ? text : buildFallbackPlayerPlan(ctx.payload);

    const model = getGeminiModelName();
    const now = new Date();
    await prisma.rosterPlayer.update({
      where: { id: playerId },
      data: {
        aiDevelopmentSummary: finalText,
        aiDevelopmentAt: now,
        aiDevelopmentModel: model,
        aiDevelopmentHash: ctx.hash
      }
    });

    return {
      cached: false,
      aiDevelopmentSummary: finalText,
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
        personnelMd: buildPersonnelMdFromAnalysis(existing.analysisJson),
        generatedAt: existing.generatedAt,
        model: existing.model
      };
    }

    const raw = await generateText({
      system: SCOUTING_SYSTEM,
      user: buildScoutingUser(ctx.payload),
      jsonMode: true,
      maxOutputTokens: 4096
    });

    const analysisJson = parseScoutingJson(raw);
    const personnelMd = buildPersonnelMdFromAnalysis(analysisJson);
    const summaryMd = buildScoutingSummaryMd(analysisJson) || analysisJson.summary;

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
      personnelMd,
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
