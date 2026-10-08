import { describe, it, expect } from 'vitest';
import { aggregatePbpTendencies, computePbpInsights } from '../../ai/pbpInsights.js';

/**
 * Buduje zdarzenia punktowe z listy [period, clockSec, side, points].
 * @param {Array<[number, number, 'home' | 'away', number] | [number, number, 'home' | 'away', 'foul', string]>} spec
 */
function buildEvents(spec) {
  let h = 0;
  let a = 0;
  return spec.map(([period, clockSec, side, pts, player], idx) => {
    if (pts === 'foul') {
      return { seq: idx + 1, period, clockSec, side, actionType: 'foul', playerName: player, scoreHome: h, scoreAway: a, isScoring: false };
    }
    if (side === 'home') h += pts;
    else a += pts;
    return {
      seq: idx + 1,
      period,
      clockSec,
      side,
      actionType: pts === 1 ? 'ft_made' : 'shot_made',
      playerName: side === 'home' ? 'Jan Domowy' : 'Adam Gość',
      scoreHome: h,
      scoreAway: a,
      isScoring: true
    };
  });
}

describe('computePbpInsights', () => {
  it('returns available=false without events (historical seasons)', () => {
    expect(computePbpInsights([])).toEqual({ available: false });
    expect(computePbpInsights(null)).toEqual({ available: false });
  });

  it('detects runs >= 8:0, lead changes and ties', () => {
    const events = buildEvents([
      [1, 590, 'away', 2], // 0:2  away leads
      [1, 560, 'home', 2], // 2:2  tie
      [1, 540, 'home', 3], // 5:2  home leads -> lead change #1
      [1, 500, 'home', 2], // 7:2
      [1, 480, 'home', 2], // 9:2
      [1, 450, 'home', 1], // 10:2  -> home run 2+3+2+2+1 = 10:0
      [2, 400, 'away', 3], // 10:5
      [2, 380, 'away', 3], // 10:8
      [2, 360, 'away', 2], // 10:10 tie
      [2, 340, 'away', 2], // 10:12 away leads -> lead change #2 ; away run 10:0
      [4, 200, 'home', 3], // 13:12 home leads -> lead change #3
      [4, 100, 'home', 1] // 14:12
    ]);

    const res = computePbpInsights(events, { labels: { home: 'bekapaka', away: 'opponent' } });
    expect(res.available).toBe(true);
    expect(res.leadChanges).toBe(3);
    expect(res.ties).toBe(2);
    expect(res.finalScore).toEqual({ bekapaka: 14, opponent: 12 });
    expect(res.runs).toHaveLength(2);
    expect(res.runs[0]).toMatchObject({ team: 'bekapaka', points: 10 });
    expect(res.runs[1]).toMatchObject({ team: 'opponent', points: 10 });
    expect(res.largestRun).toEqual({ bekapaka: 10, opponent: 10 });
    expect(res.largestLead).toEqual({ bekapaka: 8, opponent: 2 });
    expect(res.clutch.available).toBe(true);
    // ostatnie 5 min 4. kwarty: 4 pkt BeKaPaKa przy wyniku 10:12 na starcie okna
    expect(res.clutch.points).toEqual({ bekapaka: 4, opponent: 0 });
    expect(res.clutch.scoreAtStart).toEqual({ bekapaka: 10, opponent: 12 });
    expect(res.periodScoring.find((p) => p.period === 'Q1')).toEqual({ period: 'Q1', bekapaka: 10, opponent: 2 });
  });

  it('ignores runs shorter than 8 points', () => {
    const events = buildEvents([
      [1, 590, 'home', 3],
      [1, 580, 'home', 3],
      [1, 570, 'away', 2],
      [1, 560, 'home', 3]
    ]);
    const res = computePbpInsights(events);
    expect(res.runs).toEqual([]);
    expect(res.largestRun.home).toBe(6);
  });

  it('counts fouls per period and foul trouble (5 fouls = out)', () => {
    const events = buildEvents([
      [1, 500, 'home', 'foul', 'Jan Domowy'],
      [2, 500, 'home', 'foul', 'Jan Domowy'],
      [3, 500, 'home', 'foul', 'Jan Domowy'],
      [3, 400, 'home', 'foul', 'Jan Domowy'],
      [4, 300, 'home', 'foul', 'Jan Domowy'],
      [4, 200, 'away', 'foul', 'Adam Gość']
    ]);
    const res = computePbpInsights(events, { labels: { home: 'us', away: 'them' } });
    expect(res.foulsPerPeriod.us).toEqual({ Q1: 1, Q2: 1, Q3: 2, Q4: 1 });
    expect(res.foulsPerPeriod.them).toEqual({ Q4: 1 });
    expect(res.foulTrouble).toEqual([{ team: 'us', player: 'Jan Domowy', fouls: 5, fifthFoulPeriod: 'Q4' }]);
  });

  it('aggregates tendencies across matches from one team perspective', () => {
    const m1 = computePbpInsights(
      buildEvents([[1, 590, 'home', 3], [1, 580, 'home', 3], [1, 570, 'home', 2]]),
      { labels: { home: 'opponent', away: 'other' } }
    );
    const m2 = computePbpInsights(
      buildEvents([[1, 590, 'away', 3], [1, 580, 'away', 3], [1, 570, 'away', 3]]),
      { labels: { home: 'opponent', away: 'other' } }
    );
    const agg = aggregatePbpTendencies([m1, m2, { available: false }], 'opponent', 'other');
    expect(agg).toMatchObject({ available: true, matchesWithPbp: 2, runsOf8PlusFor: 1, runsOf8PlusAgainst: 1 });
    expect(aggregatePbpTendencies([], 'opponent', 'other')).toEqual({ available: false, matchesWithPbp: 0 });
  });
});
