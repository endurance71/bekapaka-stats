
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchJSON, postJSON } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import BkpkButton from '../shared/ui/BkpkButton';
import { Bot, Loader2 } from 'lucide-react';
import { DNASection } from '../components/scouting/DNASection';
import { MatchupRadar } from '../components/scouting/MatchupRadar';
import { PersonnelSection } from '../components/scouting/PersonnelSection';
import { AIAnalysisSection } from '../components/scouting/AIAnalysisSection';
import BkpkCard from '../shared/ui/BkpkCard';
import { ArrowLeft, Users, History, Trophy } from 'lucide-react';
import { cn } from '../shared/lib/utils';
import { motion } from 'framer-motion';

export default function ScoutingPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const loadScouting = async () => {
        setLoading(true);
        try {
            const opponent = searchParams.get('opponent');
            const res = await fetchJSON(`/api/scouting/detailed${opponent ? `?opponent=${encodeURIComponent(opponent)}` : ''}`);
            setData(res);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadScouting();
    }, [searchParams]);

    const handleGenerateScoutingAi = async () => {
        setAiLoading(true);
        try {
            const opponent = searchParams.get('opponent') || data?.teamInfo?.opponent?.name;
            await postJSON(`/api/scouting/analyze${opponent ? `?opponent=${encodeURIComponent(opponent)}` : ''}`, { force: true });
            await loadScouting();
        } catch (err: any) {
            alert(err?.message || 'Błąd generacji scoutingu AI');
        } finally {
            setAiLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bkpk-bg flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-bkpk-primary/20 border-t-bkpk-primary rounded-full animate-spin" />
                    <span className="text-bkpk-text-secondary font-bold tracking-widest uppercase text-sm">Ładowanie raportu...</span>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-bkpk-bg flex items-center justify-center">
                <div className="text-bkpk-text-secondary font-bold text-xl">Brak danych o rywalu.</div>
            </div>
        );
    }

    const { teamInfo, keyPlayers, form, aiAnalysis, advancedStats, bekapakaAdvancedStats } = data;
    const { opponent, bekapaka } = teamInfo;

    const parseWinPct = (record: string) => {
        if (!record) return 0;
        const [w, l] = record.split('-').map(Number);
        if (isNaN(w) || isNaN(l)) return 0;
        const total = w + l;
        return total > 0 ? Math.round((w / total) * 100) : 0;
    };

    const radarOpponent = {
        name: opponent.name,
        ppg: opponent.ppg,
        oppg: opponent.oppg,
        winPct: parseWinPct(opponent.record),
        pace: advancedStats?.pace || 0,
        threePtPct: advancedStats?.threePointAccuracy || 0
    };

    const radarBeKaPaKa = {
        name: bekapaka.name,
        ppg: bekapaka.ppg,
        oppg: bekapaka.oppg,
        winPct: parseWinPct(bekapaka.record),
        pace: bekapakaAdvancedStats?.pace || 0,
        threePtPct: bekapakaAdvancedStats?.threePointAccuracy || 0
    };

    return (
        <div className="min-h-screen bg-bkpk-bg text-bkpk-text-primary pb-32">
            {/* Header */}
            <div className="relative bg-gradient-to-b from-bkpk-navy-light/50 to-transparent pt-8 pb-12 px-4 md:px-8 border-b border-bkpk-border-strong">
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-bkpk-text-secondary hover:text-bkpk-text-primary transition-colors mb-8 group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold text-sm uppercase tracking-widest">Powrót do Pulpitu</span>
                    </button>

                    <div className="flex flex-row md:flex-row items-center justify-between md:justify-center gap-3 md:gap-24 relative">
                        {/* Background Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-bkpk-primary/5 blur-[120px] rounded-full pointer-events-none" />

                        {/* Team A */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex-1 flex flex-col items-center text-center relative z-10 min-w-0"
                        >
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-bkpk-primary/20 rounded-full blur opacity-40 group-hover:opacity-60 transition duration-1000"></div>
                                <div className="relative w-14 h-14 md:w-32 md:h-32 bg-bkpk-surface-tint-2 rounded-full flex items-center justify-center text-2xl md:text-5xl font-black text-bkpk-primary border border-bkpk-primary/30 shadow-[0_0_40px_rgba(255,107,53,0.15)] ring-4 md:ring-8 ring-bkpk-navy-light/30 shrink-0">
                                    {bekapaka.name.charAt(0)}
                                </div>
                            </div>
                            <h2 className="text-xs sm:text-lg md:text-4xl font-black font-outfit text-bkpk-text-primary mt-3 md:mt-6 tracking-tight truncate w-full px-1">{bekapaka.name}</h2>
                            <div className="flex flex-col sm:flex-row items-center gap-1 mt-1 md:mt-2">
                                <div className="px-2 py-0.5 md:px-3 md:py-1 bg-bkpk-surface-tint-4 border border-bkpk-border-strong rounded-full text-[9px] sm:text-xs font-bold text-bkpk-text-secondary">
                                    {bekapaka.record}
                                </div>
                                <span className="text-bkpk-text-muted text-[9px] sm:text-xs uppercase tracking-widest">{bekapaka.rank ? `${bekapaka.rank}. miejsce` : '-'}</span>
                            </div>
                        </motion.div>

                        {/* VS Section */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center relative py-2 md:py-0 shrink-0"
                        >
                            <div className="text-3xl md:text-8xl font-black font-outfit text-white/5 italic select-none absolute top-1/2 -translate-y-1/2" aria-hidden="true">
                                VS
                            </div>
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="hidden md:block w-12 h-1 bg-gradient-to-r from-transparent via-bkpk-primary to-transparent rounded-full mb-4 shadow-[0_0_10px_rgba(255,107,53,0.5)]" />
                                <div className="bg-bkpk-navy-light/80 backdrop-blur-md border border-bkpk-border-strong px-2.5 py-1 md:px-4 md:py-1.5 rounded-full text-[9px] sm:text-xs font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-bkpk-primary shadow-2xl">
                                    Scouting
                                </div>
                                <div className="hidden md:block w-12 h-1 bg-gradient-to-r from-transparent via-bkpk-primary to-transparent rounded-full mt-4 shadow-[0_0_10px_rgba(255,107,53,0.5)]" />
                            </div>
                        </motion.div>

                        {/* Team B */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex-1 flex flex-col items-center text-center relative z-10 min-w-0"
                        >
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-white/5 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                <div className="relative w-14 h-14 md:w-32 md:h-32 bg-bkpk-surface-tint-2 rounded-full flex items-center justify-center text-2xl md:text-5xl font-black text-bkpk-text-primary border border-bkpk-border-strong shadow-[0_0_40px_rgba(255,255,255,0.05)] ring-4 md:ring-8 ring-bkpk-navy-light/30 shrink-0">
                                    {opponent.name.charAt(0)}
                                </div>
                            </div>
                            <h2 className="text-xs sm:text-lg md:text-4xl font-black font-outfit text-bkpk-text-primary mt-3 md:mt-6 tracking-tight truncate w-full px-1">{opponent.name}</h2>
                            <div className="flex flex-col sm:flex-row items-center gap-1 mt-1 md:mt-2">
                                <div className="px-2 py-0.5 md:px-3 md:py-1 bg-bkpk-surface-tint-4 border border-bkpk-border-strong rounded-full text-[9px] sm:text-xs font-bold text-bkpk-text-secondary">
                                    {opponent.record}
                                </div>
                                <span className="text-bkpk-text-muted text-[9px] sm:text-xs uppercase tracking-widest">{opponent.rank ? `${opponent.rank}. miejsce` : '-'}</span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-8">

                {/* DNA Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <DNASection data={advancedStats} />
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* 1. Comparison Radar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-6"
                    >
                        <MatchupRadar opponent={radarOpponent} bekapaka={radarBeKaPaKa} />
                    </motion.div>

                    {/* 2. Personnel */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="lg:col-span-6"
                    >
                        <PersonnelSection data={advancedStats?.personnel} />
                    </motion.div>

                    {/* 4. AI Game Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="lg:col-span-12"
                    >
                        <div className="space-y-4">
                            {isAdmin && (
                                <div className="flex justify-end">
                                    <BkpkButton variant="primary" size="sm" onClick={handleGenerateScoutingAi} disabled={aiLoading}>
                                        {aiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bot className="w-4 h-4 mr-2" />}
                                        {data?.aiMeta?.fromGemini ? 'Odśwież raport AI' : 'Generuj raport AI (Gemini)'}
                                    </BkpkButton>
                                </div>
                            )}
                            <AIAnalysisSection data={aiAnalysis} />
                        </div>
                    </motion.div>

                    {/* 3. Key Players */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="lg:col-span-6"
                    >
                        <BkpkCard
                            title="Kluczowi Gracze Rywala"
                            icon={<Users className="w-5 h-5 text-bkpk-primary" />}
                            variant="glass"
                            className="h-full"
                            overflowVisible={true}
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                                    <thead>
                                        <tr className="text-[10px] sm:text-sm font-bold text-bkpk-text-muted uppercase tracking-widest border-b border-bkpk-border-strong">
                                            <th className="pb-3 pl-2">Zawodnik</th>
                                            <th className="pb-3 text-center hidden sm:table-cell">Mecze</th>
                                            <th className="pb-3 text-center">PPG</th>
                                            <th className="pb-3 text-center hidden sm:table-cell">3PT</th>
                                            <th className="pb-3 text-center">PTS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {keyPlayers.map((p: any, i: number) => (
                                            <tr key={i} className="border-b border-bkpk-border-strong last:border-0 hover:bg-bkpk-surface-tint-3 transition-colors">
                                                <td className="py-2 sm:py-3 pl-2 font-bold text-bkpk-text-primary">
                                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-bkpk-surface-tint-4 text-[9px] sm:text-caption text-bkpk-text-secondary mr-2">
                                                        {i + 1}
                                                    </span>
                                                    {p.name}
                                                </td>
                                                <td className="py-2 sm:py-3 text-center text-bkpk-text-secondary font-mono hidden sm:table-cell">{p.matches}</td>
                                                <td className="py-2 sm:py-3 text-center text-bkpk-primary font-black">{p.ppg.toFixed(1)}</td>
                                                <td className="py-2 sm:py-3 text-center text-bkpk-text-secondary font-mono hidden sm:table-cell">{p.threePointStats || '-'}</td>
                                                <td className="py-2 sm:py-3 text-center text-bkpk-text-secondary font-bold">{p.totalPoints}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </BkpkCard>
                    </motion.div>

                    {/* 4. Recent Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="lg:col-span-6"
                    >
                        <BkpkCard
                            title="Ostatnie Mecze Rywala"
                            icon={<History className="w-5 h-5 text-bkpk-primary" />}
                            variant="glass"
                            className="h-full"
                            overflowVisible={true}
                        >
                            <div className="space-y-3">
                                {form.map((m: any, i: number) => (
                                    <div key={i} className="bg-bkpk-surface-tint-2 border border-bkpk-border-strong rounded-xl p-3 flex items-center justify-between hover:bg-bkpk-surface-tint-4 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm border shadow-lg",
                                                m.result === 'W'
                                                    ? "bg-bkpk-success/20 border-bkpk-success/30 text-bkpk-success"
                                                    : "bg-bkpk-danger/20 border-bkpk-danger/30 text-bkpk-danger"
                                            )}>
                                                {m.result === 'W' ? 'Z' : 'P'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-caption-bold text-bkpk-text-muted uppercase tracking-widest mb-0.5">Przeciwnik</span>
                                                <span className="text-body-bold text-bkpk-text-primary group-hover:text-bkpk-primary transition-colors">vs {m.opponent}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-lg font-black text-bkpk-text-primary font-outfit tracking-tight">{m.score}</span>
                                            <span className="text-xs font-medium text-bkpk-text-muted">{m.date}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </BkpkCard>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
