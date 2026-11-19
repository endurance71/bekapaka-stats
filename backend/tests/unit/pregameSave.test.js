import { beforeEach, describe, expect, it, vi } from 'vitest';

const upsert = vi.fn(async ({ create }) => ({ id: 'b1', ...create }));
const findFirst = vi.fn();
vi.mock('../../lib/prisma.js', () => ({
  prisma: { preGameBriefing: { upsert: (...a) => upsert(...a) }, leagueMatch: { findFirst: (...a) => findFirst(...a) } }
}));

const { findPregameMatch, pregameKeyIssues, savePregame } = await import('../../ai/tacticsOps.js');
const { renderPregamePrintHtml } = await import('../../lib/pregamePrint.js');

const keys = () => [
  { number: 1, title: 'Strefa', description: 'Zastawiamy', focus: 'defense' },
  { number: 2, title: 'Atak', description: 'Pod kosz', focus: 'offense' },
  { number: 3, title: 'Powrót', description: 'Dwóch wraca', focus: 'transition' }
];
const zone = () => ['D1', 'D2', 'D3', 'D4', 'D5'].map((position) => ({ position, assignment: `${position} — zadanie` }));
const prep = { seasonId: 's1', opponent: 'Młode Wilki', roster: [], nextMatch: null };

describe('zapis karty przedmeczowej', () => {
  beforeEach(() => {
    upsert.mockClear();
  });

  it('zapisuje hasło motywacyjne i rodzaj każdego założenia', async () => {
    const out = { tacticalKeys: keys(), startingFive: zone(), benchKeys: '', motivationalMotto: '  Strefa, tablica i zero prezentów. ' };
    await savePregame(prep, JSON.stringify(out), 'agent-mcp');
    const data = upsert.mock.calls[0][0].create;
    expect(data.motivationalMotto).toBe('Strefa, tablica i zero prezentów.');
    expect(data.tacticalKeys.map((k) => k.focus)).toEqual(['defense', 'offense', 'transition']);
    expect(data.startingFive).toHaveLength(5);
  });

  it('puste hasło zapisuje jako brak (null)', async () => {
    await savePregame(prep, { tacticalKeys: keys(), startingFive: zone(), benchKeys: '', motivationalMotto: '  ' }, 'm');
    expect(upsert.mock.calls[0][0].create.motivationalMotto).toBeNull();
  });

  it('odrzuca kartę bez rodzaju założenia (focus) i nic nie zapisuje', async () => {
    const bad = keys().map(({ focus, ...k }) => k);
    await expect(savePregame(prep, { tacticalKeys: bad, startingFive: zone(), benchKeys: '', motivationalMotto: 'x' }, 'm')).rejects.toThrow(
      /klucz 1: focus musi być jednym z defense, offense, transition/
    );
    expect(upsert).not.toHaveBeenCalled();
  });

  it('wylicza wszystkie braki w kluczach', () => {
    expect(pregameKeyIssues(keys())).toEqual([]);
    expect(pregameKeyIssues(keys().slice(0, 2))).toEqual(['dokładnie 3 klucze taktyczne']);
    expect(pregameKeyIssues([{ focus: 'attack' }, ...keys().slice(1)])).toEqual([
      'klucz 1: brak tytułu (title)',
      'klucz 1: brak opisu (description)',
      'klucz 1: focus musi być jednym z defense, offense, transition'
    ]);
  });

  it('druk odprawy pokazuje hasło na mecz', () => {
    const html = renderPregamePrintHtml({
      opponent: 'Młode Wilki',
      venue: 'ZOS - KOSiR',
      logistics: { matchDate: new Date('2026-12-06T12:20:00Z'), tipoffTime: '13:20', gatheringTime: '12:35', kit: null },
      briefing: { tacticalKeys: keys(), startingFive: zone(), benchKeys: '', motivationalMotto: 'Zero <prezentów>' }
    });
    expect(html).toContain('Hasło na mecz');
    expect(html).toContain('„Zero &lt;prezentów&gt;”');
  });
});

// Terminarz BeKaPaKa: Maxbau rozegrany 14.11, najbliższy mecz to Młode Wilki 6.12.
const schedule = [
  { date: new Date('2026-11-14T16:40:00Z'), homeTeam: 'BeKaPaKa Bobolice', guestTeam: 'Maxbau Okna Dako PSP', isFinished: true, venue: 'ZOS - KOSiR' },
  { date: new Date('2026-12-06T12:20:00Z'), homeTeam: 'BeKaPaKa Bobolice', guestTeam: 'Młode Wilki', isFinished: false, venue: 'ZOS - KOSiR' },
  { date: new Date('2026-12-13T12:20:00Z'), homeTeam: 'Fasolki', guestTeam: 'BeKaPaKa Bobolice', isFinished: false, venue: 'ZOS - KOSiR' }
];
const has = (m, name) => [m.homeTeam, m.guestTeam].some((t) => t.toLowerCase().includes(name.toLowerCase()));
// Minimalny odpowiednik zapytania Prisma używanego w findPregameMatch.
const queryLeague = async ({ where, orderBy }) => {
  const names = (where.AND || []).map((c) => c.OR[0].homeTeam.contains);
  const rows = schedule
    .filter((m) => m.isFinished === where.isFinished)
    .filter((m) => (names.length ? names.every((n) => has(m, n)) : has(m, 'bekapaka')))
    .sort((a, b) => (orderBy.date === 'asc' ? a.date - b.date : b.date - a.date));
  return rows[0] || null;
};

describe('mecz karty przedmeczowej', () => {
  beforeEach(() => {
    findFirst.mockReset();
    findFirst.mockImplementation(queryLeague);
    upsert.mockClear();
  });

  it('bierze najbliższy mecz z tym rywalem, nie najbliższy mecz BeKaPaKa', async () => {
    expect((await findPregameMatch('s1', 'Fasolki')).date.toISOString()).toBe('2026-12-13T12:20:00.000Z');
    expect((await findPregameMatch('s1', 'Młode Wilki')).guestTeam).toBe('Młode Wilki');
  });

  it('dla rozegranego rywala bierze ostatni mecz z nim (karta zachowuje swoją datę)', async () => {
    const m = await findPregameMatch('s1', 'Maxbau Okna Dako PSP');
    expect(m.date.toISOString()).toBe('2026-11-14T16:40:00.000Z');
    expect(m.isFinished).toBe(true);
  });

  it('bez rywala bierze najbliższy mecz BeKaPaKa', async () => {
    expect((await findPregameMatch('s1', null)).guestTeam).toBe('Młode Wilki');
    expect(await findPregameMatch(null, 'X')).toBeNull();
  });

  it('bez meczu w terminarzu nie nadpisuje daty, hali ani godzin karty', async () => {
    await savePregame({ ...prep, nextMatch: null }, { tacticalKeys: keys(), startingFive: zone(), benchKeys: '', motivationalMotto: 'x' }, 'm');
    const { update, create } = upsert.mock.calls[0][0];
    for (const f of ['matchDate', 'venue', 'gatheringTime', 'tipoffTime', 'jerseyColor']) expect(update).not.toHaveProperty(f);
    expect(create.venue).toBeTruthy();
  });

  it('z meczem zapisuje jego datę', async () => {
    await savePregame({ ...prep, nextMatch: schedule[0] }, { tacticalKeys: keys(), startingFive: zone(), benchKeys: '', motivationalMotto: 'x' }, 'm');
    expect(upsert.mock.calls[0][0].update.matchDate.toISOString()).toBe('2026-11-14T16:40:00.000Z');
  });
});
