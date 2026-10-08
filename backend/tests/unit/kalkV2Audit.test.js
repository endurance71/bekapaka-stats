import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createFakePrisma } from '../helpers/fakePrisma.js';
import { ingestKalkV2Bundle } from '../../kalk/v2/ingestSeason.js';
import {
  auditExitCode,
  auditSeasonIntegrity,
  checkMatch,
  checkPlayByPlay,
  recomputeStandings
} from '../../kalk/v2/audit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/kalk-v2-bundle.min.json'), 'utf-8'));
const bundle = () => structuredClone(FIXTURE);
const quiet = { warn() {}, log() {} };
const NOW = new Date('2026-10-08T12:00:00Z');

async function ingested(mutate = (b) => b, extraSeed = {}) {
  const prisma = createFakePrisma({
    kalkSeason: [{ id: 'season_2026-2027', slug: '2026-2027', label: 'Sezon 2026/2027', isActive: true, kalkNumber: null, sourceSite: 'legacy' }],
    kalkSyncRun: [{ id: 'run-1', seasonId: 'season_2026-2027', mode: 'full', status: 'success', startedAt: new Date('2026-10-08T09:30:00Z'), finishedAt: new Date('2026-10-08T09:31:00Z') }],
    ...extraSeed
  });
  const b = bundle();
  mutate(b);
  await ingestKalkV2Bundle(b, { prisma, syncPlayers: null, logger: quiet });
  const season = prisma.$tables.kalkSeason.find((s) => s.id === 'season_2026-2027');
  return { prisma, season };
}

const codes = (issues) => [...new Set(issues.map((i) => i.code))].sort();

describe('Audyt KALK v2 — sezon', () => {
  it('poprawny plik: 0 błędów, 0 ostrzeżeń, kod wyjścia 0 w trybie strict', async () => {
    const { prisma, season } = await ingested();
    const report = await auditSeasonIntegrity(prisma, season, { now: NOW });
    expect(report.errors).toEqual([]);
    expect(report.warnings).toEqual([]);
    expect(report.stats).toMatchObject({ kalkMatches: 1, finishedSchedule: 1, finishedKalkMatches: 1, pbpMatches: 1, gameLogs: 10 });
    expect(auditExitCode([report], { strict: true })).toBe(0);
    expect(auditExitCode([report], { failOn: 'warn' })).toBe(0);
  });

  it('wykrywa złą sumę punktów (E2) i zwraca kod 1 w trybie strict', async () => {
    const { prisma, season } = await ingested((b) => {
      const p = b.matches[0].box.teams[0].players[0];
      p.pts += 2; // 9 zamiast 7 — Σ zawodników ≠ wynik
    });
    const report = await auditSeasonIntegrity(prisma, season, { now: NOW });
    expect(codes(report.errors)).toContain('E2');
    expect(codes(report.errors)).toContain('E4'); // PTS ≠ 2·2PM+3·3PM+FTM
    expect(report.errors.find((e) => e.code === 'E2').kalkMatchId).toBe('4124');
    expect(auditExitCode([report], { strict: true })).toBe(1);
    expect(auditExitCode([report], { failOn: 'error' })).toBe(1);
    expect(auditExitCode([report], {})).toBe(0); // tryb raportu
  });

  it('S1: brakujący box score z URL w nowym formacie; S2: tabela niezgodna z wynikami; S4: duplikat terminarza', async () => {
    const { prisma, season } = await ingested();
    prisma.$tables.leagueMatch.push(
      { id: 'lm-x', seasonId: season.id, kalkMatchId: '4200', date: new Date('2026-10-01T10:00:00Z'), homeTeam: 'Kosz-All-In', guestTeam: 'BeKaPaKa Bobolice', isFinished: true, scoreHome: 50, scoreAway: 40, phaseLabel: 'Play-off' },
      { id: 'lm-dup', seasonId: season.id, kalkMatchId: '4130', date: new Date('2026-10-18T12:40:00Z'), homeTeam: 'Kosz-All-In', guestTeam: 'BeKaPaKa Bobolice', isFinished: false }
    );
    prisma.$tables.leagueTeam.find((t) => t.name === 'Kosz-All-In').wins = 3;
    const report = await auditSeasonIntegrity(prisma, season, { now: NOW });
    const s1 = report.errors.find((e) => e.code === 'S1');
    expect(s1.details.missing).toEqual([
      expect.objectContaining({ kalkMatchId: '4200', url: 'https://www.kalk-koszalin.com/mecz/4200' })
    ]);
    expect(report.missingMatches[0].url).toBe('https://www.kalk-koszalin.com/mecz/4200');
    // Play-off nie liczy się do tabeli fazy zasadniczej → tylko zmienione wins
    const s2 = report.errors.filter((e) => e.code === 'S2');
    expect(s2).toHaveLength(1);
    expect(s2[0].message).toMatch(/Kosz-All-In: wins 3≠0/);
    expect(report.errors.find((e) => e.code === 'S4').kalkMatchId).toBe('4130');
  });

  it('S5/S6/S7: ID meczu w innym sezonie, nierozwiązany kalkSlug, stary sync', async () => {
    const { prisma, season } = await ingested(undefined, {
      rosterPlayer: [{ id: 'rp-1', firstName: 'Jan', lastName: 'Brak', kalkSlug: 'jan-brak' }]
    });
    prisma.$tables.kalkMatch.push({ id: '4124', seasonId: 'season_2025-2026', sourceSite: 'legacy', isFinished: true, boxScore: { teams: [] } });
    prisma.$tables.kalkSyncRun[0].finishedAt = new Date('2026-09-01T00:00:00Z');
    const report = await auditSeasonIntegrity(prisma, season, { now: NOW });
    expect(codes(report.warnings)).toEqual(['S5', 'S6', 'S7']);
    expect(auditExitCode([report], { strict: true })).toBe(0);
    expect(auditExitCode([report], { failOn: 'warn' })).toBe(1);
  });

  it('S3: statystyki sezonowe ze strony różne od Σ logów → ostrzeżenie', async () => {
    const { prisma, season } = await ingested((b) => {
      b.players.find((p) => p.slug === 'filip-karpinski').seasonStats[0].pts = 30;
    });
    const report = await auditSeasonIntegrity(prisma, season, { now: NOW });
    expect(report.warnings.find((w) => w.code === 'S3').message).toMatch(/filip-karpinski: pts strona 30 vs logi 7/);
  });
});

describe('Audyt KALK v2 — kontrole meczu (czyste funkcje)', () => {
  async function matchRow(mutate) {
    const { prisma } = await ingested(mutate);
    const km = prisma.$tables.kalkMatch[0];
    return {
      km,
      ctx: {
        schedule: prisma.$tables.leagueMatch.find((l) => l.kalkMatchId === '4124'),
        teamStats: prisma.$tables.kalkTeamGameStat,
        logCount: prisma.$tables.kalkPlayerGameLog.length,
        events: prisma.$tables.kalkPlayByPlayEvent,
        kalkNumber: 50
      }
    };
  }

  it('E5: dogrywka bez remisu po 4. kwarcie i niezgodna liczba OT', async () => {
    const { km, ctx } = await matchRow();
    km.info.quarters = [...km.info.quarters.slice(0, 3), { period: 4, home: 1, away: 0 }, { period: 5, home: 2, away: 0 }];
    const issues = checkMatch(km, ctx);
    expect(issues.filter((i) => i.code === 'E5').map((i) => i.message).join(' | ')).toMatch(/Dogrywka mimo braku remisu.*overtimes=0/);
  });

  it('E7: końcowy wynik PBP i Σ punktów ze zdarzeń', async () => {
    const { km, ctx } = await matchRow();
    const events = ctx.events.map((e) => ({ ...e }));
    events[events.length - 2] = { ...events[events.length - 2], scoreHome: 11 };
    events[events.length - 1] = { ...events[events.length - 1], scoreHome: 11 };
    const issues = checkPlayByPlay(km, events.filter((e) => e.seq !== 15));
    expect(issues.some((i) => i.severity === 'error' && /wynik końcowy 11:7/.test(i.message))).toBe(true);
    expect(issues.some((i) => /Σ punktów ze zdarzeń 10:7/.test(i.message))).toBe(true);
    expect(issues.some((i) => i.severity === 'warn' && /fgm PBP 4 vs box 5/.test(i.message))).toBe(true);
  });

  it('E8/E9/E10/E11/E13: starterzy, minuty, bloki, liczba zawodników, tabele typowane', async () => {
    const { km, ctx } = await matchRow();
    const away = km.boxScore.teams[1];
    away.players[4].starter = false;
    away.players[0].min = '10:00';
    away.players[0].blk = 0;
    km.boxScore.teams[0].players = km.boxScore.teams[0].players.slice(0, 4);
    const issues = checkMatch(km, { ...ctx, teamStats: ctx.teamStats.slice(0, 1) });
    expect(codes(issues)).toEqual(expect.arrayContaining(['E8', 'E9', 'E10', 'E11', 'E13']));
    expect(issues.find((i) => i.code === 'E9').severity).toBe('warn');
  });

  it('E6/E12: malejący przebieg i brak sekcji', async () => {
    const { km, ctx } = await matchRow();
    km.info.flow5[3] = { minute: 20, home: 3, away: 4 };
    km.sectionsAvailable = ['statystyki'];
    const issues = checkMatch(km, ctx);
    expect(issues.find((i) => i.code === 'E6').message).toMatch(/maleje/);
    expect(issues.find((i) => i.code === 'E12').message).toMatch(/info/);
  });

  it('recomputeStandings: 2 pkt za zwycięstwo, 1 za porażkę', () => {
    const t = recomputeStandings([
      { homeTeam: 'A', guestTeam: 'B', scoreHome: 50, scoreAway: 40, isFinished: true },
      { homeTeam: 'B', guestTeam: 'A', scoreHome: 45, scoreAway: 44, isFinished: true },
      { homeTeam: 'A', guestTeam: 'B', scoreHome: null, scoreAway: null, isFinished: false }
    ]);
    expect(t.get('a')).toMatchObject({ matches: 2, wins: 1, losses: 1, pointsFor: 94, pointsAgainst: 85, points: 3 });
  });
});
