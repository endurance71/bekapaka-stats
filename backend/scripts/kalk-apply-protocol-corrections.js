#!/usr/bin/env node
/**
 * Nakłada korekty z oficjalnych protokołów (`kalk/v2/protocolCorrections.json`: +/-, faule wymuszone) na mecze już
 * zapisane w bazie. Nowe synchronizacje nakładają je same przy ingeście; ten skrypt jest dla meczów, których KALK
 * nie zmienił (synchronizacja przyrostowa ich nie przetwarza).
 *
 *   node scripts/kalk-apply-protocol-corrections.js [--match <kalkMatchId>] [--apply]
 *   docker exec bkpk-backend-prod node scripts/kalk-apply-protocol-corrections.js --apply
 *
 * Bez --apply tylko pokazuje zmiany. Zapisuje: KalkMatch.boxScore, KalkPlayerGameLog (kolumny + stats),
 * KalkTeamGameStat.pfDrawn i Σ sezonu w KalkPlayerSeasonStat (gdy KALK podał 0 albo wiersz pochodzi z logów).
 */
import { prisma } from '../lib/prisma.js';
import { isBekapakaTeamName } from '../kalk/parseMatchBoxScore.js';
import { seasonStatTeamKey, sumGameLogs } from '../kalk/v2/mapPlayer.js';
import { correctBoxTeams, loadProtocolCorrections, PROTOCOL_FIELDS } from '../kalk/v2/protocolCorrections.js';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const matchArg = args.includes('--match') ? args[args.indexOf('--match') + 1] : null;

const teamFix = (correction, teamName) => correction.teams.find((t) => Boolean(t.bekapaka) === isBekapakaTeamName(teamName));

async function correctMatch(correction) {
  const { seasonId, kalkMatchId } = correction;
  const km = await prisma.kalkMatch.findUnique({ where: { seasonId_id: { seasonId, id: kalkMatchId } } });
  if (!km) return console.warn(`! ${seasonId}/${kalkMatchId}: brak meczu w bazie — pominięto`);

  const boxScore = structuredClone(km.boxScore);
  const res = correctBoxTeams(boxScore.teams, correction);
  res.warnings.forEach((w) => console.warn(`! ${w}`));
  console.log(`\n${correction.match || kalkMatchId}: box score — ${res.players} zawodników`);

  const logs = await prisma.kalkPlayerGameLog.findMany({ where: { seasonId, kalkMatchId } });
  const logUpdates = [];
  for (const log of logs) {
    const fix = teamFix(correction, log.teamName)?.players?.[String(log.number)];
    if (!fix) continue;
    const data = {};
    for (const field of PROTOCOL_FIELDS) if (fix[field] != null && log[field] !== fix[field]) data[field] = fix[field];
    if (!Object.keys(data).length) continue;
    logUpdates.push({ id: log.id, data: { ...data, stats: { ...(log.stats || {}), ...data } } });
    console.log(`  log #${log.number} ${fix.name}: ${Object.entries(data).map(([k, v]) => `${k} ${log[k]} → ${v}`).join(', ')}`);
  }

  const teamStats = await prisma.kalkTeamGameStat.findMany({ where: { seasonId, kalkMatchId } });
  const teamUpdates = teamStats
    .map((row) => {
      const team = boxScore.teams.find((t) => isBekapakaTeamName(t.name) === isBekapakaTeamName(row.teamName));
      const pfDrawn = team?.totals?.pfDrawn;
      return pfDrawn != null && pfDrawn !== row.pfDrawn ? { row, pfDrawn } : null;
    })
    .filter(Boolean);
  teamUpdates.forEach(({ row, pfDrawn }) => console.log(`  drużyna ${row.teamName}: pfDrawn ${row.pfDrawn} → ${pfDrawn}`));

  if (apply) {
    await prisma.$transaction(async (tx) => {
      await tx.kalkMatch.update({ where: { seasonId_id: { seasonId, id: kalkMatchId } }, data: { boxScore } });
      for (const u of logUpdates) await tx.kalkPlayerGameLog.update({ where: { id: u.id }, data: u.data });
      for (const u of teamUpdates) {
        await tx.kalkTeamGameStat.update({
          where: { seasonId_kalkMatchId_side: { seasonId, kalkMatchId, side: u.row.side } },
          data: { pfDrawn: u.pfDrawn }
        });
      }
    });
  }
  return {
    seasonId,
    slugs: logs.map((l) => l.playerSlug).filter((s) => s && !s.startsWith('anon-')),
    patched: logUpdates.map((u) => [u.id, u.data])
  };
}

/** Σ sezonu z logów — tak jak `seasonStatFromPage` przy następnej pełnej synchronizacji. */
async function refreshSeasonStats(seasonId, slugs, patched) {
  // W podglądzie logi w bazie są jeszcze sprzed korekty — Σ liczona z tymi samymi poprawkami, które zapisze --apply.
  const logs = (await prisma.kalkPlayerGameLog.findMany({ where: { seasonId, playerSlug: { in: slugs } } })).map((l) => ({
    ...l,
    ...(patched.get(l.id) || {})
  }));
  const rows = await prisma.kalkPlayerSeasonStat.findMany({ where: { seasonId, playerSlug: { in: slugs } } });
  for (const row of rows) {
    const own = logs.filter((l) => l.playerSlug === row.playerSlug && seasonStatTeamKey(l.teamKalkId, l.teamName) === row.teamKey);
    if (!own.length) continue;
    const totals = sumGameLogs(own);
    const data = {};
    for (const field of PROTOCOL_FIELDS) {
      const fromLogs = row.source === 'kalk-box' || row[field] === 0;
      if (fromLogs && totals[field] !== row[field]) data[field] = totals[field];
    }
    if (!Object.keys(data).length) continue;
    console.log(`  sezon ${row.playerSlug}: ${Object.entries(data).map(([k, v]) => `${k} ${row[k]} → ${v}`).join(', ')}`);
    if (apply) {
      await prisma.kalkPlayerSeasonStat.update({
        where: {
          seasonId_playerSlug_competition_teamKey: { seasonId, playerSlug: row.playerSlug, competition: row.competition, teamKey: row.teamKey }
        },
        data
      });
    }
  }
}

try {
  const corrections = loadProtocolCorrections().filter((c) => !matchArg || String(c.kalkMatchId) === String(matchArg));
  if (!corrections.length) console.log('Brak korekt do nałożenia.');
  const bySeason = new Map();
  const patched = new Map();
  for (const correction of corrections) {
    const done = await correctMatch(correction);
    if (!done) continue;
    bySeason.set(done.seasonId, new Set([...(bySeason.get(done.seasonId) || []), ...done.slugs]));
    for (const [id, data] of done.patched) patched.set(id, data);
  }
  for (const [seasonId, slugs] of bySeason) await refreshSeasonStats(seasonId, [...slugs], patched);
  console.log(apply ? '\nZapisano.' : '\nPodgląd — nic nie zapisano. Uruchom z --apply, żeby zapisać.');
} finally {
  await prisma.$disconnect();
}
