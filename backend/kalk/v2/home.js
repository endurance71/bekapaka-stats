/**
 * Start zawodnika (GET /api/me/home): następny mecz drużyny, mój ostatni mecz i miejsce w tabeli.
 * Czysty moduł odczytu — Prisma jako argument (testy: tests/helpers/fakePrisma.js).
 */
import { isBekapakaTeamName } from '../parseMatchBoxScore.js';
import { normalizeTeamNameForMatch } from '../../lib/kalkTeamNames.js';

const sameTeam = (a, b) => normalizeTeamNameForMatch(a) === normalizeTeamNameForMatch(b);
const parseForm = (form) => (form ? String(form).split(',').map((s) => s.trim()).filter(Boolean) : []);
const iso = (d) => (d instanceof Date ? d.toISOString() : d ?? null);

function tableRow(row) {
  if (!row) return null;
  return {
    name: row.name,
    position: row.position ?? null,
    matches: row.matches ?? 0,
    wins: row.wins ?? 0,
    losses: row.losses ?? 0,
    form: parseForm(row.form),
    streak: row.streak ?? null
  };
}

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {{ userId: string, seasonId: string, now?: Date }} opts
 */
export async function getPlayerHome(prisma, { userId, seasonId, now = new Date() }) {
  const [roster, schedule, table] = await Promise.all([
    prisma.rosterPlayer.findUnique({ where: { id: userId }, select: { id: true, kalkSlug: true } }),
    prisma.leagueMatch.findMany({ where: { seasonId }, orderBy: { date: 'asc' } }),
    prisma.leagueTeam.findMany({ where: { seasonId, phase: 'regular' } })
  ]);

  const ours = (schedule || []).filter((m) => isBekapakaTeamName(m.homeTeam) || isBekapakaTeamName(m.guestTeam));
  // Mecz w toku jeszcze się liczy jako „następny” (3 h od startu)
  const cutoff = now.getTime() - 3 * 60 * 60 * 1000;
  const next = ours.find((m) => !m.isFinished && new Date(m.date).getTime() >= cutoff) || null;

  const bekapakaRow = (table || []).find((t) => isBekapakaTeamName(t.name)) || null;
  let nextMatch = null;
  if (next) {
    const usHome = isBekapakaTeamName(next.homeTeam);
    const opponent = usHome ? next.guestTeam : next.homeTeam;
    nextMatch = {
      id: next.kalkMatchId || next.id,
      date: iso(next.date),
      venue: next.venue ?? null,
      roundLabel: next.roundLabel ?? null,
      phaseLabel: next.phaseLabel ?? null,
      host: next.homeTeam,
      opponent,
      opponentKalkId: (usHome ? next.guestTeamKalkId : next.homeTeamKalkId) ?? null,
      opponentTable: tableRow((table || []).find((t) => sameTeam(t.name, opponent)))
    };
  }

  let myLastGame = null;
  if (roster?.kalkSlug) {
    const logs = (await prisma.kalkPlayerGameLog.findMany({
      where: { seasonId, playerSlug: roster.kalkSlug },
      select: { kalkMatchId: true, pts: true, reb: true, ast: true, eval: true, secondsPlayed: true, starter: true, side: true }
    })) || [];
    if (logs.length) {
      const matches = (await prisma.kalkMatch.findMany({
        where: { seasonId, id: { in: logs.map((l) => l.kalkMatchId) } },
        select: { id: true, date: true, homeTeamName: true, guestTeamName: true, scoreHome: true, scoreAway: true }
      })) || [];
      const byId = new Map(matches.map((m) => [m.id, m]));
      const latest = logs
        .filter((l) => byId.has(l.kalkMatchId))
        .sort((a, b) => new Date(byId.get(b.kalkMatchId).date) - new Date(byId.get(a.kalkMatchId).date))[0];
      if (latest) {
        const m = byId.get(latest.kalkMatchId);
        const usHome = isBekapakaTeamName(m.homeTeamName);
        const scoreUs = usHome ? m.scoreHome : m.scoreAway;
        const scoreThem = usHome ? m.scoreAway : m.scoreHome;
        myLastGame = {
          id: m.id,
          date: iso(m.date),
          opponent: usHome ? m.guestTeamName : m.homeTeamName,
          scoreUs,
          scoreThem,
          result: scoreUs != null && scoreThem != null ? (scoreUs > scoreThem ? 'W' : scoreUs < scoreThem ? 'L' : null) : null,
          pts: latest.pts ?? 0,
          reb: latest.reb ?? 0,
          ast: latest.ast ?? 0,
          eval: latest.eval ?? null,
          minutes: latest.secondsPlayed != null ? Math.round(latest.secondsPlayed / 60) : null,
          starter: Boolean(latest.starter)
        };
      }
    }
  }

  return {
    seasonId,
    teamsInLeague: (table || []).length,
    team: tableRow(bekapakaRow),
    nextMatch,
    myLastGame,
    remainingGames: ours.filter((m) => !m.isFinished).length
  };
}
