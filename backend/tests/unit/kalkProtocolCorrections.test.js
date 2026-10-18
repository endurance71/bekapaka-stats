import { describe, it, expect } from 'vitest';
import { applyProtocolCorrections, correctBoxTeams, correctionFor, loadProtocolCorrections } from '../../kalk/v2/protocolCorrections.js';
import { seasonStatFromPage } from '../../kalk/v2/mapPlayer.js';

const correction = {
  seasonId: 's1',
  kalkMatchId: '10',
  teams: [
    { bekapaka: true, players: { 1: { name: 'Dawid Olearczyk', plusMinus: 58, pfDrawn: 4 }, 69: { name: 'Filip Karpiński', plusMinus: 53, pfDrawn: 1 } } },
    { bekapaka: false, players: { 15: { name: 'Michał Stanowski', plusMinus: -57, pfDrawn: 7 }, 99: { name: 'Nieznany', plusMinus: -1 } } }
  ]
};

const box = () => ({
  teams: [
    { name: 'Kosz-All-In', players: [{ number: '15', plusMinus: 0, pfDrawn: 0 }], totals: { pfDrawn: 0, pts: 20 } },
    {
      name: 'BeKaPaKa Bobolice',
      players: [
        { number: 1, plusMinus: 0, pfDrawn: 0 },
        { number: 69, plusMinus: 0, pfDrawn: 0 },
        { number: 12, plusMinus: 0, pfDrawn: 2 }
      ],
      totals: { pfDrawn: 0, pts: 86 }
    }
  ]
});

describe('protocol corrections (+/-, fouls drawn)', () => {
  it('patches players by team and number, and re-sums fouls drawn in team totals', () => {
    const b = box();
    const res = correctBoxTeams(b.teams, correction);
    expect(res.players).toBe(3);
    const bkpk = b.teams[1];
    expect(bkpk.players.map((p) => [p.plusMinus, p.pfDrawn])).toEqual([[58, 4], [53, 1], [0, 2]]);
    expect(bkpk.totals).toEqual({ pfDrawn: 7, pts: 86 });
    expect(b.teams[0].players[0]).toMatchObject({ plusMinus: -57, pfDrawn: 7 });
    expect(res.warnings).toEqual(['mecz 10: Kosz-All-In nie ma zawodnika #99 (Nieznany)']);
  });

  it('applies only to matches of the same season in a scraper bundle', () => {
    const matches = [{ kalkMatchId: 10, box: box() }, { kalkMatchId: 11, box: box() }];
    const res = applyProtocolCorrections('s1', matches, [correction]);
    expect(res).toMatchObject({ matches: 1, players: 3 });
    expect(matches[1].box.teams[1].players[0].plusMinus).toBe(0);
    expect(applyProtocolCorrections('other', [{ kalkMatchId: 10, box: box() }], [correction]).matches).toBe(0);
  });

  // [mecz, punkty BeKaPaKa, punkty rywala, faule popełnione rywala, faule popełnione BeKaPaKa]
  it.each([
    ['4124', 86, 20, 17, 12], // BeKaPaKa – Kosz-All-In
    ['4144', 56, 54, 19, 14] // GMVT TEAM – BeKaPaKa
  ])('ships a consistent correction for match %s (Σ +/- = 5 × margin, fouls drawn = opponent fouls)', (id, ours, theirs, oppFouls, ourFouls) => {
    const c = correctionFor('season_2026-2027', id, loadProtocolCorrections());
    const sum = (team, field) => Object.values(team.players).reduce((s, p) => s + p[field], 0);
    const [us, them] = [c.teams.find((t) => t.bekapaka), c.teams.find((t) => !t.bekapaka)];
    expect(sum(us, 'plusMinus')).toBe(5 * (ours - theirs));
    expect(sum(them, 'plusMinus')).toBe(-5 * (ours - theirs));
    expect(sum(us, 'pfDrawn')).toBe(oppFouls);
    expect(sum(them, 'pfDrawn')).toBe(ourFouls);
  });

  it('season stats take +/- and fouls drawn from game logs when KALK reports 0', () => {
    const row = { games: 1, pts: 12, twoPm: 4, threePm: 0, ftm: 4, plusMinus: '0', pfDrawn: '0' };
    expect(seasonStatFromPage(row, { seasonId: 's1', playerSlug: 'x', logTotals: { plusMinus: 58, pfDrawn: 4 } })).toMatchObject({ plusMinus: 58, pfDrawn: 4 });
    expect(seasonStatFromPage({ ...row, plusMinus: '12' }, { seasonId: 's1', playerSlug: 'x', logTotals: { plusMinus: 58 } }).plusMinus).toBe(12);
    expect(seasonStatFromPage(row, { seasonId: 's1', playerSlug: 'x' }).plusMinus).toBe(0);
  });
});
