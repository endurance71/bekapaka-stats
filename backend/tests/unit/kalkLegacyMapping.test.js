import { describe, it, expect } from 'vitest';
import { matchLegacyToV2 } from '../../kalk/v2/legacyMapping.js';

const schedule = [
  { kalkMatchId: '3842', isFinished: true, startsAtUtc: '2025-10-12T10:00:00Z', homeTeam: 'BeKaPaKa Bobolice', guestTeam: 'GMVT TEAM', scoreHome: 61, scoreAway: 53 },
  { kalkMatchId: '3843', isFinished: true, startsAtUtc: '2025-10-12T12:00:00Z', homeTeam: 'Drużyna archiwalna #208', guestTeam: 'Fasolki', scoreHome: 70, scoreAway: 65 },
  { kalkMatchId: '3850', isFinished: true, startsAtUtc: '2025-10-19T10:00:00Z', homeTeam: 'Atomówki', guestTeam: 'BeKaPaKa Bobolice', scoreHome: 84, scoreAway: 91 }
];

describe('matchLegacyToV2', () => {
  it('maps by date and score, BeKaPaKa pair required for BeKaPaKa matches', () => {
    expect(matchLegacyToV2({ date: '2025-10-12T10:00:00Z', homeTeamName: 'BeKaPaKa BOBOLICE', guestTeamName: 'GMVT TEAM', scoreHome: 61, scoreAway: 53 }, schedule)?.kalkMatchId).toBe('3842');
  });
  it('handles swapped home/away and archived team names', () => {
    expect(matchLegacyToV2({ date: '2025-10-19T09:00:00Z', homeTeamName: 'BeKaPaKa', guestTeamName: 'ATOMówki', scoreHome: 91, scoreAway: 84 }, schedule)?.kalkMatchId).toBe('3850');
    expect(matchLegacyToV2({ date: '2025-10-12T12:00:00Z', homeTeamName: 'ATOMówki', guestTeamName: 'Fasolki', scoreHome: 70, scoreAway: 65 }, schedule)?.kalkMatchId).toBe('3843');
  });
  it('returns null when score or date does not match', () => {
    expect(matchLegacyToV2({ date: '2025-10-12T10:00:00Z', homeTeamName: 'BeKaPaKa', guestTeamName: 'GMVT TEAM', scoreHome: 60, scoreAway: 53 }, schedule)).toBeNull();
    expect(matchLegacyToV2({ date: '2025-11-30T10:00:00Z', homeTeamName: 'BeKaPaKa', guestTeamName: 'GMVT TEAM', scoreHome: 61, scoreAway: 53 }, schedule)).toBeNull();
  });
});
