import { prisma } from '../lib/prisma.js';
import { buildBriefingContext } from './buildBriefingContext.js';
import { buildMatchContext } from './buildMatchContext.js';
import { buildPlayerContext } from './buildPlayerContext.js';
import { buildScoutingContext } from './buildScoutingContext.js';
import { generateText, getGeminiModelName } from './geminiClient.js';
import { withAiLock } from './locks.js';
import { MATCH_ANALYSIS_SYSTEM, buildMatchAnalysisUser } from './prompts/matchAnalysis.pl.js';
import {
  buildPlayerDevelopmentMarkdown,
  hasDetailedPlayerPlanMarkdown,
  parsePlayerDevelopmentJson
} from './playerDevelopmentMarkdown.js';
import { PLAYER_DEVELOPMENT_SYSTEM, buildPlayerDevelopmentUser } from './prompts/playerDevelopment.pl.js';
import { SCOUTING_SYSTEM, buildScoutingUser } from './prompts/scoutingOpponent.pl.js';
import { buildPersonnelMdFromAnalysis } from './scoutingPersonnel.js';
import {
  buildScoutingSummaryMd,
  parseScoutingJson
} from './scoutingMarkdown.js';
import { BRIEFING_SYSTEM, buildBriefingUser } from './prompts/teamBriefing.pl.js';
import { getActiveSeason } from '../seasonService.js';


const aiSummarySelect = {
  aiSummary: true,
  aiSummaryHash: true,
  aiSummaryAt: true,
  aiSummaryModel: true
};

async function findMatchAiTarget(gameId) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: aiSummarySelect
  });
  if (game) return { kind: 'game', id: gameId, existing: game };

  const season = await getActiveSeason();
  if (!season) return null;

  const kalk = await prisma.kalkMatch.findUnique({
    where: { seasonId_id: { seasonId: season.id, id: String(gameId) } },
    select: aiSummarySelect
  });
  if (kalk) return { kind: 'kalk', id: String(gameId), seasonId: season.id, existing: kalk };

  return null;
}

function formatStat(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '0.0';
  return value.toFixed(1);
}

/**
 * @param {object} payload
 * @returns {string}
 */
function buildFallbackPlayerPlan(payload) {
  const player = payload?.player || {};
  const positionProfile = payload?.positionProfile || {};
  const averages = payload?.averages || {};
  const derived = payload?.derived || {};
  const signals = Array.isArray(payload?.signals) ? payload.signals : [];
  const recentGames = Array.isArray(payload?.gameLog) ? payload.gameLog.slice(0, 3) : [];
  const mpg = derived.mpg ?? (averages.gamesPlayed ? averages.minutesPlayed / averages.gamesPlayed : 0);
  const per36 = derived.per36;

  const improvements = signals
    .filter((signal) => signal?.severity === 'high' || signal?.severity === 'medium')
    .slice(0, 3)
    .map((signal) => `- ${signal.message}`);

  const efgPct = derived.efgPct ?? (averages.efg || 0) * 100;
  const tsPct = derived.tsPct ?? (averages.ts || 0) * 100;

  const strengths = [
    `- Sezon: **${formatStat(averages.ppg)} PPG**, **${formatStat(averages.rpg)} RPG**, **${formatStat(averages.apg)} APG** przy **${Math.round(averages.gamesPlayed || 0)}** meczach i **${Math.round(averages.minutesPlayed || 0)}** min łącznie (~${formatStat(mpg)} min/mecz).`,
    `- eFG **${formatStat(efgPct)}%** i TS **${formatStat(tsPct)}%** opisują aktualną selekcję rzutów.`,
    per36
      ? `- W skali per 36 min: **${formatStat(per36.ppg)}** pkt, **${formatStat(per36.rpg)}** zb, **${formatStat(per36.apg)}** as — punkt odniesienia do pełnego czasu gry.`
      : `- Plus/minus średnio **${formatStat(averages.plusMinusAvg)}** na mecz.`
  ];

  const recentPts = recentGames.map((g) => g.pts || 0);
  const ptsTrend =
    recentPts.length >= 2
      ? recentPts[0] > recentPts[recentPts.length - 1]
        ? `ostatni mecz **${recentPts[0]}** pkt vs **${recentPts[recentPts.length - 1]}** pkt kilka meczów wcześniej`
        : `punkty w ostatnich meczach: ${recentPts.join(' → ')}`
      : 'za mało meczów do pełnego trendu';

  const recentTrend = recentGames.length
    ? recentGames.map((game) => `- ${game.date} vs ${game.opponent}: **${game.pts || 0}** pkt, **${game.reb || 0}** zb, **${game.ast || 0}** as, eFG **${formatStat((game.efg || 0) * 100)}%**.`).join('\n')
    : '- Brak szczegółowych danych z ostatnich meczów.';

  const focusPoints = improvements.length
    ? improvements
    : [`- Utrzymać straty na poziomie ≤ **${formatStat(derived.tovPerGame ?? 2)}** na mecz i poprawić pierwszą decyzję po odbiorze piłki.`];

  const keyMetrics = Array.isArray(positionProfile?.keyMetrics) && positionProfile.keyMetrics.length
    ? positionProfile.keyMetrics.join(', ')
    : 'PPG, RPG, APG, eFG';

  const ftLine =
    derived.ftPct != null && derived.ftPct < 60
      ? '\n- **Rzuty wolne pod zmęczeniem (5×4 po sprincie):** cel minimum **65%** w ostatniej serii.'
      : '';

  const trainingBase = [
    '- **Decyzja 2v2 z obrońcą na piłce (6×90 s):** max **2** sekundy na pass/rzut, min. **70%** udanych akcji.',
    '- **Finishing pod kontaktem (3×8 wejść):** minimum **6/8** celnych kończeń z obu stron.',
    '- **Obwód podań pod presją (4 stacje ×90 s):** max **1** strata na stację.',
    '- **1v1 z limitem 2 kozłów (4×2 min):** minimum **50%** wygranych akcji ofensywnych.',
    '- **Catch-and-shoot (5 pozycji ×10 rzutów):** minimum **55%** skuteczności łącznie.'
  ];

  const firstName = player.firstName || 'Zawodniku';
  const positionalPrioritiesTu = Array.isArray(positionProfile?.priorities) && positionProfile.priorities.length
    ? positionProfile.priorities.map((item) => `- Na pozycji ${player.position || 'Twojej'}: ${item.charAt(0).toLowerCase() + item.slice(1)}`)
    : [`- Dopasujemy trening do Twojej roli **${player.position || 'uniwersalnej'}**.`];

  const improvementsTu = focusPoints.length
    ? focusPoints.map((line) => line.replace(/^-\s*/, '- ').replace(/Średnio/g, 'Masz średnio').replace(/Utrzymać/g, 'Utrzymuj'))
  : [`- Utrzymuj straty na poziomie ≤ **${formatStat(derived.tovPerGame ?? 2)}** na mecz i popraw pierwszą decyzję po odbiorze piłki.`];

  const sections = {
    profile: `${firstName}, jestem Twoim Trenerem AI BeKaPaKa. W tym sezonie masz **${formatStat(averages.ppg)} PPG** w **${Math.round(averages.gamesPlayed || 0)}** meczach (~**${formatStat(mpg)}** min/mecz) — bazuję na statystykach KALK (liga + log meczów) i układam plan pod Twój najbliższy trening.`,
    positionPriorities: `Grasz jako **${player.position || 'N/D'}** (${positionProfile.roleName || 'rola ogólna'}).\n\n${positionalPrioritiesTu.join('\n')}\n\nBędę monitorował u Ciebie: **${keyMetrics}**.`,
    strengths: strengths
      .map((line) =>
        line
          .replace('Sezon:', 'Masz w sezonie:')
          .replace('opisują aktualną', 'to Twoja aktualna')
          .replace('punkt odniesienia', 'Twój punkt odniesienia')
      )
      .join('\n'),
    improvements: improvementsTu.join('\n'),
    trainingProposals: trainingBase.join('\n') + ftLine,
    trend: `${recentTrend}\n\nWidzę u Ciebie trend punktowy: ${ptsTrend}.`,
    sessionFocus:
      'Na najbliższym treningu:\n1. **Rozgrzewka (10 min):** kozioł + podanie po zmianie tempa.\n2. **Część główna (25 min):** ćwiczenia z sekcji „Do poprawy” (decyzje / finishing).\n3. **Zakończenie (10 min):** rzuty wolne lub contested shots — zapisz swój cel liczbowy po treningu.',
    seasonGoals: `- Podnosisz PPG z **${formatStat(averages.ppg)}** do **${formatStat(averages.ppg + 1.5)}** do końca sezonu przy podobnych minutach.\n- Utrzymujesz eFG ≥ **${formatStat(efgPct)}%** przy większej liczbie asyst (**${formatStat(averages.apg)}** APG).\n- Ograniczasz straty do ≤ **${formatStat(derived.tovPerGame ?? 2.5)}** na mecz.`
  };

  return buildPlayerDevelopmentMarkdown(sections);
}

/**
 * @param {string} raw
 * @param {object} payload
 * @returns {string}
 */
function resolvePlayerDevelopmentText(raw, payload) {
  try {
    const sections = parsePlayerDevelopmentJson(raw);
    const markdown = buildPlayerDevelopmentMarkdown(sections);
    if (hasDetailedPlayerPlanMarkdown(markdown)) return markdown;
  } catch {
    // fallback poniżej
  }
  const fallback = buildFallbackPlayerPlan(payload);
  if (hasDetailedPlayerPlanMarkdown(fallback)) return fallback;
  return fallback;
}

/**
 * @param {string} gameId
 * @param {{ force?: boolean }} options
 */
export async function generateGameAnalysis(gameId, options = {}) {
  return withAiLock(`game:${gameId}`, async () => {
    const ctx = await buildMatchContext(gameId);
    const target = await findMatchAiTarget(gameId);
    const existing = target?.existing;

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
    const aiData = {
      aiSummary: text,
      aiSummaryAt: now,
      aiSummaryModel: model,
      aiSummaryHash: ctx.hash
    };

    if (target?.kind === 'kalk') {
      await prisma.kalkMatch.update({
        where: { seasonId_id: { seasonId: target.seasonId, id: target.id } },
        data: aiData
      });
    } else {
      await prisma.game.update({
        where: { id: gameId },
        data: aiData
      });
    }

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
      hasDetailedPlayerPlanMarkdown(existing.aiDevelopmentSummary)
    ) {
      return {
        cached: true,
        aiDevelopmentSummary: existing.aiDevelopmentSummary,
        aiDevelopmentAt: existing.aiDevelopmentAt,
        model: existing.aiDevelopmentModel
      };
    }

    const raw = await generateText({
      system: PLAYER_DEVELOPMENT_SYSTEM,
      user: buildPlayerDevelopmentUser(ctx.payload),
      jsonMode: true,
      maxOutputTokens: 4096
    });
    const finalText = resolvePlayerDevelopmentText(raw, ctx.payload);

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
