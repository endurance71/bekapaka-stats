import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import { fetchJSON, postJSON, putJSON, deleteJSON } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Database, Terminal, RefreshCw, Users, Search, Filter, ChevronLeft, ChevronRight, UserPlus, Edit2, Trash2, Key, Lock } from 'lucide-react';
import BkpkCard from '../shared/ui/BkpkCard';
import BkpkButton from '../shared/ui/BkpkButton';
import { cn } from '../shared/lib/utils';
import { motion } from 'framer-motion';
import { compressImage } from '../shared/lib/imageCompression';
import { resolvePlayerPhoto } from '../shared/lib/playerUtils';
import { PasswordInput } from '../shared/ui/PasswordInput';
import { MobileDataCard, MobileDataList } from '../shared/ui/MobileDataCard';
import ScrollableTableShell from '../shared/ui/ScrollableTableShell';
import { usePortraitMobile } from '../hooks/useIsMobile';

type ScraperStatus = {
    running: boolean;
    step: string;
    message: string;
    lastFinishedAt: string | null;
    lastLog?: string;
};

type KalkIngestSummary = {
    kalkMatches: number;
    finishedMatches: number;
    playerGameLogs: number;
    kalkTeams: number;
    leagueMatchesWithBoxScore: number;
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
        <div className="bg-bkpk-bg p-3 sm:p-4 md:p-8 lg:p-12">
            <div className="max-w-[1000px] mx-auto space-y-6 sm:space-y-12">
                <header className="space-y-2">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 text-bkpk-primary font-bold uppercase tracking-[0.2em] text-[10px] sm:text-xs"
                    >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Panel Kontrolny</span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl sm:text-3xl md:text-5xl font-black font-outfit text-bkpk-text-primary tracking-tight"
                    >
                        Administracja <span className="text-bkpk-primary">Systemu</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-bkpk-text-muted text-sm sm:text-lg"
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
                        Pełna synchronizacja KALK (v2): tabela, terminarz, wszystkie kategorie statystyk, box score zakończonych meczów Dywizji II oraz log meczów kadry BeKaPaKa.
                        Proces trwa zwykle 3–4 minuty (rate limit 1 s).
                    </p>

                    {kalkSummary ? (
                        <ul className="text-xs text-bkpk-text-muted space-y-1 font-mono">
                            <li>Mecze w DB (KalkMatch): {kalkSummary.finishedMatches} / {kalkSummary.kalkMatches} zakończone</li>
                            <li>Logi zawodników (tab 3): {kalkSummary.playerGameLogs}</li>
                            <li>Drużyny KALK: {kalkSummary.kalkTeams} · terminarz z box score: {kalkSummary.leagueMatchesWithBoxScore}</li>
                        </ul>
                    ) : null}

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
                    title="Zarządzanie Zawodnikami i Użytkownikami"
                    icon={<Users className="w-5 h-5 text-bkpk-primary" />}
                    className="space-y-6"
                >
                    <UserManagement />
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
                            if (window.confirm('Usunąć wszystkie mecze z importu protokołów (tabela Game), linki protocolUrl i stare cache AI? Dane KALK (box score, liga) zostaną.')) {
                                try {
                                    const result = await postJSON<Record<string, number>>('/api/admin/purge-protocols', {});
                                    alert(`Protokoły usunięte. Pozostało meczów Game: ${result.remainingGames ?? 0}. KalkMatch: ${result.kalkMatches ?? '?'}.`);
                                    window.location.reload();
                                } catch (e) {
                                    alert('Błąd podczas czyszczenia protokołów.');
                                    console.error(e);
                                }
                            }
                        }}
                    >
                        Usuń dane protokołów (zostaw KALK)
                    </BkpkButton>

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
    const showCards = usePortraitMobile();

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
            <div className="rounded-2xl border border-bkpk-border-subtle overflow-hidden">
                {error && (
                    <div className="p-3 m-4 text-xs bg-bkpk-danger/20 text-bkpk-danger rounded-xl border border-bkpk-danger/30">
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
                                        'px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider',
                                        log.success
                                            ? 'bg-bkpk-success/10 text-bkpk-success border border-bkpk-success/20'
                                            : 'bg-bkpk-danger/10 text-bkpk-danger border border-bkpk-danger/20'
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
                <table className="w-full text-sm text-left min-w-[480px]">
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
                </ScrollableTableShell>
                )}
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

function UserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const showCards = usePortraitMobile();

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all'); // all, USER, ADMIN, no-login

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

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
    const [showEditPassword, setShowEditPassword] = useState(false);

    const fetchUsers = () => {
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
    };

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
        setEditError(null);
        setIsEditModalOpen(true);
    };

    const handleEditUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setEditError(null);
        if (!selectedUser) return;

        try {
            const body: any = {
                firstName: editFirstName,
                lastName: editLastName,
                number: editNumber !== '' ? parseInt(editNumber) : null,
                position: editPosition || null,
                role: editRole,
                photo: editPhoto
            };

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

    // Filter logic
    const filteredUsers = users.filter(user => {
        const matchesSearch = 
            `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase()));

        if (roleFilter === 'all') return matchesSearch;
        if (roleFilter === 'ADMIN') return matchesSearch && user.role === 'ADMIN';
        if (roleFilter === 'USER') return matchesSearch && user.role === 'USER' && !!user.username;
        if (roleFilter === 'no-login') return matchesSearch && !user.username;
        return matchesSearch;
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
                    className="sm:self-start flex items-center gap-2 text-sm"
                >
                    <UserPlus className="w-4 h-4" />
                    Dodaj nowego
                </BkpkButton>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2 w-full">
                    <label className="text-xs font-bold text-bkpk-text-muted uppercase flex items-center gap-2">
                        <Search className="w-3 h-3" />
                        Szukaj (imię, nazwisko, login)
                    </label>
                    <input
                        type="text"
                        placeholder="Szukaj..."
                        className="w-full bg-bkpk-surface-tint-1 border border-bkpk-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-bkpk-primary/50 transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-64 space-y-2">
                    <label className="text-xs font-bold text-bkpk-text-muted uppercase flex items-center gap-2">
                        <Filter className="w-3 h-3" />
                        Typ konta / Rola
                    </label>
                    <select
                        className="w-full bg-bkpk-surface-tint-1 border border-bkpk-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-bkpk-primary/50 transition-colors"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">Wszyscy zawodnicy</option>
                        <option value="ADMIN">Administratorzy (ADMIN)</option>
                        <option value="USER">Użytkownicy z loginem (USER)</option>
                        <option value="no-login">Bez konta logowania (tylko zawodnik)</option>
                    </select>
                </div>
            </div>

            {/* User List Table */}
            <div className="rounded-2xl border border-bkpk-border-subtle overflow-hidden">
                {error && (
                    <div className="p-3 m-4 text-xs bg-bkpk-danger/20 text-bkpk-danger rounded-xl border border-bkpk-danger/30">
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
                        {filteredUsers.map((user) => (
                            <MobileDataCard
                                key={user.id}
                                title={`${user.firstName} ${user.lastName}`}
                                subtitle={user.username ? `@${user.username}` : 'Brak konta logowania'}
                                leading={
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-bkpk-surface-tint-2 border border-bkpk-border-subtle shrink-0">
                                        <img
                                            src={resolvePlayerPhoto(user)}
                                            onError={(e) => (e.currentTarget.src = '/photos/default.png')}
                                            className="w-full h-full object-cover"
                                            alt=""
                                        />
                                    </div>
                                }
                                highlight={
                                    user.username ? (
                                        <span
                                            className={cn(
                                                'px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider',
                                                user.role === 'ADMIN'
                                                    ? 'bg-bkpk-primary/10 text-bkpk-primary border border-bkpk-primary/20'
                                                    : 'bg-bkpk-secondary/10 text-bkpk-text-secondary border border-bkpk-border-subtle'
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
                                        label: 'Status',
                                        value: user.username ? 'Aktywny login' : 'Tylko profil'
                                    }
                                ]}
                                footer={
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenEdit(user)}
                                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-bkpk-text-primary bg-bkpk-surface-tint-2 rounded-lg border border-bkpk-border-strong"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Edytuj
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                                            disabled={currentUser?.id === user.id}
                                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-bkpk-danger bg-bkpk-danger/10 rounded-lg border border-bkpk-danger/20 disabled:opacity-30"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Usuń
                                        </button>
                                    </div>
                                }
                            />
                        ))}
                        {filteredUsers.length === 0 && (
                            <p className="py-6 text-center text-bkpk-text-muted italic text-sm">
                                Brak zawodników spełniających kryteria wyszukiwania.
                            </p>
                        )}
                    </MobileDataList>
                    ) : (
                    <ScrollableTableShell compact className="border-0 rounded-none">
                    <table className="w-full text-sm text-left min-w-[640px]">
                        <thead className="text-bkpk-text-secondary font-bold uppercase text-xs border-b border-bkpk-border-subtle bg-bkpk-surface-tint-1">
                            <tr>
                                <th className="py-3 px-4">Zawodnik</th>
                                <th className="py-3 px-4">Numer i Poz.</th>
                                <th className="py-3 px-4">Login</th>
                                <th className="py-3 px-4">Rola</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4 text-right">Akcje</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-bkpk-border-subtle">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-bkpk-surface-tint-1 transition-colors">
                                    <td className="py-3 px-4 font-bold text-bkpk-text-primary flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-bkpk-surface-tint-2 border border-bkpk-border-subtle shrink-0">
                                            <img
                                                src={resolvePlayerPhoto(user)}
                                                onError={(e) => (e.currentTarget.src = '/photos/default.png')}
                                                className="w-full h-full object-cover"
                                                alt=""
                                            />
                                        </div>
                                        <span>{user.firstName} {user.lastName}</span>
                                    </td>
                                    <td className="py-3 px-4 text-bkpk-text-secondary">
                                        {user.number !== null ? `#${user.number}` : '-'} | {user.position || '-'}
                                    </td>
                                    <td className="py-3 px-4 font-mono text-xs text-bkpk-text-muted">
                                        {user.username || <span className="italic text-bkpk-text-muted">brak</span>}
                                    </td>
                                    <td className="py-3 px-4">
                                        {user.username ? (
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                                                user.role === 'ADMIN' ? "bg-bkpk-primary/10 text-bkpk-primary border border-bkpk-primary/20" : "bg-bkpk-secondary/10 text-bkpk-text-secondary border border-bkpk-border-subtle"
                                            )}>
                                                {user.role}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="py-3 px-4">
                                        {user.username ? (
                                            <span className="text-xs text-bkpk-success flex items-center gap-1.5 font-bold">
                                                <span className="w-1.5 h-1.5 rounded-full bg-bkpk-success font-bold" />
                                                Aktywny login
                                            </span>
                                        ) : (
                                            <span className="text-xs text-bkpk-text-muted flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-bkpk-text-muted/45" />
                                                Tylko profil
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenEdit(user)}
                                                className="p-1.5 text-bkpk-text-muted hover:text-bkpk-primary hover:bg-bkpk-surface-tint-2 rounded-lg transition-all"
                                                title="Edytuj profil / Zmień hasło"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                                                disabled={currentUser?.id === user.id}
                                                className="p-1.5 text-bkpk-text-muted hover:text-bkpk-danger hover:bg-bkpk-danger/10 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                                                title={currentUser?.id === user.id ? "Nie możesz usunąć samego siebie" : "Usuń zawodnika"}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
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

            {/* Add User Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Dodaj Nowego Zawodnika / Użytkownika"
                maxWidth="max-w-md"
            >
                <form onSubmit={handleAddUser} className="space-y-4">
                    {addError && (
                        <div className="p-3 text-xs bg-bkpk-danger/20 text-bkpk-danger rounded-xl border border-bkpk-danger/30">
                            {addError}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-bkpk-text-muted uppercase">Imię *</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-bkpk-surface border border-bkpk-border-subtle rounded-xl px-3 py-2 text-sm text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary/50"
                                value={addFirstName}
                                onChange={(e) => setAddFirstName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-bkpk-text-muted uppercase">Nazwisko *</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-bkpk-surface border border-bkpk-border-subtle rounded-xl px-3 py-2 text-sm text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary/50"
                                value={addLastName}
                                onChange={(e) => setAddLastName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-bkpk-text-muted uppercase">Numer koszulki</label>
                            <input
                                type="number"
                                className="w-full bg-bkpk-surface border border-bkpk-border-subtle rounded-xl px-3 py-2 text-sm text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary/50"
                                value={addNumber}
                                onChange={(e) => setAddNumber(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-bkpk-text-muted uppercase">Pozycja</label>
                            <select
                                className="w-full bg-bkpk-surface border border-bkpk-border-subtle rounded-xl px-3 py-2 text-sm text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary/50"
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

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-bkpk-text-muted uppercase">Zdjęcie Zawodnika</label>
                        <div className="flex items-center gap-4 p-3 bg-bkpk-surface-tint-1 rounded-xl border border-bkpk-border-subtle">
                            <div className="w-16 h-16 rounded-full border border-bkpk-border-strong bg-bkpk-bg overflow-hidden flex items-center justify-center shrink-0">
                                {addPhoto ? (
                                    <img src={addPhoto} className="w-full h-full object-cover" alt="Preview" />
                                ) : (
                                    <span className="text-xs text-bkpk-text-muted italic">Brak</span>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="cursor-pointer bg-bkpk-surface-tint-2 hover:bg-bkpk-surface-tint-4 border border-bkpk-border-strong text-bkpk-text-primary px-3 py-1.5 rounded-lg text-xs font-bold text-center select-none transition-colors">
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
                                        className="text-xs font-bold text-bkpk-danger hover:underline text-left animate-in fade-in"
                                    >
                                        Usuń zdjęcie
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-bkpk-border-subtle">
                        <label className="flex items-center gap-2 cursor-pointer py-1 select-none">
                            <input
                                type="checkbox"
                                className="rounded border-bkpk-border-subtle text-bkpk-primary focus:ring-bkpk-primary bg-bkpk-surface"
                                checked={addEnableLogin}
                                onChange={(e) => setAddEnableLogin(e.target.checked)}
                            />
                            <span className="text-sm font-bold text-bkpk-text-primary">Stwórz konto logowania</span>
                        </label>
                    </div>

                    {addEnableLogin && (
                        <div className="space-y-3 p-3 bg-bkpk-surface-tint-1 rounded-xl border border-bkpk-border-subtle animate-in slide-in-from-top-2 duration-200">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-bkpk-text-muted uppercase flex items-center gap-1">
                                    <Lock className="w-3 h-3 text-bkpk-primary" /> Login *
                                </label>
                                <input
                                    type="text"
                                    required={addEnableLogin}
                                    className="w-full bg-bkpk-surface border border-bkpk-border-subtle rounded-xl px-3 py-2 text-sm text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary/50"
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
                                className="[&_input]:px-3 [&_input]:py-2"
                            />
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-bkpk-text-muted uppercase">Rola *</label>
                                <select
                                    className="w-full bg-bkpk-surface border border-bkpk-border-subtle rounded-xl px-3 py-2 text-sm text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary/50"
                                    value={addRole}
                                    onChange={(e) => setAddRole(e.target.value as any)}
                                >
                                    <option value="USER">Użytkownik (USER)</option>
                                    <option value="ADMIN">Administrator (ADMIN)</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-3 border-t border-bkpk-border-subtle">
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
                        <div className="p-3 text-xs bg-bkpk-danger/20 text-bkpk-danger rounded-xl border border-bkpk-danger/30">
                            {editError}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-bkpk-text-muted uppercase">Imię *</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-bkpk-surface border border-bkpk-border-subtle rounded-xl px-3 py-2 text-sm text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary/50"
                                value={editFirstName}
                                onChange={(e) => setEditFirstName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-bkpk-text-muted uppercase">Nazwisko *</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-bkpk-surface border border-bkpk-border-subtle rounded-xl px-3 py-2 text-sm text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary/50"
                                value={editLastName}
                                onChange={(e) => setEditLastName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-bkpk-text-muted uppercase">Numer koszulki</label>
                            <input
                                type="number"
                                className="w-full bg-bkpk-surface border border-bkpk-border-subtle rounded-xl px-3 py-2 text-sm text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary/50"
                                value={editNumber}
                                onChange={(e) => setEditNumber(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-bkpk-text-muted uppercase">Pozycja</label>
                            <select
                                className="w-full bg-bkpk-surface border border-bkpk-border-subtle rounded-xl px-3 py-2 text-sm text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary/50"
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

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-bkpk-text-muted uppercase">Zdjęcie Zawodnika</label>
                        <div className="flex items-center gap-4 p-3 bg-bkpk-surface-tint-1 rounded-xl border border-bkpk-border-subtle">
                            <div className="w-16 h-16 rounded-full border border-bkpk-border-strong bg-bkpk-bg overflow-hidden flex items-center justify-center shrink-0">
                                {editPhoto ? (
                                    <img src={editPhoto} className="w-full h-full object-cover" alt="Preview" />
                                ) : (
                                    <span className="text-xs text-bkpk-text-muted italic">Brak</span>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="cursor-pointer bg-bkpk-surface-tint-2 hover:bg-bkpk-surface-tint-4 border border-bkpk-border-strong text-bkpk-text-primary px-3 py-1.5 rounded-lg text-xs font-bold text-center select-none transition-colors">
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
                                        className="text-xs font-bold text-bkpk-danger hover:underline text-left animate-in fade-in"
                                    >
                                        Usuń zdjęcie
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-bkpk-border-subtle">
                        <label className="flex items-center gap-2 cursor-pointer py-1 select-none">
                            <input
                                type="checkbox"
                                className="rounded border-bkpk-border-subtle text-bkpk-primary focus:ring-bkpk-primary bg-bkpk-surface"
                                checked={editEnableLogin}
                                onChange={(e) => setEditEnableLogin(e.target.checked)}
                            />
                            <span className="text-sm font-bold text-bkpk-text-primary">Zezwól na logowanie do systemu</span>
                        </label>
                    </div>

                    {editEnableLogin && (
                        <div className="space-y-3 p-3 bg-bkpk-surface-tint-1 rounded-xl border border-bkpk-border-subtle animate-in slide-in-from-top-2 duration-200">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-bkpk-text-muted uppercase flex items-center gap-1">
                                    <Lock className="w-3 h-3 text-bkpk-primary" /> Login *
                                </label>
                                <input
                                    type="text"
                                    required={editEnableLogin}
                                    className="w-full bg-bkpk-surface border border-bkpk-border-subtle rounded-xl px-3 py-2 text-sm text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary/50"
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
                                className="[&_input]:px-3 [&_input]:py-2"
                            />
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-bkpk-text-muted uppercase">Rola *</label>
                                <select
                                    className="w-full bg-bkpk-surface border border-bkpk-border-subtle rounded-xl px-3 py-2 text-sm text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary/50"
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value as any)}
                                >
                                    <option value="USER">Użytkownik (USER)</option>
                                    <option value="ADMIN">Administrator (ADMIN)</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-3 border-t border-bkpk-border-subtle">
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
