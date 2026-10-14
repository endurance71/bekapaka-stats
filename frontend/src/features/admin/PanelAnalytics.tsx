import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import { fetchJSON } from '../../lib/api';
import { formatLastActivity, formatLastActivityExact, getActivityRecency, activityRecencyClass } from '../../lib/formatLastActivity';
import { usePortraitMobile } from '../../hooks/useIsMobile';
import { MobileDataCard, MobileDataList } from '../../shared/ui/MobileDataCard';
import ScrollableTableShell from '../../shared/ui/ScrollableTableShell';
import BkpkButton from '../../shared/ui/BkpkButton';
import { cn } from '../../shared/lib/utils';
import {
    chartAxisProps,
    chartColors,
    chartGridProps,
    chartTooltipItemStyle,
    chartTooltipLabelStyle,
    chartTooltipStyle
} from '../../shared/lib/chartTheme';

/** Odpowiedź GET /api/admin/analytics (backend/lib/panelAnalytics.js). */
export interface PanelAnalyticsData {
    range: { days: number; from: string; to: string; timeZone: string };
    trackingSince: string | null;
    excludeAdmins: boolean;
    summary: {
        accounts: number;
        activeToday: number;
        activeLast7: number;
        activeInRange: number;
        inactiveInRange: number;
        avgActiveDays: number;
        views: number;
    };
    daily: { day: string; activeUsers: number; requests: number; views: number }[];
    users: {
        id: string;
        name: string;
        username: string;
        role: string;
        lastActivityAt: string | null;
        activeDays: number;
        requests: number;
        views: number;
        activeDayList: string[];
        topPages: { page: string; views: number }[];
    }[];
    pages: { page: string; views: number; users: number }[];
    logins: {
        success: number;
        failed: number;
        failedByUser: { username: string; count: number; lastAt: string; knownAccount: boolean }[];
    };
}

const RANGES = [7, 30, 90, 365] as const;

const PAGE_LABELS: Record<string, string> = {
    dashboard: 'Pulpit',
    liga: 'Liga — tabela',
    'liga:terminarz': 'Liga — terminarz',
    'liga:liderzy': 'Liga — liderzy',
    'liga:wszech-czasow': 'Liga — wszech czasów',
    rywal: 'Rywal (scouting)',
    druzyna: 'Drużyna — skład',
    'druzyna:zagrywki': 'Drużyna — zagrywki',
    profil: 'Mój profil',
    zawodnik: 'Profil zawodnika',
    mecze: 'Mecze — lista',
    mecz: 'Mecz — statystyki',
    'mecz:info': 'Mecz — informacje',
    'mecz:akcje': 'Mecz — akcja po akcji',
    trendy: 'Trendy',
    ai: 'Centrum analiz AI',
    admin: 'Administracja',
    slowniczek: 'Słowniczek'
};

export const pageLabel = (page: string) => PAGE_LABELS[page] ?? page;

const shortDay = (day: string) => {
    const [, m, d] = day.split('-');
    return `${Number(d)}.${m}`;
};

const longDay = (day: string) =>
    new Date(`${day}T12:00:00Z`).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'long' });

const fmt = (n: number) => n.toLocaleString('pl-PL');

const checkboxClass = 'w-5 h-5 accent-bkpk-primary cursor-pointer shrink-0';

function StatTile({ label, value, hint, tone }: { label: string; value: string | number; hint?: string; tone?: 'danger' }) {
    return (
        <div className="p-4 bg-bkpk-bg border border-bkpk-border-subtle min-w-0">
            <dt className="label-caps text-[11px] text-bkpk-text-muted leading-tight">{label}</dt>
            <dd
                className={cn(
                    'font-display text-3xl leading-none tabular-nums mt-2',
                    tone === 'danger' ? 'text-bkpk-text-danger' : 'text-bkpk-text-primary'
                )}
            >
                {value}
            </dd>
            {hint && <p className="mt-1.5 text-xs text-bkpk-text-muted">{hint}</p>}
        </div>
    );
}

/** Pasek ostatnich dni: wypełniony kwadrat = dzień z aktywnością. */
function ActivityStrip({ days, active }: { days: string[]; active: Set<string> }) {
    return (
        <div className="flex gap-[2px]" aria-hidden="true">
            {days.map((day) => (
                <span
                    key={day}
                    title={longDay(day)}
                    className={cn('w-[6px] h-4 shrink-0', active.has(day) ? 'bg-bkpk-primary' : 'bg-bkpk-border-subtle')}
                />
            ))}
        </div>
    );
}

function LastSeen({ at }: { at: string | null }) {
    return (
        <span
            className={cn('text-xs font-medium', activityRecencyClass[getActivityRecency(at)])}
            title={formatLastActivityExact(at) || undefined}
        >
            {formatLastActivity(at)}
        </span>
    );
}

export default function PanelAnalytics() {
    const [days, setDays] = useState<(typeof RANGES)[number]>(30);
    const [excludeAdmins, setExcludeAdmins] = useState(false);
    const [data, setData] = useState<PanelAnalyticsData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const showCards = usePortraitMobile();

    const load = useCallback(() => {
        setLoading(true);
        fetchJSON<PanelAnalyticsData>(`/api/admin/analytics?days=${days}&excludeAdmins=${excludeAdmins}`)
            .then((result) => {
                setData(result);
                setError(null);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [days, excludeAdmins]);

    useEffect(() => {
        load();
    }, [load]);

    // Pasek aktywności: maks. 30 ostatnich dni okresu (dłuższy nie mieści się w wierszu)
    const stripDays = useMemo(() => (data ? data.daily.slice(-30).map((d) => d.day) : []), [data]);
    const chartData = useMemo(() => data?.daily.map((d) => ({ ...d, label: shortDay(d.day) })) ?? [], [data]);
    const maxPageViews = data?.pages[0]?.views ?? 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div role="group" aria-label="Okres" className="flex flex-wrap gap-2">
                    {RANGES.map((r) => (
                        <button
                            key={r}
                            type="button"
                            aria-pressed={days === r}
                            onClick={() => setDays(r)}
                            className={cn(
                                'min-h-[44px] px-4 label-caps text-xs border transition-colors',
                                days === r
                                    ? 'border-bkpk-primary text-bkpk-text-primary bg-bkpk-surface-tint-1'
                                    : 'border-bkpk-border-subtle text-bkpk-text-muted hover:text-bkpk-text-primary'
                            )}
                        >
                            {r === 365 ? 'Rok' : `${r} dni`}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-3 min-h-[44px] cursor-pointer select-none text-sm text-bkpk-text-secondary">
                        <input
                            type="checkbox"
                            className={checkboxClass}
                            checked={excludeAdmins}
                            onChange={(e) => setExcludeAdmins(e.target.checked)}
                        />
                        Pomiń administratorów
                    </label>
                    <BkpkButton variant="ghost" onClick={load} disabled={loading} aria-label="Odśwież analitykę">
                        <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                    </BkpkButton>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-bkpk-bg border border-bkpk-border-subtle border-l-4 border-l-bkpk-danger text-sm text-bkpk-text-danger">
                    Błąd pobierania analityki: {error}
                </div>
            )}

            {!data && !error && <p className="text-sm text-bkpk-text-muted">Ładowanie analityki…</p>}

            {data && (
                <>
                    <p className="text-xs text-bkpk-text-muted">
                        {data.trackingSince
                            ? `Dane zbierane od ${longDay(data.trackingSince)}. `
                            : 'Zbieranie danych dopiero się zaczęło — pierwsze liczby pojawią się po kilku minutach korzystania z panelu. '}
                        Aktywny dzień = co najmniej jedno wejście do panelu tego dnia (czas polski). Dane tylko w naszej bazie, bez zewnętrznych narzędzi.
                    </p>

                    <dl className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        <StatTile label="Aktywni dziś" value={data.summary.activeToday} />
                        <StatTile label="Aktywni — 7 dni" value={data.summary.activeLast7} hint={`z ${data.summary.accounts} kont`} />
                        <StatTile
                            label={`Aktywni — ${data.range.days === 365 ? 'rok' : `${data.range.days} dni`}`}
                            value={data.summary.activeInRange}
                            hint={`${data.summary.inactiveInRange} bez wejścia`}
                        />
                        <StatTile label="Śr. dni aktywności" value={String(data.summary.avgActiveDays).replace('.', ',')} hint="na aktywną osobę" />
                        <StatTile
                            label="Nieudane logowania"
                            value={data.logins.failed}
                            hint={`udane: ${data.logins.success}`}
                            tone={data.logins.failed > 0 ? 'danger' : undefined}
                        />
                    </dl>

                    <div className="space-y-3">
                        <span className="kicker text-bkpk-text-primary">Aktywni użytkownicy dziennie</span>
                        <div className="w-full h-[200px] sm:h-[240px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                                    <CartesianGrid {...chartGridProps} />
                                    <XAxis dataKey="label" {...chartAxisProps} minTickGap={16} />
                                    <YAxis {...chartAxisProps} allowDecimals={false} />
                                    <Tooltip
                                        cursor={{ fill: chartColors.cursor }}
                                        contentStyle={chartTooltipStyle}
                                        itemStyle={chartTooltipItemStyle}
                                        labelStyle={chartTooltipLabelStyle}
                                        labelFormatter={(_, payload) => {
                                            const day = payload?.[0]?.payload?.day as string | undefined;
                                            return day ? longDay(day) : '';
                                        }}
                                        formatter={(value, _name, item) => [
                                            `${value} os. · ${fmt(item.payload.views)} odsłon`,
                                            'Aktywni'
                                        ]}
                                    />
                                    <Bar dataKey="activeUsers" name="Aktywni" fill={chartColors.team} maxBarSize={28} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <span className="kicker text-bkpk-text-primary">Kto korzysta</span>
                        {showCards ? (
                            <MobileDataList>
                                {data.users.map((u) => (
                                    <MobileDataCard
                                        key={u.id}
                                        title={u.name}
                                        subtitle={<LastSeen at={u.lastActivityAt} />}
                                        highlight={u.role === 'ADMIN' ? <span className="status-flag text-bkpk-text-muted">Admin</span> : undefined}
                                        stats={[
                                            { label: 'Dni aktywności', value: u.activeDays, emphasize: true },
                                            { label: 'Odsłony', value: fmt(u.views) },
                                            { label: 'Najczęściej', value: u.topPages[0] ? pageLabel(u.topPages[0].page) : '—', tone: 'muted' }
                                        ]}
                                        footer={<ActivityStrip days={stripDays} active={new Set(u.activeDayList)} />}
                                    />
                                ))}
                            </MobileDataList>
                        ) : (
                            <div className="border border-bkpk-border-subtle bg-bkpk-surface overflow-hidden">
                                <ScrollableTableShell compact className="border-0 rounded-none">
                                    <table className="bkpk-table w-full text-sm text-left min-w-[760px]">
                                        <thead className="border-b border-bkpk-border-subtle">
                                            <tr>
                                                <th className="py-2 px-4">Użytkownik</th>
                                                <th className="py-2 px-4 text-right">Dni aktywności</th>
                                                <th className="py-2 px-4">Ostatnie {stripDays.length} dni</th>
                                                <th className="py-2 px-4 text-right">Odsłony</th>
                                                <th className="py-2 px-4">Najczęściej</th>
                                                <th className="py-2 px-4">Ostatnio</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-bkpk-border-subtle">
                                            {data.users.map((u) => (
                                                <tr key={u.id}>
                                                    <td className="py-2.5 px-4">
                                                        <span className="font-semibold text-bkpk-text-primary">{u.name}</span>
                                                        {u.role === 'ADMIN' && <span className="ml-2 status-flag text-bkpk-text-muted">Admin</span>}
                                                        <span className="block text-xs text-bkpk-text-muted">{u.username}</span>
                                                    </td>
                                                    <td className="py-2.5 px-4 text-right font-display text-lg tabular-nums text-bkpk-text-primary">
                                                        {u.activeDays}
                                                    </td>
                                                    <td className="py-2.5 px-4">
                                                        <ActivityStrip days={stripDays} active={new Set(u.activeDayList)} />
                                                    </td>
                                                    <td className="py-2.5 px-4 text-right tabular-nums text-bkpk-text-secondary">{fmt(u.views)}</td>
                                                    <td className="py-2.5 px-4 text-xs text-bkpk-text-secondary">
                                                        {u.topPages.length ? u.topPages.map((p) => pageLabel(p.page)).join(', ') : '—'}
                                                    </td>
                                                    <td className="py-2.5 px-4">
                                                        <LastSeen at={u.lastActivityAt} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </ScrollableTableShell>
                            </div>
                        )}
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="space-y-3">
                            <span className="kicker text-bkpk-text-primary">Z czego korzystają</span>
                            {data.pages.length === 0 ? (
                                <p className="text-sm text-bkpk-text-muted">Brak odsłon w tym okresie.</p>
                            ) : (
                                <ul className="space-y-2.5">
                                    {data.pages.map((p) => (
                                        <li key={p.page} className="space-y-1">
                                            <div className="flex items-baseline justify-between gap-3 text-sm">
                                                <span className="text-bkpk-text-primary truncate">{pageLabel(p.page)}</span>
                                                <span className="shrink-0 tabular-nums text-bkpk-text-secondary">
                                                    {fmt(p.views)} <span className="text-bkpk-text-muted text-xs">· {p.users} os.</span>
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-bkpk-border-subtle">
                                                <div
                                                    className="h-full bg-bkpk-primary"
                                                    style={{ width: `${maxPageViews ? Math.max(2, (p.views / maxPageViews) * 100) : 0}%` }}
                                                />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="space-y-3">
                            <span className="kicker text-bkpk-text-primary">Nieudane logowania</span>
                            {data.logins.failedByUser.length === 0 ? (
                                <p className="text-sm text-bkpk-text-muted">Brak nieudanych prób w tym okresie.</p>
                            ) : (
                                <ul className="divide-y divide-bkpk-border-subtle border border-bkpk-border-subtle bg-bkpk-surface">
                                    {data.logins.failedByUser.map((f) => (
                                        <li key={f.username} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                                            <span className="min-w-0">
                                                <span className="font-semibold text-bkpk-text-primary">{f.username}</span>
                                                {!f.knownAccount && (
                                                    <span className="ml-2 inline-flex items-center gap-1 text-xs text-bkpk-warning">
                                                        <ShieldAlert className="w-3 h-3" /> nie ma takiego konta
                                                    </span>
                                                )}
                                                <span className="block text-xs text-bkpk-text-muted">
                                                    ostatnio {new Date(f.lastAt).toLocaleString('pl-PL')}
                                                </span>
                                            </span>
                                            <span className="shrink-0 font-display text-lg tabular-nums text-bkpk-text-danger">{f.count}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
