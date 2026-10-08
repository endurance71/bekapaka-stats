import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resolvePlayerImage, getPositionLabel } from '../shared/lib/playerUtils';
import PlayerCard from '../shared/ui/PlayerCard';
import BkpkCard from '../shared/ui/BkpkCard';
import BkpkButton from '../shared/ui/BkpkButton';
import { putJSON, fetchJSON } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Key, ExternalLink, RefreshCw } from 'lucide-react';
import PageContainer from '../shared/ui/PageContainer';
import PageHeader from '../shared/ui/PageHeader';
import { PasswordInput } from '../shared/ui/PasswordInput';
import AiAnalysisBlock from '../components/ai/AiAnalysisBlock';
import { useSeasonPreferenceContext } from '../context/SeasonPreferenceContext';
import GoalsCard from '../features/me/GoalsCard';
import { RankCard, RecordsCard, SeasonCompareCard, ShootingTrendCard, type CareerRecords, type RankInfo } from '../features/me/MeSections';
import { rankOf, seasonValues, seasonVsPrevious, shootingSeries, type GameLogEntry, type Goals } from '../features/me/meStats';
import type { CareerSeasonRow } from '../components/players/PlayerCareer';

type TeamPlayer = { id: string; ppg?: number | null; rpg?: number | null; apg?: number | null; gamesPlayed?: number | null };
type LeagueLeader = { id: string; pointsAverage?: number | null; rosterPlayer?: { id: string } | null };

export default function Profile() {
    const { user, updateToken } = useAuth();
    const navigate = useNavigate();

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    
    // Status states
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [showCurrentPwd, setShowCurrentPwd] = useState(false);
    const [showNewPwd, setShowNewPwd] = useState(false);
    const [showConfirmPwd, setShowConfirmPwd] = useState(false);

    // AI Summary State
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [aiMeta, setAiMeta] = useState<{ at?: string | null; model?: string | null }>({});
    const [aiLoading] = useState(false);
    const { selectedSeason, seasonId } = useSeasonPreferenceContext();
    // Średnie z wybranego sezonu (ta sama ścieżka co profil zawodnika), nie kolumny konta
    const [seasonAverages, setSeasonAverages] = useState<{ ppg: number; rpg: number; apg: number } | null>(null);
    const [gameLog, setGameLog] = useState<GameLogEntry[]>([]);
    const [careerRows, setCareerRows] = useState<CareerSeasonRow[]>([]);
    const [careerRecords, setCareerRecords] = useState<CareerRecords | null>(null);
    const [goals, setGoals] = useState<Goals | null>(null);
    const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>([]);
    const [leagueLeaders, setLeagueLeaders] = useState<LeagueLeader[]>([]);

    useEffect(() => {
        if (!user?.id || !seasonId) return;
        let active = true;
        const q = `seasonId=${encodeURIComponent(seasonId)}`;
        fetchJSON<{ averages?: { ppg: number; rpg: number; apg: number }; gameLog?: GameLogEntry[] }>(`/api/players/${user.id}/stats?${q}`)
            .then((res) => {
                if (!active) return;
                setSeasonAverages(res?.averages ?? null);
                setGameLog(res?.gameLog ?? []);
            })
            .catch(() => {
                if (!active) return;
                setSeasonAverages(null);
                setGameLog([]);
            });
        fetchJSON<TeamPlayer[]>(`/api/players?${q}`)
            .then((res) => active && setTeamPlayers(res || []))
            .catch(() => active && setTeamPlayers([]));
        fetchJSON<LeagueLeader[]>(`/api/league/leaders?category=points&limit=100&${q}`)
            .then((res) => active && setLeagueLeaders(res || []))
            .catch(() => active && setLeagueLeaders([]));
        return () => {
            active = false;
        };
    }, [user?.id, seasonId]);

    useEffect(() => {
        if (!user?.id) return;
        let active = true;
        fetchJSON<{ seasons?: CareerSeasonRow[]; careerRecords?: CareerRecords | null }>(`/api/players/${user.id}/career`)
            .then((res) => {
                if (!active) return;
                setCareerRows(res?.seasons ?? []);
                setCareerRecords(res?.careerRecords ?? null);
            })
            .catch(() => active && setCareerRows([]));
        return () => {
            active = false;
        };
    }, [user?.id]);

    const values = useMemo(() => seasonValues(gameLog), [gameLog]);
    const compare = useMemo(() => seasonVsPrevious(careerRows, seasonId), [careerRows, seasonId]);
    const series = useMemo(() => shootingSeries(gameLog), [gameLog]);
    const ranks = useMemo<RankInfo[]>(() => {
        if (!user?.id || !gameLog.length) return [];
        const played = teamPlayers.filter((p) => (p.gamesPlayed ?? 0) > 0);
        const isMe = (p: TeamPlayer) => p.id === user.id;
        const out: RankInfo[] = [];
        const team: [string, (p: TeamPlayer) => number | null | undefined][] = [
            ['Punkty/m w drużynie', (p) => p.ppg],
            ['Zbiórki/m w drużynie', (p) => p.rpg],
            ['Asysty/m w drużynie', (p) => p.apg]
        ];
        for (const [label, get] of team) {
            const r = rankOf(played, isMe, get);
            if (r) out.push({ label, ...r });
        }
        // Liderzy ligi są już posortowani (KALK, punkty na mecz); lista ucięta do 100
        const slug = user.kalkSlug ?? null;
        const idx = leagueLeaders.findIndex((l) => l.rosterPlayer?.id === user.id || (slug != null && l.id.endsWith(`__${slug}`)));
        if (idx >= 0) out.push({ label: 'Punkty/m w lidze', rank: idx + 1, of: leagueLeaders.length < 100 ? leagueLeaders.length : null });
        return out;
    }, [user?.id, user?.kalkSlug, gameLog.length, teamPlayers, leagueLeaders]);

    useEffect(() => {
        if (!user?.id) return;
        const fetchAiData = async () => {
            try {
                const playerRow = await fetchJSON<any>(`/api/players/${user.id}`);
                setAiSummary(playerRow?.aiDevelopmentSummary || null);
                setGoals(playerRow?.goals ?? { items: [] });
                setAiMeta({
                    at: playerRow?.aiDevelopmentAt,
                    model: playerRow?.aiDevelopmentModel
                });
            } catch (err) {
                console.error('Failed to fetch player AI data:', err);
            }
        };
        fetchAiData();
    }, [user?.id]);

    if (!user) {
        return (
            <div className="min-h-[100dvh] bg-bkpk-bg flex items-center justify-center">
                <div className="label-caps text-sm text-bkpk-text-muted">Brak autoryzacji. Zaloguj się ponownie.</div>
            </div>
        );
    }

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(null);

        if (newPassword !== confirmNewPassword) {
            setPasswordError('Nowe hasła nie są identyczne.');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('Nowe hasło musi mieć co najmniej 6 znaków.');
            return;
        }

        setPasswordLoading(true);
        try {
            const res = await putJSON<{ token?: string }>('/api/profile/password', {
                currentPassword,
                newPassword
            });
            // Serwer unieważnia stare sesje (inne telefony); to urządzenie dostaje nowy token
            if (res?.token) updateToken(res.token);
            setPasswordSuccess('Hasło zostało pomyślnie zmienione.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (err: any) {
            setPasswordError(err.message || 'Nie udało się zmienić hasła.');
        } finally {
            setPasswordLoading(false);
        }
    };

    const userPhoto = resolvePlayerImage(user);

    return (
        <div className="bg-bkpk-bg">
            <PageContainer width="narrow">
                {/* Header */}
                <PageHeader
                    kicker="Ja"
                    title={`${user.firstName} ${user.lastName}`.trim() || 'Mój profil'}
                    description={`Twój sezon, rekordy i cele${selectedSeason ? ` — ${selectedSeason.label}` : ''}. Sezon wybierasz w menu.`}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <SeasonCompareCard current={compare.current} previous={compare.previous} />
                    <RankCard ranks={ranks} />
                    <GoalsCard playerId={user.id} goals={goals} values={values} canEdit={goals !== null} />
                    <RecordsCard records={careerRecords} />
                    <div className="lg:col-span-2">
                        <ShootingTrendCard series={series} />
                    </div>
                </div>

                <AiAnalysisBlock
                    title="Twój plan rozwoju (AI)"
                    content={aiSummary}
                    generatedAt={aiMeta.at}
                    model={aiMeta.model}
                    loading={aiLoading}
                    playerEmptyHint="Twój plan rozwoju pojawi się, gdy trener go przygotuje (po 3 meczach w sezonie)."
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column: Player Card Visualizer */}
                    <div className="lg:col-span-5 flex flex-col items-center gap-6">
                        <div className="w-full max-w-[320px]">
                            <h2 className="kicker text-bkpk-text-primary mb-4 w-full justify-center lg:justify-start">
                                Moja karta zawodnika
                            </h2>
                            <PlayerCard
                                id={user.id}
                                firstName={user.firstName}
                                lastName={user.lastName}
                                number={user.number || 0}
                                position={user.position}
                                photoUrl={userPhoto}
                                ppg={seasonAverages?.ppg ?? 0}
                                rpg={seasonAverages?.rpg ?? 0}
                                apg={seasonAverages?.apg ?? 0}
                                isStarter={Boolean(user.starter)}
                                onClick={() => navigate(`/players/${user.id}`)}
                            />
                        </div>
                        
                        <BkpkButton
                            variant="ghost"
                            onClick={() => navigate(`/players/${user.id}`)}
                            className="w-full max-w-[320px] flex items-center justify-center gap-2"
                        >
                            <span>
                                Statystyki
                                {selectedSeason ? ` — ${selectedSeason.label}` : ''}
                            </span>
                            <ExternalLink className="w-4 h-4" aria-hidden="true" />
                        </BkpkButton>
                    </div>

                    {/* Right Column: Account Management Forms */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Change Password Form */}
                        <BkpkCard
                            title="Bezpieczeństwo konta"
                            icon={<Key className="w-5 h-5 text-bkpk-primary" />}
                            animateEntrance={false}
                        >
                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-bkpk-bg border border-bkpk-border-subtle text-sm text-bkpk-text-secondary">
                                    <ShieldCheck className="w-4 h-4 text-bkpk-success shrink-0" aria-hidden="true" />
                                    <span>Zalogowany jako: <strong className="text-bkpk-text-primary">@{user.username}</strong> ({getPositionLabel(user.position)} #{user.number || '--'})</span>
                                </div>

                                {passwordError && (
                                    <div className="p-3 text-sm bg-bkpk-bg text-bkpk-text-danger-subtle border border-bkpk-danger border-l-4">
                                        {passwordError}
                                    </div>
                                )}
                                {passwordSuccess && (
                                    <div className="p-3 text-sm bg-bkpk-bg text-bkpk-success border border-bkpk-success border-l-4">
                                        {passwordSuccess}
                                    </div>
                                )}

                                <PasswordInput
                                    label="Aktualne hasło *"
                                    placeholder="Wpisz obecne hasło..."
                                    value={currentPassword}
                                    onChange={setCurrentPassword}
                                    required
                                    autoComplete="current-password"
                                    showPassword={showCurrentPwd}
                                    onToggleShow={() => setShowCurrentPwd((v) => !v)}
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <PasswordInput
                                        label="Nowe hasło *"
                                        placeholder="Min. 6 znaków..."
                                        value={newPassword}
                                        onChange={setNewPassword}
                                        required
                                        autoComplete="new-password"
                                        showPassword={showNewPwd}
                                        onToggleShow={() => setShowNewPwd((v) => !v)}
                                    />
                                    <PasswordInput
                                        label="Powtórz nowe hasło *"
                                        placeholder="Powtórz nowe hasło..."
                                        value={confirmNewPassword}
                                        onChange={setConfirmNewPassword}
                                        required
                                        autoComplete="new-password"
                                        showPassword={showConfirmPwd}
                                        onToggleShow={() => setShowConfirmPwd((v) => !v)}
                                    />
                                </div>

                                <div className="pt-2 border-t border-bkpk-border-subtle flex justify-end">
                                    <BkpkButton
                                        variant="primary"
                                        type="submit"
                                        disabled={passwordLoading}
                                    >
                                        {passwordLoading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                                        Zmień hasło
                                    </BkpkButton>
                                </div>
                            </form>
                        </BkpkCard>

                        <p className="text-sm text-bkpk-text-secondary">
                            Nie wiesz, co znaczy skrót?{' '}
                            <Link to="/slowniczek" className="text-bkpk-text-primary underline underline-offset-2 hover:text-bkpk-primary">Słowniczek statystyk</Link>
                        </p>
                    </div>

                </div>
            </PageContainer>
        </div>
    );
}
