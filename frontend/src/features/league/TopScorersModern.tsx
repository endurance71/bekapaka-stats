import { useEffect, useState, useCallback } from 'react';
import { fetchJSON } from '../../lib/api';
import { motion } from 'framer-motion';
import { cn } from '../../shared/lib/utils';
import BkpkCard from '../../shared/ui/BkpkCard';
import { Trophy, Target, Shield, Zap, Sparkles, Award } from 'lucide-react';
import KalkEmptyState from '../../shared/ui/KalkEmptyState';
import { MobileDataCard, MobileDataList } from '../../shared/ui/MobileDataCard';
import ScrollableTableShell from '../../shared/ui/ScrollableTableShell';
import useIsMobile, { usePortraitMobile } from '../../hooks/useIsMobile';

interface Scorer {
    id: string;
    name: string;
    team: string;
    pointsTotal?: number | null;
    pointsAverage?: number | null;
    matchesPlayed?: number | null;
    stealsTotal?: number | null;
    stealsAverage?: number | null;
    blocksTotal?: number | null;
    blocksAverage?: number | null;
    reboundsTotal?: number | null;
    reboundsAverage?: number | null;
    assistsTotal?: number | null;
    assistsAverage?: number | null;
    threePointsMade?: number | null;
    threePointsAttempted?: number | null;
    threePointsPct?: number | null;
    threePointStats?: string | null;
    raw?: any;
    rosterPlayer?: {
        id: string;
        firstName: string;
        lastName: string;
        starter: boolean;
        data?: any;
    } | null;
}

type LeaderCategory = 'points' | 'three' | 'assists' | 'rebounds' | 'steals' | 'blocks';

const categories: { id: LeaderCategory; label: string; unit: string; totalLabel: string; icon: any }[] = [
    { id: 'points', label: 'Punkty', unit: 'PPG', totalLabel: 'Suma', icon: Trophy },
    { id: 'three', label: 'Rzuty za 3', unit: 'Celne', totalLabel: 'Skuteczność', icon: Target },
    { id: 'assists', label: 'Asysty', unit: 'APG', totalLabel: 'Suma', icon: Sparkles },
    { id: 'rebounds', label: 'Zbiórki', unit: 'RPG', totalLabel: 'Suma', icon: Award },
    { id: 'steals', label: 'Przechwyty', unit: 'SPG', totalLabel: 'Suma', icon: Zap },
    { id: 'blocks', label: 'Bloki', unit: 'BPG', totalLabel: 'Suma', icon: Shield },
];

interface TopScorersModernProps {
    seasonId?: string | null;
}

export default function TopScorersModern({ seasonId }: TopScorersModernProps) {
    const [activeCategory, setActiveCategory] = useState<LeaderCategory>('points');
    const [leaders, setLeaders] = useState<Scorer[]>([]);
    const [loading, setLoading] = useState(true);
    const showCards = usePortraitMobile();
    const isNarrow = useIsMobile(1024);

    const fetchLeaders = useCallback(async () => {
        if (!seasonId) return;
        setLoading(true);
        try {
            const q = new URLSearchParams({
                category: activeCategory,
                limit: '20',
                seasonId
            });
            const data = await fetchJSON<Scorer[]>(`/api/league/leaders?${q.toString()}`);
            setLeaders(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [activeCategory, seasonId]);

    useEffect(() => {
        fetchLeaders();
    }, [fetchLeaders]);

    const resolveLeaderPhoto = (player: Scorer) => {
        if (player.rosterPlayer?.data?.photo) {
            return player.rosterPlayer.data.photo;
        }
        if (player.raw?.photo_url && !player.raw.photo_url.includes('empty.jpg')) {
            return player.raw.photo_url;
        }
        return '/photos/default.png';
    };

    const getCategoryStats = (player: Scorer, cat: LeaderCategory) => {
        switch (cat) {
            case 'points':
                return {
                    main: player.pointsAverage ? player.pointsAverage.toFixed(1) : '0.0',
                    sub: player.pointsTotal ? `${player.pointsTotal} pkt` : '0 pkt',
                    label: 'PPG'
                };
            case 'three':
                return {
                    main: player.threePointsMade ? `${player.threePointsMade}` : '0',
                    sub: player.threePointsPct ? `${player.threePointsPct.toFixed(1)}% (${player.threePointsMade}/${player.threePointsAttempted})` : '0%',
                    label: 'CELNE'
                };
            case 'assists':
                return {
                    main: player.assistsAverage ? player.assistsAverage.toFixed(1) : '0.0',
                    sub: player.assistsTotal ? `${player.assistsTotal} ast` : '0 ast',
                    label: 'APG'
                };
            case 'rebounds':
                return {
                    main: player.reboundsAverage ? player.reboundsAverage.toFixed(1) : '0.0',
                    sub: player.reboundsTotal ? `${player.reboundsTotal} zb` : '0 zb',
                    label: 'RPG'
                };
            case 'steals':
                return {
                    main: player.stealsAverage ? player.stealsAverage.toFixed(1) : '0.0',
                    sub: player.stealsTotal ? `${player.stealsTotal} prz` : '0 prz',
                    label: 'SPG'
                };
            case 'blocks':
                return {
                    main: player.blocksAverage ? player.blocksAverage.toFixed(1) : '0.0',
                    sub: player.blocksTotal ? `${player.blocksTotal} bl` : '0 bl',
                    label: 'BPG'
                };
            default:
                return { main: '0.0', sub: '0', label: '' };
        }
    };

    const currentCatInfo = categories.find(c => c.id === activeCategory)!;
    const CategoryIcon = currentCatInfo.icon;

    return (
        <div className="space-y-8">
            {/* Category Selector Tabs */}
            <div className="flex flex-wrap gap-2 p-1 bg-bkpk-glass border border-bkpk-glass-border rounded-xl w-full sm:w-fit">
                {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activeCategory === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={cn(
                                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                                isActive
                                    ? "bg-bkpk-surface-tint-4 text-bkpk-text-primary shadow-bkpk-glow"
                                    : "text-bkpk-text-muted hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-2"
                            )}
                        >
                            <Icon className={cn("w-3.5 h-3.5", isActive && "text-bkpk-primary")} />
                            {cat.label}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-16 bg-bkpk-surface-tint-2 animate-pulse rounded-2xl" />
                    ))}
                </div>
            ) : leaders.length === 0 ? (
                <KalkEmptyState title={`Ranking dla kategorii ${currentCatInfo.label} jest pusty`} />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Top 3 Podium */}
                    <div className="md:col-span-12 lg:col-span-4 space-y-4 order-2 lg:order-1">
                        <div className="flex items-center gap-2 mb-6">
                            <CategoryIcon className="w-5 h-5 text-bkpk-primary" />
                            <h3 className="text-xl font-bold text-bkpk-text-primary font-outfit uppercase tracking-tight">
                                Liderzy: {currentCatInfo.label}
                            </h3>
                        </div>

                        {leaders.slice(0, 3).map((player, idx) => {
                            const isBkpk = player.team?.toLowerCase().includes('bekapaka');
                            const stats = getCategoryStats(player, activeCategory);
                            return (
                                <motion.div
                                    key={player.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <BkpkCard
                                        variant="glass"
                                        className={cn(
                                            "relative overflow-hidden border-bkpk-border-strong group transition-all duration-300",
                                            idx === 0 && "border-bkpk-warning/30 bg-bkpk-warning/5",
                                            isBkpk && "border-bkpk-primary/30"
                                        )}
                                    >
                                        <div className="relative z-10 flex items-center gap-4">
                                            {/* Photo Thumbnail with Badge rank */}
                                            <div className="relative shrink-0">
                                                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-bkpk-border-strong bg-bkpk-surface flex items-center justify-center">
                                                    <img
                                                        src={resolveLeaderPhoto(player)}
                                                        onError={(e) => (e.currentTarget.src = '/photos/default.png')}
                                                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300"
                                                        alt=""
                                                    />
                                                </div>
                                                <div className={cn(
                                                    "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center font-black font-outfit text-[10px] text-white border border-bkpk-bg shadow-lg",
                                                    idx === 0 ? "bg-bkpk-medal-gold text-black" : idx === 1 ? "bg-bkpk-medal-silver text-black" : "bg-bkpk-medal-bronze text-black"
                                                )}>
                                                    {idx + 1}
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="text-base font-bold text-bkpk-text-primary leading-tight truncate">{player.name}</div>
                                                <div className="text-[10px] font-bold text-bkpk-text-muted uppercase tracking-widest truncate">{player.team}</div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-xl font-black font-outfit text-bkpk-text-primary leading-none">{stats.main}</div>
                                                <div className="text-[10px] font-bold text-bkpk-primary uppercase tracking-widest mt-0.5">{stats.label}</div>
                                                <div className="text-[9px] text-bkpk-text-muted font-semibold mt-0.5">{stats.sub}</div>
                                            </div>
                                        </div>

                                        {/* Decorative background number */}
                                        <div className="absolute -bottom-8 -right-4 text-8xl font-black text-white/[0.02] italic pointer-events-none group-hover:text-white/[0.05] transition-colors">
                                            {idx + 1}
                                        </div>
                                    </BkpkCard>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Rest of the List (4-20) */}
                    <div className="md:col-span-12 lg:col-span-8 order-1 lg:order-2">
                        <BkpkCard variant="glass" padding="none" className="overflow-hidden border-bkpk-border-strong shadow-2xl">
                            {showCards ? (
                            <MobileDataList>
                                {leaders.slice(3).map((player, index) => {
                                    const isBkpk = player.team?.toLowerCase().includes('bekapaka');
                                    const stats = getCategoryStats(player, activeCategory);
                                    return (
                                        <MobileDataCard
                                            key={player.id}
                                            rank={index + 4}
                                            accent={isBkpk}
                                            title={player.name}
                                            subtitle={player.team}
                                            leading={
                                                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-bkpk-border-subtle">
                                                    <img
                                                        src={resolveLeaderPhoto(player)}
                                                        onError={(e) => (e.currentTarget.src = '/photos/default.png')}
                                                        className="w-full h-full object-cover"
                                                        alt=""
                                                    />
                                                </div>
                                            }
                                            highlight={
                                                <div>
                                                    <div className="text-xl font-black font-outfit text-bkpk-text-primary tabular-nums">
                                                        {stats.main}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-bkpk-primary uppercase">
                                                        {stats.label}
                                                    </div>
                                                </div>
                                            }
                                            stats={[
                                                {
                                                    label: 'Mecze',
                                                    value: player.matchesPlayed ?? player.raw?.mecze_rozegrane ?? 0
                                                },
                                                {
                                                    label: currentCatInfo.totalLabel,
                                                    value: stats.sub
                                                }
                                            ]}
                                        />
                                    );
                                })}
                            </MobileDataList>
                            ) : (
                            <ScrollableTableShell compact={isNarrow} className="border-0 rounded-none">
                                <table className="w-full text-sm text-left border-collapse min-w-[520px]">
                                    <thead>
                                        <tr className="bg-bkpk-surface-tint-2 border-b border-bkpk-border-strong">
                                            <th className="px-3 py-3 sm:px-6 sm:py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted w-10 sm:w-12 text-center">#</th>
                                            <th className="px-3 py-3 sm:px-6 sm:py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted sticky left-0 z-10 bg-bkpk-surface border-r border-bkpk-border-strong">Zawodnik</th>
                                            <th className="px-3 py-3 sm:px-6 sm:py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted whitespace-nowrap">Drużyna</th>
                                            <th className="px-3 py-3 sm:px-6 sm:py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted text-center">M</th>
                                            <th className="px-3 py-3 sm:px-6 sm:py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted text-center whitespace-nowrap">
                                                {currentCatInfo.totalLabel}
                                            </th>
                                            <th className="px-3 py-3 sm:px-6 sm:py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted text-center">
                                                {currentCatInfo.unit}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-bkpk-border-subtle">
                                        {leaders.slice(3).map((player, index) => {
                                            const isBkpk = player.team?.toLowerCase().includes('bekapaka');
                                            const stats = getCategoryStats(player, activeCategory);
                                            return (
                                                <motion.tr
                                                    key={player.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: index * 0.02 }}
                                                    className={cn(
                                                        "group transition-all hover:bg-bkpk-surface-tint-2",
                                                        isBkpk && "bg-bkpk-primary/5 hover:bg-bkpk-primary/10"
                                                    )}
                                                >
                                                    <td className="px-3 py-2.5 sm:px-6 sm:py-4 text-center font-bold text-bkpk-text-muted group-hover:text-bkpk-text-secondary transition-colors">
                                                        {index + 4}
                                                    </td>
                                                    <td className={cn(
                                                        "px-3 py-2.5 sm:px-6 sm:py-4 font-bold transition-colors sticky left-0 z-10 border-r border-bkpk-border-strong",
                                                        isBkpk
                                                            ? "text-bkpk-primary bkpk-row-highlight"
                                                            : "bg-bkpk-surface group-hover:bg-bkpk-surface-elevated"
                                                    )}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-bkpk-border-subtle">
                                                                <img
                                                                    src={resolveLeaderPhoto(player)}
                                                                    onError={(e) => (e.currentTarget.src = '/photos/default.png')}
                                                                    className="w-full h-full object-cover"
                                                                    alt=""
                                                                />
                                                            </div>
                                                            {player.name}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2.5 sm:px-6 sm:py-4 text-bkpk-text-muted text-xs font-semibold max-w-[120px] truncate">{player.team}</td>
                                                    <td className="px-3 py-2.5 sm:px-6 sm:py-4 text-center text-bkpk-text-secondary tabular-nums">{player.matchesPlayed ?? player.raw?.mecze_rozegrane ?? 0}</td>
                                                    <td className="px-3 py-2.5 sm:px-6 sm:py-4 text-center text-bkpk-text-secondary font-medium tabular-nums">{stats.sub}</td>
                                                    <td className="px-3 py-2.5 sm:px-6 sm:py-4 text-center font-black text-bkpk-text-primary tabular-nums text-base sm:text-lg bg-bkpk-surface-tint-2">
                                                        {stats.main}
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </ScrollableTableShell>
                            )}
                        </BkpkCard>
                    </div>
                </div>
            )}
        </div>
    );
}
