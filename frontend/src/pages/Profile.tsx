import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { resolvePlayerPhoto, getPositionLabel } from '../shared/lib/playerUtils';
import { compressImage } from '../shared/lib/imageCompression';
import PlayerCard from '../shared/ui/PlayerCard';
import BkpkCard from '../shared/ui/BkpkCard';
import BkpkButton from '../shared/ui/BkpkButton';
import { putJSON } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, User, Key, Lock, Image as ImageIcon, ExternalLink, RefreshCw } from 'lucide-react';

export default function Profile() {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    
    // Status states
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
    const [passwordLoading, setPasswordLoading] = useState(false);

    const [photoLoading, setPhotoLoading] = useState(false);
    const [photoError, setPhotoError] = useState<string | null>(null);

    if (!user) {
        return (
            <div className="min-h-screen bg-bkpk-bg flex items-center justify-center">
                <div className="text-bkpk-text-muted italic">Brak autoryzacji. Zaloguj się ponownie.</div>
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

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setPhotoLoading(true);
        setPhotoError(null);

        try {
            const compressed = await compressImage(file);
            await putJSON('/api/profile', { photo: compressed });
            await refreshUser();
        } catch (err: any) {
            setPhotoError(err.message || 'Wystąpił błąd podczas wgrywania zdjęcia.');
        } finally {
            setPhotoLoading(false);
        }
    };

    const handlePhotoRemove = async () => {
        if (!window.confirm('Czy na pewno chcesz usunąć swoje zdjęcie profilowe?')) return;

        setPhotoLoading(true);
        setPhotoError(null);

        try {
            await putJSON('/api/profile', { photo: null });
            await refreshUser();
        } catch (err: any) {
            setPhotoError(err.message || 'Wystąpił błąd podczas usuwania zdjęcia.');
        } finally {
            setPhotoLoading(false);
        }
    };

    const userPhoto = resolvePlayerPhoto(user);

    return (
        <div className="min-h-screen bg-bkpk-bg p-3 sm:p-4 md:p-8 lg:p-12">
            <div className="max-w-[1100px] mx-auto space-y-6 sm:space-y-12">
                
                {/* Header */}
                <header className="space-y-2">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 text-bkpk-primary font-bold uppercase tracking-[0.2em] text-[10px] sm:text-xs"
                    >
                        <User className="w-4 h-4" />
                        <span>Konto Zawodnika</span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl sm:text-3xl md:text-5xl font-black font-outfit text-bkpk-text-primary tracking-tight"
                    >
                        Mój Profil <span className="text-bkpk-primary">& Karta</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-bkpk-text-muted text-sm sm:text-lg"
                    >
                        Zarządzaj swoimi danymi logowania, wgraj zdjęcie do karty zawodnika oraz zobacz podgląd swojej karty.
                    </motion.p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column: Player Card Visualizer */}
                    <div className="lg:col-span-5 flex flex-col items-center gap-6">
                        <div className="w-full max-w-[320px]">
                            <h2 className="text-xs font-bold text-bkpk-text-muted uppercase tracking-widest mb-3 text-center lg:text-left">
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
                                isStarter={user.kalkPlayer?.rosterPlayer?.starter || false}
                                onClick={() => navigate(`/players/${user.id}`)}
                            />
                        </div>
                        
                        <BkpkButton
                            variant="ghost"
                            onClick={() => navigate(`/players/${user.id}`)}
                            className="w-full max-w-[320px] flex items-center justify-center gap-2 font-bold"
                        >
                            <span>Zobacz pełne statystyki</span>
                            <ExternalLink className="w-4 h-4" />
                        </BkpkButton>
                    </div>

                    {/* Right Column: Account Management Forms */}
                    <div className="lg:col-span-7 space-y-6">
                        
                        {/* Profile Settings (Avatar Upload) */}
                        <BkpkCard
                            title="Wizerunek na Karcie"
                            icon={<ImageIcon className="w-5 h-5 text-bkpk-primary" />}
                            className="space-y-4"
                        >
                            <p className="text-bkpk-text-secondary text-sm">
                                Twoje zdjęcie będzie wyświetlane na karcie 3D w składzie, na profilu statystyk oraz w nagłówkach systemu.
                            </p>

                            {photoError && (
                                <div className="p-3 text-xs bg-bkpk-danger/20 text-bkpk-danger rounded-xl border border-bkpk-danger/30">
                                    {photoError}
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-bkpk-surface-tint-2 rounded-2xl border border-bkpk-border-strong">
                                <div className="w-24 h-24 rounded-full border border-bkpk-border-strong bg-bkpk-bg overflow-hidden flex items-center justify-center shrink-0">
                                    <img src={userPhoto} className="w-full h-full object-cover" alt="Avatar" />
                                </div>
                                <div className="flex-1 flex flex-col gap-3 w-full sm:w-auto">
                                    <div className="flex gap-3">
                                        <label className="cursor-pointer flex-1 sm:flex-initial bg-bkpk-primary hover:bg-bkpk-primary-hover border border-bkpk-primary/30 text-white px-4 py-2.5 rounded-xl text-xs font-bold text-center select-none transition-all flex items-center justify-center gap-2 shadow-bkpk-glow disabled:opacity-50">
                                            {photoLoading ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <RefreshCw className="w-4 h-4" />
                                            )}
                                            Wgraj nowe zdjęcie
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                disabled={photoLoading}
                                                onChange={handlePhotoUpload}
                                            />
                                        </label>
                                        
                                        {(user.photo || user.data?.photo) && (
                                            <BkpkButton
                                                variant="destructive"
                                                type="button"
                                                disabled={photoLoading}
                                                onClick={handlePhotoRemove}
                                                className="text-xs"
                                            >
                                                Usuń
                                            </BkpkButton>
                                        )}
                                    </div>
                                    <p className="text-bkpk-text-muted text-[11px] leading-relaxed">
                                        Wgrywając zdjęcie, zostanie ono automatycznie wykadrowane i pomniejszone, aby ładowało się szybko na każdym urządzeniu. Akceptowane są pliki JPEG, PNG, WEBP.
                                    </p>
                                </div>
                            </div>
                        </BkpkCard>

                        {/* Change Password Form */}
                        <BkpkCard
                            title="Bezpieczeństwo Konta"
                            icon={<Key className="w-5 h-5 text-bkpk-primary" />}
                        >
                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-bkpk-surface-tint-2 rounded-xl border border-bkpk-border-strong text-xs text-bkpk-text-secondary">
                                    <ShieldCheck className="w-4 h-4 text-bkpk-success" />
                                    <span>Zalogowany jako: <strong className="text-bkpk-text-primary">@{user.username}</strong> ({getPositionLabel(user.position)} #{user.number || '--'})</span>
                                </div>

                                {passwordError && (
                                    <div className="p-3 text-xs bg-bkpk-danger/20 text-bkpk-danger rounded-xl border border-bkpk-danger/30">
                                        {passwordError}
                                    </div>
                                )}
                                {passwordSuccess && (
                                    <div className="p-3 text-xs bg-bkpk-success/20 text-bkpk-success rounded-xl border border-bkpk-success/30">
                                        {passwordSuccess}
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-bkpk-text-muted uppercase flex items-center gap-1">
                                        <Lock className="w-3.5 h-3.5" /> Aktualne hasło *
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-bkpk-surface border border-bkpk-border-subtle rounded-xl px-4 py-2.5 text-sm text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary/50"
                                        placeholder="Wpisz obecne hasło..."
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-bkpk-text-muted uppercase flex items-center gap-1">
                                            <Lock className="w-3.5 h-3.5 text-bkpk-primary" /> Nowe hasło *
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            className="w-full bg-bkpk-surface border border-bkpk-border-subtle rounded-xl px-4 py-2.5 text-sm text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary/50"
                                            placeholder="Min. 6 znaków..."
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-bkpk-text-muted uppercase flex items-center gap-1">
                                            <Lock className="w-3.5 h-3.5 text-bkpk-primary" /> Powtórz nowe hasło *
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            className="w-full bg-bkpk-surface border border-bkpk-border-subtle rounded-xl px-4 py-2.5 text-sm text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary/50"
                                            placeholder="Powtórz nowe hasło..."
                                            value={confirmNewPassword}
                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                        />
                                    </div>
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

            </div>
        </div>
    );
}
