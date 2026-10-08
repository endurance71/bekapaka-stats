import { describe, it, expect } from 'vitest';
import { factCheckText, matchDerivedNumbers, numberIsSupported } from '../../ai/factCheck.js';

const payload = {
  meta: { scoreUs: 86, scoreThem: 20, opponent: 'Kosz-All-In' },
  quarters: [{ label: 'Q1', bekapaka: 26, opponent: 4 }],
  teams: {
    bekapaka: {
      totals: { reb: 44, tov: 11 },
      fourFactors: { efgPct: 52.3 },
      players: [{ name: 'Filip Karpiński', number: 69, pts: 28, fg: '13/15' }]
    },
    opponent: { totals: { reb: 30, tov: 25 }, players: [{ name: 'Adam Nowak', number: 7, pts: 9 }] }
  },
  trend: { efg: 0.481 }
};

describe('factCheckText', () => {
  it('accepts numbers and names present in payload (incl. rounding, fractions as %, strings like 13/15)', () => {
    const text = `## Podsumowanie
Wygraliśmy 86:20 (różnica 66). Filip Karpiński (#69) rzucił 28 pkt przy 13/15 z gry, eFG 52,3% (wcześniej 48,1%).
Karpińskiego nie dało się zatrzymać, a Nowak miał tylko 9 punktów. Zbiórki 44 do 30.`;
    const res = factCheckText(text, payload, { extraNumbers: matchDerivedNumbers(payload) });
    expect(res.suspiciousNumbers).toEqual([]);
    expect(res.suspiciousNames).toEqual([]);
    expect(res.suspicious).toBe(false);
  });

  it('flags an invented number', () => {
    const res = factCheckText('BeKaPaKa zdobyła 23 punkty po szybkim ataku.', payload);
    expect(res.suspicious).toBe(true);
    expect(res.suspiciousNumbers.map((n) => n.value)).toEqual([23]);
  });

  it('flags an invented player name', () => {
    const res = factCheckText('Kluczowy był Tomasz Wiśniewski z 28 punktami.', payload);
    expect(res.suspiciousNames.map((n) => n.name)).toEqual(['Tomasz Wiśniewski']);
  });

  it('skips target sections (training goals) and small integers', () => {
    const text = `## Propozycje treningowe
- Cel: 75% z wolnych w 5 seriach po 37 rzutów.
## Profil
Masz 28 pkt w ostatnim meczu i 3 asysty.`;
    const res = factCheckText(text, payload, { skipSections: ['Propozycje treningowe'] });
    expect(res.suspicious).toBe(false);
  });

  it('numberIsSupported handles fraction → percent', () => {
    expect(numberIsSupported(48.1, [0.481])).toBe(true);
    expect(numberIsSupported(48, [0.481])).toBe(true);
    expect(numberIsSupported(47, [0.481])).toBe(false);
  });
});
