
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BkpkButton from '../shared/ui/BkpkButton';
import { Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { AppFooter } from '../components/AppFooter';
import { BrandMark } from '../shared/ui/BrandMark';
import { JerseyStripes } from '../shared/ui/JerseyStripes';
import herbUrl from '../assets/brand/herb2-kolor.svg';
import arenaUrl from '../assets/brand/arena.webp';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setError('');
        setLoading(true);

        try {
            await login(username, password);
            const redirect = searchParams.get('redirect');
            navigate(redirect && redirect.startsWith('/') && !redirect.startsWith('/login') ? redirect : '/dashboard');
        } catch {
            setError('Błędny login lub hasło');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] grid lg:grid-cols-[minmax(0,7fr)_minmax(420px,5fr)] bg-bkpk-bg">
            {/* Płyta z herbem — tożsamość klubu (jak hero bekapaka.pl) */}
            <section className="relative hidden lg:flex flex-col justify-between overflow-hidden border-r border-bkpk-border-subtle p-12 xl:p-16">
                <img src={arenaUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" aria-hidden />
                <div className="absolute inset-0 bg-gradient-to-t from-bkpk-bg via-bkpk-bg/80 to-bkpk-bg/40" aria-hidden />
                <div className="relative">
                    <BrandMark label="Panel klubu" />
                </div>
                <div className="relative flex items-end gap-10">
                    <img src={herbUrl} alt="" className="w-40 xl:w-48 h-auto shrink-0" aria-hidden />
                    <div className="space-y-4 min-w-0">
                        <span className="kicker">Statystyki · Scouting · Taktyka</span>
                        <p className="font-display uppercase text-[72px] xl:text-[96px] leading-[0.9] text-bkpk-text-primary">
                            Centrum<br />drużyny
                        </p>
                    </div>
                </div>
                <JerseyStripes className="relative max-w-[320px]" />
            </section>

            {/* Formularz */}
            <section className="flex items-center justify-center px-4 sm:px-8 pt-[max(1.5rem,env(safe-area-inset-top,0px))] pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]">
                <div className="w-full max-w-sm mx-auto space-y-8">
                    <div className="space-y-5">
                        <img src={herbUrl} alt="" className="lg:hidden w-24 h-auto" aria-hidden />
                        <span className="kicker">Panel klubu</span>
                        <h1 className="text-[48px] leading-[0.95] text-bkpk-text-primary">
                            BeKaPaKa <span className="text-bkpk-primary">Stats</span>
                        </h1>
                        <div className="space-y-1">
                            <p className="text-base text-bkpk-text-secondary">
                                Panel statystyk dla członków BeKaPaKa Bobolice
                            </p>
                            <p className="text-sm text-bkpk-text-muted">
                                Dostęp tylko dla zaproszonych użytkowników klubu
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <motion.div
                                role="alert"
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 pl-4 bg-bkpk-surface border-l-4 border-bkpk-danger text-bkpk-text-danger text-sm font-semibold"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="login-username" className="label-caps text-xs text-bkpk-text-secondary">Nazwisko (Login)</label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-bkpk-text-muted pointer-events-none" />
                                <input
                                    id="login-username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-bkpk-bg border border-bkpk-border-strong py-3 pl-11 text-base text-bkpk-text-primary placeholder:text-bkpk-text-disabled hover:border-bkpk-text-muted focus:border-bkpk-text-primary transition-colors touch-manipulation min-h-[48px] pr-4"
                                    placeholder="np. kowalski"
                                    required
                                    autoComplete="username"
                                    inputMode="text"
                                    enterKeyHint="next"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="login-password" className="label-caps text-xs text-bkpk-text-secondary">Hasło</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-bkpk-text-muted pointer-events-none" />
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-bkpk-bg border border-bkpk-border-strong py-3 pl-11 text-base text-bkpk-text-primary placeholder:text-bkpk-text-disabled hover:border-bkpk-text-muted focus:border-bkpk-text-primary transition-colors touch-manipulation min-h-[48px] pr-12"
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                    enterKeyHint="done"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-0.5 top-1/2 -translate-y-1/2 text-bkpk-text-muted hover:text-bkpk-text-primary transition-colors flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] touch-manipulation"
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <BkpkButton
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 touch-manipulation"
                            variant="primary"
                            size="lg"
                        >
                            {loading ? (
                                <span className="inline-flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
                                    Logowanie…
                                </span>
                            ) : (
                                'Zaloguj się do panelu'
                            )}
                        </BkpkButton>
                    </form>

                    <div className="space-y-3 border-t border-bkpk-border-subtle pt-6 text-sm">
                        <p className="text-bkpk-text-muted">Nie masz dostępu? Skontaktuj się z administratorem.</p>
                        <a
                            href="https://bekapaka.pl"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-[44px] items-center label-caps text-xs text-bkpk-text-primary underline decoration-bkpk-primary decoration-2 underline-offset-[6px] hover:decoration-current"
                        >
                            Oficjalna strona klubu: bekapaka.pl
                        </a>
                    </div>

                    <AppFooter className="pt-2" />
                </div>
            </section>
        </div>
    );
}
