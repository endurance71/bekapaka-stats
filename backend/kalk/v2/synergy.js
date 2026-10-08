/**
 * Duety BeKaPaKa w sezonie (Taktyka → „Synergia duetów”, GET /api/tactics/synergy).
 *
 * Mecze z akcją po akcji (od 2026/27): wspólny czas na parkiecie i bilans punktów w tym czasie (`lineups.js`).
 * Starsze sezony (tylko box score): wspólne mecze i punkty pary — bez +/-, którego box score nie daje dla par.
 * Zawsze tylko zawodnicy BeKaPaKa.
 */
import { isBekapakaTeamName } from '../parseMatchBoxScore.js';
import { certainShare, computeLineupStints, pairStats } from './lineups.js';

export const MIN_PAIR_MINUTES = 10;
export const MIN_BOX_GAMES = 3;
const BEST_PAIR_MINUTES = 20;

const PBP_SELECT = {
  kalkMatchId: true,
  seq: true,
  elapsedSec: true,
  side: true,
  playerSlug: true,
  playerName: true,
  playerNumber: true,
  actionType: true,
  subOutSlug: true,
  subOutNumber: true,
  scoreHome: true,
  scoreAway: true
};

const round1 = (n) => Math.round(n * 10) / 10;
const per10 = (points, seconds) => (seconds > 0 ? round1((points / seconds) * 600) : null);

export function emptySynergy(source = 'none') {
  return { source, gamesAnalyzed: 0, dataQuality: null, duos: [], bestOffensivePair: null, bestDefensivePair: null };
}

function rosterLookup(roster) {
  const bySlug = new Map();
  for (const r of roster || []) {
    if (r.kalkSlug) bySlug.set(r.kalkSlug, r);
  }
  return bySlug;
}

function personOf(key, bySlug, names) {
  const r = bySlug.get(key);
  const seen = names.get(key) || {};
  return {
    id: key,
    rosterId: r?.id ?? null,
    name: r ? `${r.firstName} ${r.lastName}`.trim() : seen.name || key,
    number: r?.number ?? seen.number ?? null
  };
}

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {string} seasonId
 */
export async function computeTeamSynergy(prisma, seasonId) {
  const matches = ((await prisma.kalkMatch.findMany({
    where: { seasonId },
    select: { id: true, homeTeamName: true, guestTeamName: true }
  })) || []).filter((m) => isBekapakaTeamName(m.homeTeamName) || isBekapakaTeamName(m.guestTeamName));
  if (!matches.length) return emptySynergy();

  const roster = (await prisma.rosterPlayer.findMany({
    select: { id: true, firstName: true, lastName: true, number: true, kalkSlug: true }
  })) || [];
  const bySlug = rosterLookup(roster);

  const events = (await prisma.kalkPlayByPlayEvent.findMany({
    where: { seasonId, kalkMatchId: { in: matches.map((m) => m.id) } },
    select: PBP_SELECT
  })) || [];
  const eventsByMatch = new Map();
  for (const ev of events) {
    if (!eventsByMatch.has(ev.kalkMatchId)) eventsByMatch.set(ev.kalkMatchId, []);
    eventsByMatch.get(ev.kalkMatchId).push(ev);
  }

  const pbpMatches = matches.filter((m) => (eventsByMatch.get(m.id) || []).some((ev) => ev.actionType === 'sub'));
  if (pbpMatches.length) return synergyFromPlayByPlay(pbpMatches, eventsByMatch, bySlug);
  return synergyFromBoxScore(prisma, seasonId, matches, bySlug);
}

function synergyFromPlayByPlay(pbpMatches, eventsByMatch, bySlug) {
  const pairs = new Map();
  const names = new Map();
  let qualitySum = 0;

  for (const m of pbpMatches) {
    const side = isBekapakaTeamName(m.homeTeamName) ? 'home' : 'away';
    const { stints, players } = computeLineupStints(eventsByMatch.get(m.id), side);
    for (const [k, v] of players) if (!names.has(k)) names.set(k, v);
    qualitySum += certainShare(stints);
    for (const [key, p] of pairStats(stints)) {
      const row = pairs.get(key) || { a: p.a, b: p.b, seconds: 0, pointsFor: 0, pointsAgainst: 0, games: new Set() };
      row.seconds += p.seconds;
      row.pointsFor += p.pointsFor;
      row.pointsAgainst += p.pointsAgainst;
      if (p.seconds > 0) row.games.add(m.id);
      pairs.set(key, row);
    }
  }

  const duos = [...pairs.values()]
    .filter((p) => p.seconds >= MIN_PAIR_MINUTES * 60)
    .map((p) => ({
      id: `${p.a}___${p.b}`,
      player1: personOf(p.a, bySlug, names),
      player2: personOf(p.b, bySlug, names),
      gamesTogether: p.games.size,
      minutesTogether: Math.round(p.seconds / 60),
      pointsFor: p.pointsFor,
      pointsAgainst: p.pointsAgainst,
      plusMinus: p.pointsFor - p.pointsAgainst,
      pointsForPer10: per10(p.pointsFor, p.seconds),
      pointsAgainstPer10: per10(p.pointsAgainst, p.seconds)
    }))
    .sort((x, y) => y.plusMinus - x.plusMinus || y.minutesTogether - x.minutesTogether);

  const eligible = duos.filter((d) => d.minutesTogether >= BEST_PAIR_MINUTES);
  const bestOffensivePair = [...eligible].sort((x, y) => y.pointsForPer10 - x.pointsForPer10)[0] || null;
  const bestDefensivePair = [...eligible].sort((x, y) => x.pointsAgainstPer10 - y.pointsAgainstPer10)[0] || null;

  return {
    source: 'pbp',
    gamesAnalyzed: pbpMatches.length,
    dataQuality: round1((qualitySum / pbpMatches.length) * 100),
    duos,
    bestOffensivePair,
    bestDefensivePair
  };
}

async function synergyFromBoxScore(prisma, seasonId, matches, bySlug) {
  const logs = ((await prisma.kalkPlayerGameLog.findMany({
    where: { seasonId, kalkMatchId: { in: matches.map((m) => m.id) } },
    select: { kalkMatchId: true, playerSlug: true, teamName: true, pts: true }
  })) || []).filter((l) => l.playerSlug && isBekapakaTeamName(l.teamName));
  if (!logs.length) return emptySynergy('box');

  const byMatch = new Map();
  const names = new Map();
  for (const l of logs) {
    if (!byMatch.has(l.kalkMatchId)) byMatch.set(l.kalkMatchId, []);
    byMatch.get(l.kalkMatchId).push(l);
  }

  // Nazwiska spoza składu (np. byli zawodnicy) z profili KALK
  const missing = [...new Set(logs.map((l) => l.playerSlug))].filter((slug) => !bySlug.has(slug));
  if (missing.length) {
    const profiles = (await prisma.kalkPlayerProfile.findMany({ where: { slug: { in: missing } }, select: { slug: true, fullName: true } })) || [];
    for (const pr of profiles) names.set(pr.slug, { name: pr.fullName, number: null });
  }

  const pairs = new Map();
  for (const rows of byMatch.values()) {
    for (let i = 0; i < rows.length; i += 1) {
      for (let j = i + 1; j < rows.length; j += 1) {
        const [x, y] = [rows[i], rows[j]].sort((p, q) => p.playerSlug.localeCompare(q.playerSlug));
        const key = `${x.playerSlug}___${y.playerSlug}`;
        const row = pairs.get(key) || { a: x.playerSlug, b: y.playerSlug, games: 0, points: 0 };
        row.games += 1;
        row.points += (x.pts ?? 0) + (y.pts ?? 0);
        pairs.set(key, row);
      }
    }
  }

  const duos = [...pairs.values()]
    .filter((p) => p.games >= MIN_BOX_GAMES)
    .map((p) => ({
      id: `${p.a}___${p.b}`,
      player1: personOf(p.a, bySlug, names),
      player2: personOf(p.b, bySlug, names),
      gamesTogether: p.games,
      avgCombinedPpg: round1(p.points / p.games)
    }))
    .sort((x, y) => y.gamesTogether - x.gamesTogether || y.avgCombinedPpg - x.avgCombinedPpg);

  return {
    source: 'box',
    gamesAnalyzed: byMatch.size,
    dataQuality: null,
    duos,
    bestOffensivePair: [...duos].sort((x, y) => y.avgCombinedPpg - x.avgCombinedPpg)[0] || null,
    bestDefensivePair: null
  };
}
