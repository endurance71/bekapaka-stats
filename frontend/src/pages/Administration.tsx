import { useState, useEffect, useCallback } from 'react';
import Modal from '../components/Modal';
import { fetchJSON, postJSON, putJSON, deleteJSON } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { ShieldCheck, Terminal, RefreshCw, Search, Filter, ChevronLeft, ChevronRight, UserPlus, Edit2, Trash2, Key, Lock, Bot } from 'lucide-react';
import BkpkCard from '../shared/ui/BkpkCard';
import BkpkButton from '../shared/ui/BkpkButton';
import PageContainer from '../shared/ui/PageContainer';
import PageHeader from '../shared/ui/PageHeader';
import SectionHeading from '../shared/ui/SectionHeading';
import { cn } from '../shared/lib/utils';
import { compressImage } from '../shared/lib/imageCompression';
import { PasswordInput } from '../shared/ui/PasswordInput';
import { MobileDataCard, MobileDataList } from '../shared/ui/MobileDataCard';
import ScrollableTableShell from '../shared/ui/ScrollableTableShell';
import { usePortraitMobile } from '../hooks/useIsMobile';
import {
    formatLastActivity,
    formatLastActivityExact,
    getActivityRecency,
    activityRecencyClass
} from '../lib/formatLastActivity';
import SeasonManagement from '../features/admin/SeasonManagement';
import AiEngineSettings from '../features/admin/AiEngineSettings';
import PlayerAvatar from '../shared/ui/PlayerAvatar';
import { useSeasonPreferenceContext } from '../context/SeasonPreferenceContext';

// Digital 2.0 — wspólne klasy pól formularzy (płasko, linia ink-500; fokus 3 px złoty daje global.css).
const fieldClass =
    'w-full bg-bkpk-bg border border-bkpk-border-strong min-h-[48px] px-4 text-base sm:text-sm text-bkpk-text-primary placeholder:text-bkpk-text-muted hover:border-bkpk-text-muted focus:border-bkpk-text-primary transition-colors touch-manipulation';
const fieldCompactClass =
    'w-full bg-bkpk-bg border border-bkpk-border-strong min-h-[48px] px-3 text-base sm:text-sm text-bkpk-text-primary placeholder:text-bkpk-text-muted hover:border-bkpk-text-muted focus:border-bkpk-text-primary transition-colors touch-manipulation';
const fieldLabelClass = 'label-caps text-xs text-bkpk-text-secondary flex items-center gap-2';
const checkboxClass = 'w-5 h-5 shrink-0 accent-bkpk-primary cursor-pointer';
const errorNoticeClass =
    'p-3 text-sm bg-bkpk-bg border border-bkpk-border-subtle border-l-4 border-l-bkpk-danger text-bkpk-text-danger';
const ghostActionClass =
    'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 border-2 border-bkpk-border-strong text-bkpk-text-primary font-text font-semibold uppercase tracking-[0.08em] text-[13px] leading-none hover:border-bkpk-text-primary hover:bg-bkpk-surface-tint-1 transition-colors select-none touch-manipulation';

type ScraperStatus = {
    running: boolean;
    step: string;
    message: string;
    lastFinishedAt: string | null;
    lastLog?: string;
    progressCurrent?: number;
    progressTotal?: number;
};

type KalkMissingMatch = {
    leagueMatchId: string;
    kalkMatchId: string | null;
    date: string;
    opponent: string;
    score: string;
    scrapeUrl: string | null;
};

type KalkIngestSummary = {
    kalkMatches: number;
    finishedMatches: number;
    playerGameLogs: number;
    kalkTeams: number;
    leagueMatchesWithBoxScore: number;
    bekapakaScheduleFinished?: number;
    bekapakaWithBoxScore?: number;
    bekapakaMissingBoxScore?: KalkMissingMatch[];
    duplicatePlayersCount?: number;
    divisionKalkMatchesTotal?: number;
};

interface ScraperProgressBarProps {
    current: number;
    total: number;
    percentage: number;
    className?: string;
}

function ScraperProgressBar({ current, total, percentage, className }: ScraperProgressBarProps) {
    if (total <= 0) return null;

    return (
        <div className={cn('space-y-2', className)} aria-live="polite" aria-label={`Postęp pobierania: ${percentage} procent`}>
            <div className="flex items-baseline justify-between gap-3">
                <span className="label-caps text-xs text-bkpk-text-muted">Postęp pobierania stron</span>
                <span className="font-display text-lg leading-none tabular-nums text-bkpk-text-primary">{percentage}% ({current} / {total})</span>
            </div>
            <div
                className="w-full bg-ink-700 h-2 overflow-hidden"
                role="progressbar"
                aria-valuenow={percentage}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div
                    className="bg-bkpk-primary h-full transition-[width] duration-300"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

export default function Administration() {
    const [scraperStatus, setScraperStatus] = useState<ScraperStatus>({
        running: false,
        step: 'idle',
        message: '',
        lastFinishedAt: null,
        lastLog: '',
        progressCurrent: 0,
        progressTotal: 0
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [kalkSummary, setKalkSummary] = useState<KalkIngestSummary | null>(null);

    const { isAuthenticated } = useAuth();
    const refreshStatus = () => {
        if (!isAuthenticated) return;
        fetchJSON<ScraperStatus>('/api/scrape/kalk/div2/status')
            .then(data => setScraperStatus(data))
            .catch(() => { });
        fetchJSON<KalkIngestSummary>('/api/kalk/ingest-summary')
            .then(data => setKalkSummary(data))
            .catch(() => { });
    };

    useEffect(() => {
        if (isAuthenticated) {
            refreshStatus();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        refreshStatus();
        // Poll faster if modal is open to show live logs; w tle (inna aplikacja / zablokowany ekran) bez zapytań
        const intervalTime = isModalOpen ? 1000 : 5000;
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') refreshStatus();
        }, intervalTime);
        const onVisible = () => {
            if (document.visibilityState === 'visible') refreshStatus();
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [isModalOpen]);

    const triggerScraper = async () => {
        setIsModalOpen(true);
        try {
            await postJSON('/api/scrape/kalk/div2/run', {});
            refreshStatus();
        } catch (error) {
            console.error(error);
        }
    };
    const current = scraperStatus.progressCurrent || 0;
    const total = scraperStatus.progressTotal || 0;
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    return (
        <div className="bg-bkpk-bg">
            <PageContainer width="narrow">
                <PageHeader
                    kicker="Panel Kontrolny"
                    title={<>Administracja <span className="text-bkpk-primary">Systemu</span></>}
                    description="Narzędzia do zarządzania danymi i aktualizacji systemowych."
                />

                <section className="space-y-4">
                <SectionHeading kicker="Analizy" title="Centrum analiz AI" />
                <BkpkCard variant="flat" className="space-y-4">
                    <p className="text-bkpk-text-secondary text-sm">
                        Odprawy, analizy meczów, plany rozwoju zawodników i scouting rywali — generowanie i przegląd w jednym miejscu.
                    </p>
                    <Link
                        to="/ai"
                        className={ghostActionClass}
                    >
                        <Bot className="w-4 h-4" />
                        Otwórz centrum analiz AI
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </BkpkCard>

                </section>

                <section className="space-y-4">
                <SectionHeading kicker="Ustawienia AI" title="Dostawca AI" />
                <BkpkCard variant="flat">
                    <AiEngineSettings />
                </BkpkCard>

                </section>

                <section className="space-y-4">
                <SectionHeading kicker="Sezony" title="Sezony i Rozgrywki" />
                <BkpkCard variant="flat" className="space-y-6">
                    <SeasonManagement onSeasonChanged={refreshStatus} />
                </BkpkCard>

                </section>

                <section className="space-y-4">
                <SectionHeading kicker="Dane KALK" title="Synchronizacja z ligą KALK" />
                <BkpkCard variant="flat" className="space-y-6">
                    <div className="flex items-center gap-3 p-4 bg-bkpk-bg border border-bkpk-border-subtle">
                        <div className={cn(
                            "w-2.5 h-2.5 rounded-full shrink-0",
                            scraperStatus.running ? "bg-bkpk-primary animate-pulse" : "bg-bkpk-success"
                        )} />
                        <span className="text-sm font-semibold text-bkpk-text-primary">
                            {scraperStatus.running ? 'Pobieranie danych w toku...' : `Status: Gotowy (Ostatnia aktualizacja: ${scraperStatus.lastFinishedAt ? new Date(scraperStatus.lastFinishedAt).toLocaleDateString() : 'Brak'})`}
                        </span>
                    </div>

                    <p className="text-bkpk-text-secondary text-sm leading-relaxed">
                        Pełna synchronizacja KALK (v2): tabela, terminarz, wszystkie kategorie statystyk, box score zakończonych meczów Dywizji II oraz log meczów kadry BeKaPaKa.
                        Proces trwa zwykle 3–4 minuty (1 zapytanie na sekundę do strony KALK).
                    </p>

                    {kalkSummary ? (
                        <div className="space-y-3">
                            <ul className="text-xs text-bkpk-text-secondary space-y-1.5 font-mono tabular-nums">
                                <li>
                                    BeKaPaKa: {kalkSummary.bekapakaWithBoxScore ?? '—'} / {kalkSummary.bekapakaScheduleFinished ?? '—'} z box score
                                </li>
                                <li>
                                    KalkMatch (liga): {kalkSummary.finishedMatches} / {kalkSummary.kalkMatches} zakończone · dywizja łącznie: {kalkSummary.divisionKalkMatchesTotal ?? kalkSummary.kalkMatches}
                                </li>
                                <li>Logi zawodników (tab 3): {kalkSummary.playerGameLogs}</li>
                                <li>
                                    Drużyny KALK: {kalkSummary.kalkTeams} · terminarz z kalkMatchId: {kalkSummary.leagueMatchesWithBoxScore}
                                </li>
                                {(kalkSummary.duplicatePlayersCount ?? 0) > 0 ? (
                                    <li className="text-bkpk-warning">
                                        Duplikaty zawodników (name+team): {kalkSummary.duplicatePlayersCount} — uruchom migrację ID
                                    </li>
                                ) : null}
                            </ul>
                            {(kalkSummary.bekapakaMissingBoxScore?.length ?? 0) > 0 ? (
                                <div className="p-3 bg-bkpk-bg border border-bkpk-border-subtle border-l-4 border-l-bkpk-warning text-xs space-y-2">
                                    <p className="label-caps text-xs text-bkpk-text-primary">
                                        Brak box score ({kalkSummary.bekapakaMissingBoxScore?.length})
                                    </p>
                                    <ul className="text-bkpk-text-secondary font-mono tabular-nums space-y-0.5 max-h-32 overflow-y-auto">
                                        {kalkSummary.bekapakaMissingBoxScore?.map((m) => (
                                            <li key={m.leagueMatchId}>
                                                {m.date} vs {m.opponent} ({m.score})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                    <div className="flex flex-wrap gap-3 sm:gap-4 pt-4 border-t border-bkpk-border-subtle">
                        <BkpkButton
                            variant="primary"
                            onClick={triggerScraper}
                            disabled={scraperStatus.running}
                            className="flex-1"
                        >
                            <RefreshCw className={cn("w-4 h-4", scraperStatus.running && "animate-spin")} />
                            {scraperStatus.running ? 'Otwórz podgląd LIVE' : 'Uruchom pełny import danych'}
                        </BkpkButton>
                        <BkpkButton
                            variant="ghost"
                            onClick={() => setIsModalOpen(true)}
                            disabled={!scraperStatus.lastLog}
                            className="flex-1"
                        >
                            <Terminal className="w-4 h-4" />
                            Pokaż ostatnie logi
                        </BkpkButton>
                    </div>

                    {scraperStatus.running ? (
                        <ScraperProgressBar
                            current={current}
                            total={total}
                            percentage={percentage}
                            className="mt-4"
                        />
                    ) : null}

                    {scraperStatus.running && (
                        <div className="mt-6 p-4 sm:p-5 bg-bkpk-bg border border-bkpk-border-subtle space-y-2 font-mono text-xs">
                            <div className="flex items-center gap-2">
                                <span className="label-caps text-bkpk-text-muted">Krok:</span>
                                <span className="text-bkpk-text-primary">{scraperStatus.step}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="label-caps text-bkpk-text-muted">Komunikat:</span>
                                <span className="text-bkpk-text-secondary">{scraperStatus.message}</span>
                            </div>
                        </div>
                    )}
                </BkpkCard>

                </section>

                <section className="space-y-4">
                <SectionHeading kicker="Użytkownicy" title="Zarządzanie Zawodnikami i Użytkownikami" />
                <BkpkCard variant="flat" className="space-y-6">
                    <UserManagement />
                </BkpkCard>

                </section>

                <section className="space-y-4">
                <SectionHeading kicker="Uwaga" title="Strefa Niebezpieczna" />
                <BkpkCard variant="flat" className="space-y-6 border-l-4 border-l-bkpk-danger">
                    <p className="text-bkpk-text-secondary text-sm">
                        Operacje w tej sekcji są nieodwracalne. Zachowaj szczególną ostrożność.
                    </p>

                    <BkpkButton
                        variant="destructive"
                        onClick={async () => {
                            if (window.confirm('Czy na pewno chcesz usunąć WSZYSTKIE dane z bazy (łącznie z KALK)? Tej operacji nie można cofnąć.')) {
                                try {
                                    await postJSON('/api/admin/reset-data', {});
                                    alert('Dane zostały wyczyszczone.');
                                    window.location.reload();
                                } catch (e) {
                                    alert('Błąd podczas resetowania danych.');
                                    console.error(e);
                                }
                            }
                        }}
                    >
                        Usuń wszystkie dane (Reset Bazy)
                    </BkpkButton>
                </BkpkCard>
                </section>
            </PageContainer>

            {/* Live Scraper Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={scraperStatus.running ? "🚀 Pobieranie danych w toku..." : "✅ Logi Scrapera"}
            >
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-3 text-lg font-semibold text-bkpk-text-primary">
                        {scraperStatus.running && <RefreshCw className="w-5 h-5 animate-spin text-bkpk-primary" />}
                        <span>{scraperStatus.message}</span>
                    </div>

                    {scraperStatus.running ? (
                        <>
                            <ScraperProgressBar current={current} total={total} percentage={percentage} />
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-bkpk-text-secondary">
                                <span>
                                    <span className="label-caps text-bkpk-text-muted">Krok:</span> {scraperStatus.step}
                                </span>
                            </div>
                        </>
                    ) : null}

                    <div className="bg-bkpk-bg p-4 sm:p-6 border border-bkpk-border-subtle font-mono text-sm text-bkpk-success h-[400px] overflow-y-auto whitespace-pre-wrap">
                        {scraperStatus.lastLog || "Oczekiwanie na logi..."}
                    </div>

                    <div className="flex justify-end gap-3">
                        <BkpkButton variant="ghost" onClick={() => setIsModalOpen(false)}>
                            Zamknij
                        </BkpkButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

type AdminUser = {
    id: string;
    firstName: string;
    lastName: string;
    username?: string | null;
    role?: string;
    number?: number | null;
    position?: string | null;
    photo?: string | null;
    data?: { photo?: string };
    lastActivityAt?: string | null;
    lastActivityIp?: string | null;
    /** Sezony, w których zawodnik nie gra (ukryty w składzie sezonu) */
    inactiveSeasonIds?: string[];
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function LastActivityDisplay({ user }: { user: AdminUser }) {
    if (!user.username) {
        return <span className="text-bkpk-text-muted">—</span>;
    }

    const label = formatLastActivity(user.lastActivityAt);
    const exact = formatLastActivityExact(user.lastActivityAt);
    const recency = getActivityRecency(user.lastActivityAt);
    const title = exact
        ? `${exact}${user.lastActivityIp ? ` · IP: ${user.lastActivityIp}` : ''}`
        : undefined;

    return (
        <span className={cn('text-xs font-medium', activityRecencyClass[recency])} title={title}>
            {label}
        </span>
    );
}

function LoginLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const { isAuthenticated, loading } = useAuth();
    const showCards = usePortraitMobile();

    // Filtering & Pagination state
    const [usernameFilter, setUsernameFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        total: 0,
        totalPages: 1
    });

    const fetchLogs = useCallback((currentPage: number, username: string, status: string) => {
        const query = new URLSearchParams({
            page: currentPage.toString(),
            limit: '20',
            username,
            success: status === 'all' ? '' : status
        });

        fetchJSON<any>(`/api/admin/logs?${query}`)
            .then(data => {
                setLogs(data.logs);
                setPagination({
                    total: data.total,
                    totalPages: data.totalPages
                });
                setError(null);
            })
            .catch(err => {
                console.error(err);
                setError(err.message);
            });
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchLogs(page, usernameFilter, statusFilter);
        }
    }, [isAuthenticated, page, statusFilter]);

    // Debounced username filter
    useEffect(() => {
        if (!isAuthenticated) return;
        const timer = setTimeout(() => {
            setPage(1);
            fetchLogs(1, usernameFilter, statusFilter);
        }, 500);
        return () => clearTimeout(timer);
    }, [usernameFilter]);

    if (loading) return <div className="p-4 text-center text-bkpk-text-muted">Ładowanie autoryzacji...</div>;
    if (!isAuthenticated) return <div className="p-4 text-center text-bkpk-text-danger">Brak autoryzacji (zaloguj się ponownie).</div>;

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full space-y-2">
                    <label className={fieldLabelClass}>
                        <Search className="w-3 h-3" />
                        Szukaj użytkownika
                    </label>
                    <input
                        type="search"
                        inputMode="search"
                        enterKeyHint="search"
                        autoCorrect="off"
                        autoCapitalize="none"
                        placeholder="Wpisz login..."
                        className={fieldClass}
                        value={usernameFilter}
                        onChange={(e) => setUsernameFilter(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-48 space-y-2">
                    <label className={fieldLabelClass}>
                        <Filter className="w-3 h-3" />
                        Status
                    </label>
                    <select
                        className={fieldClass}
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="all">Wszystkie</option>
                        <option value="true">Udane</option>
                        <option value="false">Błędy</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="border border-bkpk-border-subtle bg-bkpk-surface overflow-hidden">
                {error && (
                    <div className={cn(errorNoticeClass, 'm-4')}>
                        Błąd pobierania logów: {error}
                    </div>
                )}
                {showCards ? (
                <MobileDataList className="p-4">
                    {logs.map((log) => (
                        <MobileDataCard
                            key={log.id}
                            title={log.username}
                            subtitle={new Date(log.timestamp).toLocaleString('pl-PL')}
                            highlight={
                                <span
                                    className={cn(
                                        'status-flag',
                                        log.success ? 'text-bkpk-success' : 'text-bkpk-text-danger'
                                    )}
                                >
                                    {log.success ? 'Udane' : 'Błąd'}
                                </span>
                            }
                            stats={[{ label: 'Adres IP', value: log.ipAddress || '—' }]}
                        />
                    ))}
                    {logs.length === 0 && (
                        <p className="py-6 text-center text-bkpk-text-muted italic text-sm">
                            Brak wpisów pasujących do filtrów.
                        </p>
                    )}
                </MobileDataList>
                ) : (
                <ScrollableTableShell compact className="border-0 rounded-none">
                <table className="bkpk-table w-full text-sm text-left min-w-[480px]">
                    <thead className="border-b border-bkpk-border-subtle">
                        <tr>
                            <th className="py-2 px-4">Kto</th>
                            <th className="py-2 px-4">Kiedy</th>
                            <th className="py-2 px-4">Status</th>
                            <th className="py-2 px-4">Adres IP</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-bkpk-border-subtle">
                        {logs.map((log) => (
                            <tr key={log.id} className="transition-colors">
                                <td className="py-2.5 px-4 font-semibold text-bkpk-text-primary">{log.username}</td>
                                <td className="py-2.5 px-4 text-bkpk-text-secondary tabular-nums">{new Date(log.timestamp).toLocaleString()}</td>
                                <td className="py-2.5 px-4">
                                    <span className={cn(
                                        "status-flag",
                                        log.success ? "text-bkpk-success" : "text-bkpk-text-danger"
                                    )}>
                                        {log.success ? 'Udane' : 'Błąd'}
                                    </span>
                                </td>
                                <td className="py-2.5 px-4 text-bkpk-text-muted font-mono text-xs tabular-nums">{log.ipAddress}</td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-8 text-center text-bkpk-text-muted italic">Brak wpisów pasujących do filtrów.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
                </ScrollableTableShell>
                )}
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
                <div className="text-xs text-bkpk-text-muted">
                    Razem: <span className="font-display text-base tabular-nums text-bkpk-text-primary">{pagination.total}</span> logów
                </div>
                <div className="flex items-center gap-3">
                    <BkpkButton
                        variant="ghost"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        size="sm"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Poprzednia
                    </BkpkButton>
                    <span className="text-xs text-bkpk-text-muted whitespace-nowrap">
                        Strona <span className="font-display text-base tabular-nums text-bkpk-text-primary">{page}</span> z <span className="font-display text-base tabular-nums text-bkpk-text-primary">{pagination.totalPages || 1}</span>
                    </span>
                    <BkpkButton
                        variant="ghost"
                        disabled={page >= pagination.totalPages}
                        onClick={() => setPage(p => p + 1)}
                        size="sm"
                    >
                        Następna
                        <ChevronRight className="w-4 h-4" />
                    </BkpkButton>
                </div>
            </div>
        </div>
    );
}

function UserManagement() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const showCards = usePortraitMobile();

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all'); // all, USER, ADMIN, no-login
    const [inactiveOnly, setInactiveOnly] = useState(false);
    const [activitySort, setActivitySort] = useState<'none' | 'desc' | 'asc'>('none');

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isLoginAuditOpen, setIsLoginAuditOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

    // Current logged in user (from Auth context) to prevent deleting oneself
    const { user: currentUser } = useAuth();

    // Form fields for Add
    const [addFirstName, setAddFirstName] = useState('');
    const [addLastName, setAddLastName] = useState('');
    const [addNumber, setAddNumber] = useState('');
    const [addPosition, setAddPosition] = useState('');
    const [addEnableLogin, setAddEnableLogin] = useState(false);
    const [addUsername, setAddUsername] = useState('');
    const [addPassword, setAddPassword] = useState('');
    const [addRole, setAddRole] = useState<'USER' | 'ADMIN'>('USER');
    const [addPhoto, setAddPhoto] = useState<string | null>(null);
    const [addError, setAddError] = useState<string | null>(null);
    const [showAddPassword, setShowAddPassword] = useState(false);

    // Form fields for Edit
    const [editFirstName, setEditFirstName] = useState('');
    const [editLastName, setEditLastName] = useState('');
    const [editNumber, setEditNumber] = useState('');
    const [editPosition, setEditPosition] = useState('');
    const [editEnableLogin, setEditEnableLogin] = useState(false);
    const [editUsername, setEditUsername] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editRole, setEditRole] = useState<'USER' | 'ADMIN'>('USER');
    const [editPhoto, setEditPhoto] = useState<string | null>(null);
    const [editError, setEditError] = useState<string | null>(null);
    // „Nie gra w tym sezonie” — dotyczy sezonu wybranego w menu
    const { seasonId, selectedSeason } = useSeasonPreferenceContext();
    const seasonName = selectedSeason ? selectedSeason.label.replace(/^Sezon\s*/i, '').replace(/\s*\(.*\)$/, '') : '';
    const [editInactive, setEditInactive] = useState(false);
    const isInactiveNow = (user: AdminUser) => Boolean(seasonId && user.inactiveSeasonIds?.includes(seasonId));
    const [showEditPassword, setShowEditPassword] = useState(false);

    const fetchUsers = useCallback(() => {
        setLoading(true);
        fetchJSON<any[]>('/api/admin/users')
            .then(data => {
                setUsers(data);
                setError(null);
            })
            .catch(err => {
                console.error(err);
                setError(err.message);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddError(null);
        try {
            const body: any = {
                firstName: addFirstName,
                lastName: addLastName,
                number: addNumber !== '' ? parseInt(addNumber) : null,
                position: addPosition || null,
                photo: addPhoto
            };

            if (addEnableLogin) {
                if (!addUsername.trim() || !addPassword.trim()) {
                    setAddError('Nazwa użytkownika i hasło są wymagane dla konta logowania.');
                    return;
                }
                body.username = addUsername;
                body.password = addPassword;
                body.role = addRole;
            }

            await postJSON('/api/admin/users', body);
            setIsAddModalOpen(false);
            // Reset fields
            setAddFirstName('');
            setAddLastName('');
            setAddNumber('');
            setAddPosition('');
            setAddEnableLogin(false);
            setAddUsername('');
            setAddPassword('');
            setAddRole('USER');
            setAddPhoto(null);
            fetchUsers();
        } catch (err: any) {
            setAddError(err.message || 'Błąd dodawania użytkownika');
        }
    };

    const handleOpenEdit = (user: any) => {
        setSelectedUser(user);
        setEditFirstName(user.firstName || '');
        setEditLastName(user.lastName || '');
        setEditNumber(user.number !== null && user.number !== undefined ? user.number.toString() : '');
        setEditPosition(user.position || '');
        setEditEnableLogin(!!user.username);
        setEditUsername(user.username || '');
        setEditPassword('');
        setEditRole(user.role || 'USER');
        setEditPhoto(user.photo || user.data?.photo || null);
        setEditInactive(isInactiveNow(user));
        setEditError(null);
        setIsEditModalOpen(true);
    };

    const handleEditUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setEditError(null);
        if (!selectedUser) return;

        try {
            if (editRole === 'ADMIN' && !editEnableLogin) {
                setEditError('Rola Admin wymaga włączonego logowania do systemu.');
                return;
            }

            const body: any = {
                firstName: editFirstName,
                lastName: editLastName,
                number: editNumber !== '' ? parseInt(editNumber) : null,
                position: editPosition || null,
                role: editRole,
                photo: editPhoto
            };
            if (seasonId) {
                const others = (selectedUser.inactiveSeasonIds || []).filter((id) => id !== seasonId);
                body.inactiveSeasonIds = editInactive ? [...others, seasonId] : others;
            }

            if (editEnableLogin) {
                if (!editUsername.trim()) {
                    setEditError('Nazwa użytkownika jest wymagana dla konta logowania.');
                    return;
                }
                body.username = editUsername;
                if (editPassword.trim() !== '') {
                    body.password = editPassword;
                }
            } else {
                body.username = null; // Clear username/login account
            }

            await putJSON(`/api/admin/users/${selectedUser.id}`, body);
            setIsEditModalOpen(false);
            setSelectedUser(null);
            setEditPhoto(null);
            fetchUsers();
        } catch (err: any) {
            setEditError(err.message || 'Błąd aktualizacji użytkownika');
        }
    };

    const handleDeleteUser = async (userId: string, name: string) => {
        if (currentUser?.id === userId) {
            alert('Nie możesz usunąć własnego konta administratora.');
            return;
        }

        if (window.confirm(`Czy na pewno chcesz usunąć użytkownika/zawodnika ${name}? Tej operacji nie można cofnąć. Statystyki historyczne w meczach zostaną zachowane jako tekst, ale profil zawodnika zostanie usunięty.`)) {
            try {
                await deleteJSON(`/api/admin/users/${userId}`);
                fetchUsers();
            } catch (err: any) {
                alert(`Błąd usuwania użytkownika: ${err.message}`);
            }
        }
    };

    const handleActivitySortToggle = () => {
        setActivitySort((prev) => {
            if (prev === 'none') return 'desc';
            if (prev === 'desc') return 'asc';
            return 'none';
        });
    };

    const isUserInactive = (user: AdminUser) => {
        if (!user.username) return false;
        if (!user.lastActivityAt) return true;
        const diffDays = (Date.now() - new Date(user.lastActivityAt).getTime()) / MS_PER_DAY;
        return diffDays > 30;
    };

    // Filter logic
    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase()));

        if (!matchesSearch) return false;
        if (inactiveOnly && !isUserInactive(user)) return false;

        if (roleFilter === 'all') return true;
        if (roleFilter === 'ADMIN') return user.role === 'ADMIN';
        if (roleFilter === 'USER') return user.role === 'USER' && !!user.username;
        if (roleFilter === 'no-login') return !user.username;
        return true;
    });

    const displayUsers = [...filteredUsers].sort((a, b) => {
        if (activitySort === 'none') return 0;
        const aTime = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
        const bTime = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
        return activitySort === 'desc' ? bTime - aTime : aTime - bTime;
    });

    return (
        <div className="space-y-6">
            {/* Header + Add button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-bkpk-text-secondary text-sm">
                    Zarządzaj składem zawodników, ich rolami (użytkownik/administrator) oraz uprawnieniami do logowania.
                </p>
                <BkpkButton
                    variant="primary"
                    onClick={() => {
                        setAddError(null);
                        setIsAddModalOpen(true);
                    }}
                    className="sm:self-start shrink-0"
                >
                    <UserPlus className="w-4 h-4" />
                    Dodaj nowego
                </BkpkButton>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full space-y-2">
                    <label className={fieldLabelClass}>
                        <Search className="w-3 h-3" />
                        Szukaj (imię, nazwisko, login)
                    </label>
                    <input
                        type="search"
                        inputMode="search"
                        enterKeyHint="search"
                        autoCorrect="off"
                        autoCapitalize="none"
                        placeholder="Szukaj..."
                        className={fieldClass}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-64 space-y-2">
                    <label className={fieldLabelClass}>
                        <Filter className="w-3 h-3" />
                        Typ konta / Rola
                    </label>
                    <select
                        className={fieldClass}
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">Wszyscy zawodnicy</option>
                        <option value="ADMIN">Administratorzy (ADMIN)</option>
                        <option value="USER">Użytkownicy z loginem (USER)</option>
                        <option value="no-login">Bez konta logowania (tylko zawodnik)</option>
                    </select>
                </div>
                <div className="w-full md:w-auto flex items-end">
                    <label className="flex items-center gap-3 min-h-[48px] cursor-pointer select-none text-sm text-bkpk-text-secondary">
                        <input
                            type="checkbox"
                            className={checkboxClass}
                            checked={inactiveOnly}
                            onChange={(e) => setInactiveOnly(e.target.checked)}
                        />
                        <span className="label-caps text-xs text-bkpk-text-secondary whitespace-nowrap">
                            Nieaktywni &gt; 30 dni
                        </span>
                    </label>
                </div>
            </div>

            {/* User List Table */}
            <div className="border border-bkpk-border-subtle bg-bkpk-surface overflow-hidden">
                {error && (
                    <div className={cn(errorNoticeClass, 'm-4')}>
                        Błąd pobierania użytkowników: {error}
                    </div>
                )}
                
                {loading ? (
                    <div className="py-12 text-center text-bkpk-text-muted">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-bkpk-primary" />
                        Ładowanie listy...
                    </div>
                ) : (
                    <>
                    {showCards ? (
                    <MobileDataList className="p-4">
                        {displayUsers.map((user) => (
                            <MobileDataCard
                                key={user.id}
                                title={`${user.firstName} ${user.lastName}`}
                                subtitle={`${user.username ? `@${user.username}` : 'Brak konta logowania'}${isInactiveNow(user) ? ` · nie gra ${seasonName}` : ''}`}
                                leading={
                                    <div className="w-10 h-10 overflow-hidden bg-bkpk-bg border border-bkpk-border-strong shrink-0">
                                        <PlayerAvatar player={user} className="w-full h-full" />
                                    </div>
                                }
                                highlight={
                                    user.username ? (
                                        <span
                                            className={cn(
                                                'status-flag',
                                                user.role === 'ADMIN' ? 'text-bkpk-primary' : 'text-bkpk-text-secondary'
                                            )}
                                        >
                                            {user.role}
                                        </span>
                                    ) : undefined
                                }
                                stats={[
                                    {
                                        label: 'Nr / Poz.',
                                        value: `${user.number !== null ? `#${user.number}` : '—'} · ${user.position || '—'}`
                                    },
                                    {
                                        label: 'Ostatnia aktywność',
                                        value: user.username
                                            ? formatLastActivity(user.lastActivityAt)
                                            : '—'
                                    }
                                ]}
                                footer={
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenEdit(user)}
                                            className={ghostActionClass}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Edytuj
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                                            disabled={currentUser?.id === user.id}
                                            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 border-2 border-bkpk-danger text-bkpk-text-danger font-text font-semibold uppercase tracking-[0.08em] text-[13px] leading-none hover:bg-bkpk-surface-tint-1 transition-colors touch-manipulation disabled:opacity-50 disabled:text-bkpk-text-muted disabled:border-bkpk-border-strong"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Usuń
                                        </button>
                                    </div>
                                }
                            />
                        ))}
                        {displayUsers.length === 0 && (
                            <p className="py-6 text-center text-bkpk-text-muted italic text-sm">
                                Brak zawodników spełniających kryteria wyszukiwania.
                            </p>
                        )}
                    </MobileDataList>
                    ) : (
                    <ScrollableTableShell compact className="border-0 rounded-none">
                    <table className="bkpk-table w-full text-sm text-left min-w-[720px]">
                        <thead className="border-b border-bkpk-border-subtle">
                            <tr>
                                <th className="py-3 px-4">Zawodnik</th>
                                <th className="py-3 px-4">Numer i Poz.</th>
                                <th className="py-3 px-4">Login</th>
                                <th className="py-3 px-4">Rola</th>
                                <th className="py-3 px-4">
                                    <button
                                        type="button"
                                        onClick={handleActivitySortToggle}
                                        className="inline-flex items-center gap-1 uppercase hover:text-bkpk-text-primary hover:underline underline-offset-4 transition-colors"
                                        title="Sortuj po ostatniej aktywności"
                                    >
                                        Ostatnia aktywność
                                        {activitySort === 'desc' ? ' ↓' : activitySort === 'asc' ? ' ↑' : ''}
                                    </button>
                                </th>
                                <th className="py-3 px-4 text-right">Akcje</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-bkpk-border-subtle">
                            {displayUsers.map((user) => (
                                <tr key={user.id} className="transition-colors">
                                    <td className="py-3 px-4 font-semibold text-bkpk-text-primary">
                                        <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 overflow-hidden bg-bkpk-bg border border-bkpk-border-strong shrink-0">
                                            <PlayerAvatar player={user} className="w-full h-full" />
                                        </div>
                                        <span>{user.firstName} {user.lastName}</span>
                                        {isInactiveNow(user) && <span className="status-flag text-bkpk-text-muted">Nie gra {seasonName}</span>}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-bkpk-text-secondary tabular-nums">
                                        {user.number !== null ? `#${user.number}` : '-'} | {user.position || '-'}
                                    </td>
                                    <td className="py-3 px-4 font-mono text-xs text-bkpk-text-muted">
                                        {user.username || <span className="italic text-bkpk-text-muted">brak</span>}
                                    </td>
                                    <td className="py-3 px-4">
                                        {user.username ? (
                                            <span className={cn(
                                                "status-flag",
                                                user.role === 'ADMIN' ? "text-bkpk-primary" : "text-bkpk-text-secondary"
                                            )}>
                                                {user.role}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="py-3 px-4">
                                        <LastActivityDisplay user={user} />
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenEdit(user)}
                                                className="w-11 h-11 inline-flex items-center justify-center border border-transparent text-bkpk-text-secondary hover:text-bkpk-text-primary hover:border-bkpk-border-strong transition-colors"
                                                title="Edytuj profil / Zmień hasło"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                                                disabled={currentUser?.id === user.id}
                                                className="w-11 h-11 inline-flex items-center justify-center border border-transparent text-bkpk-text-secondary hover:text-bkpk-text-danger hover:border-bkpk-danger transition-colors disabled:opacity-50 disabled:text-bkpk-text-muted disabled:hover:border-transparent"
                                                title={currentUser?.id === user.id ? "Nie możesz usunąć samego siebie" : "Usuń zawodnika"}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {displayUsers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-bkpk-text-muted italic">Brak zawodników spełniających kryteria wyszukiwania.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    </ScrollableTableShell>
                    )}
                    </>
                )}
            </div>

            <div className="pt-3 border-t border-bkpk-border-subtle">
                <button
                    type="button"
                    onClick={() => setIsLoginAuditOpen(true)}
                    className="inline-flex items-center gap-2 min-h-[44px] label-caps text-xs text-bkpk-text-secondary hover:text-bkpk-text-primary transition-colors"
                >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Pokaż historię logowań (audyt bezpieczeństwa)
                </button>
            </div>

            <Modal
                isOpen={isLoginAuditOpen}
                onClose={() => setIsLoginAuditOpen(false)}
                title="Historia logowań (audyt bezpieczeństwa)"
                maxWidth="max-w-4xl"
            >
                <LoginLogs />
            </Modal>

            {/* Add User Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Dodaj Nowego Zawodnika / Użytkownika"
                maxWidth="max-w-md"
            >
                <form onSubmit={handleAddUser} className="space-y-4">
                    {addError && (
                        <div className={errorNoticeClass}>
                            {addError}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className={fieldLabelClass}>Imię *</label>
                            <input
                                type="text"
                                required
                                className={fieldCompactClass}
                                value={addFirstName}
                                onChange={(e) => setAddFirstName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className={fieldLabelClass}>Nazwisko *</label>
                            <input
                                type="text"
                                required
                                className={fieldCompactClass}
                                value={addLastName}
                                onChange={(e) => setAddLastName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className={fieldLabelClass}>Numer koszulki</label>
                            <input
                                type="number"
                                className={fieldCompactClass}
                                value={addNumber}
                                onChange={(e) => setAddNumber(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className={fieldLabelClass}>Pozycja</label>
                            <select
                                className={fieldCompactClass}
                                value={addPosition}
                                onChange={(e) => setAddPosition(e.target.value)}
                            >
                                <option value="">Wybierz pozycję...</option>
                                <option value="PG">PG (Rozgrywający)</option>
                                <option value="SG">SG (Rzucający obrońca)</option>
                                <option value="SF">SF (Niski skrzydłowy)</option>
                                <option value="PF">PF (Silny skrzydłowy)</option>
                                <option value="C">C (Środkowy)</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className={fieldLabelClass}>Zdjęcie Zawodnika</label>
                        <div className="flex items-center gap-4 p-3 bg-bkpk-bg border border-bkpk-border-subtle">
                            <div className="w-16 h-16 border border-bkpk-border-strong bg-bkpk-surface overflow-hidden flex items-center justify-center shrink-0">
                                {addPhoto ? (
                                    <img src={addPhoto} className="w-full h-full object-cover" alt="Preview" />
                                ) : (
                                    <span className="text-xs text-bkpk-text-muted italic">Brak</span>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className={cn(ghostActionClass, 'cursor-pointer text-center')}>
                                    Wgraj zdjęcie
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                try {
                                                    const compressed = await compressImage(file);
                                                    setAddPhoto(compressed);
                                                } catch (err) {
                                                    alert('Błąd podczas kompresji zdjęcia');
                                                }
                                            }
                                        }}
                                    />
                                </label>
                                {addPhoto && (
                                    <button
                                        type="button"
                                        onClick={() => setAddPhoto(null)}
                                        className="min-h-[44px] text-left label-caps text-xs text-bkpk-text-danger hover:underline underline-offset-4 animate-in fade-in"
                                    >
                                        Usuń zdjęcie
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-bkpk-border-subtle">
                        <label className="flex items-center gap-3 min-h-[48px] cursor-pointer select-none">
                            <input
                                type="checkbox"
                                className={checkboxClass}
                                checked={addEnableLogin}
                                onChange={(e) => setAddEnableLogin(e.target.checked)}
                            />
                            <span className="text-sm font-semibold text-bkpk-text-primary">Stwórz konto logowania</span>
                        </label>
                    </div>

                    {addEnableLogin && (
                        <div className="space-y-3 p-3 sm:p-4 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle animate-in slide-in-from-top-2 duration-200">
                            <div className="space-y-2">
                                <label className={fieldLabelClass}>
                                    <Lock className="w-3 h-3 text-bkpk-primary" /> Login *
                                </label>
                                <input
                                    type="text"
                                    required={addEnableLogin}
                                    className={fieldCompactClass}
                                    value={addUsername}
                                    onChange={(e) => setAddUsername(e.target.value)}
                                />
                            </div>
                            <PasswordInput
                                label="Hasło *"
                                placeholder="Wpisz hasło..."
                                value={addPassword}
                                onChange={setAddPassword}
                                required={addEnableLogin}
                                autoComplete="new-password"
                                showPassword={showAddPassword}
                                onToggleShow={() => setShowAddPassword((v) => !v)}
                                className="[&_input]:px-3"
                            />
                        </div>
                    )}

                    {addEnableLogin && (
                        <div className="space-y-2">
                            <label className={fieldLabelClass}>Rola *</label>
                            <select
                                className={fieldCompactClass}
                                value={addRole}
                                onChange={(e) => setAddRole(e.target.value as 'USER' | 'ADMIN')}
                            >
                                <option value="USER">Zawodnik</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-bkpk-border-subtle">
                        <BkpkButton variant="ghost" type="button" onClick={() => setIsAddModalOpen(false)}>
                            Anuluj
                        </BkpkButton>
                        <BkpkButton variant="primary" type="submit">
                            Zapisz
                        </BkpkButton>
                    </div>
                </form>
            </Modal>

            {/* Edit User Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedUser(null);
                }}
                title={`Edycja: ${selectedUser?.firstName} ${selectedUser?.lastName}`}
                maxWidth="max-w-md"
            >
                <form onSubmit={handleEditUser} className="space-y-4">
                    {editError && (
                        <div className={errorNoticeClass}>
                            {editError}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className={fieldLabelClass}>Imię *</label>
                            <input
                                type="text"
                                required
                                className={fieldCompactClass}
                                value={editFirstName}
                                onChange={(e) => setEditFirstName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className={fieldLabelClass}>Nazwisko *</label>
                            <input
                                type="text"
                                required
                                className={fieldCompactClass}
                                value={editLastName}
                                onChange={(e) => setEditLastName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className={fieldLabelClass}>Numer koszulki</label>
                            <input
                                type="number"
                                className={fieldCompactClass}
                                value={editNumber}
                                onChange={(e) => setEditNumber(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className={fieldLabelClass}>Pozycja</label>
                            <select
                                className={fieldCompactClass}
                                value={editPosition}
                                onChange={(e) => setEditPosition(e.target.value)}
                            >
                                <option value="">Wybierz pozycję...</option>
                                <option value="PG">PG (Rozgrywający)</option>
                                <option value="SG">SG (Rzucający obrońca)</option>
                                <option value="SF">SF (Niski skrzydłowy)</option>
                                <option value="PF">PF (Silny skrzydłowy)</option>
                                <option value="C">C (Środkowy)</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className={fieldLabelClass}>Zdjęcie Zawodnika</label>
                        <div className="flex items-center gap-4 p-3 bg-bkpk-bg border border-bkpk-border-subtle">
                            <div className="w-16 h-16 border border-bkpk-border-strong bg-bkpk-surface overflow-hidden flex items-center justify-center shrink-0">
                                {editPhoto ? (
                                    <img src={editPhoto} className="w-full h-full object-cover" alt="Preview" />
                                ) : (
                                    <span className="text-xs text-bkpk-text-muted italic">Brak</span>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className={cn(ghostActionClass, 'cursor-pointer text-center')}>
                                    Wgraj zdjęcie
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                try {
                                                    const compressed = await compressImage(file);
                                                    setEditPhoto(compressed);
                                                } catch (err) {
                                                    alert('Błąd podczas kompresji zdjęcia');
                                                }
                                            }
                                        }}
                                    />
                                </label>
                                {editPhoto && (
                                    <button
                                        type="button"
                                        onClick={() => setEditPhoto(null)}
                                        className="min-h-[44px] text-left label-caps text-xs text-bkpk-text-danger hover:underline underline-offset-4 animate-in fade-in"
                                    >
                                        Usuń zdjęcie
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className={fieldLabelClass}>Rola *</label>
                        <select
                            className={fieldCompactClass}
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as 'USER' | 'ADMIN')}
                        >
                            <option value="USER">Zawodnik</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>

                    {seasonId && (
                        <div className="pt-2 border-t border-bkpk-border-subtle">
                            <label className="flex items-start gap-3 min-h-[48px] py-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    className={cn(checkboxClass, 'mt-0.5')}
                                    checked={editInactive}
                                    onChange={(e) => setEditInactive(e.target.checked)}
                                />
                                <span>
                                    <span className="block text-sm font-semibold text-bkpk-text-primary">Nie gra w sezonie {seasonName}</span>
                                    <span className="block text-xs text-bkpk-text-muted">Ukryty w Drużynie, rankingach i w składzie na stronie WWW w tym sezonie. Konto, kariera i dawne mecze zostają.</span>
                                </span>
                            </label>
                        </div>
                    )}

                    <div className="pt-2 border-t border-bkpk-border-subtle">
                        <label className="flex items-center gap-3 min-h-[48px] cursor-pointer select-none">
                            <input
                                type="checkbox"
                                className={checkboxClass}
                                checked={editEnableLogin}
                                onChange={(e) => setEditEnableLogin(e.target.checked)}
                            />
                            <span className="text-sm font-semibold text-bkpk-text-primary">Zezwól na logowanie do systemu</span>
                        </label>
                    </div>

                    {editEnableLogin && (
                        <div className="space-y-3 p-3 sm:p-4 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle animate-in slide-in-from-top-2 duration-200">
                            <div className="space-y-2">
                                <label className={fieldLabelClass}>
                                    <Lock className="w-3 h-3 text-bkpk-primary" /> Login *
                                </label>
                                <input
                                    type="text"
                                    required={editEnableLogin}
                                    className={fieldCompactClass}
                                    value={editUsername}
                                    onChange={(e) => setEditUsername(e.target.value)}
                                />
                            </div>
                            <PasswordInput
                                label="Nowe hasło (zostaw puste, aby nie zmieniać)"
                                placeholder="Wpisz nowe hasło..."
                                value={editPassword}
                                onChange={setEditPassword}
                                autoComplete="new-password"
                                showPassword={showEditPassword}
                                onToggleShow={() => setShowEditPassword((v) => !v)}
                                className="[&_input]:px-3"
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-bkpk-border-subtle">
                        <BkpkButton
                            variant="ghost"
                            type="button"
                            onClick={() => {
                                setIsEditModalOpen(false);
                                setSelectedUser(null);
                            }}
                        >
                            Anuluj
                        </BkpkButton>
                        <BkpkButton variant="primary" type="submit">
                            Zapisz zmiany
                        </BkpkButton>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
