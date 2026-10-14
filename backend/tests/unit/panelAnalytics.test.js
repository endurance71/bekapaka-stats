import { describe, expect, it, vi } from 'vitest';
import {
  createActivityRecorder,
  getPanelAnalytics,
  pageKeyFromPath,
  warsawDay,
  warsawDayStart
} from '../../lib/panelAnalytics.js';

describe('warsawDay', () => {
  it('uses the Warsaw calendar date, not UTC', () => {
    expect(warsawDay(new Date('2026-10-14T22:30:00Z'))).toBe('2026-10-15'); // 00:30 CEST
    expect(warsawDay(new Date('2026-12-31T22:59:00Z'))).toBe('2026-12-31'); // 23:59 CET
  });

  it('finds the instant a Warsaw day starts across DST', () => {
    expect(warsawDayStart('2026-07-01').toISOString()).toBe('2026-06-30T22:00:00.000Z');
    expect(warsawDayStart('2026-12-01').toISOString()).toBe('2026-11-30T23:00:00.000Z');
  });
});

describe('pageKeyFromPath', () => {
  it.each([
    ['/dashboard', 'dashboard'],
    ['/druzyna', 'druzyna'],
    ['/druzyna?widok=zagrywki', 'druzyna:zagrywki'],
    ['/league?widok=terminarz', 'liga:terminarz'],
    ['/league?widok=cokolwiek', 'liga'],
    ['/games', 'mecze'],
    ['/games/abc-123', 'mecz'],
    ['/games/abc-123?widok=akcje', 'mecz:akcje'],
    ['/players/xyz', 'zawodnik'],
    ['/ai/mecze', 'ai'],
    ['/rywal?opponent=Kosz', 'rywal']
  ])('%s → %s', (path, key) => {
    expect(pageKeyFromPath(path)).toBe(key);
  });

  it.each([['/login'], ['/nieznane'], ['https://evil.example/dashboard'], [''], [null], [42], ['/' + 'a'.repeat(600)]])(
    'ignores %s',
    (path) => {
      expect(pageKeyFromPath(path)).toBeNull();
    }
  );
});

function fakeDb() {
  const activity = new Map();
  const views = new Map();
  return {
    activity,
    views,
    panelActivityDay: {
      upsert: vi.fn(async ({ where, create, update }) => {
        const key = `${where.userId_day.userId}|${where.userId_day.day.toISOString()}`;
        const row = activity.get(key);
        if (row) {
          row.requests += update.requests.increment;
          row.lastAt = update.lastAt;
        } else {
          activity.set(key, { ...create });
        }
      })
    },
    panelPageViewDay: {
      upsert: vi.fn(async ({ where, create, update }) => {
        const w = where.userId_day_page;
        const key = `${w.userId}|${w.day.toISOString()}|${w.page}`;
        const row = views.get(key);
        if (row) row.views += update.views.increment;
        else views.set(key, { ...create });
      })
    }
  };
}

describe('createActivityRecorder', () => {
  it('aggregates in memory and writes one upsert per user and day', async () => {
    const db = fakeDb();
    let clock = new Date('2026-10-14T08:00:00Z');
    const recorder = createActivityRecorder({ db, now: () => clock });

    recorder.recordRequest('u1');
    clock = new Date('2026-10-14T09:00:00Z');
    recorder.recordRequest('u1');
    recorder.recordRequest('u2');
    recorder.recordPageView('u1', 'dashboard');
    recorder.recordPageView('u1', 'dashboard');
    recorder.recordPageView('u1', 'liga');

    await recorder.flush();

    expect(db.panelActivityDay.upsert).toHaveBeenCalledTimes(2);
    const u1 = db.activity.get('u1|2026-10-14T00:00:00.000Z');
    expect(u1).toMatchObject({ requests: 2 });
    expect(u1.firstAt.toISOString()).toBe('2026-10-14T08:00:00.000Z');
    expect(u1.lastAt.toISOString()).toBe('2026-10-14T09:00:00.000Z');
    expect(db.views.get('u1|2026-10-14T00:00:00.000Z|dashboard').views).toBe(2);
    expect(recorder.pending()).toEqual({ activity: 0, views: 0 });

    recorder.recordRequest('u1');
    await recorder.flush();
    expect(db.activity.get('u1|2026-10-14T00:00:00.000Z').requests).toBe(3);
  });

  it('keeps counters after a failed write and drops rows of deleted accounts', async () => {
    const db = fakeDb();
    const logger = { error: vi.fn() };
    const recorder = createActivityRecorder({ db, logger, now: () => new Date('2026-10-14T08:00:00Z') });
    db.panelActivityDay.upsert
      .mockRejectedValueOnce(new Error('db down'))
      .mockRejectedValueOnce(Object.assign(new Error('fk'), { code: 'P2003' }));

    recorder.recordRequest('u1');
    recorder.recordRequest('gone');
    await recorder.flush();

    expect(recorder.pending()).toEqual({ activity: 1, views: 0 });
    expect(logger.error).toHaveBeenCalledOnce();

    await recorder.flush();
    expect(db.activity.get('u1|2026-10-14T00:00:00.000Z').requests).toBe(1);
    expect(db.activity.has('gone|2026-10-14T00:00:00.000Z')).toBe(false);
  });

  it('runs concurrent flushes one after another', async () => {
    const db = fakeDb();
    const recorder = createActivityRecorder({ db, now: () => new Date('2026-10-14T08:00:00Z') });
    recorder.recordRequest('u1');
    const first = recorder.flush();
    recorder.recordRequest('u1');
    const second = recorder.flush();
    await Promise.all([first, second]);
    expect(db.activity.get('u1|2026-10-14T00:00:00.000Z').requests).toBe(2);
  });
});

describe('getPanelAnalytics', () => {
  const day = (d) => new Date(`${d}T00:00:00.000Z`);
  const accounts = [
    { id: 'coach', firstName: 'Trener', lastName: 'Główny', username: 'trener', role: 'ADMIN', lastActivityAt: null },
    { id: 'p1', firstName: 'Jan', lastName: 'Kowalski', username: 'jan', role: 'USER', lastActivityAt: null },
    { id: 'p2', firstName: 'Ola', lastName: 'Nowak', username: 'ola', role: 'USER', lastActivityAt: null }
  ];
  const activity = [
    { userId: 'coach', day: day('2026-10-14'), requests: 50 },
    { userId: 'coach', day: day('2026-10-13'), requests: 30 },
    { userId: 'p1', day: day('2026-10-14'), requests: 10 },
    { userId: 'p1', day: day('2026-10-01'), requests: 5 }
  ];
  const views = [
    { userId: 'coach', day: day('2026-10-14'), page: 'admin', views: 4 },
    { userId: 'p1', day: day('2026-10-14'), page: 'dashboard', views: 3 },
    { userId: 'p1', day: day('2026-10-01'), page: 'liga', views: 1 }
  ];
  const loginLog = [
    { username: 'jan', success: true, timestamp: new Date('2026-10-14T07:00:00Z') },
    { username: 'jan', success: false, timestamp: new Date('2026-10-14T06:59:00Z') },
    { username: 'admin', success: false, timestamp: new Date('2026-10-12T03:00:00Z') },
    { username: 'trener', success: false, timestamp: new Date('2026-10-12T03:00:00Z') }
  ];

  function db() {
    return {
      rosterPlayer: { findMany: vi.fn(async () => accounts) },
      panelActivityDay: {
        findMany: vi.fn(async ({ where }) => activity.filter((r) => r.day >= where.day.gte)),
        findFirst: vi.fn(async () => ({ day: day('2026-09-20') }))
      },
      panelPageViewDay: { findMany: vi.fn(async ({ where }) => views.filter((r) => r.day >= where.day.gte)) },
      loginLog: { findMany: vi.fn(async ({ where }) => loginLog.filter((r) => r.timestamp >= where.timestamp.gte)) }
    };
  }
  const now = new Date('2026-10-14T12:00:00Z');

  it('summarises daily actives, users, pages and logins', async () => {
    const result = await getPanelAnalytics(db(), { days: 30, now });

    expect(result.range).toMatchObject({ days: 30, from: '2026-09-15', to: '2026-10-14' });
    expect(result.daily).toHaveLength(30);
    expect(result.daily.at(-1)).toEqual({ day: '2026-10-14', activeUsers: 2, requests: 60, views: 7 });
    expect(result.summary).toMatchObject({ accounts: 3, activeToday: 2, activeLast7: 2, activeInRange: 2, inactiveInRange: 1, avgActiveDays: 2 });
    expect(result.trackingSince).toBe('2026-09-20');

    expect(result.users.map((u) => u.id)).toEqual(['coach', 'p1', 'p2']);
    expect(result.users[1]).toMatchObject({ name: 'Jan Kowalski', activeDays: 2, requests: 15, views: 4, activeDayList: ['2026-10-01', '2026-10-14'] });
    expect(result.users[1].topPages[0]).toEqual({ page: 'dashboard', views: 3 });

    expect(result.pages[0]).toEqual({ page: 'admin', views: 4, users: 1 });
    expect(result.logins).toMatchObject({ success: 1, failed: 3 });
    expect(result.logins.failedByUser.find((f) => f.username === 'admin')).toMatchObject({ count: 1, knownAccount: false });
  });

  it('can leave admins out but keeps failed logins on unknown usernames', async () => {
    const result = await getPanelAnalytics(db(), { days: 7, excludeAdmins: true, now });

    expect(result.summary.accounts).toBe(2);
    expect(result.users.map((u) => u.id)).toEqual(['p1', 'p2']);
    expect(result.daily.at(-1).requests).toBe(10);
    expect(result.logins.failedByUser.map((f) => f.username).sort()).toEqual(['admin', 'jan']);
  });

  it('falls back to 30 days for an unsupported range', async () => {
    const result = await getPanelAnalytics(db(), { days: 12345, now });
    expect(result.range.days).toBe(30);
  });
});
