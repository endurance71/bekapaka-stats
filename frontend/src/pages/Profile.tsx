import React, { useState, useEffect } from 'react';
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

export default function Profile() {
    const { user } = useAuth();
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
    const { selectedSeason } = useSeasonPreferenceContext();

    useEffect(() => {
        if (!user?.id) return;
        const fetchAiData = async () => {
            try {
                const playerRow = await fetchJSON<any>(`/api/players/${user.id}`);
                setAiSummary(playerRow?.aiDevelopmentSummary || null);
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
            await putJSON('/api/profile/password', {
                currentPassword,
                newPassword
            });
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
                    kicker="Konto Zawodnika"
                    title={<>Mój Profil <span className="text-bkpk-primary">& Karta</span></>}
                    description="Zarządzaj kontem i zobacz podgląd karty. Sezon wybierasz w menu nawigacji."
                />

                <AiAnalysisBlock
                    title="Twój plan rozwoju (AI)"
                    content={aiSummary}
                    generatedAt={aiMeta.at}
                    model={aiMeta.model}
                    loading={aiLoading}
                    emptyHint="Twój plan rozwoju nie został jeszcze wygenerowany przez trenera."
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column: Player Card Visualizer */}
                    <div className="lg:col-span-5 flex flex-col items-center gap-6">
                        <div className="w-full max-w-[320px]">
                            <h2 className="kicker text-bkpk-text-primary mb-4 w-full justify-center lg:justify-start">
                                Moja Karta Zawodnika
                            </h2>
                            <PlayerCard
                                id={user.id}
                                firstName={user.firstName}
                                lastName={user.lastName}
                                number={user.number || 0}
                                position={user.position}
                                photoUrl={userPhoto}
                                ppg={user.ppg}
                                rpg={user.rpg}
                                apg={user.apg}
                                isStarter={(user.kalkPlayer?.rosterPlayer as { starter?: boolean } | undefined)?.starter || false}
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
                            title="Bezpieczeństwo Konta"
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

                    </div>

                </div>
            </PageContainer>
        </div>
    );
}
