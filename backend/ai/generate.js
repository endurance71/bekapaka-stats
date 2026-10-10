import { prisma } from '../lib/prisma.js';
import { buildBriefingContext } from './buildBriefingContext.js';
import { buildMatchContext } from './buildMatchContext.js';
import { buildPlayerContext } from './buildPlayerContext.js';
import { buildScoutingContext } from './buildScoutingContext.js';
import { TEMPLATE_MODEL_NAME } from './geminiClient.js';
import { aiText } from './textEngine.js';
import { getPromptVersion } from './promptVersions.js';
import { PLAYER_DEVELOPMENT_SCHEMA, SCOUTING_SCHEMA } from './responseSchemas.js';
import { withAiLock } from './locks.js';
import { resolveKalkMatchById } from '../kalk/v2/resolveMatch.js';
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
import { hasCompleteBriefingMarkdown } from './briefingMarkdown.js';
import { hasCompleteMatchAnalysisMarkdown } from './matchAnalysisMarkdown.js';
import { resolveSeasonId } from '../seasonService.js';


const aiSummarySelect = {
  aiSummary: true,
  aiSummaryHash: true,
  aiSummaryAt: true,
  aiSummaryModel: true
};

/**
 * Wiersz docelowy analizy meczu: legacy Game albo KalkMatch (z sezonem, gdy podany).
 * @param {string} gameId
 * @param {string | null | undefined} [seasonId]
 */
async function findMatchAiTarget(gameId, seasonId = undefined) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: aiSummarySelect
  });
  if (game) return { kind: 'game', id: gameId, existing: game };

  // Ten sam resolver co getGameById (sezon aktywny przy duplikatach ID, aliasy starych ID 2025/26).
  const kalk = await resolveKalkMatchById(prisma, String(gameId), {
    seasonId: seasonId || null,
    select: aiSummarySelect
  });
  if (kalk) return { kind: 'kalk', id: String(kalk.id), seasonId: kalk.seasonId, existing: kalk };

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
    ? recentGames.map((game) => `- ${game.date} vs ${game.opponent}${game.result ? ` (${game.result} ${game.score ?? ''})` : ''}: **${game.pts || 0}** pkt, **${game.reb || 0}** zb, **${game.ast || 0}** as, eFG **${game.efgPct == null ? 'brak danych' : `${formatStat(game.efgPct)}%`}**.`).join('\n')
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
 * @returns {{ text: string, isTemplate: boolean }}
 */
export function resolvePlayerDevelopmentText(raw, payload) {
  try {
    const sections = parsePlayerDevelopmentJson(raw);
    const markdown = buildPlayerDevelopmentMarkdown(sections);
    if (hasDetailedPlayerPlanMarkdown(markdown)) return { text: markdown, isTemplate: false };
  } catch {
    // fallback poniżej
  }
  return { text: buildFallbackPlayerPlan(payload), isTemplate: true };
}

// Każda operacja: prepare (kontekst, prompt, hash wejścia) → silnik tekstowy (aiText) → save (walidacja + zapis).
// Te same prepare/save obsługują wynik z MCP (Claude Code właściciela), więc logika nie jest powielana.

/**
 * @param {string} gameId
 * @param {{ seasonId?: string | null }} options
 */
export async function prepareGameAnalysis(gameId, options = {}) {
  const ctx = await buildMatchContext(gameId, { seasonId: options.seasonId });
  const target = await findMatchAiTarget(ctx.kalkMatchId || gameId, ctx.seasonId ?? options.seasonId);
  return {
    operation: 'panel.match',
    lockKey: `game:${options.seasonId || 'any'}:${gameId}`,
    inputHash: ctx.hash,
    version: getPromptVersion('match'),
    gameId,
    target,
    prompt: {
      system: MATCH_ANALYSIS_SYSTEM,
      user: buildMatchAnalysisUser(ctx.payload, ctx.ruleInsights),
      maxOutputTokens: 8192
    }
  };
}

function cachedGameAnalysis(prep) {
  const existing = prep.target?.existing;
  if (existing?.aiSummary && existing.aiSummaryHash === prep.inputHash && hasCompleteMatchAnalysisMarkdown(existing.aiSummary)) {
    return { cached: true, aiSummary: existing.aiSummary, aiSummaryAt: existing.aiSummaryAt, model: existing.aiSummaryModel };
  }
  return null;
}

export async function saveGameAnalysis(prep, text, model) {
  if (!hasCompleteMatchAnalysisMarkdown(text)) {
    throw new Error('Wygenerowana analiza meczu jest niekompletna — spróbuj ponownie');
  }
  const now = new Date();
  const aiData = { aiSummary: text, aiSummaryAt: now, aiSummaryModel: model, aiSummaryHash: prep.inputHash };
  if (prep.target?.kind === 'kalk') {
    await prisma.kalkMatch.update({
      where: { seasonId_id: { seasonId: prep.target.seasonId, id: prep.target.id } },
      data: aiData
    });
  } else {
    await prisma.game.update({ where: { id: prep.gameId }, data: aiData });
  }
  return { cached: false, aiSummary: text, aiSummaryAt: now, model };
}

/**
 * @param {string} gameId
 * @param {{ force?: boolean, seasonId?: string | null }} options
 */
export async function generateGameAnalysis(gameId, options = {}) {
  return withAiLock(`game:${options.seasonId || 'any'}:${gameId}`, async () => {
    const prep = await prepareGameAnalysis(gameId, options);
    const cached = !options.force && cachedGameAnalysis(prep);
    if (cached) return cached;
    const out = await aiText({ operation: prep.operation, ...prep.prompt });
    return saveGameAnalysis(prep, out.text, out.model);
  });
}

/**
 * @param {string} playerId
 * @param {{ seasonId?: string | null }} options
 */
export async function preparePlayerDevelopment(playerId, options = {}) {
  const ctx = await buildPlayerContext(playerId, { seasonId: options.seasonId });
  const existing = await prisma.rosterPlayer.findUnique({
    where: { id: playerId },
    select: { aiDevelopmentSummary: true, aiDevelopmentHash: true, aiDevelopmentAt: true, aiDevelopmentModel: true }
  });
  return {
    operation: 'panel.player',
    lockKey: `player:${playerId}`,
    inputHash: ctx.hash,
    version: getPromptVersion('player'),
    playerId,
    payload: ctx.payload,
    existing,
    prompt: {
      system: PLAYER_DEVELOPMENT_SYSTEM,
      user: buildPlayerDevelopmentUser(ctx.payload),
      jsonMode: true,
      responseJsonSchema: PLAYER_DEVELOPMENT_SCHEMA,
      maxOutputTokens: 4096
    }
  };
}

function cachedPlayerDevelopment(prep) {
  const existing = prep.existing;
  if (
    existing?.aiDevelopmentSummary &&
    existing.aiDevelopmentHash === prep.inputHash &&
    existing.aiDevelopmentModel !== TEMPLATE_MODEL_NAME &&
    hasDetailedPlayerPlanMarkdown(existing.aiDevelopmentSummary)
  ) {
    return {
      cached: true,
      aiDevelopmentSummary: existing.aiDevelopmentSummary,
      aiDevelopmentAt: existing.aiDevelopmentAt,
      model: existing.aiDevelopmentModel,
      isTemplate: false
    };
  }
  return null;
}

/**
 * @param {{ strict?: boolean }} [options] — strict (wynik agenta MCP): niepełny plan jest odrzucany zamiast zastąpienia szablonem.
 */
export async function savePlayerDevelopment(prep, raw, model, { strict = false } = {}) {
  const { text: finalText, isTemplate } = resolvePlayerDevelopmentText(raw, prep.payload);
  if (strict && isTemplate) throw new Error('Plan rozwoju nie spełnia wymaganej struktury (brakujące lub zbyt krótkie sekcje)');
  // Szablon (fallback) zapisywany z modelem „template” — odróżnialny od odpowiedzi modelu w audycie i katalogu.
  const savedModel = isTemplate ? TEMPLATE_MODEL_NAME : model;
  const now = new Date();
  await prisma.rosterPlayer.update({
    where: { id: prep.playerId },
    data: { aiDevelopmentSummary: finalText, aiDevelopmentAt: now, aiDevelopmentModel: savedModel, aiDevelopmentHash: prep.inputHash }
  });
  return { cached: false, aiDevelopmentSummary: finalText, aiDevelopmentAt: now, model: savedModel, isTemplate };
}

/**
 * @param {string} playerId
 * @param {{ force?: boolean, seasonId?: string | null }} options
 */
export async function generatePlayerDevelopment(playerId, options = {}) {
  return withAiLock(`player:${playerId}`, async () => {
    const prep = await preparePlayerDevelopment(playerId, options);
    const cached = !options.force && cachedPlayerDevelopment(prep);
    if (cached) return cached;
    const out = await aiText({ operation: prep.operation, ...prep.prompt });
    return savePlayerDevelopment(prep, out.text, out.model);
  });
}

/**
 * @param {string | undefined} opponentQuery
 * @param {{ seasonId?: string | null }} options
 */
export async function prepareScoutingReport(opponentQuery, options = {}) {
  const targetSeasonId = await resolveSeasonId(options.seasonId || undefined);
  const ctx = await buildScoutingContext(opponentQuery, targetSeasonId);
  return {
    operation: 'panel.scouting',
    // Klucz sezonowy `{seasonId}::{rywal}` — raporty z różnych sezonów się nie nadpisują.
    lockKey: `scouting:${ctx.opponentKey}`,
    inputHash: ctx.hash,
    version: getPromptVersion('scouting'),
    ctx,
    prompt: {
      system: SCOUTING_SYSTEM,
      user: buildScoutingUser(ctx.payload),
      jsonMode: true,
      responseJsonSchema: SCOUTING_SCHEMA,
      maxOutputTokens: 4096
    }
  };
}

async function cachedScoutingReport(prep) {
  const { ctx } = prep;
  const existing = await prisma.scoutingAiReport.findUnique({ where: { opponentKey: ctx.opponentKey } });
  if (existing?.sourceHash === ctx.hash && existing.summaryMd) {
    return {
      cached: true,
      opponentKey: ctx.opponentKey,
      opponentName: ctx.opponentName,
      seasonId: ctx.seasonId,
      aiAnalysis: existing.analysisJson,
      summaryMd: existing.summaryMd,
      personnelMd: buildPersonnelMdFromAnalysis(existing.analysisJson),
      generatedAt: existing.generatedAt,
      model: existing.model
    };
  }
  return null;
}

export async function saveScoutingReport(prep, raw, model) {
  const { ctx } = prep;
  const analysisJson = parseScoutingJson(raw);
  const personnelMd = buildPersonnelMdFromAnalysis(analysisJson);
  const summaryMd = buildScoutingSummaryMd(analysisJson) || analysisJson.summary;
  const now = new Date();
  const data = { opponentName: ctx.opponentName, summaryMd, analysisJson, model, sourceHash: ctx.hash, generatedAt: now };
  await prisma.scoutingAiReport.upsert({
    where: { opponentKey: ctx.opponentKey },
    create: { opponentKey: ctx.opponentKey, ...data },
    update: data
  });
  return {
    cached: false,
    opponentKey: ctx.opponentKey,
    opponentName: ctx.opponentName,
    seasonId: ctx.seasonId,
    aiAnalysis: analysisJson,
    summaryMd,
    personnelMd,
    generatedAt: now,
    model
  };
}

/**
 * @param {string | undefined} opponentQuery
 * @param {{ force?: boolean, seasonId?: string | null }} options
 */
export async function generateScoutingReport(opponentQuery, options = {}) {
  const prep = await prepareScoutingReport(opponentQuery, options);
  return withAiLock(prep.lockKey, async () => {
    const cached = !options.force && (await cachedScoutingReport(prep));
    if (cached) return cached;
    const out = await aiText({ operation: prep.operation, ...prep.prompt });
    return saveScoutingReport(prep, out.text, out.model);
  });
}

/**
 * @param {{ seasonId?: string }} options
 */
export async function prepareTeamBriefing(options = {}) {
  const targetSeasonId = await resolveSeasonId(options.seasonId);
  const ctx = await buildBriefingContext(targetSeasonId);
  return {
    operation: 'panel.briefing',
    lockKey: `briefing:${targetSeasonId || 'default'}`,
    inputHash: ctx.hash,
    version: getPromptVersion('briefing'),
    briefingId: targetSeasonId || 'default',
    requireUpcomingOpponent: Boolean(ctx.payload.hasUpcomingMatch),
    prompt: { system: BRIEFING_SYSTEM, user: buildBriefingUser(ctx.payload), maxOutputTokens: 4096 }
  };
}

async function cachedTeamBriefing(prep) {
  const existing = await prisma.teamBriefing.findUnique({ where: { id: prep.briefingId } });
  if (
    existing?.sourceHash === prep.inputHash &&
    existing.contentMd &&
    hasCompleteBriefingMarkdown(existing.contentMd, { requireUpcomingOpponent: prep.requireUpcomingOpponent })
  ) {
    return { cached: true, contentMd: existing.contentMd, generatedAt: existing.generatedAt, model: existing.model };
  }
  return null;
}

export async function saveTeamBriefing(prep, text, model) {
  if (!hasCompleteBriefingMarkdown(text, { requireUpcomingOpponent: prep.requireUpcomingOpponent })) {
    throw new Error('Wygenerowany briefing jest niekompletny — spróbuj ponownie');
  }
  const now = new Date();
  const data = { contentMd: text, model, sourceHash: prep.inputHash, generatedAt: now };
  await prisma.teamBriefing.upsert({
    where: { id: prep.briefingId },
    create: { id: prep.briefingId, ...data },
    update: data
  });
  return { cached: false, contentMd: text, generatedAt: now, model };
}

/**
 * @param {{ force?: boolean, seasonId?: string }} options
 */
export async function generateTeamBriefing(options = {}) {
  const targetSeasonId = await resolveSeasonId(options.seasonId);
  return withAiLock(`briefing:${targetSeasonId || 'default'}`, async () => {
    const prep = await prepareTeamBriefing({ seasonId: targetSeasonId });
    const cached = !options.force && (await cachedTeamBriefing(prep));
    if (cached) return cached;
    const out = await aiText({ operation: prep.operation, ...prep.prompt });
    return saveTeamBriefing(prep, out.text, out.model);
  });
}

export async function getTeamBriefingCached(querySeasonId = undefined) {
  const targetSeasonId = await resolveSeasonId(querySeasonId);
  if (!targetSeasonId) {
    return prisma.teamBriefing.findUnique({ where: { id: 'default' } });
  }

  const bySeason = await prisma.teamBriefing.findUnique({ where: { id: targetSeasonId } });
  if (bySeason) return bySeason;

  if (targetSeasonId === 'season_2025-2026') {
    return prisma.teamBriefing.findUnique({ where: { id: 'default' } });
  }

  return null;
}
