/**
 * Zawodnicy KALK v2: id w DB, profile, statystyki sezonowe i agregaty KalkPlayer.
 *
 * Agregaty KalkPlayer (zbiórki/asysty/przechwyty/bloki…) liczone są z typowanych
 * wierszy KalkPlayerSeasonStat — koniec rozjazdu kluczy `zbiorki_/asysty_/prz_/bl_`
 * vs `rebounds_/assists_/steals_/blocks_` ze starego importu.
 */
import { slugify, toInt, toNum, round1, pct } from './util.js';

export const DIVISION_COMPETITION = 'Dywizja II';

/** `KalkPlayer.id` = `{seasonSlug}__{slug}`. */
export function seasonPlayerId(seasonSlug, slug) {
  return `${seasonSlug}__${slug}`;
}

/** Klucz drużyny w KalkPlayerSeasonStat. */
export function seasonStatTeamKey(teamKalkId, teamName) {
  if (teamKalkId != null && String(teamKalkId) !== '') return String(teamKalkId);
  return slugify(teamName) || 'unknown';
}

/**
 * Imię i nazwisko z profilu (fallback: "Imię Nazwisko" z nowej strony).
 * @param {{ firstName?: string|null, lastName?: string|null, fullName?: string|null } | null} profile
 * @param {string} [fallbackFullName]
 */
export function splitPlayerName(profile, fallbackFullName = '') {
  if (profile?.firstName && profile?.lastName) {
    return { firstName: profile.firstName.trim(), lastName: profile.lastName.trim() };
  }
  const full = String(profile?.fullName || fallbackFullName || '').trim();
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] || '', lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/**
 * Nazwa zawodnika do wyświetlenia. Stara strona KALK (sezon `sourceSite: 'legacy'`) podawała „Nazwisko Imię”,
 * nowa — „Imię Nazwisko”; zamieniamy tylko dla starej i tylko przy dwóch słowach.
 * @param {string} name
 * @param {string|null|undefined} sourceSite
 */
export function displayPlayerName(name, sourceSite) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (sourceSite === 'legacy' && parts.length === 2) return `${parts[1]} ${parts[0]}`;
  return parts.join(' ');
}

/** Nazwisko (do zdań typu „Kowalski i Nowak”), z tą samą regułą kolejności co `displayPlayerName`. */
export function playerSurname(name, sourceSite) {
  const parts = displayPlayerName(name, sourceSite).split(' ');
  return parts.length > 1 ? parts.slice(1).join(' ') : parts[0] || '';
}

/**
 * Minuty z kolumny MIN (strona podaje minuty; kontrakt mógł podać sekundy).
 * @param {number|null} value
 * @param {number} games
 */
export function normalizeMinutesTotal(value, games) {
  const n = toNum(value);
  if (n === null) return null;
  if (games > 0 && n > games * 60) return Math.round(n / 60);
  return Math.round(n);
}

function attemptsFromPct(made, pctValue) {
  const p = toNum(pctValue);
  if (!made || !p) return made === 0 ? 0 : null;
  return Math.round((made * 100) / p);
}

/**
 * Wiersz KalkPlayerSeasonStat (source 'kalk-page') z players[].seasonStats[].
 * @param {object} row — seasonStats[] z kontraktu
 * @param {{ seasonId: string, playerSlug: string, logTotals?: object|null }} ctx
 */
export function seasonStatFromPage(row, { seasonId, playerSlug, logTotals = null }) {
  const games = toInt(row.games) ?? 0;
  const twoPm = toInt(row.twoPm) ?? 0;
  const threePm = toInt(row.threePm) ?? 0;
  const ftm = toInt(row.ftm) ?? 0;
  const exact = (made, key) => (logTotals && logTotals[`${key}m`] === made ? logTotals[`${key}a`] : null);
  const twoPa = exact(twoPm, 'twoP') ?? attemptsFromPct(twoPm, row.twoPct);
  const threePa = exact(threePm, 'threeP') ?? attemptsFromPct(threePm, row.threePct);
  const fta = exact(ftm, 'ft') ?? attemptsFromPct(ftm, row.ftPct);
  return {
    seasonId,
    playerSlug,
    competition: row.competition || DIVISION_COMPETITION,
    teamKey: seasonStatTeamKey(row.teamKalkId, row.teamName),
    teamName: row.teamName || '',
    teamKalkId: row.teamKalkId != null ? String(row.teamKalkId) : null,
    games,
    minutesTotal: normalizeMinutesTotal(row.minutesTotal, games),
    pts: toInt(row.pts) ?? 0,
    twoPm,
    twoPa,
    twoPct: toNum(row.twoPct),
    threePm,
    threePa,
    threePct: toNum(row.threePct),
    ftm,
    fta,
    ftPct: toNum(row.ftPct),
    orb: toInt(row.orb) ?? 0,
    drb: toInt(row.drb) ?? 0,
    reb: toInt(row.reb) ?? 0,
    ast: toInt(row.ast) ?? 0,
    stl: toInt(row.stl) ?? 0,
    tov: toInt(row.tov) ?? 0,
    blk: toInt(row.blk) ?? 0,
    pf: toInt(row.pf) ?? 0,
    pfDrawn: toInt(row.pfDrawn) ?? 0,
    eval: toInt(row.eval) ?? 0,
    plusMinus: toInt(row.plusMinus) ?? 0,
    source: 'kalk-page'
  };
}

/**
 * Σ logów meczowych zawodnika (per drużyna) → sumy.
 * @param {object[]} logs — KalkPlayerGameLog (typowane kolumny)
 */
export function sumGameLogs(logs) {
  const t = {
    games: 0, secondsPlayed: 0, pts: 0, twoPm: 0, twoPa: 0, threePm: 0, threePa: 0, ftm: 0, fta: 0,
    orb: 0, drb: 0, reb: 0, ast: 0, stl: 0, tov: 0, blk: 0, pf: 0, pfDrawn: 0, eval: 0, plusMinus: 0
  };
  for (const l of logs) {
    if ((l.secondsPlayed ?? 0) > 0 || (l.pts ?? 0) > 0) t.games += 1;
    for (const k of Object.keys(t)) {
      if (k === 'games') continue;
      t[k] += l[k] ?? 0;
    }
  }
  return t;
}

/**
 * Wiersz KalkPlayerSeasonStat (source 'kalk-box') z Σ logów, gdy brak strony zawodnika.
 */
export function seasonStatFromLogs({ seasonId, playerSlug, teamKalkId, teamName, totals }) {
  return {
    seasonId,
    playerSlug,
    competition: DIVISION_COMPETITION,
    teamKey: seasonStatTeamKey(teamKalkId, teamName),
    teamName: teamName || '',
    teamKalkId: teamKalkId != null ? String(teamKalkId) : null,
    games: totals.games,
    minutesTotal: Math.round(totals.secondsPlayed / 60),
    pts: totals.pts,
    twoPm: totals.twoPm,
    twoPa: totals.twoPa,
    twoPct: pct(totals.twoPm, totals.twoPa),
    threePm: totals.threePm,
    threePa: totals.threePa,
    threePct: pct(totals.threePm, totals.threePa),
    ftm: totals.ftm,
    fta: totals.fta,
    ftPct: pct(totals.ftm, totals.fta),
    orb: totals.orb,
    drb: totals.drb,
    reb: totals.reb,
    ast: totals.ast,
    stl: totals.stl,
    tov: totals.tov,
    blk: totals.blk,
    pf: totals.pf,
    pfDrawn: totals.pfDrawn,
    eval: totals.eval,
    plusMinus: totals.plusMinus,
    source: 'kalk-box'
  };
}

/** Klucze Σ logów zgodne z `exact()` w seasonStatFromPage. */
export function logTotalsForAttempts(totals) {
  if (!totals) return null;
  return {
    twoPm: totals.twoPm, twoPa: totals.twoPa,
    threePm: totals.threePm, threePa: totals.threePa,
    ftm: totals.ftm, fta: totals.fta
  };
}

const avg = (total, games) => (games > 0 ? round1(total / games) : null);

/**
 * Agregaty KalkPlayer z wierszy KalkPlayerSeasonStat Dywizji II (suma po drużynach).
 * @param {object[]} rows
 */
export function kalkPlayerAggregates(rows) {
  const division = (rows || []).filter((r) => !r.competition || r.competition === DIVISION_COMPETITION);
  if (!division.length) {
    return {
      matchesPlayed: null, pointsTotal: null, pointsAverage: null, eval: null,
      reboundsTotal: null, reboundsAverage: null, assistsTotal: null, assistsAverage: null,
      stealsTotal: null, stealsAverage: null, blocksTotal: null, blocksAverage: null,
      turnoversTotal: null, turnoversAverage: null, foulsTotal: null, foulsAverage: null,
      minutesTotal: null, minutesAverage: null,
      threePointsMade: null, threePointsAttempted: null, threePointsPct: null, threePointStats: null,
      twoPointsPct: null, ftPct: null
    };
  }
  const sum = (key) => division.reduce((s, r) => s + (r[key] ?? 0), 0);
  const sumNullable = (key) => (division.every((r) => r[key] != null) ? sum(key) : null);
  const games = sum('games');
  const twoPm = sum('twoPm');
  const twoPa = sumNullable('twoPa');
  const threePm = sum('threePm');
  const threePa = sumNullable('threePa');
  const ftm = sum('ftm');
  const fta = sumNullable('fta');
  const single = division.length === 1 ? division[0] : null;
  const threePct = threePa != null ? pct(threePm, threePa) : single?.threePct ?? null;
  const minutes = sumNullable('minutesTotal');

  return {
    matchesPlayed: games,
    pointsTotal: sum('pts'),
    pointsAverage: avg(sum('pts'), games),
    eval: avg(sum('eval'), games),
    reboundsTotal: sum('reb'),
    reboundsAverage: avg(sum('reb'), games),
    assistsTotal: sum('ast'),
    assistsAverage: avg(sum('ast'), games),
    stealsTotal: sum('stl'),
    stealsAverage: avg(sum('stl'), games),
    blocksTotal: sum('blk'),
    blocksAverage: avg(sum('blk'), games),
    turnoversTotal: sum('tov'),
    turnoversAverage: avg(sum('tov'), games),
    foulsTotal: sum('pf'),
    foulsAverage: avg(sum('pf'), games),
    minutesTotal: minutes,
    minutesAverage: minutes != null ? avg(minutes, games) : null,
    threePointsMade: threePm,
    threePointsAttempted: threePa,
    threePointsPct: threePct,
    threePointStats: threePa != null ? `${threePm}/${threePa} (${threePct ?? 0}%)` : null,
    twoPointsPct: twoPa != null ? pct(twoPm, twoPa) : single?.twoPct ?? null,
    ftPct: fta != null ? pct(ftm, fta) : single?.ftPct ?? null
  };
}
