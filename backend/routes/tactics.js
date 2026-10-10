import express from 'express';
import { prisma } from '../lib/prisma.js';
import { generatePlay, generatePregame } from '../ai/tacticsOps.js';
import { resolveSeasonId, getSeasonById } from '../seasonService.js';
import { getNextOpponentScouting } from '../dataStore.js';
import { DEFAULT_PLAYBOOK_PRESETS } from '../lib/playbookPresets.js';
import { upgradePresetPlays } from '../lib/playbookUpgrade.js';

// Raz na proces: zagrywki z presetów pod starymi nazwami → polska wersja
let presetUpgrade = null;
import { computeTeamSynergy, emptySynergy } from '../kalk/v2/synergy.js';
import { signPrintToken } from '../lib/pregamePrint.js';
import { getJwtSecret } from '../lib/requireEnv.js';

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

// POST /api/tactics/plays/generate (AI) — silnik tekstowy wg ustawienia „Dostawca AI”
tacticsRouter.post('/plays/generate', async (req, res) => {
  try {
    const { category, targetDefense, goal, additionalNotes, seasonId } = req.body;
    const { play, model } = await generatePlay({ category, targetDefense, goal, additionalNotes, seasonId });
    res.status(201).json({ play, model });
  } catch (err) {
    console.error('Error generating play with AI:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Błąd generacji zagrywki AI' });
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

// GET /api/tactics/pregame/print-link — krótki podpisany link do strony A4 (działa w Safari bez sesji aplikacji)
tacticsRouter.get('/pregame/print-link', async (req, res) => {
  try {
    const seasonId = await resolveSeasonId(req.query.seasonId);
    const opponent = typeof req.query.opponent === 'string' ? req.query.opponent.trim() : '';
    if (!seasonId || !opponent) return res.status(400).json({ error: 'Brak rywala do druku odprawy' });
    const t = signPrintToken(getJwtSecret(), { seasonId, opponent });
    res.json({ url: `/api/print/pregame?t=${encodeURIComponent(t)}` });
  } catch (err) {
    console.error('Print link error:', err);
    res.status(500).json({ error: 'Nie udało się przygotować druku' });
  }
});

// POST /api/tactics/pregame/generate — silnik tekstowy wg ustawienia „Dostawca AI”
tacticsRouter.post('/pregame/generate', async (req, res) => {
  try {
    const { seasonId, opponent, force } = req.body;
    const result = await generatePregame({ seasonId, opponent }, { force: Boolean(force) });
    res.json(result);
  } catch (err) {
    console.error('Error generating pregame briefing card:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Błąd generowania karty odprawy' });
  }
});
