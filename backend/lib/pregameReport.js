/**
 * Dane do drukowanego raportu o rywalu (odprawa A4 / PDF).
 * Wyłącznie liczby z bazy: scouting rywala (ten sam payload co analiza), średnie BeKaPaKa z box score,
 * tabela, a dla każdego zawodnika rywala i naszej kadry — bieżący i poprzedni sezon z kariery KALK.
 */
import { prisma } from './prisma.js';
import { LEAGUE_TABLE_ORDER_BY } from './leagueTeamResolve.js';
import { getDetailedScouting, getRoster } from '../dataStore.js';
import { loadScoutingExtras } from '../ai/scoutingData.js';
import { getPlayerCareer } from '../kalk/v2/readModels.js';
import { normTeam, pickSeasons, seasonLabel } from './pregameSeasons.js';
import { squadForMatch } from './matchDay.js';

async function careerSafe(id) {
  try {
    return await getPlayerCareer(prisma, id);
  } catch {
    return null;
  }
}

/**
 * @param {{ seasonId: string, opponent: string, matchDay?: any }} target
 * @returns {Promise<object|null>} null, gdy brak danych scoutingu rywala
 */
export async function loadPregameReport({ seasonId, opponent, matchDay = null }) {
  const scouting = await getDetailedScouting(opponent, seasonId, { includeAiPayload: true }).catch(() => null);
  if (!scouting?.aiPayload) return null;
  const ai = scouting.aiPayload;
  const sid = scouting.seasonId || seasonId;
  const usName = ai.teamInfo?.bekapaka?.name || 'BeKaPaKa Bobolice';

  const [seasons, table, usExtras, oppExtras, roster] = await Promise.all([
    prisma.kalkSeason.findMany({ select: { id: true, slug: true } }).catch(() => []),
    prisma.leagueTeam.findMany({ where: { seasonId: sid, phase: 'regular' }, orderBy: LEAGUE_TABLE_ORDER_BY }).catch(() => []),
    loadScoutingExtras({ opponentName: usName, seasonId: sid }).catch(() => ({})),
    loadScoutingExtras({ opponentName: opponent, seasonId: sid }).catch(() => ({})),
    getRoster(sid).catch(() => [])
  ]);
  const sorted = [...seasons].sort((a, b) => a.slug.localeCompare(b.slug));
  const idx = sorted.findIndex((s) => s.id === sid);
  const seasonSlug = idx >= 0 ? sorted[idx].slug : null;
  const prevSlug = idx > 0 ? sorted[idx - 1].slug : null;

  // Zawodnicy rywala: wszyscy z meczami w tym sezonie (ten sam klucz drużyny co scouting)
  const simple = String(opponent).split('-')[0].trim() || opponent;
  const teamWhere = oppExtras.teamKalkId
    ? { OR: [{ teamKalkId: oppExtras.teamKalkId }, { teamName: { contains: simple, mode: 'insensitive' } }] }
    : { teamName: { contains: simple, mode: 'insensitive' } };
  const oppRows = await prisma.kalkPlayerSeasonStat
    .findMany({ where: { seasonId: sid, games: { gt: 0 }, ...teamWhere }, orderBy: { pts: 'desc' }, take: 14 })
    .catch(() => []);
  const bySlug = new Map();
  for (const r of oppRows) if (!bySlug.has(r.playerSlug)) bySlug.set(r.playerSlug, r);
  const pmByName = new Map((ai.keyPlayers || []).map((p) => [normTeam(p.name), p]));

  const opponentPlayers = (
    await Promise.all(
      [...bySlug.keys()].map(async (slug) => {
        const career = await careerSafe(slug);
        if (!career) return null;
        const { current, previous } = pickSeasons(career, { seasonSlug, prevSlug, teamName: opponent });
        if (!current) return null;
        const name = career.profile?.fullName || slug;
        const pm = pmByName.get(normTeam(name));
        const cur = (career.gameLogSummary || []).find((g) => g.seasonSlug === seasonSlug);
        return {
          slug,
          name,
          number: career.profile?.lastNumber ?? null,
          position: career.profile?.position ?? null,
          heightCm: career.profile?.heightCm ?? null,
          birthYear: career.profile?.birthYear ?? null,
          current,
          previous,
          starts: cur?.starts ?? null,
          plusMinus: pm?.plusMinus ?? null,
          plusMinusGames: pm?.plusMinusGames ?? 0,
          careerBest: career.careerRecords
            ? { pts: career.careerRecords.bestPts?.value ?? null, reb: career.careerRecords.bestReb?.value ?? null, ast: career.careerRecords.bestAst?.value ?? null }
            : null,
          seasonsPlayed: [...new Set((career.seasons || []).filter((s) => s.games > 0).map((s) => s.seasonSlug))].length
        };
      })
    )
  )
    .filter(Boolean)
    .sort((a, b) => (b.current.perGame?.pts ?? 0) - (a.current.perGame?.pts ?? 0));

  const squad = squadForMatch(roster, matchDay);
  const person = (p) => ({ id: p.id, name: `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim(), number: p.number ?? null });

  return {
    squad: squad.set
      ? { available: squad.available.map(person), unavailable: squad.unavailable.map((u) => ({ ...person(u.player), reason: u.reason })) }
      : null,
    seasonLabel: seasonLabel(seasonSlug),
    prevSeasonLabel: seasonLabel(prevSlug),
    teams: { us: ai.teamInfo?.bekapaka || null, them: ai.teamInfo?.opponent || null },
    averages: { us: usExtras.teamSeasonAverages || null, them: ai.teamSeasonAverages || null },
    advanced: { us: ai.bekapakaAdvancedStats || null, them: ai.advancedStats || null },
    pbp: { us: usExtras.playByPlayTendencies || null, them: ai.playByPlayTendencies || null },
    form: { us: usExtras.form || [], them: ai.form || [] },
    headToHead: ai.headToHead || [],
    previousSeasons: { us: usExtras.previousSeasons || [], them: ai.previousSeasons || [] },
    table: table.map((t, i) => ({
      rank: t.position ?? i + 1,
      name: t.name,
      matches: t.matches,
      wins: t.wins,
      losses: t.losses,
      pointsFor: t.pointsFor,
      pointsAgainst: t.pointsAgainst,
      points: t.points
    })),
    analysis: scouting.aiMeta?.fromGemini ? scouting.aiAnalysis : null,
    opponentPlayers
  };
}

