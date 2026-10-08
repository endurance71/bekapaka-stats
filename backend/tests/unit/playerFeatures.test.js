import { describe, expect, it } from 'vitest';
import { resolveMatchDay, validateMatchDay } from '../../lib/matchDay.js';
import { buildIcsCalendar, foldIcsLine, leagueMatchToEvent, selectTeamMatches } from '../../lib/calendarIcs.js';
import { normalizeGoals, validateGoals } from '../../lib/playerGoals.js';
import { summarizeGameLogs } from '../../kalk/v2/readModels.js';

describe('dzień meczowy', () => {
  it('walidacja: zbiórka GG:MM, strój i uwagi z limitem, puste = wyczyść', () => {
    expect(validateMatchDay({ gatheringTime: '13:55', kit: 'Czarne', notes: 'Bez spóźnień' })).toEqual({ gatheringTime: '13:55', kit: 'Czarne', notes: 'Bez spóźnień' });
    expect(validateMatchDay({ gatheringTime: '', kit: '' })).toBeNull();
    expect(validateMatchDay(null)).toBeNull();
    expect(() => validateMatchDay({ gatheringTime: '25:00' })).toThrow(/GG:MM/);
    expect(() => validateMatchDay({ venue: 'x' })).toThrow(/Nieznane pole/);
  });

  it('bez ustawionej zbiórki: orientacyjnie 45 min przed meczem (czas polski)', () => {
    expect(resolveMatchDay(null, '2026-10-18T12:40:00.000Z')).toMatchObject({ gatheringTime: '13:55', gatheringEstimated: true, kit: null });
    expect(resolveMatchDay({ gatheringTime: '13:30', kit: 'Białe' }, '2026-10-18T12:40:00.000Z')).toMatchObject({ gatheringTime: '13:30', gatheringEstimated: false, kit: 'Białe' });
  });
});

describe('kalendarz .ics', () => {
  const rows = [
    { id: 'lm1', kalkMatchId: '4144', date: new Date('2026-10-18T12:40:00Z'), homeTeam: 'GMVT TEAM', guestTeam: 'BeKaPaKa Bobolice', venue: 'ZOS - KOSiR, Koszalin', roundLabel: 'Kolejka 4', isFinished: false },
    { id: 'lm2', kalkMatchId: '4150', date: new Date('2026-10-12T12:00:00Z'), homeTeam: 'Pantery', guestTeam: 'Fasolki' },
    { id: 'lm3', kalkMatchId: '4124', date: new Date('2026-10-04T10:00:00Z'), homeTeam: 'BeKaPaKa Bobolice', guestTeam: 'Kosz-All-In', isFinished: true, scoreHome: 86, scoreAway: 20 }
  ];

  it('tylko mecze BeKaPaKa, rosnąco; jeden mecz po ID', () => {
    expect(selectTeamMatches(rows).map((m) => m.kalkMatchId)).toEqual(['4124', '4144']);
    expect(selectTeamMatches(rows, '4144').map((m) => m.kalkMatchId)).toEqual(['4144']);
  });

  it('wydarzenia z UID jak na stronie, UTC, ucieczka przecinków, wynik w tytule', () => {
    const ics = buildIcsCalendar(selectTeamMatches(rows).map(leagueMatchToEvent), { now: new Date('2026-10-08T10:00:00Z') });
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain('UID:bekapaka-kalk-4144@bekapaka.pl');
    expect(ics).toContain('DTSTART:20261018T124000Z');
    expect(ics).toContain('DTEND:20261018T144000Z');
    expect(ics).toContain('LOCATION:ZOS - KOSiR\\, Koszalin');
    expect(ics).toContain('SUMMARY:BeKaPaKa Bobolice – Kosz-All-In (86:20)');
    expect(ics.split('\r\n').every((l) => l.length <= 75)).toBe(true);
  });

  it('łamanie długich linii', () => {
    const folded = foldIcsLine('X'.repeat(160));
    expect(folded.split('\r\n').map((l) => l.length)).toEqual([75, 75, 12]);
  });
});

describe('cele sezonu', () => {
  it('do 5 celów, znane statystyki, zakresy, bez duplikatów', () => {
    expect(validateGoals({ items: [{ stat: 'ppg', target: 10 }, { stat: 'ftPct', target: '70' }] })).toEqual({ items: [{ stat: 'ppg', target: 10 }, { stat: 'ftPct', target: 70 }] });
    expect(() => validateGoals({ items: [{ stat: 'dunks', target: 1 }] })).toThrow(/Nieznana/);
    expect(() => validateGoals({ items: [{ stat: 'ppg', target: 99 }] })).toThrow(/0–60/);
    expect(() => validateGoals({ items: [{ stat: 'ppg', target: 5 }, { stat: 'ppg', target: 6 }] })).toThrow(/jeden cel/);
    expect(() => validateGoals({ items: Array.from({ length: 6 }, (_, i) => ({ stat: ['ppg', 'rpg', 'apg', 'spg', 'bpg', 'tovPg'][i], target: 1 })) })).toThrow(/Maksymalnie 5/);
  });

  it('stary kształt celów mapowany na listę', () => {
    expect(normalizeGoals({ ppg: 12, fgPercentage: 45, turnovers: 2 }).items).toEqual([
      { stat: 'ppg', target: 12 }, { stat: 'fgPct', target: 45 }, { stat: 'tovPg', target: 2 }
    ]);
    expect(normalizeGoals(null)).toEqual({ items: [] });
  });
});

describe('rekordy kariery', () => {
  it('najlepszy mecz w punktach, zbiórkach, asystach i trójkach', () => {
    const logs = [
      { seasonId: 's1', kalkMatchId: 'a', opponentName: 'A', pts: 12, reb: 10, ast: 1, threePm: 2, eval: 15 },
      { seasonId: 's2', kalkMatchId: 'b', opponentName: 'B', pts: 28, reb: 6, ast: 4, stats: { three_pm: 0 }, eval: 36 }
    ];
    const r = summarizeGameLogs(logs);
    expect(r.bestPts).toMatchObject({ value: 28, matchId: 'b' });
    expect(r.bestReb).toMatchObject({ value: 10, matchId: 'a' });
    expect(r.bestAst).toMatchObject({ value: 4, matchId: 'b' });
    expect(r.bestThreePm).toMatchObject({ value: 2, matchId: 'a' });
    expect(r.doubleDoubles).toBe(1);
  });
});
