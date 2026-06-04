
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BkpkCard from '../shared/ui/BkpkCard';
import BkpkButton from '../shared/ui/BkpkButton';
import { Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { AppFooter } from '../components/AppFooter';

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
            navigate(redirect && redirect.startsWith('/') ? redirect : '/dashboard');
        } catch {
            setError('Błędny login lub hasło');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-bkpk-bg px-4 pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
            <div className="w-full max-w-sm mx-auto">
                <BkpkCard className="p-8 space-y-8 relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-bkpk-primary/10 blur-3xl rounded-full" />

                    <div className="text-center space-y-4 relative z-10">
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-32 h-32 rounded-3xl bg-bkpk-surface flex items-center justify-center shadow-2xl border border-bkpk-border-strong overflow-hidden p-4 relative group">
                                <div className="absolute inset-0 bg-bkpk-primary/5 group-hover:bg-bkpk-primary/10 transition-colors" />
                                <img src="/logo.png" alt="BK Logo" className="w-full h-full object-contain relative z-10" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black font-outfit tracking-tighter text-bkpk-text-primary">
                                    BeKaPaKa <span className="text-bkpk-primary">STATS</span>
                                </h1>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <motion.div
                                role="alert"
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 bg-bkpk-danger/10 border border-bkpk-danger text-bkpk-text-danger rounded-md text-sm text-center font-bold"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div className="space-y-1">
                            <label htmlFor="login-username" className="text-xs font-bold text-bkpk-text-secondary uppercase">Nazwisko (Login)</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-bkpk-text-muted pointer-events-none" />
                                <input
                                    id="login-username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-bkpk-surface-tint-2 border border-bkpk-border-subtle rounded-bkpk-md py-2.5 pl-10 pr-4 text-base text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary transition-colors touch-manipulation"
                                    placeholder="np. kowalski"
                                    required
                                    autoComplete="username"
                                    inputMode="text"
                                    enterKeyHint="next"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="login-password" className="text-xs font-bold text-bkpk-text-secondary uppercase">Hasło</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-bkpk-text-muted pointer-events-none" />
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-bkpk-surface-tint-2 border border-bkpk-border-subtle rounded-bkpk-md py-2.5 pl-10 pr-12 text-base text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary transition-colors touch-manipulation"
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                    enterKeyHint="done"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 text-bkpk-text-muted hover:text-bkpk-primary transition-colors flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] touch-manipulation"
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
                            className="w-full h-12 text-lg mt-6 touch-manipulation"
                            variant="primary"
                            size="lg"
                        >
                            {loading ? (
                                <span className="inline-flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
                                    Logowanie…
                                </span>
                            ) : (
                                'Zaloguj się do systemu'
                            )}
                        </BkpkButton>
                    </form>

                    <div className="text-center text-xs text-bkpk-text-muted">
                        <p>Nie masz dostępu? Skontaktuj się z administratorem.</p>
                    </div>
                </BkpkCard>
                <AppFooter className="mt-6" />
            </div>
        </div>
    );
}
