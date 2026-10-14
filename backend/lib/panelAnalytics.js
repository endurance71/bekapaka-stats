/**
 * Analityka korzystania z panelu — wyłącznie w naszej bazie, bez zewnętrznych skryptów i cookies.
 * - PanelActivityDay: użytkownik × dzień (Europe/Warsaw): liczba zapytań API z sesją, pierwsze i ostatnie.
 * - PanelPageViewDay: użytkownik × dzień × strona panelu (np. "druzyna:zagrywki").
 * Liczniki zbierane w pamięci procesu i zapisywane zbiorczo co minutę (nie jeden zapis na zapytanie).
 */

export const ANALYTICS_TZ = 'Europe/Warsaw';
const DAY_MS = 24 * 60 * 60 * 1000;

const dayFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: ANALYTICS_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

/** Data kalendarzowa w Warszawie: 'YYYY-MM-DD'. */
export function warsawDay(date = new Date()) {
  return dayFormatter.format(date);
}

/** 'YYYY-MM-DD' → Date (północ UTC) — tak Prisma zapisuje kolumnę @db.Date. */
export function dayToDate(day) {
  return new Date(`${day}T00:00:00.000Z`);
}

export function dateToDay(date) {
  return new Date(date).toISOString().slice(0, 10);
}

export function shiftDay(day, delta) {
  return dateToDay(dayToDate(day).getTime() + delta * DAY_MS);
}

/** Chwila, w której zaczyna się dany dzień w Warszawie (uwzględnia czas letni). */
export function warsawDayStart(day) {
  const utcMidnight = dayToDate(day).getTime();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ANALYTICS_TZ,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).formatToParts(new Date(utcMidnight));
  const get = (type) => Number(parts.find((p) => p.type === type)?.value);
  const asIfUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
  return new Date(utcMidnight - (asIfUtc - utcMidnight));
}

/**
 * Strony panelu, które liczymy, i dozwolone zakładki (?widok=…). Wszystko spoza listy jest pomijane,
 * więc liczba kluczy (a tym samym wierszy w bazie) jest ograniczona.
 */
const PAGE_SEGMENTS = {
  dashboard: { key: 'dashboard' },
  league: { key: 'liga', views: ['terminarz', 'liderzy', 'wszech-czasow'] },
  rywal: { key: 'rywal' },
  druzyna: { key: 'druzyna', views: ['zagrywki'] },
  profile: { key: 'profil' },
  players: { key: 'zawodnik', detail: true },
  games: { key: 'mecze', detailKey: 'mecz', detailViews: ['info', 'akcje'] },
  trends: { key: 'trendy' },
  ai: { key: 'ai' },
  admin: { key: 'admin' },
  slowniczek: { key: 'slowniczek' }
};

/** Ścieżka panelu (np. "/games/abc?widok=akcje") → klucz strony ("mecz:akcje") albo null. */
export function pageKeyFromPath(rawPath) {
  if (typeof rawPath !== 'string' || rawPath.length > 512 || !rawPath.startsWith('/')) return null;
  let url;
  try {
    url = new URL(rawPath, 'http://panel.local');
  } catch {
    return null;
  }
  const [segment, detail] = url.pathname.split('/').filter(Boolean);
  const def = PAGE_SEGMENTS[segment ?? ''];
  if (!def) return null;
  const view = url.searchParams.get('widok');
  if (detail && def.detailKey) {
    return def.detailViews?.includes(view) ? `${def.detailKey}:${view}` : def.detailKey;
  }
  return def.views?.includes(view) ? `${def.key}:${view}` : def.key;
}

/**
 * Bufor liczników w pamięci. `flush()` zapisuje i czyści bufor; nieudany zapis wraca do bufora
 * (np. chwilowy brak bazy), wiersze usuniętych kont są porzucane.
 */
export function createActivityRecorder({ db, now = () => new Date(), flushIntervalMs = 60_000, logger = console } = {}) {
  let activity = new Map();
  let views = new Map();
  let timer = null;
  let flushing = null;

  function recordRequest(userId) {
    if (!userId) return;
    const at = now();
    const day = warsawDay(at);
    const key = `${userId}|${day}`;
    const entry = activity.get(key);
    if (entry) {
      entry.requests += 1;
      entry.lastAt = at;
    } else {
      activity.set(key, { userId: String(userId), day, requests: 1, firstAt: at, lastAt: at });
    }
  }

  function recordPageView(userId, page) {
    if (!userId || !page) return;
    const day = warsawDay(now());
    const key = `${userId}|${day}|${page}`;
    const entry = views.get(key);
    if (entry) entry.views += 1;
    else views.set(key, { userId: String(userId), day, page, views: 1 });
  }

  async function writeActivity(entry) {
    const day = dayToDate(entry.day);
    await db.panelActivityDay.upsert({
      where: { userId_day: { userId: entry.userId, day } },
      create: { userId: entry.userId, day, requests: entry.requests, firstAt: entry.firstAt, lastAt: entry.lastAt },
      update: { requests: { increment: entry.requests }, lastAt: entry.lastAt }
    });
  }

  async function writeView(entry) {
    const day = dayToDate(entry.day);
    await db.panelPageViewDay.upsert({
      where: { userId_day_page: { userId: entry.userId, day, page: entry.page } },
      create: { userId: entry.userId, day, page: entry.page, views: entry.views },
      update: { views: { increment: entry.views } }
    });
  }

  function requeue(entry, kind) {
    if (kind === 'activity') {
      const key = `${entry.userId}|${entry.day}`;
      const current = activity.get(key);
      if (current) {
        current.requests += entry.requests;
        if (entry.firstAt < current.firstAt) current.firstAt = entry.firstAt;
      } else {
        activity.set(key, entry);
      }
    } else {
      const key = `${entry.userId}|${entry.day}|${entry.page}`;
      const current = views.get(key);
      if (current) current.views += entry.views;
      else views.set(key, entry);
    }
  }

  async function writeAll(entries, kind, write) {
    let failed = 0;
    for (const entry of entries) {
      try {
        await write(entry);
      } catch (e) {
        // P2003 = brak użytkownika (konto usunięte) — tego wiersza nie da się zapisać, pomijamy.
        if (e?.code === 'P2003') continue;
        failed += 1;
        requeue(entry, kind);
      }
    }
    return failed;
  }

  async function doFlush() {
    if (activity.size === 0 && views.size === 0) return;
    const activityEntries = [...activity.values()];
    const viewEntries = [...views.values()];
    activity = new Map();
    views = new Map();
    const failed = (await writeAll(activityEntries, 'activity', writeActivity))
      + (await writeAll(viewEntries, 'view', writeView));
    if (failed > 0) logger.error(`[analytics] Nie zapisano ${failed} liczników — ponowię przy kolejnym zapisie.`);
  }

  function flush() {
    // Jeden zapis naraz: równoległy flush czeka na trwający i dopisuje to, co wpadło w międzyczasie.
    const run = (flushing ?? Promise.resolve()).catch(() => {}).then(doFlush);
    const tracked = run.finally(() => {
      if (flushing === tracked) flushing = null;
    });
    flushing = tracked;
    return tracked;
  }

  function start() {
    if (timer) return;
    timer = setInterval(() => {
      flush().catch((e) => logger.error('[analytics] flush failed:', e));
    }, flushIntervalMs);
    timer.unref?.();
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
    return flush();
  }

  return { recordRequest, recordPageView, flush, start, stop, pending: () => ({ activity: activity.size, views: views.size }) };
}

export const ANALYTICS_RANGES = [7, 30, 90, 365];

/** Zestawienie dla zakładki „Analityka” w Administracji. */
export async function getPanelAnalytics(db, { days = 30, excludeAdmins = false, now = new Date() } = {}) {
  const rangeDays = ANALYTICS_RANGES.includes(Number(days)) ? Number(days) : 30;
  const to = warsawDay(now);
  const from = shiftDay(to, -(rangeDays - 1));
  const last7From = shiftDay(to, -6);
  const fromDate = dayToDate(from);

  const [accounts, activityRows, viewRows, loginRows, firstRow] = await Promise.all([
    db.rosterPlayer.findMany({
      where: { username: { not: null } },
      select: { id: true, firstName: true, lastName: true, username: true, role: true, lastActivityAt: true }
    }),
    db.panelActivityDay.findMany({ where: { day: { gte: fromDate } } }),
    db.panelPageViewDay.findMany({ where: { day: { gte: fromDate } } }),
    db.loginLog.findMany({
      where: { timestamp: { gte: warsawDayStart(from) } },
      select: { username: true, success: true, timestamp: true }
    }),
    db.panelActivityDay.findFirst({ orderBy: { day: 'asc' }, select: { day: true } })
  ]);

  const included = excludeAdmins ? accounts.filter((u) => u.role !== 'ADMIN') : accounts;
  const includedIds = new Set(included.map((u) => u.id));
  const activity = activityRows.filter((r) => includedIds.has(r.userId));
  const pageViews = viewRows.filter((r) => includedIds.has(r.userId));

  const dayList = [];
  for (let d = from; d <= to; d = shiftDay(d, 1)) dayList.push(d);
  const daily = new Map(dayList.map((day) => [day, { day, activeUsers: 0, requests: 0, views: 0 }]));
  const perUser = new Map(included.map((u) => [u.id, { days: new Set(), requests: 0, views: 0, pages: new Map() }]));

  for (const row of activity) {
    const day = dateToDay(row.day);
    const bucket = daily.get(day);
    if (bucket) {
      bucket.activeUsers += 1;
      bucket.requests += row.requests;
    }
    const user = perUser.get(row.userId);
    user.days.add(day);
    user.requests += row.requests;
  }

  const pages = new Map();
  for (const row of pageViews) {
    const bucket = daily.get(dateToDay(row.day));
    if (bucket) bucket.views += row.views;
    const user = perUser.get(row.userId);
    user.views += row.views;
    user.pages.set(row.page, (user.pages.get(row.page) ?? 0) + row.views);
    const page = pages.get(row.page) ?? { page: row.page, views: 0, users: new Set() };
    page.views += row.views;
    page.users.add(row.userId);
    pages.set(row.page, page);
  }

  const users = included
    .map((u) => {
      const stats = perUser.get(u.id);
      return {
        id: u.id,
        name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.username,
        username: u.username,
        role: u.role,
        lastActivityAt: u.lastActivityAt,
        activeDays: stats.days.size,
        requests: stats.requests,
        views: stats.views,
        activeDayList: [...stats.days].sort(),
        topPages: [...stats.pages.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([page, views]) => ({ page, views }))
      };
    })
    .sort((a, b) => b.activeDays - a.activeDays || b.views - a.views || b.requests - a.requests || a.name.localeCompare(b.name, 'pl'));

  const activeLast7 = new Set(activity.filter((r) => dateToDay(r.day) >= last7From).map((r) => r.userId));
  const activeToday = daily.get(to)?.activeUsers ?? 0;
  const activeInRange = users.filter((u) => u.activeDays > 0).length;

  const knownUsernames = new Set(accounts.map((u) => u.username));
  const includedUsernames = new Set(included.map((u) => u.username));
  // Nieudane próby na nieistniejące loginy zostają zawsze (to sygnał bezpieczeństwa), odfiltrowujemy tylko pominięte konta.
  const logins = loginRows.filter((r) => includedUsernames.has(r.username) || !knownUsernames.has(r.username));
  const failedByUser = new Map();
  for (const row of logins) {
    if (row.success) continue;
    const entry = failedByUser.get(row.username) ?? { username: row.username, count: 0, lastAt: row.timestamp, knownAccount: knownUsernames.has(row.username) };
    entry.count += 1;
    if (row.timestamp > entry.lastAt) entry.lastAt = row.timestamp;
    failedByUser.set(row.username, entry);
  }

  return {
    range: { days: rangeDays, from, to, timeZone: ANALYTICS_TZ },
    trackingSince: firstRow ? dateToDay(firstRow.day) : null,
    excludeAdmins: Boolean(excludeAdmins),
    summary: {
      accounts: included.length,
      activeToday,
      activeLast7: activeLast7.size,
      activeInRange,
      inactiveInRange: included.length - activeInRange,
      avgActiveDays: activeInRange ? Math.round((users.reduce((s, u) => s + u.activeDays, 0) / activeInRange) * 10) / 10 : 0,
      views: users.reduce((s, u) => s + u.views, 0)
    },
    daily: [...daily.values()],
    users,
    pages: [...pages.values()]
      .map((p) => ({ page: p.page, views: p.views, users: p.users.size }))
      .sort((a, b) => b.views - a.views),
    logins: {
      success: logins.filter((r) => r.success).length,
      failed: logins.filter((r) => !r.success).length,
      failedByUser: [...failedByUser.values()].sort((a, b) => b.count - a.count).slice(0, 10)
    }
  };
}
