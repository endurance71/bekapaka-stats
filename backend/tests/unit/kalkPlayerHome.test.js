import { describe, expect, it } from 'vitest';
import { createFakePrisma } from '../helpers/fakePrisma.js';
import { getPlayerHome } from '../../kalk/v2/home.js';

const S = 'season_2026-2027';
const NOW = new Date('2026-10-10T12:00:00Z');

function seed(extra = {}) {
  return createFakePrisma({
    rosterPlayer: [{ id: 'rp-1', firstName: 'Filip', lastName: 'Karpiński', kalkSlug: 'filip-karpinski' }],
    leagueMatch: [
      { id: 'lm-1', seasonId: S, kalkMatchId: '4124', date: new Date('2026-10-04T10:00:00Z'), homeTeam: 'BeKaPaKa Bobolice', guestTeam: 'Kosz-All-In', isFinished: true, scoreHome: 86, scoreAway: 20 },
      { id: 'lm-2', seasonId: S, kalkMatchId: '4144', date: new Date('2026-10-18T12:40:00Z'), homeTeam: 'GMVT TEAM', guestTeam: 'BeKaPaKa Bobolice', isFinished: false, venue: 'ZOS - KOSiR', roundLabel: 'Kolejka 4', homeTeamKalkId: '146', guestTeamKalkId: '138' },
      { id: 'lm-3', seasonId: S, kalkMatchId: '4150', date: new Date('2026-10-12T12:00:00Z'), homeTeam: 'Pantery', guestTeam: 'Fasolki', isFinished: false }
    ],
    leagueTeam: [
      { id: 't1', seasonId: S, name: 'BeKaPaKa Bobolice', phase: 'regular', position: 1, matches: 1, wins: 1, losses: 0, form: 'W', streak: 'W1' },
      { id: 't2', seasonId: S, name: 'GMVT TEAM', phase: 'regular', position: 5, matches: 1, wins: 0, losses: 1, form: 'P', streak: 'P1' }
    ],
    kalkMatch: [{ id: '4124', seasonId: S, date: new Date('2026-10-04T10:00:00Z'), homeTeamName: 'BeKaPaKa Bobolice', guestTeamName: 'Kosz-All-In', scoreHome: 86, scoreAway: 20 }],
    kalkPlayerGameLog: [{ id: 'g1', seasonId: S, kalkMatchId: '4124', playerSlug: 'filip-karpinski', teamName: 'BeKaPaKa Bobolice', pts: 28, reb: 6, ast: 4, eval: 36, secondsPlayed: 1637, starter: true }],
    ...extra
  });
}

describe('getPlayerHome', () => {
  it('następny mecz BeKaPaKa (nie innych drużyn), rywal w tabeli, mój ostatni mecz, drużyna', async () => {
    const res = await getPlayerHome(seed(), { userId: 'rp-1', seasonId: S, now: NOW });
    expect(res.nextMatch).toMatchObject({ id: '4144', opponent: 'GMVT TEAM', host: 'GMVT TEAM', venue: 'ZOS - KOSiR', opponentKalkId: '146' });
    expect(res.nextMatch.opponentTable).toMatchObject({ position: 5, wins: 0, losses: 1 });
    expect(res.myLastGame).toMatchObject({ id: '4124', opponent: 'Kosz-All-In', result: 'W', pts: 28, eval: 36, minutes: 27, starter: true });
    expect(res.team).toMatchObject({ position: 1, wins: 1, form: ['W'] });
    expect(res.remainingGames).toBe(1);
    expect(res.teamsInLeague).toBe(2);
  });

  it('zawodnik bez sluga KALK / bez meczów → brak „mojego meczu”', async () => {
    const prisma = seed({ rosterPlayer: [{ id: 'rp-2', firstName: 'QA', lastName: 'Panel', kalkSlug: null }] });
    const res = await getPlayerHome(prisma, { userId: 'rp-2', seasonId: S, now: NOW });
    expect(res.myLastGame).toBeNull();
    expect(res.nextMatch).not.toBeNull();
  });
});
