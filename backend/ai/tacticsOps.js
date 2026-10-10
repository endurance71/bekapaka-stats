// Operacje AI taktyki (generator zagrywek, karta odprawy): prepare → silnik tekstowy → save.
// Wspólne dla tras panelu i dla wyników z MCP (Claude Code właściciela).
import { prisma } from '../lib/prisma.js';
import { aiText } from './textEngine.js';
import { hashAiPayload } from './hash.js';
import { getPromptVersion } from './promptVersions.js';
import { buildTacticalPlaySystemInstruction, buildTacticalPlayUserPrompt } from './prompts/tacticalPlayGenerator.pl.js';
import { DEFAULT_PREGAME_VENUE, buildPreGameCardSystemInstruction, buildPreGameCardUserPrompt } from './prompts/pregameBriefingCard.pl.js';
import { PREGAME_CARD_SCHEMA, TACTICAL_PLAY_SCHEMA, validatePlayDiagram } from './responseSchemas.js';
import { findScoutingReport } from './scoutingData.js';
import { resolveSeasonId } from '../seasonService.js';
import { getRoster, getNextOpponentScouting, getDetailedScouting } from '../dataStore.js';
import { matchLogistics } from '../lib/matchDay.js';

function parseJson(raw, what) {
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    throw new Error(`Nieprawidłowa odpowiedź AI (${what}) — spróbuj ponownie`);
  }
}

/** @param {{ category?: string, targetDefense?: string, goal?: string, additionalNotes?: string, seasonId?: string }} input */
export async function preparePlay(input = {}) {
  const { category, targetDefense, goal, additionalNotes, seasonId } = input;
  const roster = await getRoster(seasonId);
  const user = buildTacticalPlayUserPrompt({ category, targetDefense, goal, additionalNotes, roster });
  return {
    operation: 'panel.play',
    lockKey: `play:${hashAiPayload('play', user).slice(0, 16)}`,
    inputHash: hashAiPayload('play', user),
    version: getPromptVersion('play'),
    input: { category, targetDefense },
    prompt: { system: buildTacticalPlaySystemInstruction(), user, jsonMode: true, responseJsonSchema: TACTICAL_PLAY_SCHEMA }
  };
}

export async function savePlay(prep, raw, model) {
  const parsed = parseJson(raw, 'zagrywka');
  if (!parsed || !parsed.name) throw new Error('Nieprawidłowa odpowiedź AI');
  const diagramIssues = validatePlayDiagram(parsed.diagramData);
  if (diagramIssues.length) {
    throw new Error(`Nieprawidłowy diagram zagrywki AI: ${diagramIssues.slice(0, 3).join('; ')} — spróbuj ponownie`);
  }
  const { category, targetDefense } = prep.input;
  const play = await prisma.play.create({
    data: {
      name: parsed.name,
      category: parsed.category || category || 'half_court',
      description: parsed.description || null,
      targetDefense: parsed.targetDefense || targetDefense || null,
      diagramData: parsed.diagramData || null,
      tags: [targetDefense, category, 'AI-Generated'].filter(Boolean),
      isAiGenerated: true
    }
  });
  return { play, model };
}

export async function generatePlay(input) {
  const prep = await preparePlay(input);
  const out = await aiText({ operation: prep.operation, ...prep.prompt });
  return savePlay(prep, out.text, out.model);
}

/** @param {{ seasonId?: string, opponent?: string }} input */
export async function preparePregame(input = {}) {
  const targetSeasonId = await resolveSeasonId(input.seasonId);
  let opponent = input.opponent;
  let nextMatch = null;

  const nextScouting = await getNextOpponentScouting(targetSeasonId);
  if (!opponent && nextScouting?.opponent) opponent = nextScouting.opponent;

  if (targetSeasonId) {
    nextMatch = await prisma.leagueMatch.findFirst({
      where: {
        seasonId: targetSeasonId,
        isFinished: false,
        OR: [
          { homeTeam: { contains: 'bekapaka', mode: 'insensitive' } },
          { guestTeam: { contains: 'bekapaka', mode: 'insensitive' } }
        ]
      },
      orderBy: { date: 'asc' }
    });
  }

  if (!opponent) {
    const err = new Error('Brak zdefiniowanego rywala do odprawy');
    err.statusCode = 400;
    throw err;
  }

  const [roster, scoutingLookup, scoutingData] = await Promise.all([
    getRoster(targetSeasonId),
    // Raport scoutingu tego sezonu (klucz sezonowy, fallback: stary klucz bez sezonu)
    findScoutingReport(String(opponent), targetSeasonId).catch(() => ({ report: null })),
    getDetailedScouting(String(opponent), targetSeasonId, { includeAiPayload: true }).catch(() => null)
  ]);
  const scoutingReport = scoutingLookup?.report || null;

  // Statystyki rywala z tych samych danych co scouting (bez tekstu modelu) — źródło liczb dla odprawy.
  const ai = scoutingData?.aiPayload || null;
  const opponentStats = ai
    ? {
        teamInfo: ai.teamInfo,
        keyPlayers: ai.keyPlayers,
        form: ai.form,
        formNote: ai.formNote,
        teamSeasonAverages: ai.teamSeasonAverages,
        headToHead: ai.headToHead,
        playByPlayTendencies: ai.playByPlayTendencies
      }
    : null;

  const user = buildPreGameCardUserPrompt({ opponentName: opponent, scoutingReport, opponentStats, roster, nextMatch });
  return {
    operation: 'panel.pregame',
    lockKey: `pregame:${targetSeasonId}:${String(opponent).toLowerCase()}`,
    inputHash: hashAiPayload('pregame', user),
    version: getPromptVersion('pregame'),
    seasonId: targetSeasonId,
    opponent: String(opponent),
    roster,
    nextMatch,
    prompt: { system: buildPreGameCardSystemInstruction(), user, jsonMode: true, responseJsonSchema: PREGAME_CARD_SCHEMA }
  };
}

export async function cachedPregame(prep) {
  const existing = await prisma.preGameBriefing.findFirst({
    where: { seasonId: prep.seasonId, opponentName: { equals: prep.opponent, mode: 'insensitive' } }
  });
  return existing ? { briefing: existing, cached: true } : null;
}

export async function savePregame(prep, raw, model) {
  const parsed = parseJson(raw, 'karta odprawy');
  // Ten sam kontrakt co schemat (Gemini wymusza go po stronie API; inne silniki i agent — tutaj).
  if (!Array.isArray(parsed?.tacticalKeys) || parsed.tacticalKeys.length !== 3) throw new Error('Karta odprawy musi mieć dokładnie 3 klucze taktyczne');
  if (!Array.isArray(parsed?.startingFive) || parsed.startingFive.length !== 5) throw new Error('Karta odprawy musi mieć dokładnie 5 zawodników w pierwszej piątce');
  const { roster, nextMatch } = prep;
  // Anty-halucynacja: w piątce tylko zawodnicy z kadry (dopasowanie po playerId lub imieniu i nazwisku).
  const rosterById = new Map((roster || []).map((p) => [String(p.id), p]));
  const rosterByName = new Map((roster || []).map((p) => [`${p.firstName} ${p.lastName}`.trim().toLowerCase(), p]));
  parsed.startingFive = parsed.startingFive
    .map((slot) => {
      const match = rosterById.get(String(slot?.playerId)) || rosterByName.get(String(slot?.name || '').trim().toLowerCase());
      if (!match) return null;
      return { ...slot, playerId: match.id, name: `${match.firstName} ${match.lastName}`.trim(), number: match.number ?? null };
    })
    .filter(Boolean);

  // Godziny i strój tylko z terminarza i dnia meczowego (czas polski) — bez zgadywania
  const { matchDate, tipoffTime: tipoff, gatheringTime: gathering, kit } = matchLogistics(nextMatch);
  const data = {
    matchDate,
    venue: nextMatch?.venue || DEFAULT_PREGAME_VENUE,
    gatheringTime: gathering,
    tipoffTime: tipoff,
    jerseyColor: kit || '',
    tacticalKeys: parsed.tacticalKeys || [],
    startingFive: parsed.startingFive || [],
    benchKeys: parsed.benchKeys || null,
    generatedByAi: true,
    model
  };
  const briefing = await prisma.preGameBriefing.upsert({
    where: { seasonId_opponentName: { seasonId: prep.seasonId, opponentName: prep.opponent } },
    create: { seasonId: prep.seasonId, opponentName: prep.opponent, ...data },
    update: data
  });
  return { briefing, model };
}

export async function generatePregame(input, { force = false } = {}) {
  const prep = await preparePregame(input);
  const cached = !force && (await cachedPregame(prep));
  if (cached) return cached;
  const out = await aiText({ operation: prep.operation, ...prep.prompt });
  return savePregame(prep, out.text, out.model);
}
