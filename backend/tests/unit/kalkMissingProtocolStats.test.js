import { describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/prisma.js', () => ({ prisma: {} }));

import { markMissingProtocolStats, pointsSourcesFor } from '../../ai/buildMatchContext.js';
import { plusMinusPerGame } from '../../ai/scoutingData.js';

describe('dane, których KALK nie podaje, to brak danych — nie zero', () => {
  it('mecz bez protokołu: same zera w +/- i faulach wymuszonych → null', () => {
    const players = [
      { name: 'A', plusMinus: 0, pfDrawn: 0 },
      { name: 'B', plusMinus: 0, pfDrawn: 0 },
      { name: 'C', plusMinus: null, pfDrawn: null }
    ];
    expect(markMissingProtocolStats(players)).toEqual({ plusMinus: true, pfDrawn: true });
    expect(players.map((p) => [p.plusMinus, p.pfDrawn])).toEqual([[null, null], [null, null], [null, null]]);
  });

  it('mecz z protokołem: zero u jednego zawodnika zostaje zerem', () => {
    const players = [
      { name: 'A', plusMinus: 12, pfDrawn: 3 },
      { name: 'B', plusMinus: 0, pfDrawn: 0 }
    ];
    expect(markMissingProtocolStats(players)).toEqual({ plusMinus: false, pfDrawn: false });
    expect(players[1]).toMatchObject({ plusMinus: 0, pfDrawn: 0 });
  });

  it('punkty spod kosza z KALK nie trafiają do analiz', () => {
    expect(pointsSourcesFor({ fastBreakPts: 22, ptsOffTurnovers: 15, secondChancePts: 12, ptsInPaint: 4 }, null)).toEqual({
      fastBreakPts: 22,
      ptsOffTurnovers: 15,
      secondChancePts: 12,
      ptsInPaint: null
    });
  });

  it('+/- rywala: średnia na mecz tylko z meczów z +/- w protokole', () => {
    const logs = [
      { playerSlug: 'zloty', kalkMatchId: '4144', plusMinus: -2 }, // mecz z nami — protokół z Drive
      { playerSlug: 'zloty', kalkMatchId: '4143', plusMinus: 0 }, // mecz bez +/- w KALK
      { playerSlug: 'lisiecki', kalkMatchId: '4144', plusMinus: 4 },
      { playerSlug: 'lisiecki', kalkMatchId: '4150', plusMinus: 7 }
    ];
    const map = plusMinusPerGame(logs, new Set(['4144', '4150']));
    expect(map.get('zloty')).toEqual({ perGame: -2, games: 1 });
    expect(map.get('lisiecki')).toEqual({ perGame: 5.5, games: 2 });
    expect(plusMinusPerGame(logs, new Set()).size).toBe(0);
  });
});
