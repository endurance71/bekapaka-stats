import { describe, it, expect } from 'vitest';
import { reconcileStandings } from '../../kalk/v2/standings.js';

// Stan 2026/27 po 4. kolejce: tabela KALK nie wliczyła obu meczów 1. kolejki.
const kalkTable = [
  { name: 'Młode Wilki', position: 1, matches: 2, wins: 2, losses: 0, pointsFor: 151, pointsAgainst: 119, points: 4, form: 'W,W', streak: 'W2' },
  { name: 'Maxbau Okna Dako PSP', position: 2, matches: 2, wins: 1, losses: 1, pointsFor: 130, pointsAgainst: 118, points: 3, form: 'W,L', streak: 'L1' },
  { name: 'BrdCrew', position: 3, matches: 1, wins: 1, losses: 0, pointsFor: 130, pointsAgainst: 22, points: 2, form: 'W', streak: 'W1' },
  { name: 'BeKaPaKa Bobolice', position: 4, matches: 1, wins: 1, losses: 0, pointsFor: 86, pointsAgainst: 20, points: 2, form: 'W', streak: 'W1' },
  { name: 'Pantery', position: 8, matches: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, points: 0, form: null, streak: null },
  { name: 'Atomówki', position: 10, matches: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, points: 0, form: null, streak: null }
];
const m = (date, homeTeam, scoreHome, scoreAway, guestTeam, phaseLabel = 'Sezon zasadniczy') => ({ date, homeTeam, guestTeam, scoreHome, scoreAway, isFinished: true, phaseLabel });
const schedule = [
  m('2026-09-27', 'BrdCrew', 64, 46, 'Pantery'),
  m('2026-09-27', 'Atomówki', 70, 65, 'Fasolki'),
  m('2026-10-03', 'Grubik Team', 45, 66, 'Maxbau Okna Dako PSP'),
  m('2026-10-04', 'Młode Wilki', 78, 55, 'GMVT TEAM'),
  m('2026-10-04', 'BeKaPaKa Bobolice', 86, 20, 'Kosz-All-In'),
  m('2026-10-10', 'Kosz-All-In', 22, 130, 'BrdCrew'),
  m('2026-10-10', 'Maxbau Okna Dako PSP', 64, 73, 'Młode Wilki'),
  { ...m('2026-10-17', 'Pantery', null, null, 'Fasolki'), isFinished: false },
  m('2027-03-01', 'Pantery', 50, 40, 'BrdCrew', 'Play out')
];

describe('reconcileStandings', () => {
  it('recounts only the rows KALK got wrong, from regular-season results, and re-sorts the table', () => {
    const { rows, corrected } = reconcileStandings(kalkTable, schedule);
    expect(corrected).toEqual(['BrdCrew', 'Pantery', 'Atomówki']);
    const by = Object.fromEntries(rows.map((r) => [r.name, r]));
    expect(by.BrdCrew).toMatchObject({ matches: 2, wins: 2, losses: 0, pointsFor: 194, pointsAgainst: 68, points: 4, form: 'W,W', streak: 'W2', position: 1 });
    expect(by.Pantery).toMatchObject({ matches: 1, wins: 0, losses: 1, pointsFor: 46, pointsAgainst: 64, points: 1, form: 'L', streak: 'L1' });
    expect(by['Atomówki']).toMatchObject({ matches: 1, wins: 1, points: 2, form: 'W' });
    // Wiersz zgodny z wynikami zostaje jak w KALK (poza pozycją po ponownym sortowaniu).
    expect(by['Młode Wilki']).toMatchObject({ matches: 2, form: 'W,W', streak: 'W2', position: 2 });
    expect(rows.map((r) => r.name)).toEqual(['BrdCrew', 'Młode Wilki', 'Maxbau Okna Dako PSP', 'BeKaPaKa Bobolice', 'Atomówki', 'Pantery']);
  });

  it('leaves a table that matches the results untouched', () => {
    const ok = kalkTable.filter((t) => ['Młode Wilki', 'Maxbau Okna Dako PSP', 'BeKaPaKa Bobolice'].includes(t.name));
    const { rows, corrected } = reconcileStandings(ok, schedule);
    expect(corrected).toEqual([]);
    expect(rows).toEqual(ok);
  });
});
