import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { bestRun, columnName, setContent, teamComparisons } from '../../studio/publications/match-graphics.js';
import { factsSchema } from '../../studio/publications/channels.js';
import { projectContentSchema } from '../../studio/contracts.js';

const reference = factsSchema.parse(JSON.parse(readFileSync(new URL('../fixtures/studio-reference/gmvt-2026-10-18.facts.json', import.meta.url), 'utf8')));

describe('post-match graphic set (reference 18.10.2026)', () => {
  it('fills the poster with the run after the break, the biggest edge and the quarters', () => {
    const poster = setContent('poster', reference);
    expect(poster.kicker).toBe('6. kolejka KALK');
    expect(poster.heroStats).toEqual([
      { value: '12:0', label: 'seria po przerwie' },
      { value: '22', label: 'zbiórki w ataku' },
    ]);
    expect(poster.quarters.map((q) => `${q.us}:${q.them}`)).toEqual(['15:10', '12:15', '16:13', '13:16']);
  });

  it('lists our three top scorers and the best rebounder with shirt numbers', () => {
    const leaders = setContent('leaders', reference);
    expect(leaders.title).toBe('Nasi liderzy');
    expect(leaders.subtitle).toBe('BeKaPaKa 56:54 GMVT TEAM · 18.10.2026');
    expect(leaders.tableRows.map((r) => [r.label, r.value, r.unit, r.number])).toEqual([
      ['Filip Karpiński', '20', 'PKT', '69'],
      ['Dawid Olearczyk', '14', 'PKT', '1'],
      ['Alan Niwiński', '10', 'PKT', '27'],
      ['Piotr Sosiński', '9', 'ZB.', '8'],
    ]);
    expect(leaders.tableRows[0].detail).toBe('7 zbiórek · 4 przechwyty · 8/17 z gry');
    expect(leaders.tableRows[1].detail).toBe('6 asyst · 4 przechwyty · 5/9 z gry');
    expect(leaders.altText).toContain('Piotr Sosiński 9 zbiórek.');
  });

  it('compares the team where BeKaPaKa was best, with both columns', () => {
    const stats = setContent('comparison', reference);
    expect(stats.title).toBe('Klucz do wygranej');
    expect(stats.columns).toEqual(['BKPK', 'GMVT']);
    expect(stats.tableRows.map((r) => [r.label, r.value, r.value2])).toEqual([
      ['Zbiórki w ataku', '22', '9'],
      ['Przechwyty', '13', '6'],
      ['Punkty po stratach', '20', '10'],
      ['Punkty z kontry', '21', '12'],
    ]);
    expect(stats.tableRows[0].detail).toBe('14 pkt drugiej szansy (rywal 4)');
    expect(stats.tableRows[2].detail).toBe('21 strat rywala');
  });

  it('produces content the graphic contract accepts', () => {
    for (const role of ['poster', 'leaders', 'comparison']) expect(() => projectContentSchema.parse(setContent(role, reference))).not.toThrow();
  });

  it('calls a lost match „Mecz w liczbach” and treats fewer turnovers as an edge', () => {
    const lost = { ...reference, scoreUs: 50, scoreThem: 60, report: { ...reference.report, team: { us: { ...reference.report.team.us, tov: 5 }, them: reference.report.team.them } } };
    expect(setContent('comparison', lost).title).toBe('Mecz w liczbach');
    expect(teamComparisons(lost.report).find((c) => c.key === 'tov')).toMatchObject({ us: 5, them: 21, gap: 16 });
  });

  it('leaves out what the facts cannot fill', () => {
    const bare = factsSchema.parse({ kind: 'match', opponent: 'GMVT TEAM', scoreUs: 56, scoreThem: 54 });
    expect(setContent('comparison', bare)).toBe(null);
    expect(setContent('leaders', bare)).toBe(null);
    expect(setContent('poster', bare).heroStats).toEqual([]);
    // Without a box score the KALK leaders still fill the card.
    expect(setContent('leaders', { ...bare, leaders: [{ name: 'Filip Karpiński', value: '20', stat: 'PTS' }] }).tableRows[0]).toMatchObject({ label: 'Filip Karpiński', value: '20' });
    expect(bestRun({ flow: { runs: [{ team: 'us', points: 4, from: '10:10', to: '14:10', fromMinute: 5, toMinute: 6, quarter: '1. kwarta', scorers: [] }] } })).toBe(null);
  });

  it('names the rival column by its acronym or initials', () => {
    expect(columnName('GMVT TEAM')).toBe('GMVT');
    expect(columnName('Młode Wilki')).toBe('MW');
    expect(columnName('Koszalin')).toBe('KOSZAL');
    expect(columnName('')).toBe('RYWAL');
  });
});
