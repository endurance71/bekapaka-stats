
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import BkpkCard from '../shared/ui/BkpkCard';
import BkpkButton from '../shared/ui/BkpkButton';
import { Lock, User } from 'lucide-react';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(username, password);
            navigate('/dashboard'); // Default redirect
        } catch (err) {
            setError('Błędny login lub hasło');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bkpk-bg p-4">
            <div className="w-full max-w-md">
                <BkpkCard className="p-8 space-y-8 relative overflow-hidden">
                    {/* Interior Card Glow */}
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
                            <div className="p-3 bg-red-500/10 border border-red-500 text-red-500 rounded-md text-sm text-center font-bold">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-bkpk-text-secondary uppercase">Nazwisko (Login)</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-bkpk-text-muted" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-bkpk-surface-tint-2 border border-bkpk-border-subtle rounded-bkpk-md py-2.5 pl-10 pr-4 text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary transition-colors"
                                    placeholder="np. kowalski"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-bkpk-text-secondary uppercase">Hasło</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-bkpk-text-muted" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-bkpk-surface-tint-2 border border-bkpk-border-subtle rounded-bkpk-md py-2.5 pl-10 pr-4 text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary transition-colors"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <BkpkButton
                            type="submit"
                            loading={loading}
                            className="w-full h-16 text-xl mt-6 shadow-[0_0_30px_rgba(255,107,53,0.3)] hover:shadow-[0_0_40px_rgba(255,107,53,0.5)] bg-bkpk-primary border-none text-bkpk-bg"
                            variant="primary"
                        >
                            Zaloguj się do systemu
                        </BkpkButton>
                    </form>

                    <div className="text-center text-xs text-bkpk-text-muted">
                        <p>Nie masz dostępu? Skontaktuj się z administratorem.</p>
                    </div>
                </BkpkCard>
                <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-bkpk-primary/5 blur-[120px] rounded-full pointer-events-none -mr-48 -mt-48" />
                <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-bkpk-success/5 blur-[120px] rounded-full pointer-events-none -ml-48 -mb-48" />
            </div>
        </div>
    );
}
