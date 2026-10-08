/**
 * Mapowanie box score kontraktu v3 → istniejący kształt `KalkMatch.boxScore`
 * (gameViewFromKalkMatch / enrichKalkTeamStats / hash AI) + wiersze typowane.
 */
import { enrichKalkTeamStats, isBekapakaTeamName } from '../parseMatchBoxScore.js';
import { formatMinutes, kalkMatchUrl, slugify, toInt } from './util.js';

export const BOX_STAT_KEYS = [
  'secondsPlayed', 'pts', 'twoPm', 'twoPa', 'threePm', 'threePa', 'fgm', 'fga', 'ftm', 'fta',
  'orb', 'drb', 'reb', 'ast', 'stl', 'tov', 'pf', 'pfDrawn', 'blk', 'blkAgainst', 'eval'
];

/**
 * Slug zawodnika z wiersza box score; brak linku → syntetyczny, stabilny slug.
 * @param {object} row
 * @param {object} team
 */
export function boxRowSlug(row, team) {
  if (row?.slug) return String(row.slug);
  const base = slugify(row?.name) || `nr-${row?.number ?? 'x'}`;
  return `anon-${team?.teamKalkId || slugify(team?.name)}-${base}`;
}

/**
 * Wiersz zawodnika w legacy kształcie boxScore (+ slug, blkAgainst).
 * @param {object} p — box.teams[].players[] z kontraktu
 * @param {object} team
 */
export function boxPlayerToLegacy(p, team) {
  return {
    name: p.name,
    slug: boxRowSlug(p, team),
    profile_url: p.slug ? `https://www.kalk-koszalin.com/zawodnik/${p.slug}` : null,
    kalkPlayerNumericId: null,
    number: toInt(p.number),
    starter: Boolean(p.starter),
    min: formatMinutes(p.secondsPlayed),
    pts: toInt(p.pts) ?? 0,
    two_pm: toInt(p.twoPm) ?? 0,
    two_pa: toInt(p.twoPa) ?? 0,
    three_pm: toInt(p.threePm) ?? 0,
    three_pa: toInt(p.threePa) ?? 0,
    fgm: toInt(p.fgm) ?? 0,
    fga: toInt(p.fga) ?? 0,
    ftm: toInt(p.ftm) ?? 0,
    fta: toInt(p.fta) ?? 0,
    orb: toInt(p.orb) ?? 0,
    drb: toInt(p.drb) ?? 0,
    reb: toInt(p.reb) ?? 0,
    ast: toInt(p.ast) ?? 0,
    stl: toInt(p.stl) ?? 0,
    tov: toInt(p.tov) ?? 0,
    pf: toInt(p.pf) ?? 0,
    pfDrawn: toInt(p.pfDrawn) ?? 0,
    blk: toInt(p.blk) ?? 0,
    blkAgainst: toInt(p.blkAgainst) ?? 0,
    eval: toInt(p.eval) ?? 0,
    plusMinus: toInt(p.plusMinus) ?? 0
  };
}

/** Suma kolumn z wierszy kontraktu (gdy brak `totals`). */
export function sumBoxRows(players) {
  const out = {};
  for (const key of BOX_STAT_KEYS) {
    out[key] = (players || []).reduce((s, p) => s + (toInt(p[key]) ?? 0), 0);
  }
  return out;
}

/** Sumy drużyny z kontraktu (lub wyliczone z wierszy). */
export function teamTotals(team) {
  const summed = sumBoxRows(team?.players);
  if (!team?.totals) return summed;
  const out = {};
  for (const key of BOX_STAT_KEYS) {
    const v = toInt(team.totals[key]);
    out[key] = v ?? summed[key];
  }
  return out;
}

/**
 * Kwarty w legacy kształcie: [{ label: 'Q1', home, away }] (OT = Q5, Q6…).
 * @param {object | null} info
 */
export function legacyQuarters(info) {
  const quarters = Array.isArray(info?.quarters) ? info.quarters : [];
  return quarters
    .slice()
    .sort((a, b) => (a.period ?? 0) - (b.period ?? 0))
    .map((q, idx) => ({
      label: `Q${q.period ?? idx + 1}`,
      home: toInt(q.home) ?? 0,
      away: toInt(q.away) ?? 0
    }));
}

/**
 * Strony box score w kolejności [home, away].
 * @param {object} match — matches[] z kontraktu
 */
export function boxSides(match) {
  const teams = Array.isArray(match?.box?.teams) ? match.box.teams : [];
  const home = teams.find((t) => t.side === 'home') || teams[0] || null;
  const away = teams.find((t) => t.side === 'away') || teams.find((t) => t !== home) || null;
  return { home, away };
}

/**
 * boxScore JSON (kształt legacy + slug/blkAgainst/teams[].totals).
 * @param {object} match — matches[] z kontraktu
 * @param {object} schedule — wpis terminarza (wynik)
 */
export function buildBoxScoreJson(match, schedule) {
  const { home, away } = boxSides(match);
  const homePts = toInt(schedule?.scoreHome) ?? teamTotals(home).pts;
  const awayPts = toInt(schedule?.scoreAway) ?? teamTotals(away).pts;

  const legacyTeam = (team, pts) => ({
    name: team?.name || '',
    isBekapaka: isBekapakaTeamName(team?.name),
    players: (team?.players || []).map((p) => boxPlayerToLegacy(p, team)),
    pts
  });

  const homeTeam = enrichKalkTeamStats(legacyTeam(home, homePts), awayPts);
  const awayTeam = enrichKalkTeamStats(legacyTeam(away, awayPts), homePts);
  homeTeam.totals = teamTotals(home);
  awayTeam.totals = teamTotals(away);

  const quarters = legacyQuarters(match?.info);
  const box = {
    teams: [homeTeam, awayTeam],
    meta: { quarters, matchUrl: kalkMatchUrl(match.kalkMatchId) }
  };
  if (quarters.length) box.quarters = quarters;
  return box;
}

/**
 * Typowany wiersz KalkTeamGameStat.
 */
export function teamGameStatRow({ seasonId, kalkMatchId, side, team, opponent, info, ptsFor, ptsAgainst }) {
  const totals = teamTotals(team);
  const quarters = Array.isArray(info?.quarters) ? info.quarters : [];
  const key = side === 'home' ? 'home' : 'away';
  const q = (period) => {
    const row = quarters.find((x) => x.period === period);
    return row ? toInt(row[key]) : null;
  };
  const otRows = quarters.filter((x) => (x.period ?? 0) >= 5);
  const sources = info?.pointsSources?.[key] || null;
  const startersPts = toInt(team?.startersPts);
  const benchPts = toInt(team?.benchPts);
  return {
    seasonId,
    kalkMatchId,
    side,
    teamKalkId: team?.teamKalkId ? String(team.teamKalkId) : null,
    teamName: team?.name || '',
    opponentKalkId: opponent?.teamKalkId ? String(opponent.teamKalkId) : null,
    opponentName: opponent?.name || '',
    isWin: ptsFor != null && ptsAgainst != null && ptsFor !== ptsAgainst ? ptsFor > ptsAgainst : null,
    pts: ptsFor ?? totals.pts,
    ptsAgainst: ptsAgainst ?? 0,
    q1: q(1),
    q2: q(2),
    q3: q(3),
    q4: q(4),
    otPts: otRows.length ? otRows.reduce((s, r) => s + (toInt(r[key]) ?? 0), 0) : null,
    minutesSec: totals.secondsPlayed ?? null,
    fgm: totals.fgm,
    fga: totals.fga,
    twoPm: totals.twoPm,
    twoPa: totals.twoPa,
    threePm: totals.threePm,
    threePa: totals.threePa,
    ftm: totals.ftm,
    fta: totals.fta,
    orb: totals.orb,
    drb: totals.drb,
    reb: totals.reb,
    ast: totals.ast,
    stl: totals.stl,
    tov: totals.tov,
    pf: totals.pf,
    pfDrawn: totals.pfDrawn,
    blk: totals.blk,
    blkAgainst: totals.blkAgainst,
    eval: totals.eval,
    startersPts: startersPts ?? sumWhere(team?.players, (p) => p.starter),
    benchPts: benchPts ?? sumWhere(team?.players, (p) => !p.starter),
    ptsOffTurnovers: sources ? toInt(sources.ptsOffTurnovers) : null,
    ptsInPaint: sources ? toInt(sources.ptsInPaint) : null,
    secondChancePts: sources ? toInt(sources.secondChancePts) : null,
    fastBreakPts: sources ? toInt(sources.fastBreakPts) : null
  };
}

function sumWhere(players, predicate) {
  if (!Array.isArray(players) || !players.length) return null;
  return players.filter(predicate).reduce((s, p) => s + (toInt(p.pts) ?? 0), 0);
}

/**
 * KalkPlayerGameLog — typowane kolumny + `stats` JSON zgodny z normalizePlayerGameLogRow.
 */
export function playerGameLogRow({ seasonId, kalkMatchId, kalkPlayerId, player, team, opponent, side, ptsFor, ptsAgainst }) {
  const legacy = boxPlayerToLegacy(player, team);
  const isWin = ptsFor != null && ptsAgainst != null && ptsFor !== ptsAgainst ? ptsFor > ptsAgainst : null;
  const stats = {
    opponent: opponent?.name || '',
    matchUrl: kalkMatchUrl(kalkMatchId),
    kalkMatchId,
    scoreLabel: ptsFor != null && ptsAgainst != null ? `${ptsFor}:${ptsAgainst}` : null,
    min: legacy.min,
    pts: legacy.pts,
    two_pm: legacy.two_pm,
    two_pa: legacy.two_pa,
    three_pm: legacy.three_pm,
    three_pa: legacy.three_pa,
    fgm: legacy.fgm,
    fga: legacy.fga,
    ftm: legacy.ftm,
    fta: legacy.fta,
    orb: legacy.orb,
    drb: legacy.drb,
    reb: legacy.reb,
    ast: legacy.ast,
    pf: legacy.pf,
    pfDrawn: legacy.pfDrawn,
    tov: legacy.tov,
    stl: legacy.stl,
    blk: legacy.blk,
    blkAgainst: legacy.blkAgainst,
    plusMinus: legacy.plusMinus,
    eval: legacy.eval,
    starter: legacy.starter,
    number: legacy.number
  };
  return {
    seasonId,
    kalkPlayerId,
    kalkMatchId,
    teamName: team?.name || '',
    opponentName: opponent?.name || '',
    isWin,
    stats,
    playerSlug: legacy.slug,
    teamKalkId: team?.teamKalkId ? String(team.teamKalkId) : null,
    side,
    number: legacy.number,
    starter: legacy.starter,
    secondsPlayed: toInt(player.secondsPlayed),
    pts: legacy.pts,
    twoPm: legacy.two_pm,
    twoPa: legacy.two_pa,
    threePm: legacy.three_pm,
    threePa: legacy.three_pa,
    fgm: legacy.fgm,
    fga: legacy.fga,
    ftm: legacy.ftm,
    fta: legacy.fta,
    orb: legacy.orb,
    drb: legacy.drb,
    reb: legacy.reb,
    ast: legacy.ast,
    stl: legacy.stl,
    tov: legacy.tov,
    pf: legacy.pf,
    pfDrawn: legacy.pfDrawn,
    blk: legacy.blk,
    blkAgainst: legacy.blkAgainst,
    eval: legacy.eval,
    plusMinus: legacy.plusMinus
  };
}

/**
 * KalkPlayByPlayEvent z kontraktu.
 */
export function playByPlayRow(seasonId, kalkMatchId, e) {
  return {
    seasonId,
    kalkMatchId,
    seq: toInt(e.seq) ?? 0,
    period: toInt(e.period) ?? 0,
    clockSec: toInt(e.clockSec),
    elapsedSec: toInt(e.elapsedSec),
    side: e.side ?? null,
    teamKalkId: e.teamKalkId != null ? String(e.teamKalkId) : null,
    playerName: e.playerName ?? null,
    playerSlug: e.playerSlug ?? null,
    playerNumber: toInt(e.playerNumber),
    actionRaw: e.actionRaw ?? '',
    actionType: e.actionType || 'unknown',
    shotValue: toInt(e.shotValue),
    made: typeof e.made === 'boolean' ? e.made : null,
    blocked: typeof e.blocked === 'boolean' ? e.blocked : null,
    reboundType: e.reboundType ?? null,
    subOutNumber: toInt(e.subOutNumber),
    subOutSlug: e.subOutSlug ?? null,
    scoreHome: toInt(e.scoreHome) ?? 0,
    scoreAway: toInt(e.scoreAway) ?? 0,
    isScoring: Boolean(e.isScoring)
  };
}
