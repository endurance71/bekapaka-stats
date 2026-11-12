import { describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/prisma.js', () => ({ prisma: {} }));

import { markMissingProtocolStats, pointsSourcesFor } from '../../ai/buildMatchContext.js';
import { plusMinusKey, plusMinusPerGame } from '../../ai/scoutingData.js';
import { teamPlusMinusAvailable } from '../../kalk/v2/util.js';

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

  it('+/- rywala: średnia na mecz tylko z meczów, w których JEGO drużyna ma +/-', () => {
    const logs = [
      { playerSlug: 'zloty', kalkMatchId: '4144', side: 'home', plusMinus: -2 }, // protokół z Drive
      { playerSlug: 'zloty', kalkMatchId: '4143', side: 'away', plusMinus: 0 }, // KALK: same zera
      { playerSlug: 'slomski', kalkMatchId: '4184', side: 'home', plusMinus: 0 }, // rywal ma +/- z akcji, Grubik nie
      { playerSlug: 'lisiecki', kalkMatchId: '4144', side: 'home', plusMinus: 4 },
      { playerSlug: 'lisiecki', kalkMatchId: '4150', side: 'away', plusMinus: 7 }
    ];
    const withPm = new Set([plusMinusKey('4144', 'home'), plusMinusKey('4150', 'away'), plusMinusKey('4184', 'away')]);
    const map = plusMinusPerGame(logs, withPm);
    expect(map.get('zloty')).toEqual({ perGame: -2, games: 1 });
    expect(map.get('lisiecki')).toEqual({ perGame: 5.5, games: 2 });
    expect(map.has('slomski')).toBe(false);
    expect(plusMinusPerGame(logs, new Set()).size).toBe(0);
  });

  it('dostępność +/- sprawdzana osobno dla każdej drużyny w meczu', () => {
    const box = {
      teams: [
        { name: 'Grubik Team', players: [{ plusMinus: 0 }, { plusMinus: 0 }] },
        { name: 'BeKaPaKa Bobolice', players: [{ plusMinus: 31 }, { plusMinus: -9 }] }
      ]
    };
    expect(teamPlusMinusAvailable(box, 'BeKaPaKa Bobolice')).toBe(true);
    expect(teamPlusMinusAvailable(box, 'Grubik Team')).toBe(false);
    expect(teamPlusMinusAvailable(box, 'Nieznana')).toBe(true); // bez dopasowania — jak dla całego meczu

    const grubik = [{ name: 'S', plusMinus: 0, pfDrawn: 0 }];
    const bek = [{ name: 'K', plusMinus: 31, pfDrawn: 0 }];
    expect(markMissingProtocolStats(grubik).plusMinus).toBe(true);
    expect(markMissingProtocolStats(bek).plusMinus).toBe(false);
    expect([grubik[0].plusMinus, bek[0].plusMinus]).toEqual([null, 31]);
  });
});
