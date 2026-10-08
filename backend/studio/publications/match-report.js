// Public statistics of one played KALK match for the match report: quarters, team totals, the club's box score,
// the opponent's top scorers, MVP and the next club match. Server-only (reads the stats database).
// Internal data (match-day notes, gathering time, kit) never enters public facts.
import { isClub } from '../sources.js';
import { matchReportSchema } from './channels.js';

const num = (v) => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Math.round(Number(v)) : null);
const pct = (made, att) => (num(att) > 0 ? Math.round((num(made) / num(att)) * 100) : null);
const ratio = (made, att) => (num(att) !== null && num(made) !== null ? `${num(made)}/${num(att)}` : '');

function teamLine(t) {
  if (!t) return null;
  return {
    fg: ratio(t.fgm, t.fga),
    fgPct: pct(t.fgm, t.fga),
    three: ratio(t.threePm, t.threePa),
    threePct: pct(t.threePm, t.threePa),
    ft: ratio(t.ftm, t.fta),
    ftPct: pct(t.ftm, t.fta),
    reb: num(t.reb),
    ast: num(t.ast),
    stl: num(t.stl),
    tov: num(t.tov),
    blk: num(t.blk),
    benchPts: num(t.benchPts),
    fastBreakPts: num(t.fastBreakPts),
    ptsOffTurnovers: num(t.ptsOffTurnovers),
  };
}

const quarterLabel = (period, label) => (period > 4 || /^(ot|dog)/i.test(label || '') ? `Dogrywka${period > 5 ? ` ${period - 4}` : ''}` : `${period}. kwarta`);

/**
 * @param {import('@prisma/client').PrismaClient} db
 * @param {{ id: string, seasonId: string, date: string, source: string }} match snapshot from sources.matches()
 * @param {Array<{ date: string, opponent: string, venue: string, scoreUs: number|null }>} schedule club matches of the season
 */
export async function matchReport(db, match, schedule = []) {
  if (match.source !== 'kalk') return null;
  const km = await db.kalkMatch.findUnique({ where: { seasonId_id: { seasonId: match.seasonId, id: match.id } } });
  if (!km?.isFinished && km?.scoreHome == null) return null;
  const usSide = isClub(km.homeTeamName) ? 'home' : 'away';
  const themSide = usSide === 'home' ? 'away' : 'home';

  const rawQuarters = Array.isArray(km.info?.quarters) ? km.info.quarters : Array.isArray(km.boxScore?.quarters) ? km.boxScore.quarters : [];
  const quarters = rawQuarters
    .map((q, i) => ({ period: num(q.period) ?? i + 1, label: q.label, us: num(q[usSide]), them: num(q[themSide]) }))
    .filter((q) => q.us !== null && q.them !== null)
    .map((q) => ({ label: quarterLabel(q.period, q.label), us: q.us, them: q.them }));
  const halftime = quarters.length >= 2 ? { us: quarters[0].us + quarters[1].us, them: quarters[0].them + quarters[1].them } : null;

  const [stats, logs] = await Promise.all([
    db.kalkTeamGameStat.findMany({ where: { seasonId: match.seasonId, kalkMatchId: km.id } }),
    db.kalkPlayerGameLog.findMany({ where: { seasonId: match.seasonId, kalkMatchId: km.id }, include: { kalkPlayer: { select: { name: true } } } }),
  ]);
  const us = stats.find((s) => s.side === usSide);
  const them = stats.find((s) => s.side === themSide);

  const played = (l) => (num(l.secondsPlayed) ?? 0) > 0 || (num(l.pts) ?? 0) > 0;
  const name = (l) => l.kalkPlayer?.name || l.playerName || '';
  const byPoints = (a, b) => (num(b.pts) ?? 0) - (num(a.pts) ?? 0) || (num(b.eval) ?? 0) - (num(a.eval) ?? 0);
  const players = logs
    .filter((l) => isClub(l.teamName) && played(l) && name(l))
    .sort(byPoints)
    .slice(0, 16)
    .map((l) => ({
      name: name(l),
      number: num(l.number),
      pts: num(l.pts) ?? 0,
      reb: num(l.reb) ?? 0,
      ast: num(l.ast) ?? 0,
      stl: num(l.stl) ?? 0,
      three: ratio(l.threePm, l.threePa),
      eval: num(l.eval),
    }));
  const opponentTop = logs
    .filter((l) => !isClub(l.teamName) && (num(l.pts) ?? 0) > 0 && name(l))
    .sort(byPoints)
    .slice(0, 3)
    .map((l) => ({ name: name(l), pts: num(l.pts) ?? 0, reb: num(l.reb) ?? 0 }));

  const mvpName = km.info?.mvp?.name;
  const mvp = mvpName ? { name: mvpName, eval: num(km.info.mvp.eval ?? km.mvpEval) } : null;

  const after = Date.parse(match.date);
  const next = schedule
    .filter((m) => m.scoreUs === null && Number.isFinite(Date.parse(m.date)) && Date.parse(m.date) > after)
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))[0];

  return matchReportSchema.parse({
    quarters,
    halftime,
    overtimes: num(km.overtimes) ?? 0,
    team: us && them ? { us: teamLine(us), them: teamLine(them) } : null,
    players,
    opponentTop,
    mvp,
    nextMatch: next ? { opponent: next.opponent, date: next.date, venue: next.venue } : null,
  });
}
