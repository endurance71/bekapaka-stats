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

// Stan 2026/27 po 5. kolejce (18.10): wszystkie zakończone mecze sezonu zasadniczego.
const season = [
  m('2026-09-27', 'BrdCrew', 64, 46, 'Pantery'),
  m('2026-09-27', 'Atomówki', 70, 65, 'Fasolki'),
  m('2026-10-03', 'Grubik Team', 45, 66, 'Maxbau Okna Dako PSP'),
  m('2026-10-04', 'BeKaPaKa Bobolice', 86, 20, 'Kosz-All-In'),
  m('2026-10-04', 'Młode Wilki', 78, 55, 'GMVT TEAM'),
  m('2026-10-10', 'Kosz-All-In', 22, 130, 'BrdCrew'),
  m('2026-10-10', 'Maxbau Okna Dako PSP', 64, 73, 'Młode Wilki'),
  m('2026-10-17', 'Pantery', 89, 66, 'Atomówki'),
  m('2026-10-17', 'Fasolki', 58, 53, 'Grubik Team'),
  m('2026-10-17', 'Kosz-All-In', 31, 101, 'Pantery')
];
const teamNames = ['Pantery', 'BrdCrew', 'Młode Wilki', 'Maxbau Okna Dako PSP', 'Fasolki', 'Atomówki', 'Kosz-All-In', 'BeKaPaKa Bobolice', 'Grubik Team', 'GMVT TEAM'];
// Puste wiersze wymuszają przeliczenie i sortowanie wszystkich drużyn.
const blank = teamNames.map((name, i) => ({ name, position: i + 1, matches: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, points: 0 }));

describe('reconcileStandings — remisy jak w KALK', () => {
  it('reproduces the KALK order on the results KALK counts (without round 1)', () => {
    const { rows } = reconcileStandings(blank, season.slice(2));
    // Tabela kalk-koszalin.com po 5. kolejce: 2 pkt — Fasolki (wygrana z Grubik), Grubik (1 pkt w meczu
    // bezpośrednim), potem BrdCrew i BeKaPaKa wg bilansu; 1 pkt — Atomówki i GMVT (−23) wg punktów zdobytych.
    expect(rows.map((r) => r.name)).toEqual([
      'Pantery', 'Młode Wilki', 'Maxbau Okna Dako PSP', 'Kosz-All-In', 'Fasolki',
      'Grubik Team', 'BrdCrew', 'BeKaPaKa Bobolice', 'Atomówki', 'GMVT TEAM'
    ]);
  });

  it('breaks ties by head-to-head before the point difference on the full results', () => {
    const { rows } = reconcileStandings(blank, season);
    // 3 pkt: Atomówki pokonały Fasolki → przed nimi i przed Maxbau (lepszy bilans, ale bez meczu z nimi).
    expect(rows.map((r) => r.name)).toEqual([
      'Pantery', 'BrdCrew', 'Młode Wilki', 'Atomówki', 'Fasolki',
      'Maxbau Okna Dako PSP', 'Kosz-All-In', 'BeKaPaKa Bobolice', 'Grubik Team', 'GMVT TEAM'
    ]);
    expect(rows.map((r) => r.position)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('restarts head-to-head for teams still tied after the mini table splits the group (FIBA D.1)', () => {
    // A, B, C, D po 6 pkt. Mała tabela ABCD: A i B po 5 pkt, C i D po 4. A ma w niej lepszy bilans (+69 vs +1),
    // ale dla pary A–B liczy się od nowa tylko ich mecz — wygrało B. Tak samo C–D: wygrało C.
    const names = ['A', 'B', 'C', 'D', 'E1', 'E2', 'E3', 'E4'];
    const rowsIn = names.map((name, i) => ({ name, position: i + 1, matches: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, points: 0 }));
    const games = [
      m('2026-10-01', 'A', 80, 40, 'D'),
      m('2026-10-01', 'B', 51, 50, 'A'),
      m('2026-10-02', 'D', 61, 60, 'B'),
      m('2026-10-02', 'C', 70, 60, 'D'),
      m('2026-10-03', 'A', 80, 50, 'C'),
      m('2026-10-03', 'B', 61, 60, 'C'),
      m('2026-10-04', 'E1', 70, 60, 'A'),
      m('2026-10-04', 'E2', 70, 60, 'B'),
      m('2026-10-05', 'C', 70, 60, 'E3'),
      m('2026-10-05', 'D', 70, 60, 'E4')
    ];
    const { rows } = reconcileStandings(rowsIn, games);
    expect(rows.map((r) => r.name)).toEqual(['B', 'A', 'C', 'D', 'E1', 'E2', 'E3', 'E4']);
    expect(rows.slice(0, 4).map((r) => r.points)).toEqual([6, 6, 6, 6]);
  });
});
