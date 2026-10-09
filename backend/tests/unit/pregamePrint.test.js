import { describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import { renderPregamePrintHtml, signPrintToken, verifyPrintToken } from '../../lib/pregamePrint.js';

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
    expect(html).toContain('13:55 / 14:40');
    expect(html).not.toContain('17:45');
    expect(html).toContain('ZOS - KOSiR');
    expect(html).toContain('trener poda');
    expect(html).toContain('GMVT &lt;TEAM&gt;');
    expect(html).toContain('Zbiórka &lt;script&gt;');
    expect(html).toContain('size: A4');
    expect(html).toContain('<script src="print.js"></script>');
  });
});
