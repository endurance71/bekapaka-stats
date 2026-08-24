import express from 'express';
import { prisma } from '../lib/prisma.js';
import { generateText, getGeminiModelName } from '../ai/geminiClient.js';
import {
  buildTacticalPlaySystemInstruction,
  buildTacticalPlayUserPrompt
} from '../ai/prompts/tacticalPlayGenerator.pl.js';
import {
  buildPreGameCardSystemInstruction,
  buildPreGameCardUserPrompt
} from '../ai/prompts/pregameBriefingCard.pl.js';
import { resolveSeasonId, getActiveSeason, getSeasonById } from '../seasonService.js';
import { getRoster, getNextOpponentScouting } from '../dataStore.js';
import { DEFAULT_PLAYBOOK_PRESETS } from '../lib/playbookPresets.js';

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

    let plays = await prisma.play.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // Auto-seed jeśli baza zagrywek jest pusta
    if (plays.length === 0 && !category && !targetDefense) {
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
      jsonMode: true
    });

    const parsed = JSON.parse(rawJson);
    if (!parsed || !parsed.name) {
      throw new Error('Nieprawidłowa odpowiedź AI');
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

// GET /api/tactics/synergy
tacticsRouter.get('/synergy', async (req, res) => {
  try {
    const targetSeasonId = await resolveSeasonId(req.query.seasonId);
    const season = await getSeasonById(targetSeasonId);
    const roster = await getRoster(targetSeasonId);

    if (!season) {
      return res.json({ duos: [], bestOffensivePair: null, bestDefensivePair: null, gamesAnalyzed: 0 });
    }

    // Pobierz wszystkie logi meczowe zawodników w tym sezonie
    const kalkLogs = await prisma.kalkPlayerGameLog.findMany({
      where: { seasonId: season.id },
      include: { kalkMatch: true, kalkPlayer: true }
    });

    // Zgrupuj logi meczowe według meczu
    const matchMap = new Map();
    for (const log of kalkLogs) {
      const matchId = log.kalkMatchId;
      if (!matchMap.has(matchId)) {
        matchMap.set(matchId, []);
      }
      const stats = log.stats && typeof log.stats === 'object' ? log.stats : {};
      const pts = Number(stats.pts) || 0;
      const pm = Number(stats.plusMinus) || 0;
      const min = String(stats.min || '0:0');
      matchMap.get(matchId).push({
        playerId: log.kalkPlayerId,
        playerName: log.kalkPlayer?.name || log.opponentName || 'Zawodnik',
        pts,
        plusMinus: pm,
        min
      });
    }

    const gamesAnalyzed = matchMap.size;
    if (gamesAnalyzed === 0) {
      return res.json({ duos: [], bestOffensivePair: null, bestDefensivePair: null, gamesAnalyzed: 0 });
    }

    // Oblicz statystyki par (duetów)
    const duoMap = new Map();

    for (const [matchId, playersInMatch] of matchMap.entries()) {
      for (let i = 0; i < playersInMatch.length; i++) {
        for (let j = i + 1; j < playersInMatch.length; j++) {
          const p1 = playersInMatch[i];
          const p2 = playersInMatch[j];
          const key = [p1.playerId, p2.playerId].sort().join('___');

          if (!duoMap.has(key)) {
            duoMap.set(key, {
              p1Id: p1.playerId,
              p1Name: p1.playerName,
              p2Id: p2.playerId,
              p2Name: p2.playerName,
              gamesTogether: 0,
              combinedPoints: 0,
              totalPlusMinus: 0,
              plusMinusList: []
            });
          }

          const record = duoMap.get(key);
          record.gamesTogether++;
          record.combinedPoints += (p1.pts + p2.pts);
          record.totalPlusMinus += (p1.plusMinus + p2.plusMinus) / 2; // avg +/- pary
          record.plusMinusList.push((p1.plusMinus + p2.plusMinus) / 2);
        }
      }
    }

    // Dopasuj nazwiska z RosterPlayer
    const playerLookup = new Map();
    for (const r of roster) {
      const kalkId = r.kalkPlayerId || r.kalkPlayer?.id;
      if (kalkId) {
        playerLookup.set(kalkId, { name: `${r.firstName} ${r.lastName}`, number: r.number, photo: r.photo });
      }
    }

    const duos = Array.from(duoMap.values())
      .filter(d => d.gamesTogether >= 1)
      .map(d => {
        const p1Info = playerLookup.get(d.p1Id) || { name: d.p1Name, number: null };
        const p2Info = playerLookup.get(d.p2Id) || { name: d.p2Name, number: null };
        const avgCombinedPpg = parseFloat((d.combinedPoints / d.gamesTogether).toFixed(1));
        const avgPlusMinus = parseFloat((d.totalPlusMinus / d.gamesTogether).toFixed(1));

        return {
          id: `${d.p1Id}___${d.p2Id}`,
          player1: { id: d.p1Id, name: p1Info.name, number: p1Info.number },
          player2: { id: d.p2Id, name: p2Info.name, number: p2Info.number },
          gamesTogether: d.gamesTogether,
          combinedPoints: d.combinedPoints,
          avgCombinedPpg,
          avgPlusMinus,
          synergyScore: parseFloat((avgCombinedPpg * 0.4 + avgPlusMinus * 0.6).toFixed(1))
        };
      })
      .sort((a, b) => b.synergyScore - a.synergyScore);

    const bestOffensivePair = [...duos].sort((a, b) => b.avgCombinedPpg - a.avgCombinedPpg)[0] || null;
    const bestDefensivePair = [...duos].sort((a, b) => b.avgPlusMinus - a.avgPlusMinus)[0] || null;

    res.json({
      duos,
      bestOffensivePair,
      bestDefensivePair,
      gamesAnalyzed
    });
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

    const [roster, scoutingReport] = await Promise.all([
      getRoster(targetSeasonId),
      prisma.scoutingAiReport.findFirst({
        where: { opponentName: { contains: String(opponent), mode: 'insensitive' } }
      })
    ]);

    const system = buildPreGameCardSystemInstruction();
    const user = buildPreGameCardUserPrompt({
      opponentName: opponent,
      scoutingReport,
      roster,
      nextMatch
    });

    const rawJson = await generateText({
      system,
      user,
      jsonMode: true
    });

    const parsed = JSON.parse(rawJson);

    const matchDate = nextMatch?.date ? new Date(nextMatch.date) : new Date();
    const isHome = nextMatch?.homeTeam?.toLowerCase().includes('bekapaka') ?? true;

    const tipoff = matchDate && !isNaN(matchDate.getTime())
      ? matchDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
      : '18:30';

    // Godzina zbiórki: 45 minut przed meczem
    const gatheringDate = new Date(matchDate.getTime() - 45 * 60 * 1000);
    const gathering = !isNaN(gatheringDate.getTime())
      ? gatheringDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
      : '17:45';

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
        jerseyColor: isHome ? 'Czarne' : 'Białe',
        venue: 'Hala Sportowa, Bobolice',
        tacticalKeys: parsed.tacticalKeys || [],
        startingFive: parsed.startingFive || [],
        benchKeys: parsed.benchKeys || null,
        generatedByAi: true,
        model: getGeminiModelName()
      },
      update: {
        matchDate,
        gatheringTime: gathering,
        tipoffTime: tipoff,
        jerseyColor: isHome ? 'Czarne' : 'Białe',
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
