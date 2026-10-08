import { useEffect, useState, useCallback, useMemo } from 'react';
import { formatStatFixed } from '../shared/lib/formatStat';
import { useParams, Link } from 'react-router-dom';
import { fetchJSON, postJSON } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import AiAnalysisBlock from '../components/ai/AiAnalysisBlock';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import { ChevronLeft, TrendingUp, BarChart2, Target } from 'lucide-react';
import { MvpIcon as Star, CalendarIcon as Calendar } from '../shared/ui/BrandIcon';
import { cn } from '../shared/lib/utils';
import BkpkCard from '../shared/ui/BkpkCard';
import PageContainer from '../shared/ui/PageContainer';
import PageLoader from '../shared/ui/PageLoader';
import JerseyStripes from '../shared/ui/JerseyStripes';
import {
    chartAxisProps,
    chartColors,
    chartGridProps,
    chartTooltipItemStyle,
    chartTooltipLabelStyle,
    chartTooltipStyle,
} from '../shared/lib/chartTheme';
import BoxScoreModern from '../features/games/BoxScoreModern';
import KalkEmptyState from '../shared/ui/KalkEmptyState';
import { useSeasonPreferenceContext } from '../context/SeasonPreferenceContext';
import useIsMobile from '../hooks/useIsMobile';
import { getPositionLabel } from '../shared/lib/playerUtils';
import PlayerCareer, { type PlayerCareerResponse } from '../components/players/PlayerCareer';
import PlayerAvatar from '../shared/ui/PlayerAvatar';
import { normalizePlayerIdentity } from '../shared/lib/playerIdentity';
import { pluralPl } from '../shared/lib/plural';
import BkpkTooltip from '../shared/ui/BkpkTooltip';

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
    /** false = KALK nie podał +/- w tym meczu */
    plusMinusAvailable?: boolean;
    /** EVAL z KALK (null w starych danych) */
    eval?: number | null;
}

interface PlayerStats {
    season?: {
        id: string;
        slug: string;
        label: string;
        isActive: boolean;
    } | null;
    leagueKalk?: {
        pointsAverage?: number | null;
        pointsTotal?: number | null;
        matchesPlayed?: number | null;
        eval?: number | null;
    } | null;
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
        plusMinusAvg: number | null;
        /** Średni EVAL z KALK */
        evalAvg?: number | null;
        gamesPlayed: number;
        minutesPlayed?: number;
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
    const [career, setCareer] = useState<PlayerCareerResponse | null>(null);
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const isMobile = useIsMobile();
    const { seasonId, selectedSeason } = useSeasonPreferenceContext();

    const fetchStats = useCallback(async () => {
        if (!id) return;
        if (!seasonId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const statsQ = new URLSearchParams({ t: String(Date.now()), seasonId });
            const [stats, playerRow] = await Promise.all([
                fetchJSON<PlayerStats>(`/api/players/${id}/stats?${statsQ.toString()}`),
                fetchJSON<any>(`/api/players/${id}`)
            ]);
            setData(stats ? { ...stats, player: normalizePlayerIdentity(stats.player) } : stats);
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
    }, [id, seasonId]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Kariera KALK (wszystkie sezony od 2023/24) — niezależna od wybranego sezonu; błąd nie blokuje profilu.
    useEffect(() => {
        if (!id) return;
        let active = true;
        setCareer(null);
        fetchJSON<PlayerCareerResponse>(`/api/players/${encodeURIComponent(id)}/career`)
            .then((data) => {
                if (active) setCareer(data);
            })
            .catch((error) => console.error('Error fetching player career:', error));
        return () => {
            active = false;
        };
    }, [id]);

    const handleGenerateAi = async (force = false) => {
        if (!id) return;
        setAiLoading(true);
        try {
            const result = await postJSON<{
                aiDevelopmentSummary: string;
                aiDevelopmentAt: string;
                model?: string;
            }>(`/api/players/${id}/analyze`, { force });
            setAiSummary(result.aiDevelopmentSummary);
            setAiMeta({ at: result.aiDevelopmentAt, model: result.model });
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
            formattedDate: new Date(g.date).toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' })
        }));
    }, [data]);

    if (loading) {
        return <PageLoader fullScreen label="Analizowanie Profilu..." />;
    }

    if (!data) return <div className="p-20 text-center label-caps text-sm text-bkpk-text-muted">Nie znaleziono zawodnika.</div>;

    const { player, averages, gameLog } = data;

    return (
        <div className="bg-bkpk-bg">
            <PageContainer>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
                    <Link to="/druzyna" className="group inline-flex items-center gap-3 min-h-[44px] text-bkpk-text-secondary hover:text-bkpk-text-primary transition-colors">
                        <div className="w-8 h-8 border border-bkpk-border-strong flex items-center justify-center group-hover:border-bkpk-text-primary transition-colors">
                            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <span className="label-caps text-xs">Powrót do składu</span>
                    </Link>

                    {selectedSeason && !selectedSeason.isActive ? (
                        <span className="status-flag text-bkpk-text-secondary">
                            Archiwum sezonu
                        </span>
                    ) : null}
                </div>

                {/* Profile Hero — jak profil zawodnika na bekapaka.pl: numer konturem, nazwisko Condensed, średnie pod linią */}
                <section className="relative overflow-hidden bg-bkpk-surface border border-bkpk-border-subtle p-5 sm:p-8 md:p-12 pb-10 sm:pb-12 md:pb-16">
                    {/* Numer konturem w tle */}
                    <div
                        className="hidden sm:block absolute -top-4 right-4 md:right-10 font-display font-extrabold leading-none tabular-nums text-[160px] md:text-[240px] outline-text text-bkpk-primary opacity-60 pointer-events-none select-none"
                        aria-hidden="true"
                    >
                        {player.number}
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-12">
                        {/* Player Photo */}
                        <div className="relative shrink-0">
                            <div className="w-32 h-40 md:w-48 md:h-60 bg-bkpk-bg border border-bkpk-border-strong relative overflow-hidden">
                                <PlayerAvatar player={player} className="w-full h-full" />
                                <div className="absolute bottom-0 right-0 min-w-9 h-9 md:min-w-12 md:h-12 px-1.5 bg-bkpk-primary flex items-center justify-center">
                                    <span className="text-lg md:text-2xl leading-none font-display font-extrabold tabular-nums text-bkpk-text-primary">#{player.number}</span>
                                </div>
                            </div>
                        </div>

                        {/* Player Meta */}
                        <div className="flex-1 text-center md:text-left space-y-5 w-full min-w-0">
                            <div>
                                <span className="kicker text-bkpk-text-primary mb-3">
                                    {getPositionLabel(player.position)}
                                </span>
                                <h1 className="grid gap-1 text-bkpk-text-primary">
                                    <span className="font-text font-semibold normal-case tracking-normal text-lg sm:text-2xl text-bkpk-text-secondary">{player.firstName}</span>
                                    <span className="text-[44px] sm:text-[64px] md:text-[88px] leading-[0.92] break-words">{player.lastName}</span>
                                </h1>
                                <p className="label-caps text-xs text-bkpk-text-secondary flex flex-wrap items-center justify-center md:justify-start gap-y-1.5 gap-x-3 md:gap-4 mt-4">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                                        {selectedSeason?.label ?? 'Sezon'}
                                    </span>
                                    <span className="hidden md:inline-block w-1 h-1 bg-bkpk-border-strong" aria-hidden="true" />
                                    <span className="flex items-center gap-1.5 text-bkpk-text-primary tabular-nums">
                                        <Star className="w-3.5 h-3.5" aria-hidden="true" /> {averages.gamesPlayed} {pluralPl(averages.gamesPlayed ?? 0, 'mecz', 'mecze', 'meczów')}
                                        <span className="text-bkpk-text-muted">•</span>
                                        {(averages.minutesPlayed ?? 0)} min
                                    </span>
                                </p>
                            </div>

                            {/* Key Stats Bar */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 max-w-2xl w-full border-t-2 border-bkpk-text-primary">
                                {[
                                    { label: 'Pkt/m', value: formatStatFixed(averages.ppg, 1), color: 'text-bkpk-text-primary' },
                                    { label: 'Zb/m', value: formatStatFixed(averages.rpg, 1), color: 'text-bkpk-text-primary' },
                                    { label: 'As/m', value: formatStatFixed(averages.apg, 1), color: 'text-bkpk-text-primary' },
                                    { label: 'Eval', value: formatStatFixed(averages.evalAvg ?? data.leagueKalk?.eval ?? null, 1), color: 'text-bkpk-text-primary' },
                                ].map((s, idx) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "pt-4 pb-1 px-3 text-left",
                                            idx % 2 === 1 && "border-l border-bkpk-border-subtle",
                                            idx >= 2 && "mt-3 lg:mt-0 border-t lg:border-t-0 lg:border-l border-bkpk-border-subtle"
                                        )}
                                    >
                                        <div className="label-caps text-[11px] text-bkpk-text-muted">{s.label}</div>
                                        <div className={cn("text-4xl sm:text-5xl leading-[0.9] font-display font-extrabold tabular-nums mt-2", s.color)}>{s.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <JerseyStripes className="absolute inset-x-0 bottom-0" />
                </section>

                {(isAdmin || user?.id === id) && (
                    <AiAnalysisBlock
                        title="Plan rozwoju (AI)"
                        content={aiSummary}
                        generatedAt={aiMeta.at}
                        model={aiMeta.model}
                        canGenerate={isAdmin}
                        loading={aiLoading}
                        onGenerate={handleGenerateAi}
                        emptyHint="Brak planu rozwoju — użyj „Generuj” (potrzebne min. 3 mecze)."
                        playerEmptyHint="Plan rozwoju pojawi się, gdy trener go przygotuje (po 3 meczach)."
                    />
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Charts Area */}
                    <div className="lg:col-span-8 space-y-8">
                        <BkpkCard variant="glass" className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-9 h-9 border border-bkpk-border-strong shrink-0">
                                        <TrendingUp className="w-5 h-5 text-bkpk-primary" aria-hidden="true" />
                                    </div>
                                    <h3 className="text-[22px] sm:text-[24px] text-bkpk-text-primary">Trend Formy</h3>
                                </div>
                                <div className="status-flag text-bkpk-text-secondary">
                                    Punkty na Mecz
                                </div>
                            </div>

                            {averages.gamesPlayed === 0 ? (
                                <div className="py-20">
                                    <KalkEmptyState
                                        title="Brak statystyk meczowych"
                                        message={
                                            selectedSeason
                                                ? `Brak występów w sezonie ${selectedSeason.label}. Wybierz inny sezon w menu.`
                                                : 'Ten zawodnik nie ma jeszcze zarejestrowanych występów w tym sezonie.'
                                        }
                                        className="bg-transparent border-none p-0"
                                    />
                                </div>
                            ) : (
                                <div className="w-full" style={{ height: isMobile ? '200px' : '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={trendData}>
                                        <CartesianGrid {...chartGridProps} />
                                        <XAxis
                                            dataKey="formattedDate"
                                            {...chartAxisProps}
                                            dy={10}
                                            interval={isMobile ? Math.ceil(trendData.length / 4) : 0}
                                        />
                                        <YAxis
                                            {...chartAxisProps}
                                            dx={-10}
                                            width={isMobile ? 20 : 35}
                                        />
                                            <Tooltip
                                                trigger={isMobile ? 'click' : 'hover'}
                                                contentStyle={chartTooltipStyle}
                                                itemStyle={chartTooltipItemStyle}
                                                labelStyle={chartTooltipLabelStyle}
                                                cursor={{ stroke: chartColors.axis, strokeDasharray: '2 4' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="pts"
                                                name="Punkty"
                                                stroke={chartColors.team}
                                                strokeWidth={3}
                                                fill={chartColors.team}
                                                fillOpacity={0.14}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </BkpkCard>

                        {career && <PlayerCareer career={career} showPersonal={isAdmin || user?.id === id} />}

                        {/* Advanced Box Score (Game Log) */}
                        <section className="space-y-4">
                            <BoxScoreModern
                                showPlusMinus={gameLog.some((g) => g.plusMinusAvailable !== false && g.plusMinus !== 0)}
                                playerStats={gameLog.map(g => {
                                    // EVAL z KALK; wzór uproszczony tylko dla starych danych bez EVAL
                                    const evalVal = g.eval ?? (g.pts + g.reb + g.ast + g.stl + g.blk) - ((g.fga - g.fgm) + (g.fta - g.ftm) + g.tov);
                                    return {
                                        name: g.opponent,
                                        eval: evalVal,
                                        points: g.pts,
                                        rebounds: g.reb,
                                        assists: g.ast,
                                        steals: g.stl,
                                        blocks: g.blk,
                                        turnovers: g.tov,
                                        plusMinus: g.plusMinusAvailable === false ? null : g.plusMinus,
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
                            <div className="flex items-center gap-2">
                                <h3 className="text-[22px] sm:text-[24px] text-bkpk-text-primary">Skuteczność w sezonie</h3>
                                <BkpkTooltip content="Skuteczność rzutów liczy trójkę 1,5 raza (bo daje 3 pkt); skuteczność ogólna dolicza też rzuty wolne." />
                            </div>
                            <div className="space-y-6">
                                {[
                                    { label: 'Skuteczność rzutów', value: formatStatFixed((averages.efg ?? 0) * 100, 1) + '%', progress: (averages.efg ?? 0) * 100 },
                                    { label: 'Skuteczność ogólna', value: formatStatFixed((averages.ts ?? 0) * 100, 1) + '%', progress: (averages.ts ?? 0) * 100 },
                                    ...(averages.plusMinusAvg != null
                                        ? [{ label: 'Średni bilans +/-', value: averages.plusMinusAvg > 0 ? `+${formatStatFixed(averages.plusMinusAvg, 1)}` : formatStatFixed(averages.plusMinusAvg, 1), progress: Math.max(0, averages.plusMinusAvg + 10) * 5 }]
                                        : []),
                                ].map((stat, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <span className="label-caps text-xs text-bkpk-text-secondary">{stat.label}</span>
                                            <span className="font-display font-extrabold text-2xl leading-none tabular-nums text-bkpk-text-primary">{stat.value}</span>
                                        </div>
                                        <div className="h-1.5 bg-bkpk-surface-tint-2 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(100, stat.progress)}%` }}
                                                transition={{ duration: 0.3, delay: 0.2 + (i * 0.05) }}
                                                className={cn(
                                                    "h-full",
                                                    stat.label.includes('Plus') ? ((averages.plusMinusAvg ?? 0) >= 0 ? "bg-bkpk-success" : "bg-bkpk-danger") : "bg-bkpk-primary"
                                                )}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </BkpkCard>

                    </div>
                </div>
            </PageContainer>
        </div>
    );
}
