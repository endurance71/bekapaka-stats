import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchJSON, postJSON } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import AiAnalysisBlock from '../components/ai/AiAnalysisBlock';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import { ChevronLeft, Star, TrendingUp, BarChart2, Calendar, Target } from 'lucide-react';
import { cn } from '../shared/lib/utils';
import BkpkCard from '../shared/ui/BkpkCard';
import BoxScoreModern from '../features/games/BoxScoreModern';
import KalkEmptyState from '../shared/ui/KalkEmptyState';
import useIsMobile from '../hooks/useIsMobile';

interface StatSnapshot {
    gameId: string;
    date: string;
    opponent: string;
    pts: number;
    reb: number;
    ast: number;
    stl: number;
    blk: number;
    tov: number;
    pf: number;
    min: string;
    fgm: number;
    fga: number;
    three_pm: number;
    three_pa: number;
    ftm: number;
    fta: number;
    efg: number;
    ts: number;
    plusMinus: number;
}

interface PlayerStats {
    player: {
        id: string;
        firstName: string;
        lastName: string;
        number: number;
        position: string;
        kalkPlayer?: {
            raw?: {
                photo_url?: string | null;
            };
        };
    };
    averages: {
        ppg: number;
        rpg: number;
        apg: number;
        efg: number;
        ts: number;
        plusMinusAvg: number;
        gamesPlayed: number;
    };
    gameLog: StatSnapshot[];
}

export default function PlayerProfile() {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<PlayerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [aiMeta, setAiMeta] = useState<{ at?: string; model?: string }>({});
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const isMobile = useIsMobile();

    const fetchStats = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [stats, playerRow] = await Promise.all([
                fetchJSON<PlayerStats>(`/api/players/${id}/stats?t=${Date.now()}`),
                fetchJSON<any>(`/api/players/${id}`)
            ]);
            setData(stats);
            setAiSummary(playerRow?.aiDevelopmentSummary || null);
            setAiMeta({
                at: playerRow?.aiDevelopmentAt,
                model: playerRow?.aiDevelopmentModel
            });
        } catch (error) {
            console.error('Error fetching player stats:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const handleGenerateAi = async (force = false) => {
        if (!id) return;
        setAiLoading(true);
        try {
            const result = await postJSON<{
                aiDevelopmentSummary: string;
                aiDevelopmentAt: string;
            }>(`/api/players/${id}/analyze`, { force });
            setAiSummary(result.aiDevelopmentSummary);
            setAiMeta({ at: result.aiDevelopmentAt });
        } catch (error: any) {
            alert(error?.message || 'Nie udało się wygenerować planu rozwoju');
        } finally {
            setAiLoading(false);
        }
    };

    const trendData = useMemo(() => {
        if (!data?.gameLog) return [];
        return [...data.gameLog].reverse().map(g => ({
            ...g,
            formattedDate: new Date(g.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        }));
    }, [data]);

    if (loading) {
        return (
            <div className="min-h-screen bg-bkpk-bg flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-bkpk-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-bkpk-text-muted font-bold uppercase tracking-widest text-xs">Analizowanie Profilu...</p>
                </div>
            </div>
        );
    }

    if (!data) return <div className="p-20 text-center text-bkpk-text-muted italic">Player not found.</div>;

    const { player, averages, gameLog } = data;
    const normalize = (str: string) => str.toLowerCase()
        .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
        .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
        .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
        .replace(/\s+/g, '-')
    const fallbackPhoto = `/photos/${normalize(player.firstName)}-${normalize(player.lastName)}.png`
    const remotePhoto = player.kalkPlayer?.raw?.photo_url || null
    const playerPhoto = remotePhoto && !remotePhoto.toLowerCase().includes('empty.jpg')
        ? remotePhoto
        : fallbackPhoto

    return (
        <div className="min-h-screen bg-bkpk-bg p-4 md:p-8 lg:p-12">
            <div className="max-w-[1400px] mx-auto space-y-12">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <Link to="/roster" className="group flex items-center gap-2 text-bkpk-text-muted hover:text-bkpk-text-primary transition-colors">
                        <div className="w-8 h-8 rounded-full bg-bkpk-surface-tint-2 flex items-center justify-center group-hover:bg-bkpk-surface-tint-4 transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </div>
                        <span className="font-bold uppercase tracking-wider text-xs">Powrót do Składu</span>
                    </Link>

                    <div className="flex items-center gap-4 bg-bkpk-surface-tint-2 px-4 py-2 rounded-full border border-bkpk-border-strong">
                        <div className="w-2 h-2 bg-bkpk-success rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-bkpk-text-secondary uppercase tracking-widest">Aktywny Profil Zawodnika</span>
                    </div>
                </div>

                {/* Immersive Profile Hero */}
                <section className="relative overflow-hidden rounded-bkpk-lg bg-bkpk-glass border border-bkpk-glass-border shadow-bkpk-glow p-8 md:p-12">
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                        {/* Player Number & Photo Avatar */}
                        <div className="relative">
                            <div className="text-8xl md:text-9xl font-black font-outfit text-white/5 absolute -top-8 -left-8 pointer-events-none">
                                {player.number}
                            </div>
                            <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-bkpk-primary/20 to-transparent p-1 border border-bkpk-border-strong relative">
                                <img
                                    src={playerPhoto}
                                    onError={(e) => (e.currentTarget.src = '/photos/default.png')}
                                    className="w-full h-full object-cover rounded-full grayscale hover:grayscale-0 transition-all duration-700"
                                    alt=""
                                />
                                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-bkpk-bg border border-bkpk-border-strong rounded-2xl flex items-center justify-center shadow-2xl">
                                    <span className="text-xl font-black font-outfit text-bkpk-primary">#{player.number}</span>
                                </div>
                            </div>
                        </div>

                        {/* Player Meta */}
                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div>
                                <h1 className="text-4xl md:text-6xl font-black font-outfit text-bkpk-text-primary tracking-tight uppercase">
                                    <span className="text-bkpk-primary block text-xl mb-1">{player.firstName}</span>
                                    {player.lastName}
                                </h1>
                                <p className="text-bkpk-text-muted font-medium flex flex-wrap items-center justify-center md:justify-start gap-y-2 gap-x-4 md:gap-4 mt-2">
                                    <span className="flex items-center gap-1.5"><Target className="w-4 h-4" /> {
                                        player.position === 'G' ? 'Obrońca' :
                                            player.position === 'F' ? 'Skrzydłowy' :
                                                player.position === 'C' ? 'Środkowy' :
                                                    player.position === 'PG' ? 'Rozgrywający' :
                                                        player.position === 'SG' ? 'Rzucający Obrońca' :
                                                            player.position === 'SF' ? 'Niski Skrzydłowy' :
                                                                player.position === 'PF' ? 'Silny Skrzydłowy' : player.position
                                    }</span>
                                    <span className="hidden md:inline-block w-1 h-1 bg-bkpk-surface-tint-6 rounded-full" />
                                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Sezon 2025/26</span>
                                    <span className="hidden md:inline-block w-1 h-1 bg-bkpk-surface-tint-6 rounded-full" />
                                    <span className="flex items-center gap-1.5 text-bkpk-success"><Star className="w-4 h-4" /> {averages.gamesPlayed} meczy</span>
                                </p>
                            </div>

                            {/* Key Stats Bar */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-2xl">
                                {[
                                    { label: 'PPG', value: averages.ppg.toFixed(1), color: 'text-bkpk-primary' },
                                    { label: 'RPG', value: averages.rpg.toFixed(1), color: 'text-bkpk-text-primary' },
                                    { label: 'APG', value: averages.apg.toFixed(1), color: 'text-bkpk-text-primary' },
                                    { label: 'EVAL', value: (averages.efg * 100).toFixed(0), color: 'text-bkpk-warning' },
                                ].map((s, idx) => (
                                    <div key={idx} className="bg-bkpk-surface-tint-2 border border-bkpk-border-strong p-4 rounded-2xl text-center">
                                        <div className="text-xs font-bold text-bkpk-text-muted uppercase tracking-widest">{s.label}</div>
                                        <div className={cn("text-2xl font-black font-outfit mt-1", s.color)}>{s.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-bkpk-primary/5 to-transparent pointer-events-none" />
                </section>

                <AiAnalysisBlock
                    title="Plan rozwoju (AI)"
                    content={aiSummary}
                    generatedAt={aiMeta.at}
                    model={aiMeta.model}
                    isAdmin={isAdmin}
                    loading={aiLoading}
                    onGenerate={handleGenerateAi}
                    emptyHint="Brak planu rozwoju AI. Administrator może go wygenerować (min. 3 mecze w bazie)."
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Charts Area */}
                    <div className="lg:col-span-8 space-y-8">
                        <BkpkCard variant="glass" className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-bkpk-primary" />
                                    <h3 className="text-xl font-bold text-bkpk-text-primary font-outfit">Trend Formy</h3>
                                </div>
                                <div className="px-3 py-1 bg-bkpk-primary/10 border border-bkpk-primary/20 rounded-lg text-xs font-bold text-bkpk-primary uppercase">
                                    Punkty na Mecz
                                </div>
                            </div>

                            {averages.gamesPlayed === 0 ? (
                                <div className="py-20">
                                    <KalkEmptyState
                                        title="Brak statystyk meczowych"
                                        message="Ten zawodnik nie ma jeszcze zarejestrowanych występów w obecnym sezonie KALK."
                                        className="bg-transparent border-none p-0"
                                    />
                                </div>
                            ) : (
                                <div className="w-full" style={{ height: isMobile ? '200px' : '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={trendData}>
                                            <defs>
                                                <linearGradient id="colorPts" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--color-bkpk-primary)" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="var(--color-bkpk-primary)" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--bkpk-surface-tint-2)" />
                                        <XAxis
                                            dataKey="formattedDate"
                                            stroke="var(--bkpk-text-muted)"
                                            fontSize={9}
                                            tickLine={false}
                                            axisLine={false}
                                            dy={10}
                                            interval={isMobile ? Math.ceil(trendData.length / 4) : 0}
                                        />
                                        <YAxis
                                            stroke="var(--bkpk-text-muted)"
                                            fontSize={9}
                                            tickLine={false}
                                            axisLine={false}
                                            dx={-10}
                                            width={isMobile ? 20 : 35}
                                        />
                                            <Tooltip
                                                trigger={isMobile ? 'click' : 'hover'}
                                                contentStyle={{
                                                    backgroundColor: 'var(--bkpk-color-surface-elevated)',
                                                    border: '1px solid var(--bkpk-border-strong)',
                                                    borderRadius: '12px',
                                                    backdropFilter: 'blur(10px)',
                                                    fontSize: '12px'
                                                }}
                                                itemStyle={{ color: 'var(--bkpk-text-primary)', fontWeight: 'bold' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="pts"
                                                stroke="var(--color-bkpk-primary)"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorPts)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </BkpkCard>

                        {/* Advanced Box Score (Game Log) */}
                        <section className="space-y-4">
                            <BoxScoreModern
                                playerStats={gameLog.map(g => {
                                    // Calculate EVAL if not provided directly
                                    const evalVal = (g.pts + g.reb + g.ast + g.stl + g.blk) - ((g.fga - g.fgm) + (g.fta - g.ftm) + g.tov);
                                    return {
                                        name: g.opponent,
                                        eval: evalVal,
                                        points: g.pts,
                                        rebounds: g.reb,
                                        assists: g.ast,
                                        steals: g.stl,
                                        blocks: g.blk,
                                        turnovers: g.tov,
                                        plusMinus: g.plusMinus,
                                        minutes: g.min,
                                        fg: `${g.fgm}/${g.fga}`,
                                        threeP: `${g.three_pm}/${g.three_pa}`,
                                        ft: `${g.ftm}/${g.fta}`
                                    };
                                })}
                            />
                        </section>
                    </div>

                    {/* Sidebar / Detailed Averages */}
                    <div className="lg:col-span-4 space-y-8">
                        <BkpkCard variant="glass" className="space-y-6">
                            <h3 className="text-lg font-bold text-bkpk-text-primary font-outfit">Efektywność Sezonowa</h3>
                            <div className="space-y-6">
                                {[
                                    { label: 'eFG%', value: (averages.efg * 100).toFixed(1) + '%', progress: averages.efg * 100 },
                                    { label: 'TS%', value: (averages.ts * 100).toFixed(1) + '%', progress: averages.ts * 100 },
                                    { label: 'Plus/Minus Avg', value: averages.plusMinusAvg > 0 ? `+${averages.plusMinusAvg.toFixed(1)}` : averages.plusMinusAvg.toFixed(1), progress: Math.max(0, averages.plusMinusAvg + 10) * 5 },
                                ].map((stat, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs font-bold text-bkpk-text-muted uppercase tracking-widest">{stat.label}</span>
                                            <span className="text-sm font-bold text-bkpk-text-primary">{stat.value}</span>
                                        </div>
                                        <div className="h-1.5 bg-bkpk-surface-tint-2 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(100, stat.progress)}%` }}
                                                transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                                                className={cn(
                                                    "h-full rounded-full",
                                                    stat.label.includes('Plus') ? (averages.plusMinusAvg >= 0 ? "bg-bkpk-success" : "bg-bkpk-danger") : "bg-bkpk-primary"
                                                )}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </BkpkCard>

                        {/* Recent Achievements / Milestones */}
                        <BkpkCard variant="glass" className="border-bkpk-warning/20">
                            <div className="flex items-center gap-2 mb-4 text-bkpk-warning">
                                <Star className="w-5 h-5 fill-current" />
                                <h3 className="text-lg font-bold text-bkpk-text-primary font-outfit">Najlepsze Występy</h3>
                            </div>
                            <div className="space-y-4">
                                {gameLog.sort((a, b) => b.pts - a.pts).slice(0, 3).map((g, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-bkpk-surface-tint-2 rounded-xl border border-bkpk-border-strong">
                                        <div>
                                            <div className="text-xs font-bold text-bkpk-text-primary">{g.opponent}</div>
                                            <div className="text-xs text-bkpk-text-muted">{new Date(g.date).toLocaleDateString()}</div>
                                        </div>
                                        <div className="text-lg font-black font-outfit text-bkpk-warning">
                                            {g.pts} PTS
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </BkpkCard>
                    </div>
                </div>
            </div>
        </div >
    );
}
