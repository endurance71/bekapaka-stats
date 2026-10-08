import express from 'express';
import { prisma } from '../lib/prisma.js';
import { generateText, getGeminiModelName } from '../ai/geminiClient.js';
import {
  buildTacticalPlaySystemInstruction,
  buildTacticalPlayUserPrompt
} from '../ai/prompts/tacticalPlayGenerator.pl.js';
import {
  DEFAULT_PREGAME_VENUE,
  buildPreGameCardSystemInstruction,
  buildPreGameCardUserPrompt
} from '../ai/prompts/pregameBriefingCard.pl.js';
import { PREGAME_CARD_SCHEMA, TACTICAL_PLAY_SCHEMA, validatePlayDiagram } from '../ai/responseSchemas.js';
import { findScoutingReport } from '../ai/scoutingData.js';
import { resolveSeasonId, getActiveSeason, getSeasonById } from '../seasonService.js';
import { getRoster, getNextOpponentScouting, getDetailedScouting } from '../dataStore.js';
import { DEFAULT_PLAYBOOK_PRESETS } from '../lib/playbookPresets.js';
import { matchLogistics } from '../lib/matchDay.js';
import { upgradePresetPlays } from '../lib/playbookUpgrade.js';

// Raz na proces: zagrywki z presetów pod starymi nazwami → polska wersja
let presetUpgrade = null;
import { computeTeamSynergy, emptySynergy } from '../kalk/v2/synergy.js';

export const tacticsRouter = express.Router();

/**
 * ZAGRYWKI (PLAYBOOK)
 */

// GET /api/tactics/plays
tacticsRouter.get('/plays', async (req, res) => {
  try {
    const { category, targetDefense } = req.query;
    const where = {};
    if (category) where.category = String(category);
    if (targetDefense) where.targetDefense = { contains: String(targetDefense), mode: 'insensitive' };

    presetUpgrade ??= upgradePresetPlays(prisma, DEFAULT_PLAYBOOK_PRESETS).catch((e) => {
      console.error('Play preset upgrade failed:', e.message);
      presetUpgrade = null; // spróbuj przy następnym żądaniu
      return 0;
    });
    await presetUpgrade;

    let plays = await prisma.play.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // Auto-seed jeśli baza zagrywek jest pusta
    if (plays.length === 0 && !category && !targetDefense && req.user?.role === 'ADMIN') {
      await Promise.all(
        DEFAULT_PLAYBOOK_PRESETS.map((p) =>
          prisma.play.create({
            data: {
              name: p.name,
              category: p.category,
              targetDefense: p.targetDefense,
              description: p.description,
              diagramData: p.diagramData,
              tags: p.tags || [],
              isAiGenerated: false
            }
          })
        )
      );
      plays = await prisma.play.findMany({ orderBy: { createdAt: 'desc' } });
    }

    res.json(plays);
  } catch (err) {
    console.error('Error fetching plays:', err);
    res.status(500).json({ error: 'Błąd pobierania bazy zagrywek' });
  }
});

// GET /api/tactics/plays/:id
tacticsRouter.get('/plays/:id', async (req, res) => {
  try {
    const play = await prisma.play.findUnique({
      where: { id: req.params.id }
    });
    if (!play) return res.status(404).json({ error: 'Zagrywka nie znaleziona' });
    res.json(play);
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania zagrywki' });
  }
});

// POST /api/tactics/plays
tacticsRouter.post('/plays', async (req, res) => {
  try {
    const { name, category, description, targetDefense, diagramData, videoUrl, tags } = req.body;
    if (!name) return res.status(400).json({ error: 'Nazwa zagrywki jest wymagana' });

    const play = await prisma.play.create({
      data: {
        name,
        category: category || 'half_court',
        description: description || null,
        targetDefense: targetDefense || null,
        diagramData: diagramData || null,
        videoUrl: videoUrl || null,
        tags: Array.isArray(tags) ? tags : [],
        isAiGenerated: false
      }
    });
    res.status(201).json(play);
  } catch (err) {
    console.error('Error creating play:', err);
    res.status(500).json({ error: 'Błąd tworzenia zagrywki' });
  }
});

// PUT /api/tactics/plays/:id
tacticsRouter.put('/plays/:id', async (req, res) => {
  try {
    const { name, category, description, targetDefense, diagramData, videoUrl, tags, attempts, successes } = req.body;
    const play = await prisma.play.update({
      where: { id: req.params.id },
      data: {
        ...(name != null ? { name } : {}),
        ...(category != null ? { category } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(targetDefense !== undefined ? { targetDefense } : {}),
        ...(diagramData !== undefined ? { diagramData } : {}),
        ...(videoUrl !== undefined ? { videoUrl } : {}),
        ...(tags !== undefined ? { tags: Array.isArray(tags) ? tags : [] } : {}),
        ...(attempts !== undefined ? { attempts: Number(attempts) || 0 } : {}),
        ...(successes !== undefined ? { successes: Number(successes) || 0 } : {})
      }
    });
    res.json(play);
  } catch (err) {
    res.status(500).json({ error: 'Błąd aktualizacji zagrywki' });
  }
});

// DELETE /api/tactics/plays/:id
tacticsRouter.delete('/plays/:id', async (req, res) => {
  try {
    await prisma.play.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Błąd usuwania zagrywki' });
  }
});

// POST /api/tactics/plays/generate (AI)
tacticsRouter.post('/plays/generate', async (req, res) => {
  try {
    const { category, targetDefense, goal, additionalNotes, seasonId } = req.body;
    const roster = await getRoster(seasonId);

    const system = buildTacticalPlaySystemInstruction();
    const user = buildTacticalPlayUserPrompt({
      category,
      targetDefense,
      goal,
      additionalNotes,
      roster
    });

    const rawJson = await generateText({
      system,
      user,
      jsonMode: true,
      responseJsonSchema: TACTICAL_PLAY_SCHEMA
    });

    const parsed = JSON.parse(rawJson);
    if (!parsed || !parsed.name) {
      throw new Error('Nieprawidłowa odpowiedź AI');
    }
    const diagramIssues = validatePlayDiagram(parsed.diagramData);
    if (diagramIssues.length) {
      throw new Error(`Nieprawidłowy diagram zagrywki AI: ${diagramIssues.slice(0, 3).join('; ')} — spróbuj ponownie`);
    }

    const saved = await prisma.play.create({
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

    res.status(201).json({
      play: saved,
      model: getGeminiModelName()
    });
  } catch (err) {
    console.error('Error generating play with AI:', err);
    res.status(500).json({ error: err.message || 'Błąd generacji zagrywki AI' });
  }
});

/**
 * ANALIZA SYNERGII PAR I ZESTAWIEŃ (LINEUP / DUO SYNERGY)
 */

// GET /api/tactics/synergy — duety BeKaPaKa (akcja po akcji: wspólne minuty i bilans; starsze sezony: wspólne mecze)
tacticsRouter.get('/synergy', async (req, res) => {
  try {
    const targetSeasonId = await resolveSeasonId(req.query.seasonId);
    const season = await getSeasonById(targetSeasonId);
    if (!season) return res.json(emptySynergy());
    res.json(await computeTeamSynergy(prisma, season.id));
  } catch (err) {
    console.error('Error calculating synergy:', err);
    res.status(500).json({ error: 'Błąd kalkulacji synergii duetów' });
  }
});

/**
 * ASYSTENT ODPRAWY PRZEDMECZOWEJ (MATCHDAY PRE-GAME CARD)
 */

// GET /api/tactics/pregame
tacticsRouter.get('/pregame', async (req, res) => {
  try {
    const targetSeasonId = await resolveSeasonId(req.query.seasonId);
    let { opponent } = req.query;

    if (!opponent) {
      const nextScouting = await getNextOpponentScouting(targetSeasonId);
      if (nextScouting?.opponent) {
        opponent = nextScouting.opponent;
      }
    }

    if (!opponent) {
      return res.json({ briefing: null, opponent: null });
    }

    const briefing = await prisma.preGameBriefing.findFirst({
      where: {
        seasonId: targetSeasonId,
        opponentName: { equals: String(opponent), mode: 'insensitive' }
      }
    });

    res.json({ briefing, opponent: String(opponent) });
  } catch (err) {
    console.error('Error fetching pregame briefing:', err);
    res.status(500).json({ error: 'Błąd pobierania odprawy przedmeczowej' });
  }
});

// POST /api/tactics/pregame/generate
tacticsRouter.post('/pregame/generate', async (req, res) => {
  try {
    const { seasonId: qSeasonId, opponent: requestedOpponent, force } = req.body;
    const targetSeasonId = await resolveSeasonId(qSeasonId);

    let opponent = requestedOpponent;
    let nextMatch = null;

    const nextScouting = await getNextOpponentScouting(targetSeasonId);
    if (!opponent && nextScouting?.opponent) {
      opponent = nextScouting.opponent;
    }

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
      return res.status(400).json({ error: 'Brak zdefiniowanego rywala do odprawy' });
    }

    // Sprawdź czy już istnieje
    if (!force) {
      const existing = await prisma.preGameBriefing.findFirst({
        where: {
          seasonId: targetSeasonId,
          opponentName: { equals: String(opponent), mode: 'insensitive' }
        }
      });
      if (existing) {
        return res.json({ briefing: existing, cached: true });
      }
    }

    const [roster, scoutingLookup, scoutingData] = await Promise.all([
      getRoster(targetSeasonId),
      // Raport scoutingu tego sezonu (klucz sezonowy, fallback: stary klucz bez sezonu)
      findScoutingReport(String(opponent), targetSeasonId).catch(() => ({ report: null })),
      getDetailedScouting(String(opponent), targetSeasonId, { includeAiPayload: true }).catch(() => null)
    ]);
    const scoutingReport = scoutingLookup?.report || null;

    // Statystyki rywala z tych samych danych co scouting (bez tekstu Gemini) — źródło liczb dla odprawy.
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

    const system = buildPreGameCardSystemInstruction();
    const user = buildPreGameCardUserPrompt({
      opponentName: opponent,
      scoutingReport,
      opponentStats,
      roster,
      nextMatch
    });

    const rawJson = await generateText({
      system,
      user,
      jsonMode: true,
      responseJsonSchema: PREGAME_CARD_SCHEMA
    });

    const parsed = JSON.parse(rawJson);
    // Anty-halucynacja: w piątce tylko zawodnicy z kadry (dopasowanie po playerId lub imieniu i nazwisku).
    const rosterById = new Map((roster || []).map((p) => [String(p.id), p]));
    const rosterByName = new Map(
      (roster || []).map((p) => [`${p.firstName} ${p.lastName}`.trim().toLowerCase(), p])
    );
    parsed.startingFive = (Array.isArray(parsed.startingFive) ? parsed.startingFive : [])
      .map((slot) => {
        const match =
          rosterById.get(String(slot?.playerId)) ||
          rosterByName.get(String(slot?.name || '').trim().toLowerCase());
        if (!match) return null;
        return {
          ...slot,
          playerId: match.id,
          name: `${match.firstName} ${match.lastName}`.trim(),
          number: match.number ?? null
        };
      })
      .filter(Boolean);

    // Godziny i strój tylko z terminarza i dnia meczowego (czas polski) — bez zgadywania
    const { matchDate, tipoffTime: tipoff, gatheringTime: gathering, kit } = matchLogistics(nextMatch);
    const jerseyColor = kit || '';

    const saved = await prisma.preGameBriefing.upsert({
      where: {
        seasonId_opponentName: {
          seasonId: targetSeasonId,
          opponentName: String(opponent)
        }
      },
      create: {
        seasonId: targetSeasonId,
        opponentName: String(opponent),
        matchDate,
        gatheringTime: gathering,
        tipoffTime: tipoff,
        jerseyColor,
        venue: nextMatch?.venue || DEFAULT_PREGAME_VENUE,
        tacticalKeys: parsed.tacticalKeys || [],
        startingFive: parsed.startingFive || [],
        benchKeys: parsed.benchKeys || null,
        generatedByAi: true,
        model: getGeminiModelName()
      },
      update: {
        matchDate,
        venue: nextMatch?.venue || DEFAULT_PREGAME_VENUE,
        gatheringTime: gathering,
        tipoffTime: tipoff,
        jerseyColor,
        tacticalKeys: parsed.tacticalKeys || [],
        startingFive: parsed.startingFive || [],
        benchKeys: parsed.benchKeys || null,
        generatedByAi: true,
        model: getGeminiModelName()
      }
    });

    res.json({
      briefing: saved,
      model: getGeminiModelName()
    });
  } catch (err) {
    console.error('Error generating pregame briefing card:', err);
    res.status(500).json({ error: err.message || 'Błąd generowania karty odprawy' });
  }
});
