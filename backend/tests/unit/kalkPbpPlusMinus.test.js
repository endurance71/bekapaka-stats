import { describe, expect, it } from 'vitest';
import { computeLineupStints } from '../../kalk/v2/lineups.js';
import { applyPbpPlusMinus, plusMinusFromPbp } from '../../kalk/v2/pbpPlusMinus.js';

let seq = 0;
const ev = (over) => ({
  seq: ++seq, period: 1, elapsedSec: 0, side: 'home', playerSlug: null, playerName: null, playerNumber: null,
  actionType: 'shot_made', subOutSlug: null, subOutNumber: null, scoreHome: 0, scoreAway: 0, ...over
});
const sub = (slug, out, over = {}) => ev({ actionType: 'sub', playerSlug: slug, subOutSlug: out, ...over });

/** Mecz 600 s: piątka a–e, f wchodzi za e w 300 s; wynik 6:2 (różnica +4). */
function game({ lateSub = false } = {}) {
  seq = 0;
  return [
    ...['a', 'b', 'c', 'd', 'e'].map((s) => sub(s, null)),
    ev({ side: 'away', actionType: 'sub', playerSlug: 'x1' }),
    ev({ side: null, actionType: 'period_start' }),
    ev({ elapsedSec: 100, playerSlug: 'a', scoreHome: 2 }),
    ev({ elapsedSec: 200, side: 'away', playerSlug: 'x1', scoreHome: 2, scoreAway: 2 }),
    // KALK zapisuje zmianę 10 s po pierwszej akcji wchodzącego f (przypadek z meczów 4124 i 4184)
    ...(lateSub
      ? [ev({ elapsedSec: 300, actionType: 'rebound', playerSlug: 'f', scoreHome: 2, scoreAway: 2 }),
         sub('f', 'e', { elapsedSec: 310, scoreHome: 2, scoreAway: 2 })]
      : [sub('f', 'e', { elapsedSec: 300, scoreHome: 2, scoreAway: 2 })]),
    ev({ elapsedSec: 400, playerSlug: 'f', scoreHome: 4, scoreAway: 2 }),
    ev({ elapsedSec: 500, playerSlug: 'b', scoreHome: 6, scoreAway: 2 }),
    ev({ elapsedSec: 600, side: null, actionType: 'period_end', scoreHome: 6, scoreAway: 2 })
  ];
}
const box = (secondsE = 300, secondsF = 300) => [
  ...['a', 'b', 'c', 'd'].map((slug) => ({ slug, secondsPlayed: 600, plusMinus: 0 })),
  { slug: 'e', secondsPlayed: secondsE, plusMinus: 0 },
  { slug: 'f', secondsPlayed: secondsF, plusMinus: 0 }
];

describe('+/- z akcji po akcji', () => {
  it('liczy +/- z odcinków piątek i sprawdza sumę = 5 × różnica', () => {
    const res = plusMinusFromPbp(game(), 'home', box(), 4);
    expect(res.ok).toBe(true);
    expect(Object.fromEntries(res.values)).toEqual({ a: 4, b: 4, c: 4, d: 4, e: 0, f: 4 });
  });

  it('spóźniony wpis zmiany (10 s po akcji wchodzącego) nie robi szóstego zawodnika na parkiecie', () => {
    const { stints } = computeLineupStints(game({ lateSub: true }), 'home');
    expect(stints.every((st) => st.certain)).toBe(true);
    expect(plusMinusFromPbp(game({ lateSub: true }), 'home', box(), 4).ok).toBe(true);
  });

  it('odrzuca drużynę, gdy czas gry z akcji nie zgadza się z box score albo suma nie pasuje do wyniku', () => {
    expect(plusMinusFromPbp(game(), 'home', box(100, 500), 4)).toMatchObject({ ok: false, reason: expect.stringMatching(/czas gry e/) });
    expect(plusMinusFromPbp(game(), 'home', box(), 6)).toMatchObject({ ok: false, reason: expect.stringMatching(/5 × różnica 30/) });
  });

  it('odrzuca mecz z niepewną piątką (zawodnik bez zmiany, której nie ma w oknie)', () => {
    seq = 0;
    const events = [...game().slice(0, -1), ev({ elapsedSec: 550, playerSlug: 'g', scoreHome: 6, scoreAway: 2 }), ev({ elapsedSec: 600, side: null, actionType: 'period_end', scoreHome: 6, scoreAway: 2 })];
    expect(plusMinusFromPbp(events, 'home', box(), 4)).toMatchObject({ ok: false, reason: 'odcinki bez pewnej piątki' });
  });

  it('w paczce uzupełnia tylko drużyny z samymi zerami i oznacza źródło', () => {
    const home = { side: 'home', name: 'BeKaPaKa Bobolice', players: box(), totals: { pts: 6, plusMinus: 0 } };
    const away = { side: 'away', name: 'Rywal', players: [{ slug: 'x1', secondsPlayed: 600, plusMinus: -3 }], totals: { pts: 2 } };
    const res = applyPbpPlusMinus([{ kalkMatchId: '1', pbp: { events: game() }, box: { teams: [home, away] } }]);
    expect(res.teams).toBe(1);
    expect(home.plusMinusSource).toBe('pbp');
    expect(home.players.find((p) => p.slug === 'f').plusMinus).toBe(4);
    expect(home.totals.plusMinus).toBe(20);
    // rywal ma +/- od KALK albo z protokołu — bez zmian
    expect(away.players[0].plusMinus).toBe(-3);
    expect(away.plusMinusSource).toBeUndefined();
  });
});
