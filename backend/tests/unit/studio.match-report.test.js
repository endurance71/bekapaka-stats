import { describe, it, expect } from 'vitest';
import { factsSchema } from '../../studio/publications/channels.js';
import { playbook } from '../../studio/publications/playbooks.js';
import { schematicCopy } from '../../studio/publications/templates.js';
import { lintCopy } from '../../studio/publications/brand-lint.js';
import { matchReport } from '../../studio/publications/match-report.js';
import { opponentShort } from '../../studio/publications/service.js';

const team = (side, o) => ({ side, fgm: 0, fga: 0, threePm: 0, threePa: 0, ftm: 0, fta: 0, reb: 0, ast: 0, stl: 0, tov: 0, blk: 0, benchPts: 0, fastBreakPts: 0, ptsOffTurnovers: 0, ...o });
const log = (teamName, name, o) => ({ teamName, kalkPlayer: { name }, number: 7, secondsPlayed: 600, pts: 0, reb: 0, ast: 0, stl: 0, threePm: 0, threePa: 0, eval: 0, ...o });
// Club plays away here: quarters and team totals must be read from the guest side.
const db = {
  kalkMatch: {
    findUnique: async ({ where }) => where.seasonId_id?.id === 'k1' && where.seasonId_id.seasonId === 's' && ({
      id: 'k1', isFinished: true, scoreHome: 60, scoreAway: 71, overtimes: 0, homeTeamName: 'Pantery', guestTeamName: 'BeKaPaKa Bobolice',
      info: { quarters: [{ period: 1, label: 'Kw. 1', home: 20, away: 15 }, { period: 2, label: 'Kw. 2', home: 10, away: 20 }, { period: 3, label: 'Kw. 3', home: 15, away: 18 }, { period: 4, label: 'Kw. 4', home: 15, away: 18 }], mvp: { name: 'Jan Kowalski', eval: 25 } },
    }),
  },
  kalkTeamGameStat: { findMany: async () => [team('home', { fgm: 20, fga: 60, reb: 30 }), team('away', { fgm: 28, fga: 56, threePm: 5, threePa: 15, reb: 41, ast: 18 })] },
  kalkPlayerGameLog: {
    findMany: async () => [
      log('BeKaPaKa Bobolice', 'Adam Nowak', { pts: 12, reb: 9 }),
      log('BeKaPaKa Bobolice', 'Jan Kowalski', { pts: 24, reb: 5, ast: 6, eval: 25, threePm: 2, threePa: 4 }),
      log('BeKaPaKa Bobolice', 'Ławka Bez Minut', { secondsPlayed: 0 }),
      log('Pantery', 'Piotr Rywal', { pts: 19, reb: 7 }),
    ],
  },
};
const match = { id: 'k1', seasonId: 's', date: '2026-10-04T10:00:00.000Z', source: 'kalk', venue: 'KOSiR Koszalin' };
const schedule = [
  { opponent: 'Młode Wilki', date: '2026-10-25T16:00:00.000Z', venue: 'KOSiR Koszalin', scoreUs: null },
  { opponent: 'Kosz-All-In', date: '2026-10-11T16:00:00.000Z', venue: 'KOSiR Koszalin', scoreUs: null },
  { opponent: 'Stary mecz', date: '2026-09-27T16:00:00.000Z', venue: 'KOSiR Koszalin', scoreUs: 70 },
];

describe('match report facts', () => {
  it('reads the club side, skips players without minutes and finds the next match', async () => {
    const r = await matchReport(db, match, schedule);
    expect(r.quarters).toEqual([
      { label: '1. kwarta', us: 15, them: 20 },
      { label: '2. kwarta', us: 20, them: 10 },
      { label: '3. kwarta', us: 18, them: 15 },
      { label: '4. kwarta', us: 18, them: 15 },
    ]);
    expect(r.halftime).toEqual({ us: 35, them: 30 });
    expect(r.team.us).toMatchObject({ fg: '28/56', fgPct: 50, three: '5/15', threePct: 33, reb: 41 });
    expect(r.team.them).toMatchObject({ fg: '20/60', fgPct: 33 });
    expect(r.players.map((p) => p.name)).toEqual(['Jan Kowalski', 'Adam Nowak']);
    expect(r.opponentTop).toEqual([{ name: 'Piotr Rywal', pts: 19, reb: 7 }]);
    expect(r.mvp).toEqual({ name: 'Jan Kowalski', eval: 25 });
    expect(r.nextMatch.opponent).toBe('Kosz-All-In');
  });
  it('is empty for league-only matches', async () => {
    expect(await matchReport(db, { ...match, source: 'league' })).toBeNull();
  });
});

describe('match report article', () => {
  it('writes a full report from facts only and passes the brand lint', async () => {
    const facts = factsSchema.parse({ kind: 'match', competition: 'KALK', seasonLabel: 'Sezon 2026/2027', round: '3', opponent: 'Pantery', date: match.date, venue: 'KOSiR Koszalin', entryInfo: 'Wstęp wolny', scoreUs: 71, scoreThem: 60, report: await matchReport(db, match, schedule) });
    const { website } = schematicCopy(playbook('match-result'), facts);
    expect(website.title).toBe('BeKaPaKa Bobolice 71:60 Pantery – relacja z 3. kolejki KALK');
    for (const part of ['## Przebieg meczu', '- **Do przerwy:** 35:30', 'BeKaPaKa w liczbach: 41 zbiórek · 18 asyst', '## Nasi zawodnicy', '- **Jan Kowalski (#7):** 24 pkt', 'MVP meczu: Jan Kowalski', '## Statystyki zespołów', '- **Rzuty z gry:** BeKaPaKa 28/56 (50%) · Pantery 20/60 (33%)', 'Najskuteczniejsi w zespole Pantery: Piotr Rywal 19 pkt', '## Następny mecz', '- **Rywal:** Kosz-All-In'])
      expect(website.content).toContain(part);
    expect(website.content).toContain('\n\nBeKaPaKa Bobolice 71:60 Pantery\n\n');
    expect(website.content).not.toMatch(/dziś|dzisiaj|wczoraj/i);
    expect(website.excerpt.length).toBeGreaterThanOrEqual(140);
    expect(lintCopy('website', website, facts).filter((i) => i.level === 'error')).toEqual([]);
    expect(lintCopy('website', website, facts).some((i) => /Liczby spoza/.test(i.message))).toBe(false);
    // The next match is written in Warsaw time (e.g. 18:00) — its hour counts as a known fact.
    expect(website.content).toContain('o 18:00');
  });
  it('keeps the short article when there are no statistics', () => {
    const facts = factsSchema.parse({ kind: 'match', round: '3', opponent: 'Pantery', scoreUs: 71, scoreThem: 60 });
    expect(schematicCopy(playbook('match-result'), facts).website.content).not.toContain('## Przebieg meczu');
  });
});

describe('rival shield text', () => {
  it('uses initials or a short name instead of the placeholder', () => {
    expect(opponentShort('Kosz-All-In')).toBe('KAI');
    expect(opponentShort('Młode Wilki')).toBe('MW');
    expect(opponentShort('AZS')).toBe('AZS');
    expect(opponentShort('PANTERY')).toBe('PANT');
    expect(opponentShort('STUDIUM PRACOWNIKÓW MEDYCZNYCH I SPOŁECZNYCH')).toBe('SPMS');
    expect(opponentShort('')).toBe('');
  });
});
