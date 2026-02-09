import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import { fetchJSON, postJSON } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Database, Terminal, RefreshCw, Users, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import BkpkCard from '../shared/ui/BkpkCard';
import BkpkButton from '../shared/ui/BkpkButton';
import { cn } from '../shared/lib/utils';
import { motion } from 'framer-motion';

type ScraperStatus = {
    running: boolean;
    step: string;
    message: string;
    lastFinishedAt: string | null;
    lastLog?: string;
};

export default function Administration() {
    const [scraperStatus, setScraperStatus] = useState<ScraperStatus>({
        running: false,
        step: 'idle',
        message: '',
        lastFinishedAt: null,
        lastLog: ''
    });
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { isAuthenticated } = useAuth();
    const refreshStatus = () => {
        if (!isAuthenticated) return;
        fetchJSON<ScraperStatus>('/api/scrape/kalk/div2/status')
            .then(data => setScraperStatus(data))
            .catch(() => { });
    };

    useEffect(() => {
        if (isAuthenticated) {
            refreshStatus();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        refreshStatus();
        // Poll faster if modal is open to show live logs
        const intervalTime = isModalOpen ? 1000 : 5000;
        const interval = setInterval(refreshStatus, intervalTime);
        return () => clearInterval(interval);
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

    return (
        <div className="min-h-screen bg-bkpk-bg p-4 md:p-8 lg:p-12">
            <div className="max-w-[1000px] mx-auto space-y-12">
                <header className="space-y-2">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 text-bkpk-primary font-bold uppercase tracking-[0.2em] text-xs"
                    >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Panel Kontrolny</span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-black font-outfit text-bkpk-text-primary tracking-tight"
                    >
                        Administracja <span className="text-bkpk-primary">Systemu</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-bkpk-text-muted text-lg"
                    >
                        Narzędzia do zarządzania danymi i aktualizacji systemowych.
                    </motion.p>
                </header>

                <BkpkCard
                    title="Liga KALK Scraper"
                    icon={<Database className="w-5 h-5 text-bkpk-primary" />}
                    className="space-y-6"
                >
                    <div className="flex items-center gap-3 p-4 bg-bkpk-surface-tint-2 rounded-2xl border border-bkpk-border-strong">
                        <div className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            scraperStatus.running ? "bg-bkpk-warning shadow-bkpk-glow animate-pulse" : "bg-bkpk-success"
                        )} />
                        <span className="text-sm font-bold text-bkpk-text-primary">
                            {scraperStatus.running ? 'Pobieranie danych w toku...' : `Status: Gotowy (Ostatnia aktualizacja: ${scraperStatus.lastFinishedAt ? new Date(scraperStatus.lastFinishedAt).toLocaleDateString() : 'Brak'})`}
                        </span>
                    </div>

                    <p className="text-bkpk-text-secondary text-sm leading-relaxed">
                        Uruchomienie scrapera spowoduje pobranie najnowszej tabeli ligowej, wyników meczów oraz statystyk wszystkich zawodników z oficjalnej strony ligi.
                        Proces jest w pełni zautomatyzowany i trwa zazwyczaj do 30 sekund.
                    </p>

                    <div className="flex flex-wrap gap-4 pt-4 border-t border-bkpk-border-strong">
                        <BkpkButton
                            variant="primary"
                            onClick={triggerScraper}
                            disabled={scraperStatus.running}
                            className="flex-1"
                        >
                            <RefreshCw className={cn("w-4 h-4 mr-2", scraperStatus.running && "animate-spin")} />
                            {scraperStatus.running ? 'Otwórz podgląd LIVE' : 'Uruchom pełny import danych'}
                        </BkpkButton>
                        <BkpkButton
                            variant="ghost"
                            onClick={() => setIsModalOpen(true)}
                            disabled={!scraperStatus.lastLog}
                            className="flex-1"
                        >
                            <Terminal className="w-4 h-4 mr-2" />
                            Pokaż ostatnie logi
                        </BkpkButton>
                    </div>

                    {scraperStatus.running && (
                        <div className="mt-8 p-6 bg-bkpk-overlay-medium rounded-2xl border border-bkpk-border-strong space-y-2 font-mono text-xs">
                            <div className="flex items-center gap-2">
                                <span className="text-bkpk-primary font-bold">Krok:</span>
                                <span className="text-bkpk-text-primary">{scraperStatus.step}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-bkpk-primary font-bold">Komunikat:</span>
                                <span className="text-bkpk-text-secondary">{scraperStatus.message}</span>
                            </div>
                        </div>
                    )}
                </BkpkCard>



                <BkpkCard
                    title="Historia Logowań (Audyt)"
                    icon={<Users className="w-5 h-5 text-bkpk-text-muted" />}
                    className="space-y-4"
                >
                    <LoginLogs />
                </BkpkCard>

                <BkpkCard
                    title="Strefa Niebezpieczna"
                    icon={<Terminal className="w-5 h-5 text-bkpk-danger" />}
                    className="space-y-6 border-bkpk-danger/30"
                >
                    <p className="text-bkpk-text-secondary text-sm">
                        Operacje w tej sekcji są nieodwracalne. Zachowaj szczególną ostrożność.
                    </p>

                    <BkpkButton
                        variant="destructive"
                        onClick={async () => {
                            if (window.confirm('Czy na pewno chcesz usunąć WSZYSTKIE dane z bazy? Tej operacji nie można cofnąć.')) {
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
            </div>

            {/* Live Scraper Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={scraperStatus.running ? "🚀 Pobieranie danych w toku..." : "✅ Logi Scrapera"}
            >
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-3 text-lg font-bold text-bkpk-text-primary">
                        {scraperStatus.running && <RefreshCw className="w-5 h-5 animate-spin text-bkpk-primary" />}
                        <span>{scraperStatus.message}</span>
                    </div>

                    <div className="bg-bkpk-overlay-strong p-6 rounded-2xl border border-bkpk-border-strong font-mono text-sm text-bkpk-success h-[400px] overflow-y-auto whitespace-pre-wrap scrollbar-thin scrollbar-thumb-white/10">
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

function LoginLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const { isAuthenticated, loading } = useAuth();

    // Filtering & Pagination state
    const [usernameFilter, setUsernameFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        total: 0,
        totalPages: 1
    });

    const fetchLogs = (currentPage: number, username: string, status: string) => {
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
    };

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
    if (!isAuthenticated) return <div className="p-4 text-center text-bkpk-danger">Brak autoryzacji (zaloguj się ponownie).</div>;

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                    <label className="text-xs font-bold text-bkpk-text-muted uppercase flex items-center gap-2">
                        <Search className="w-3 h-3" />
                        Szukaj użytkownika
                    </label>
                    <input
                        type="text"
                        placeholder="Wpisz login..."
                        className="w-full bg-bkpk-surface-tint-1 border border-bkpk-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-bkpk-primary/50 transition-colors"
                        value={usernameFilter}
                        onChange={(e) => setUsernameFilter(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-48 space-y-2">
                    <label className="text-xs font-bold text-bkpk-text-muted uppercase flex items-center gap-2">
                        <Filter className="w-3 h-3" />
                        Status
                    </label>
                    <select
                        className="w-full bg-bkpk-surface-tint-1 border border-bkpk-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-bkpk-primary/50 transition-colors"
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
            <div className="overflow-x-auto rounded-2xl border border-bkpk-border-subtle">
                {error && (
                    <div className="p-3 m-4 text-xs bg-bkpk-danger/20 text-bkpk-danger rounded-xl border border-bkpk-danger/30">
                        Błąd pobierania logów: {error}
                    </div>
                )}
                <table className="w-full text-sm text-left">
                    <thead className="text-bkpk-text-secondary font-bold uppercase text-xs border-b border-bkpk-border-subtle bg-bkpk-surface-tint-1">
                        <tr>
                            <th className="py-2 px-4">Kto</th>
                            <th className="py-2 px-4">Kiedy</th>
                            <th className="py-2 px-4">Status</th>
                            <th className="py-2 px-4">Adres IP</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-bkpk-border-subtle">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-bkpk-surface-tint-1">
                                <td className="py-2.5 px-4 font-bold text-bkpk-text-primary">{log.username}</td>
                                <td className="py-2.5 px-4 text-bkpk-text-muted">{new Date(log.timestamp).toLocaleString()}</td>
                                <td className="py-2.5 px-4">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                                        log.success ? "bg-bkpk-success/10 text-bkpk-success border border-bkpk-success/20" : "bg-bkpk-danger/10 text-bkpk-danger border border-bkpk-danger/20"
                                    )}>
                                        {log.success ? 'Udane' : 'Błąd'}
                                    </span>
                                </td>
                                <td className="py-2.5 px-4 text-bkpk-text-muted font-mono text-xs">{log.ipAddress}</td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-8 text-center text-bkpk-text-muted italic">Brak wpisów pasujących do filtrów.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
                <div className="text-xs text-bkpk-text-muted">
                    Razem: <span className="text-bkpk-text-primary font-bold">{pagination.total}</span> logów
                </div>
                <div className="flex items-center gap-3">
                    <BkpkButton
                        variant="ghost"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="h-8 px-3 text-xs"
                    >
                        <ChevronLeft className="w-3 h-3 mr-1" />
                        Poprzednia
                    </BkpkButton>
                    <span className="text-xs text-bkpk-text-muted">
                        Strona <span className="text-bkpk-text-primary font-bold">{page}</span> z <span className="text-bkpk-text-primary font-bold">{pagination.totalPages || 1}</span>
                    </span>
                    <BkpkButton
                        variant="ghost"
                        disabled={page >= pagination.totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="h-8 px-3 text-xs"
                    >
                        Następna
                        <ChevronRight className="w-3 h-3 ml-1" />
                    </BkpkButton>
                </div>
            </div>
        </div>
    );
}
