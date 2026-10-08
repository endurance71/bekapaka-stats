/**
 * Modele odczytu KALK v2 dla panelu: akcja po akcji, info meczu (MVP, sędziowie, liderzy,
 * przebieg, źródła punktów, H2H, rekordy) i kariera zawodnika.
 *
 * Funkcje przyjmują klienta Prisma jako argument (testy: tests/helpers/fakePrisma.js).
 * Tylko odczyt — żadnych zapisów do bazy.
 */
import { resolveKalkMatchById } from './resolveMatch.js';
import { computePbpInsights } from '../../ai/pbpInsights.js';
import { isBekapakaTeamName } from '../parseMatchBoxScore.js';
import { normalizeMinutesTotal, seasonStatFromPage } from './mapPlayer.js';

const REGULATION_PERIODS = 4;
export const DEFAULT_MIN_RUN = 8;
export const H2H_LIMIT = 10;
/** Kariera w panelu: od sezonu 2023/2024 (pierwszy sezon BeKaPaKa w KALK). */
export const CAREER_FIRST_SEASON_SLUG = '2023-2024';

const RECORD_KEYS = ['pts', 'reb', 'ast', 'stl', 'blk', 'eval'];

const PBP_EVENT_SELECT = {
  seq: true,
  period: true,
  clockSec: true,
  side: true,
  playerName: true,
  playerSlug: true,
  playerNumber: true,
  actionRaw: true,
  actionType: true,
  shotValue: true,
  made: true,
  reboundType: true,
  subOutNumber: true,
  scoreHome: true,
  scoreAway: true,
  isScoring: true
};

/** Etykieta okresu: Q1–Q4, OT1… */
export function periodLabel(period) {
  const p = Number(period) || 0;
  return p > REGULATION_PERIODS ? `OT${p - REGULATION_PERIODS}` : `Q${p}`;
}

const normName = (name) => String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');

function sideTeams(km) {
  const home = {
    name: km.homeTeamName,
    teamKalkId: km.homeTeamId ?? null,
    isBekapaka: isBekapakaTeamName(km.homeTeamName),
    score: km.scoreHome ?? null
  };
  const away = {
    name: km.guestTeamName,
    teamKalkId: km.guestTeamId ?? null,
    isBekapaka: isBekapakaTeamName(km.guestTeamName),
    score: km.scoreAway ?? null
  };
  const bekapakaSide = home.isBekapaka ? 'home' : away.isBekapaka ? 'away' : null;
  return { home, away, bekapakaSide };
}

/**
 * Serie punktowe bez odpowiedzi rywala (≥ minRun). Kolejność wg `seq`.
 * @param {Array<{ seq: number, period: number, side?: string|null, scoreHome: number, scoreAway: number }>} events
 * @param {number} [minRun]
 * @returns {Array<{ side: 'home'|'away', points: number, startSeq: number, endSeq: number, period: number, endPeriod: number, fromScore: {home:number, away:number}, toScore: {home:number, away:number} }>}
 */
export function computeScoringRuns(events, minRun = DEFAULT_MIN_RUN) {
  const sorted = [...(events || [])].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
  const runs = [];
  let prevH = 0;
  let prevA = 0;
  let run = null;
  const close = () => {
    if (run && run.points >= minRun) runs.push(run);
    run = null;
  };
  for (const ev of sorted) {
    const h = typeof ev.scoreHome === 'number' ? ev.scoreHome : prevH;
    const a = typeof ev.scoreAway === 'number' ? ev.scoreAway : prevA;
    const dh = h - prevH;
    const da = a - prevA;
    if (dh === 0 && da === 0) continue;
    let side = null;
    if (dh > 0 && da === 0) side = 'home';
    else if (da > 0 && dh === 0) side = 'away';
    if (!side) {
      // Korekta wyniku / obie strony naraz — zamknij serię.
      close();
    } else if (run && run.side === side) {
      run.points += side === 'home' ? dh : da;
      run.endSeq = ev.seq;
      run.endPeriod = ev.period;
      run.toScore = { home: h, away: a };
    } else {
      close();
      run = {
        side,
        points: side === 'home' ? dh : da,
        startSeq: ev.seq,
        endSeq: ev.seq,
        period: ev.period,
        endPeriod: ev.period,
        fromScore: { home: prevH, away: prevA },
        toScore: { home: h, away: a }
      };
    }
    prevH = h;
    prevA = a;
  }
  close();
  return runs;
}

/**
 * GET /api/games/:id/play-by-play
 * @returns {Promise<object|null>} null = nieznany mecz (404)
 */
export async function getGamePlayByPlay(prisma, id, { seasonId = null, minRun = DEFAULT_MIN_RUN } = {}) {
  const km = await resolveKalkMatchById(prisma, id, {
    seasonId,
    select: { homeTeamName: true, guestTeamName: true, homeTeamId: true, guestTeamId: true, scoreHome: true, scoreAway: true, hasPlayByPlay: true }
  });
  if (!km) return null;
  const { home, away, bekapakaSide } = sideTeams(km);
  const base = { matchId: km.id, seasonId: km.seasonId, home, away, bekapakaSide };

  const events = (await prisma.kalkPlayByPlayEvent.findMany({
    where: { seasonId: km.seasonId, kalkMatchId: km.id },
    select: PBP_EVENT_SELECT,
    orderBy: { seq: 'asc' }
  })) || [];

  if (events.length === 0) {
    return { ...base, available: false, events: [], periods: [], runs: [], leadChanges: 0, ties: 0, largestLead: { home: 0, away: 0 }, largestRun: { home: 0, away: 0 } };
  }

  const insights = computePbpInsights(events, { labels: { home: 'home', away: 'away' }, minRun });
  const runs = computeScoringRuns(events, minRun);

  const periodEnd = new Map();
  for (const ev of events) periodEnd.set(ev.period, { home: ev.scoreHome, away: ev.scoreAway });
  const periods = [...periodEnd.keys()].sort((x, y) => x - y).map((p) => ({
    period: p,
    label: periodLabel(p),
    scoreHome: periodEnd.get(p).home,
    scoreAway: periodEnd.get(p).away
  }));

  return {
    ...base,
    available: true,
    events,
    periods,
    runs,
    leadChanges: insights.leadChanges ?? 0,
    ties: insights.ties ?? 0,
    largestLead: insights.largestLead ?? { home: 0, away: 0 },
    largestRun: insights.largestRun ?? { home: 0, away: 0 }
  };
}

/** Drużyny box score w kolejności [home, away] (po nazwie, fallback: kolejność). */
function boxSidesOf(km) {
  const teams = Array.isArray(km.boxScore?.teams) ? km.boxScore.teams : [];
  const home = teams.find((t) => normName(t.name) === normName(km.homeTeamName)) || teams[0] || null;
  const away = teams.find((t) => t !== home && normName(t.name) === normName(km.guestTeamName))
    || teams.find((t) => t !== home) || null;
  return { home, away };
}

/**
 * Rekordy meczu z box score: najlepszy zawodnik w PTS/REB/AST/STL/BLK/EVAL dla każdej drużyny.
 * Remisy: wszyscy zawodnicy z tą samą wartością. Brak wartości > 0 (poza EVAL) → null.
 * @param {object} km — KalkMatch (boxScore, homeTeamName, guestTeamName)
 */
export function computeMatchRecords(km) {
  const sides = boxSidesOf(km);
  const out = { home: {}, away: {} };
  for (const side of ['home', 'away']) {
    const players = Array.isArray(sides[side]?.players) ? sides[side].players : [];
    for (const key of RECORD_KEYS) {
      const withValue = players
        .map((p) => ({ p, v: p?.[key] }))
        .filter(({ v }) => typeof v === 'number' && Number.isFinite(v));
      if (!withValue.length) {
        out[side][key] = null;
        continue;
      }
      const best = Math.max(...withValue.map(({ v }) => v));
      if (key !== 'eval' && best <= 0) {
        out[side][key] = null;
        continue;
      }
      out[side][key] = {
        value: best,
        players: withValue
          .filter(({ v }) => v === best)
          .map(({ p }) => ({ name: p.name, slug: p.slug ?? null, number: p.number ?? null }))
      };
    }
  }
  return out;
}

function teamMatches(candidate, ref) {
  if (ref.id && candidate.id && ref.sameSource && String(candidate.id) === String(ref.id)) return true;
  if (ref.name && normName(candidate.name) === normName(ref.name)) return true;
  return ref.isBekapaka && isBekapakaTeamName(candidate.name);
}

/**
 * Poprzednie mecze tych samych drużyn (wszystkie sezony), od najnowszego, max `limit`.
 * ID drużyn porównywane tylko między meczami z tego samego źródła (v2 ↔ v2) — stare ID mogą się powtarzać.
 */
export async function findHeadToHead(prisma, km, { limit = H2H_LIMIT } = {}) {
  const { home, away, bekapakaSide } = sideTeams(km);
  const ids = [home.teamKalkId, away.teamKalkId].filter(Boolean).map(String);
  const names = [home.name, away.name].filter(Boolean);
  const or = [
    ...(ids.length ? [{ homeTeamId: { in: ids } }, { guestTeamId: { in: ids } }] : []),
    { homeTeamName: { in: names } },
    { guestTeamName: { in: names } }
  ];
  if (bekapakaSide) {
    or.push({ homeTeamName: { contains: 'bekapaka', mode: 'insensitive' } }, { guestTeamName: { contains: 'bekapaka', mode: 'insensitive' } });
  }
  const candidates = (await prisma.kalkMatch.findMany({
    where: { OR: or },
    select: {
      id: true, seasonId: true, date: true, homeTeamId: true, guestTeamId: true, homeTeamName: true, guestTeamName: true,
      scoreHome: true, scoreAway: true, isFinished: true, stageLabel: true, roundLabel: true, sourceSite: true
    },
    orderBy: { date: 'desc' }
  })) || [];

  const refFor = (team, candidate) => ({
    id: team.teamKalkId,
    name: team.name,
    isBekapaka: team.isBekapaka,
    sameSource: (candidate.sourceSite || 'legacy') === (km.sourceSite || 'legacy')
  });
  const currentDate = new Date(km.date).getTime();
  // Perspektywa: BeKaPaKa (gdy gra), inaczej gospodarz bieżącego meczu.
  const focus = bekapakaSide === 'away' ? away : home;
  const other = focus === home ? away : home;

  const rows = [];
  for (const c of candidates) {
    if (c.id === km.id && c.seasonId === km.seasonId) continue;
    if (!c.isFinished || c.scoreHome == null || c.scoreAway == null) continue;
    if (!(new Date(c.date).getTime() < currentDate)) continue;
    const cHome = { id: c.homeTeamId, name: c.homeTeamName };
    const cAway = { id: c.guestTeamId, name: c.guestTeamName };
    let focusAtHome;
    if (teamMatches(cHome, refFor(focus, c)) && teamMatches(cAway, refFor(other, c))) focusAtHome = true;
    else if (teamMatches(cAway, refFor(focus, c)) && teamMatches(cHome, refFor(other, c))) focusAtHome = false;
    else continue;
    const focusScore = focusAtHome ? c.scoreHome : c.scoreAway;
    const otherScore = focusAtHome ? c.scoreAway : c.scoreHome;
    rows.push({
      matchId: c.id,
      seasonId: c.seasonId,
      date: c.date instanceof Date ? c.date.toISOString() : c.date,
      homeTeamName: c.homeTeamName,
      guestTeamName: c.guestTeamName,
      scoreHome: c.scoreHome,
      scoreAway: c.scoreAway,
      stageLabel: c.stageLabel ?? null,
      roundLabel: c.roundLabel ?? null,
      focusAtHome,
      focusScore,
      otherScore,
      focusWon: focusScore > otherScore
    });
  }
  rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const meetings = rows.slice(0, limit);
  return {
    focusSide: focus === home ? 'home' : 'away',
    focusTeam: focus.name,
    otherTeam: other.name,
    games: meetings.length,
    focusWins: meetings.filter((m) => m.focusWon).length,
    otherWins: meetings.filter((m) => m.focusScore < m.otherScore).length,
    meetings
  };
}

function teamStatRow(row) {
  if (!row) return null;
  const { seasonId: _s, kalkMatchId: _k, updatedAt: _u, ...rest } = row;
  return rest;
}

function sideForTeamKalkId(teamKalkId, home, away) {
  if (teamKalkId == null) return null;
  if (home.teamKalkId != null && String(teamKalkId) === String(home.teamKalkId)) return 'home';
  if (away.teamKalkId != null && String(teamKalkId) === String(away.teamKalkId)) return 'away';
  return null;
}

/**
 * GET /api/games/:id/info
 * @returns {Promise<object|null>} null = nieznany mecz (404)
 */
export async function getGameInfo(prisma, id, { seasonId = null } = {}) {
  const km = await resolveKalkMatchById(prisma, id, { seasonId });
  if (!km) return null;
  const { home, away, bekapakaSide } = sideTeams(km);
  const info = km.info && typeof km.info === 'object' ? km.info : {};

  const statRows = (await prisma.kalkTeamGameStat.findMany({ where: { seasonId: km.seasonId, kalkMatchId: km.id } })) || [];
  const teamStats = {
    home: teamStatRow(statRows.find((r) => r.side === 'home')),
    away: teamStatRow(statRows.find((r) => r.side === 'away'))
  };

  // MVP: info.mvp (kontrakt) lub kolumny; strona z box score / liderów.
  let mvp = info.mvp ? { ...info.mvp } : km.mvpPlayerSlug ? { slug: km.mvpPlayerSlug, name: null, number: null, eval: km.mvpEval ?? null } : null;
  if (mvp) {
    const sides = boxSidesOf(km);
    for (const side of ['home', 'away']) {
      const p = (sides[side]?.players || []).find((x) => (mvp.slug && x.slug === mvp.slug) || (!mvp.slug && mvp.name && normName(x.name) === normName(mvp.name)));
      if (p) {
        mvp.side = side;
        mvp.teamName = side === 'home' ? home.name : away.name;
        mvp.name = mvp.name || p.name;
        mvp.number = mvp.number ?? p.number ?? null;
        mvp.line = { pts: p.pts ?? null, reb: p.reb ?? null, ast: p.ast ?? null, eval: p.eval ?? null };
        break;
      }
    }
    mvp.side ??= null;
  }

  const referees = Array.isArray(km.refereeList) && km.refereeList.length
    ? km.refereeList
    : Array.isArray(info.referees) && info.referees.length
      ? info.referees
      : String(km.referees || '').split(',').map((s) => s.trim()).filter(Boolean);

  const leaders = {};
  for (const [key, list] of Object.entries(info.leaders || {})) {
    leaders[key] = (Array.isArray(list) ? list : []).map((l) => ({ ...l, side: sideForTeamKalkId(l.teamKalkId, home, away) }));
  }

  const quarters = Array.isArray(info.quarters) && info.quarters.length
    ? [...info.quarters].sort((a, b) => (a.period ?? 0) - (b.period ?? 0)).map((q) => ({
      period: q.period, label: periodLabel(q.period), home: q.home, away: q.away
    }))
    : (Array.isArray(km.boxScore?.quarters) ? km.boxScore.quarters : []).map((q, idx) => ({
      period: idx + 1, label: periodLabel(idx + 1), home: q.home, away: q.away
    }));

  let pointsSources = info.pointsSources ?? null;
  if (!pointsSources && (teamStats.home?.ptsOffTurnovers != null || teamStats.away?.ptsOffTurnovers != null)) {
    const pick = (r) => (r ? {
      ptsOffTurnovers: r.ptsOffTurnovers, ptsInPaint: r.ptsInPaint, secondChancePts: r.secondChancePts, fastBreakPts: r.fastBreakPts
    } : null);
    pointsSources = { home: pick(teamStats.home), away: pick(teamStats.away) };
  }

  const h2h = await findHeadToHead(prisma, km);

  return {
    matchId: km.id,
    seasonId: km.seasonId,
    home,
    away,
    bekapakaSide,
    stageLabel: km.stageLabel ?? info.stageLabel ?? null,
    roundLabel: km.roundLabel ?? info.roundLabel ?? km.roundCode ?? null,
    venue: km.venue ?? info.venue ?? null,
    city: info.city ?? null,
    startsAtUtc: km.startsAtUtc ?? info.startsAtUtc ?? null,
    date: km.date,
    overtimes: km.overtimes ?? info.overtimes ?? 0,
    hasPlayByPlay: Boolean(km.hasPlayByPlay),
    sectionsAvailable: km.sectionsAvailable || [],
    mvp,
    referees,
    commissioner: km.commissioner ?? info.commissioner ?? null,
    statistician: km.statistician ?? null,
    leaders,
    flow5: Array.isArray(info.flow5) ? info.flow5 : [],
    quarters,
    pointsSources,
    teamStats,
    h2h,
    records: computeMatchRecords(km)
  };
}

// ---------------------------------------------------------------- kariera zawodnika

const seasonSlugFromLabel = (label) => {
  const m = String(label || '').match(/(\d{4})\s*[/-]\s*(\d{4})/);
  return m ? `${m[1]}-${m[2]}` : null;
};
const seasonLabelFromSlug = (slug) => String(slug || '').replace('-', '/');

const pctOf = (made, att) => (att ? Math.round((made / att) * 1000) / 10 : null);
const per = (total, games) => (games ? Math.round((total / games) * 10) / 10 : null);

/** Wiersz kariery z KalkPlayerSeasonStat (lub wiersza profilu w tym samym kształcie). */
export function careerRowFromSeasonStat(row, season) {
  const games = row.games || 0;
  const minutes = normalizeMinutesTotal(row.minutesTotal, games);
  const fgm = (row.twoPm || 0) + (row.threePm || 0);
  const fga = row.twoPa != null && row.threePa != null ? row.twoPa + row.threePa : null;
  const totals = {
    min: minutes,
    pts: row.pts, reb: row.reb, orb: row.orb, drb: row.drb, ast: row.ast, stl: row.stl, blk: row.blk, tov: row.tov,
    pf: row.pf, pfDrawn: row.pfDrawn, eval: row.eval, plusMinus: row.plusMinus,
    fgm, fga, twoPm: row.twoPm, twoPa: row.twoPa ?? null, threePm: row.threePm, threePa: row.threePa ?? null,
    ftm: row.ftm, fta: row.fta ?? null
  };
  return {
    seasonId: season?.id ?? row.seasonId ?? null,
    seasonSlug: season?.slug ?? null,
    seasonLabel: season?.slug ? seasonLabelFromSlug(season.slug) : null,
    isActiveSeason: Boolean(season?.isActive),
    competition: row.competition,
    teamName: row.teamName,
    teamKalkId: row.teamKalkId ?? null,
    source: row.source,
    games,
    totals,
    perGame: {
      min: minutes != null ? per(minutes, games) : null,
      pts: per(row.pts, games), reb: per(row.reb, games), orb: per(row.orb, games), drb: per(row.drb, games),
      ast: per(row.ast, games), stl: per(row.stl, games), blk: per(row.blk, games), tov: per(row.tov, games),
      pf: per(row.pf, games), eval: per(row.eval, games)
    },
    pct: {
      fg: fga != null ? pctOf(fgm, fga) : null,
      two: row.twoPa != null ? pctOf(row.twoPm, row.twoPa) : (row.twoPct ?? null),
      three: row.threePa != null ? pctOf(row.threePm, row.threePa) : (row.threePct ?? null),
      ft: row.fta != null ? pctOf(row.ftm, row.fta) : (row.ftPct ?? null)
    }
  };
}

const logStat = (log, key, jsonKey = key) => {
  if (typeof log[key] === 'number') return log[key];
  const v = log.stats?.[jsonKey];
  return typeof v === 'number' ? v : Number(v) || 0;
};

/** Podsumowanie logów meczowych jednego sezonu. */
export function summarizeGameLogs(logs, matchDates = new Map()) {
  let wins = 0;
  let losses = 0;
  let starts = 0;
  let doubleDoubles = 0;
  let bestPts = null;
  let bestEval = null;
  let bestReb = null;
  let bestAst = null;
  let bestThreePm = null;
  for (const log of logs) {
    if (log.isWin === true) wins += 1;
    else if (log.isWin === false) losses += 1;
    if (log.starter === true || log.stats?.starter === true) starts += 1;
    const pts = logStat(log, 'pts');
    const reb = logStat(log, 'reb');
    const ast = logStat(log, 'ast');
    const stl = logStat(log, 'stl');
    const blk = logStat(log, 'blk');
    const ev = logStat(log, 'eval');
    if ([pts, reb, ast, stl, blk].filter((v) => v >= 10).length >= 2) doubleDoubles += 1;
    const game = {
      matchId: log.kalkMatchId,
      opponent: log.opponentName,
      date: matchDates.get(`${log.seasonId}|${log.kalkMatchId}`) ?? null
    };
    const threePm = logStat(log, 'threePm', 'three_pm');
    if (!bestPts || pts > bestPts.value) bestPts = { value: pts, ...game };
    if (!bestEval || ev > bestEval.value) bestEval = { value: ev, ...game };
    if (!bestReb || reb > bestReb.value) bestReb = { value: reb, ...game };
    if (!bestAst || ast > bestAst.value) bestAst = { value: ast, ...game };
    if (!bestThreePm || threePm > bestThreePm.value) bestThreePm = { value: threePm, ...game };
  }
  return { games: logs.length, wins, losses, starts, doubleDoubles, bestPts, bestEval, bestReb, bestAst, bestThreePm };
}

/** Slug KALK z RosterPlayer (kalkSlug lub `{sezon}__{slug}` w kalkPlayerId). */
export function rosterKalkSlug(roster) {
  if (!roster) return null;
  if (roster.kalkSlug) return roster.kalkSlug;
  const id = String(roster.kalkPlayerId || '');
  const idx = id.indexOf('__');
  return idx >= 0 ? id.slice(idx + 2) || null : null;
}

/**
 * GET /api/players/:id/career — id = RosterPlayer.id lub slug KALK.
 * @returns {Promise<object|null>} null = nieznany zawodnik (404)
 */
export async function getPlayerCareer(prisma, id, { firstSeasonSlug = CAREER_FIRST_SEASON_SLUG } = {}) {
  const key = String(id || '').trim();
  if (!key) return null;
  let roster = await prisma.rosterPlayer.findUnique({ where: { id: key }, select: { id: true, firstName: true, lastName: true, kalkSlug: true, kalkPlayerId: true, position: true, heightCm: true, number: true } });
  if (!roster) {
    roster = await prisma.rosterPlayer.findFirst({ where: { kalkSlug: key }, select: { id: true, firstName: true, lastName: true, kalkSlug: true, kalkPlayerId: true, position: true, heightCm: true, number: true } });
  }
  const slug = roster ? rosterKalkSlug(roster) : key;

  const seasons = ((await prisma.kalkSeason.findMany({ select: { id: true, slug: true, label: true, isActive: true } })) || [])
    .filter((s) => s.slug >= firstSeasonSlug)
    .sort((a, b) => a.slug.localeCompare(b.slug));
  const seasonById = new Map(seasons.map((s) => [s.id, s]));
  const seasonBySlug = new Map(seasons.map((s) => [s.slug, s]));

  if (!slug) {
    return {
      slug: null,
      rosterPlayerId: roster.id,
      profile: { fullName: `${roster.firstName} ${roster.lastName}`.trim(), position: roster.position ?? null, heightCm: roster.heightCm ?? null, birthYear: null, lastNumber: roster.number ?? null },
      seasons: [],
      gameLogSummary: [],
      careerRecords: null
    };
  }

  const [profile, stats] = await Promise.all([
    prisma.kalkPlayerProfile.findUnique({ where: { slug } }),
    prisma.kalkPlayerSeasonStat.findMany({ where: { playerSlug: slug } })
  ]);

  const rows = [];
  // Ten sam sezon/rozgrywki/drużyna (po ID KALK lub nazwie) — wiersz z bazy ma pierwszeństwo przed profilem.
  const seen = new Set();
  const seenKeys = (sSlug, r) => [
    `${sSlug}|${normName(r.competition)}|n:${normName(r.teamName)}`,
    ...(r.teamKalkId != null ? [`${sSlug}|${normName(r.competition)}|id:${r.teamKalkId}`] : [])
  ];
  const markSeen = (sSlug, r) => seenKeys(sSlug, r).forEach((k) => seen.add(k));
  const isSeen = (sSlug, r) => seenKeys(sSlug, r).some((k) => seen.has(k));
  for (const s of stats || []) {
    const season = seasonById.get(s.seasonId);
    if (!season) continue;
    rows.push(careerRowFromSeasonStat(s, season));
    markSeen(season.slug, s);
  }
  // Sezony bez wierszy w KalkPlayerSeasonStat: z profilu (strona zawodnika KALK).
  for (const oc of Array.isArray(profile?.otherCompetitions) ? profile.otherCompetitions : []) {
    const sSlug = seasonSlugFromLabel(oc.seasonLabel);
    if (!sSlug || sSlug < firstSeasonSlug) continue;
    if (isSeen(sSlug, oc)) continue;
    const season = seasonBySlug.get(sSlug) || { id: null, slug: sSlug, isActive: false };
    const mapped = seasonStatFromPage(oc, { seasonId: season.id, playerSlug: slug });
    rows.push(careerRowFromSeasonStat({ ...mapped, source: 'kalk-profile' }, season));
    markSeen(sSlug, oc);
  }
  rows.sort((a, b) => (a.seasonSlug || '').localeCompare(b.seasonSlug || '') || (b.games - a.games));

  const legacyIds = seasons.map((s) => `${s.slug}__${slug}`);
  const logs = (await prisma.kalkPlayerGameLog.findMany({
    where: { OR: [{ playerSlug: slug }, { kalkPlayerId: { in: legacyIds } }] }
  })) || [];
  const matchIds = [...new Set(logs.map((l) => l.kalkMatchId))];
  const matches = matchIds.length
    ? (await prisma.kalkMatch.findMany({ where: { id: { in: matchIds } }, select: { id: true, seasonId: true, date: true } })) || []
    : [];
  const matchDates = new Map(matches.map((m) => [`${m.seasonId}|${m.id}`, m.date instanceof Date ? m.date.toISOString() : m.date]));
  const logsBySeason = new Map();
  for (const log of logs) {
    if (!seasonById.has(log.seasonId)) continue;
    if (!logsBySeason.has(log.seasonId)) logsBySeason.set(log.seasonId, []);
    logsBySeason.get(log.seasonId).push(log);
  }
  const gameLogSummary = [...logsBySeason.entries()]
    .map(([sid, list]) => {
      const season = seasonById.get(sid);
      return { seasonId: sid, seasonSlug: season.slug, seasonLabel: seasonLabelFromSlug(season.slug), ...summarizeGameLogs(list, matchDates) };
    })
    .sort((a, b) => a.seasonSlug.localeCompare(b.seasonSlug));
  // Rekordy kariery (od 2023/24): najlepszy mecz w punktach, zbiórkach, asystach, trójkach i Eval
  const careerLogs = [...logsBySeason.values()].flat();
  const careerRecords = careerLogs.length ? summarizeGameLogs(careerLogs, matchDates) : null;

  if (!roster && !profile && rows.length === 0 && logs.length === 0) return null;

  return {
    slug,
    rosterPlayerId: roster?.id ?? null,
    profile: {
      fullName: profile?.fullName ?? (roster ? `${roster.firstName} ${roster.lastName}`.trim() : slug),
      position: profile?.position ?? roster?.position ?? null,
      heightCm: profile?.heightCm ?? roster?.heightCm ?? null,
      birthYear: profile?.birthYear ?? null,
      lastNumber: profile?.lastNumber ?? roster?.number ?? null
    },
    seasons: rows,
    gameLogSummary,
    careerRecords
  };
}

const ARCHIVED_TEAM = /^Drużyna archiwalna\b/i;
const ratio = (a, b) => (b > 0 ? Math.round((a / b) * 1000) / 10 : null);
const perGame = (pts, games) => (games > 0 ? Math.round((pts / games) * 10) / 10 : null);

/** Bilans BeKaPaKa z rywalem z zakończonych meczów terminarza (wszystkie sezony w bazie, od 2023/24). */
export function headToHeadByOpponent(leagueMatches, bekapakaKalkId) {
  const out = new Map();
  for (const m of leagueMatches) {
    if (!m.isFinished || m.scoreHome == null || m.scoreAway == null) continue;
    const bkpkHome = m.homeTeamKalkId === bekapakaKalkId;
    if (!bkpkHome && m.guestTeamKalkId !== bekapakaKalkId) continue;
    const opponentId = bkpkHome ? m.guestTeamKalkId : m.homeTeamKalkId;
    if (!opponentId) continue;
    const us = bkpkHome ? m.scoreHome : m.scoreAway;
    const them = bkpkHome ? m.scoreAway : m.scoreHome;
    const row = out.get(opponentId) || { games: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, lastDate: null };
    row.games += 1;
    if (us > them) row.wins += 1;
    else if (us < them) row.losses += 1;
    row.pointsFor += us;
    row.pointsAgainst += them;
    const date = m.date instanceof Date ? m.date.toISOString() : m.date;
    if (date && (!row.lastDate || date > row.lastDate)) row.lastDate = date;
    out.set(opponentId, row);
  }
  return out;
}

/**
 * GET /api/league/all-time — bilans wszech czasów drużyn Dywizji II (strona drużyny KALK)
 * + bilans bezpośredni z BeKaPaKa. Sortowanie: % zwycięstw, potem liczba meczów.
 */
export async function getTeamsAllTime(prisma) {
  const [profiles, active] = await Promise.all([
    prisma.kalkTeamProfile.findMany({ where: { allTimeGames: { gt: 0 } } }),
    prisma.kalkSeason.findFirst({ where: { isActive: true }, select: { id: true } })
  ]);
  const bekapaka = profiles.find((p) => isBekapakaTeamName(p.name)) || null;
  const leagueMatches = bekapaka
    ? await prisma.leagueMatch.findMany({
        where: { isFinished: true, OR: [{ homeTeamKalkId: bekapaka.id }, { guestTeamKalkId: bekapaka.id }] },
        select: { date: true, isFinished: true, scoreHome: true, scoreAway: true, homeTeamKalkId: true, guestTeamKalkId: true }
      })
    : [];
  const activeIds = new Set();
  if (active) {
    const rows = await prisma.leagueMatch.findMany({
      where: { seasonId: active.id },
      select: { homeTeamKalkId: true, guestTeamKalkId: true }
    });
    for (const r of rows) {
      if (r.homeTeamKalkId) activeIds.add(r.homeTeamKalkId);
      if (r.guestTeamKalkId) activeIds.add(r.guestTeamKalkId);
    }
  }
  const h2h = bekapaka ? headToHeadByOpponent(leagueMatches, bekapaka.id) : new Map();

  const teams = profiles.map((p) => {
    const games = p.allTimeGames ?? 0;
    const wins = p.allTimeWins ?? 0;
    const losses = p.allTimeLosses ?? 0;
    const pf = p.allTimePointsFor ?? null;
    const pa = p.allTimePointsAgainst ?? null;
    const qw = p.quartersWon ?? 0;
    const ql = p.quartersLost ?? 0;
    const isBekapaka = bekapaka?.id === p.id;
    return {
      kalkId: p.id,
      slug: p.slug,
      name: p.name,
      since: p.sinceDate instanceof Date ? p.sinceDate.toISOString() : p.sinceDate ?? null,
      captainSlug: p.captainSlug ?? null,
      isBekapaka,
      isArchived: ARCHIVED_TEAM.test(p.name),
      isActive: activeIds.has(p.id),
      games,
      wins,
      losses,
      winPct: ratio(wins, wins + losses),
      pointsFor: pf,
      pointsAgainst: pa,
      pointsForPerGame: pf == null ? null : perGame(pf, games),
      pointsAgainstPerGame: pa == null ? null : perGame(pa, games),
      quartersWon: p.quartersWon ?? null,
      quartersLost: p.quartersLost ?? null,
      quarterWinPct: ratio(qw, qw + ql),
      overtimes: p.overtimes ?? null,
      overtimeWins: p.overtimeWins ?? null,
      overtimeLosses: p.overtimeLosses ?? null,
      headToHead: isBekapaka ? null : h2h.get(p.id) ?? null,
      scrapedAt: p.scrapedAt instanceof Date ? p.scrapedAt.toISOString() : p.scrapedAt ?? null
    };
  });
  teams.sort((a, b) => (b.winPct ?? -1) - (a.winPct ?? -1) || b.games - a.games || a.name.localeCompare(b.name, 'pl'));
  return { bekapakaKalkId: bekapaka?.id ?? null, headToHeadSince: CAREER_FIRST_SEASON_SLUG, teams };
}
