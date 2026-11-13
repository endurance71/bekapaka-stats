import { describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import { findBySurname, fmt, mdLite, renderPregamePrintHtml, signPrintToken, verifyPrintToken } from '../../lib/pregamePrint.js';
import { pickSeasons } from '../../lib/pregameSeasons.js';

const secret = 'test-only-secret-at-least-thirty-two-chars';

describe('druk odprawy', () => {
  it('podpisany link: działa tylko z właściwym zakresem i przed wygaśnięciem', () => {
    const t = signPrintToken(secret, { seasonId: 's1', opponent: 'GMVT TEAM' });
    expect(verifyPrintToken(secret, t)).toEqual({ seasonId: 's1', opponent: 'GMVT TEAM' });
    expect(verifyPrintToken(secret, 'zepsuty')).toBeNull();
    expect(verifyPrintToken(secret, jwt.sign({ id: 'player-1', role: 'USER' }, secret))).toBeNull(); // token sesji ≠ link druku
    expect(verifyPrintToken(secret, jwt.sign({ scope: 'pregame-print', seasonId: 's1', opponent: 'X', exp: Math.floor(Date.now() / 1000) - 5 }, secret))).toBeNull();
  });

  it('strona A4: godziny z terminarza (czas polski), ucieczka HTML, bez zmyślonych wartości', () => {
    const html = renderPregamePrintHtml({
      opponent: 'GMVT <TEAM>',
      venue: 'ZOS - KOSiR',
      logistics: { matchDate: new Date('2026-10-18T12:40:00Z'), tipoffTime: '14:40', gatheringTime: '13:55', kit: null },
      briefing: {
        tipoffTime: '18:30', gatheringTime: '17:45', jerseyColor: '',
        tacticalKeys: [{ number: 1, title: 'Obrona', description: 'Zbiórka <script>', focus: 'defense' }],
        startingFive: [{ position: 'PG', name: 'Dawid Olearczyk', number: 1, assignment: 'Krycie rozgrywającego' }],
        benchKeys: 'Tempo'
      }
    });
    expect(html).toContain('<b>Zbiórka</b>13:55');
    expect(html).toContain('<b>Początek</b>14:40');
    expect(html).not.toContain('17:45');
    expect(html).toContain('ZOS - KOSiR');
    expect(html).toContain('trener poda');
    expect(html).toContain('GMVT &lt;TEAM&gt;');
    expect(html).toContain('Zbiórka &lt;script&gt;');
    expect(html).toContain('size: A4');
    expect(html).toContain('<script src="print.js"></script>');
  });

  it('raport o rywalu: porównania, sezon bieżący i poprzedni, krycie z odmienionych nazwisk', () => {
    const cur = (pts) => ({ seasonLabel: '2026/27', games: 3, perGame: { pts, reb: 4, ast: 3, stl: 2, tov: 3, pf: 3.7, min: 32 }, pct: { two: 40.7, three: 25, ft: 75 } });
    const html = renderPregamePrintHtml({
      opponent: 'Maxbau Okna Dako PSP',
      venue: 'ZOS - KOSiR',
      logistics: { matchDate: new Date('2026-11-14T16:40:00Z'), tipoffTime: '17:40', gatheringTime: '16:55', kit: null },
      briefing: {
        tacticalKeys: [{ number: 1, title: 'Zastawianie', description: 'Opis', focus: 'defense' }],
        startingFive: [{ position: 'PF', playerId: 'p1', name: 'Filip Karpiński', number: 69, assignment: 'Kryje Krzpiota. Opis zadania.' }],
        benchKeys: '- Kaszubowski wchodzi za Motylińskiego'
      },
      report: {
        seasonLabel: '2026/27',
        prevSeasonLabel: '2025/26',
        teams: { us: { rank: 2, record: '3-0', ppg: 70, oppg: 40.7 }, them: { rank: 8, record: '1-2', ppg: 61.3, oppg: 66.3 } },
        averages: { us: { tovPg: 14.3, orbPg: 15.3 }, them: { games: 3, tovPg: 18.3, orbPg: 13.3 } },
        advanced: { us: { pace: 74.9, fourFactors: { efg: 45 } }, them: { pace: 75.8, fourFactors: { efg: 41.1 } } },
        pbp: {}, form: { us: [], them: [{ opponent: 'BrdCrew', score: '54:81', result: 'L' }] },
        headToHead: [], previousSeasons: {}, table: [],
        analysis: { summary: 'Krótko o <rywalu>.', verdict: 'KLUCZ: zatrzymać kontry\n- dwóch wraca', personnel: { threats: '- Krzpiot: krótkie podania w jego strefie' }, lockerRoom: ['Zastawiamy wszyscy'] },
        opponentPlayers: [
          { name: 'Wojciech Krzpiot', number: 7, position: 'G', heightCm: 185, current: cur(13.3), previous: [{ seasonLabel: '2025/26', teamName: 'MAXBAU OKNA DAKO PSP', competition: 'Dywizja I', games: 15, perGame: { pts: 13.9, reb: 4.1, ast: 4.3 }, pct: {} }], plusMinus: 0, plusMinusGames: 3 },
          { name: 'Aleksander Nowak', number: 99, current: cur(11.3), previous: [] }
        ],
        ownPlayers: [{ playerId: 'p1', name: 'Filip Karpiński', games: 3, ppg: 22.7, rpg: 6.7, apg: 2, spg: 2.3, plusMinusTotal: 95, previous: [] }]
      }
    });
    expect(html).toContain('Raport o rywalu');
    expect(html).toContain('Porównanie drużyn');
    expect(html).toContain('2025/26:</b> MAXBAU OKNA DAKO PSP, Dywizja I — 15 meczów, 13,9 pkt');
    expect(html).toContain('Jak kryć:</b> krótkie podania w jego strefie');
    expect(html).toContain('#7 Wojciech Krzpiot'); // „Kryje Krzpiota” → rywal w parze krycia
    expect(html).toContain('Krótko o &lt;rywalu&gt;.');
    expect(html).toContain('assets/herb2-kolor.svg');
    expect(html).not.toMatch(/\bAI\b/); // bez oznaczeń AI w druku
  });

  it('pomocnicze: liczby po polsku, odmienione nazwiska, prosty markdown, wybór sezonów', () => {
    expect(fmt(61.25)).toBe('61,3');
    expect(fmt(null)).toBe('—');
    const players = [{ name: 'Paweł Głodek' }, { name: 'Jakub Nagórski' }, { name: 'Rafał Dolik' }];
    expect(findBySurname(players, 'Głodka')?.name).toBe('Paweł Głodek');
    expect(findBySurname(players, 'Nagórskiego')?.name).toBe('Jakub Nagórski');
    expect(findBySurname(players, 'Nowaka')).toBeNull();
    expect(mdLite('Akapit\n- punkt **ważny**')).toBe('<p>Akapit</p><ul><li>punkt <strong>ważny</strong></li></ul>');
    const career = { seasons: [
      { seasonSlug: '2026-2027', teamName: 'MAXBAU OKNA DAKO PSP', competition: 'Dywizja II', games: 3, perGame: {}, pct: {}, totals: {} },
      { seasonSlug: '2025-2026', teamName: 'X', competition: 'Puchar Ligi', games: 2, perGame: {}, pct: {}, totals: {} },
      { seasonSlug: '2025-2026', teamName: 'X', competition: 'Ekstraliga', games: 11, perGame: {}, pct: {}, totals: {} }
    ] };
    const picked = pickSeasons(career, { seasonSlug: '2026-2027', prevSlug: '2025-2026', teamName: 'Maxbau Okna Dako PSP' });
    expect(picked.current.games).toBe(3);
    expect(picked.previous.map((s) => s.competition)).toEqual(['Ekstraliga', 'Puchar Ligi']);
    expect(picked.current.seasonLabel).toBe('2026/27');
  });
});
