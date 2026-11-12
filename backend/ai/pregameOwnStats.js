// Statystyki sezonu zawodników BeKaPaKa do karty przedmeczowej — z box score KALK (KalkPlayerGameLog).
// Liczone od pierwszego meczu: porównania z rywalem mają być na karcie także przy 1–2 meczach (z podaną próbą).
import { prisma } from '../lib/prisma.js';

/** @param {number} value @param {number} [digits] */
function round(value, digits = 1) {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

/** @param {number} made @param {number} attempted */
function shooting(made, attempted) {
  return { made, attempted, pct: attempted > 0 ? round((made / attempted) * 100) : null };
}

/**
 * Identyfikator zawodnika KALK powiązanego z wierszem kadry (z getRoster).
 * @param {Record<string, any>} player
 * @returns {string | null}
 */
export function rosterKalkPlayerId(player) {
  return player?.kalkPlayer?.id ? String(player.kalkPlayer.id) : null;
}

/**
 * Średnie sezonu dla każdego zawodnika kadry z co najmniej jednym meczem.
 * Zawodnicy bez meczów w sezonie trafiają do `withoutGames` (bez liczb).
 * @param {Array<Record<string, any>>} roster — wiersze z getRoster (id, firstName, lastName, number, position, kalkPlayer)
 * @param {Array<Record<string, any>>} logs — KalkPlayerGameLog (typowane kolumny) tego sezonu
 */
export function buildOwnPlayerStats(roster, logs) {
  /** @type {Map<string, Array<Record<string, any>>>} */
  const logsByKalkId = new Map();
  for (const row of logs || []) {
    const key = String(row.kalkPlayerId);
    if (!logsByKalkId.has(key)) logsByKalkId.set(key, []);
    logsByKalkId.get(key).push(row);
  }

  const players = [];
  const withoutGames = [];
  for (const p of roster || []) {
    const name = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim();
    const kalkId = rosterKalkPlayerId(p);
    const rows = kalkId ? logsByKalkId.get(kalkId) || [] : [];
    if (!rows.length) {
      withoutGames.push(name);
      continue;
    }
    const games = rows.length;
    const sum = (field) => rows.reduce((acc, r) => acc + (Number(r[field]) || 0), 0);
    const per = (field) => round(sum(field) / games);
    const seconds = rows.filter((r) => r.secondsPlayed != null);
    players.push({
      playerId: p.id,
      name,
      number: p.number ?? null,
      games,
      starts: rows.filter((r) => r.starter === true).length,
      mpg: seconds.length ? round(seconds.reduce((acc, r) => acc + r.secondsPlayed, 0) / seconds.length / 60) : null,
      ppg: per('pts'),
      rpg: per('reb'),
      orbPg: per('orb'),
      apg: per('ast'),
      spg: per('stl'),
      bpg: per('blk'),
      tovPg: per('tov'),
      pfPg: per('pf'),
      twoPt: shooting(sum('twoPm'), sum('twoPa')),
      threePt: shooting(sum('threePm'), sum('threePa')),
      ft: shooting(sum('ftm'), sum('fta')),
      plusMinusTotal: sum('plusMinus')
    });
  }

  players.sort((a, b) => b.starts - a.starts || b.games - a.games || b.ppg - a.ppg || a.name.localeCompare(b.name, 'pl'));
  return { players, withoutGames };
}

/**
 * Wczytuje box score sezonu dla kadry i liczy średnie.
 * @param {Array<Record<string, any>>} roster
 * @param {string | null | undefined} seasonId
 */
export async function loadOwnPlayerStats(roster, seasonId) {
  const kalkIds = [...new Set((roster || []).map(rosterKalkPlayerId).filter(Boolean))];
  if (!seasonId || !kalkIds.length) return buildOwnPlayerStats(roster, []);
  const logs = await prisma.kalkPlayerGameLog.findMany({
    where: { seasonId, kalkPlayerId: { in: kalkIds } },
    select: {
      kalkPlayerId: true,
      kalkMatchId: true,
      starter: true,
      secondsPlayed: true,
      pts: true,
      twoPm: true,
      twoPa: true,
      threePm: true,
      threePa: true,
      ftm: true,
      fta: true,
      orb: true,
      reb: true,
      ast: true,
      stl: true,
      blk: true,
      tov: true,
      pf: true,
      plusMinus: true
    },
    orderBy: [{ kalkPlayerId: 'asc' }, { kalkMatchId: 'asc' }]
  });
  return buildOwnPlayerStats(roster, logs);
}
