import { useEffect, useState, useCallback } from 'react';
import { fetchJSON } from '../../lib/api';
import { motion } from 'framer-motion';
import { cn } from '../../shared/lib/utils';
import BkpkCard from '../../shared/ui/BkpkCard';
import { Target, Shield, Zap, Sparkles, Award } from 'lucide-react';
import { TrophyIcon as Trophy } from '../../shared/ui/BrandIcon';
import KalkEmptyState from '../../shared/ui/KalkEmptyState';
import { MobileDataCard, MobileDataList } from '../../shared/ui/MobileDataCard';
import ScrollableTableShell from '../../shared/ui/ScrollableTableShell';
import SectionHeading from '../../shared/ui/SectionHeading';
import { bkpkActivePillClass } from '../../shared/ui/BkpkButton';
import useIsMobile, { usePortraitMobile } from '../../hooks/useIsMobile';
import PlayerAvatar from '../../shared/ui/PlayerAvatar';
import type { PhotoSource } from '../../shared/lib/playerUtils';
import { Link } from 'react-router-dom';
import { useRosterLinks } from '../../shared/lib/useRosterLinks';
import { formatStatFixed, fmtPct } from '../../shared/lib/formatStat';

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
    { id: 'points', label: 'Punkty', unit: 'pkt/m', totalLabel: 'Suma', icon: Trophy },
    { id: 'three', label: 'Rzuty za 3', unit: 'celne', totalLabel: 'Skuteczność', icon: Target },
    { id: 'assists', label: 'Asysty', unit: 'as/m', totalLabel: 'Suma', icon: Sparkles },
    { id: 'rebounds', label: 'Zbiórki', unit: 'zb/m', totalLabel: 'Suma', icon: Award },
    { id: 'steals', label: 'Przechwyty', unit: 'prz/m', totalLabel: 'Suma', icon: Zap },
    { id: 'blocks', label: 'Bloki', unit: 'bl/m', totalLabel: 'Suma', icon: Shield },
];

interface TopScorersModernProps {
    seasonId?: string | null;
}

export default function TopScorersModern({ seasonId }: TopScorersModernProps) {
    const [activeCategory, setActiveCategory] = useState<LeaderCategory>('points');
    const [leaders, setLeaders] = useState<Scorer[]>([]);
    const [loading, setLoading] = useState(true);
    const rosterLinks = useRosterLinks();
    // Zawodnik BeKaPaKa → link do profilu (powiązanie w tym sezonie albo slug KALK)
    const profileHref = (player: Scorer): string | null => {
        const slug = player.id.includes('__') ? player.id.slice(player.id.indexOf('__') + 2) : null;
        const rosterId = player.rosterPlayer?.id ?? (slug ? rosterLinks.get(slug) : undefined);
        return rosterId ? `/players/${rosterId}` : null;
    };
    const NameLink = ({ player, className }: { player: Scorer; className?: string }) => {
        const href = profileHref(player);
        return href ? <Link to={href} className={cn(className, 'hover:text-bkpk-primary hover:underline underline-offset-2')}>{player.name}</Link> : <span className={className}>{player.name}</span>;
    };
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

    // Zawodnik BeKaPaKa → portret/zdjęcie jak w składzie; rywal → zdjęcie z KALK albo monogram.
    const leaderPhotoSource = (player: Scorer): PhotoSource =>
        player.rosterPlayer
            ? { ...player.rosterPlayer, photo: player.rosterPlayer.data?.photo, kalkPlayer: { raw: player.raw } }
            : { kalkPlayer: { raw: player.raw } };

    const getCategoryStats = (player: Scorer, cat: LeaderCategory) => {
        switch (cat) {
            case 'points':
                return {
                    main: formatStatFixed(player.pointsAverage),
                    sub: player.pointsTotal ? `${player.pointsTotal} pkt` : '0 pkt',
                    label: 'pkt/m'
                };
            case 'three':
                return {
                    main: player.threePointsMade ? `${player.threePointsMade}` : '0',
                    sub: player.threePointsPct != null ? `${fmtPct(Number(player.threePointsPct))} (${player.threePointsMade ?? 0}/${player.threePointsAttempted ?? 0})` : '–',
                    label: 'celne'
                };
            case 'assists':
                return {
                    main: formatStatFixed(player.assistsAverage),
                    sub: `${player.assistsTotal ?? 0} as`,
                    label: 'as/m'
                };
            case 'rebounds':
                return {
                    main: formatStatFixed(player.reboundsAverage),
                    sub: player.reboundsTotal ? `${player.reboundsTotal} zb` : '0 zb',
                    label: 'zb/m'
                };
            case 'steals':
                return {
                    main: formatStatFixed(player.stealsAverage),
                    sub: player.stealsTotal ? `${player.stealsTotal} prz` : '0 prz',
                    label: 'prz/m'
                };
            case 'blocks':
                return {
                    main: formatStatFixed(player.blocksAverage),
                    sub: player.blocksTotal ? `${player.blocksTotal} bl` : '0 bl',
                    label: 'bl/m'
                };
            default:
                return { main: '0.0', sub: '0', label: '' };
        }
    };

    const currentCatInfo = categories.find(c => c.id === activeCategory)!;

    // Miejsca 1–3: złoto tylko dla lidera kategorii (wyróżnienie), srebro i brąz jako medale
    const podiumRankClass = (idx: number) =>
        cn(
            'shrink-0 w-11 h-11 flex items-center justify-center text-xl font-display tabular-nums',
            idx === 0 && 'bg-bkpk-medal-gold text-bkpk-bg',
            idx === 1 && 'bg-bkpk-medal-silver text-bkpk-bg',
            idx === 2 && 'bg-bkpk-medal-bronze text-bkpk-bg'
        );

    return (
        <div className="space-y-8">
            {/* Category Selector Tabs — segmenty, aktywny w inwersji */}
            <div className="flex flex-wrap gap-2 w-full sm:w-fit">
                {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activeCategory === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={cn(
                                "inline-flex items-center gap-2 min-h-[44px] px-4 label-caps text-[12px] sm:text-[13px] transition-colors",
                                isActive
                                    ? bkpkActivePillClass
                                    : "border border-bkpk-border-strong text-bkpk-text-secondary hover:text-bkpk-text-primary hover:border-bkpk-text-secondary"
                            )}
                        >
                            <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                            {cat.label}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-16 bg-bkpk-surface-tint-2 animate-pulse" />
                    ))}
                </div>
            ) : leaders.length === 0 ? (
                <KalkEmptyState title={`Ranking dla kategorii ${currentCatInfo.label} jest pusty`} />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Top 3 Podium */}
                    <div className="md:col-span-12 lg:col-span-4 space-y-3 order-1">
                        <SectionHeading as="h3" title={`Liderzy: ${currentCatInfo.label}`} className="mb-5" />

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
                                        variant="flat"
                                        className={cn(
                                            "relative overflow-hidden group",
                                            idx === 0 && "border-t-2 border-t-bkpk-medal-gold",
                                            isBkpk && "bg-[var(--table-own-bg)] shadow-[inset_4px_0_0_var(--c-red-500)]"
                                        )}
                                    >
                                        <div className="relative z-10 flex items-center gap-3 sm:gap-4">
                                            <div
                                                className={podiumRankClass(idx)}
                                                aria-label={`Miejsce ${idx + 1}`}
                                            >
                                                {idx + 1}
                                            </div>
                                            <div className="relative shrink-0">
                                                <div className="w-12 h-12 sm:w-14 sm:h-14 overflow-hidden border border-bkpk-border-strong bg-bkpk-bg flex items-center justify-center">
                                                    <PlayerAvatar player={leaderPhotoSource(player)} className="w-full h-full" />
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <NameLink player={player} className="block font-display text-lg uppercase text-bkpk-text-primary leading-tight truncate" />
                                                <div className="label-caps text-[11px] text-bkpk-text-muted truncate mt-0.5">{player.team}</div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className={cn(
                                                    "text-[28px] font-display tabular-nums leading-none",
                                                    idx === 0 ? "text-bkpk-medal-gold" : "text-bkpk-text-primary"
                                                )}>{stats.main}</div>
                                                <div className="label-caps text-[11px] text-bkpk-text-secondary mt-1">{stats.label}</div>
                                                <div className="text-[11px] text-bkpk-text-muted font-semibold tabular-nums mt-0.5">{stats.sub}</div>
                                            </div>
                                        </div>

                                        {/* Decorative background number */}
                                        <div aria-hidden="true" className="absolute -bottom-6 right-2 text-8xl font-display leading-none outline-text text-bkpk-border-subtle pointer-events-none group-hover:text-bkpk-border-strong transition-colors">
                                            {idx + 1}
                                        </div>
                                    </BkpkCard>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Rest of the List (4-20) */}
                    <div className="md:col-span-12 lg:col-span-8 order-2">
                        <BkpkCard variant="flat" padding="none" className="overflow-hidden bg-bkpk-bg">
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
                                            title={<NameLink player={player} />}
                                            subtitle={player.team}
                                            leading={
                                                <div className="w-9 h-9 overflow-hidden shrink-0 border border-bkpk-border-strong">
                                                    <PlayerAvatar player={leaderPhotoSource(player)} className="w-full h-full" />
                                                </div>
                                            }
                                            highlight={
                                                <div className="text-right">
                                                    <div className="text-xl font-display text-bkpk-text-primary tabular-nums leading-none">
                                                        {stats.main}
                                                    </div>
                                                    <div className="label-caps text-[11px] text-bkpk-text-secondary mt-1">
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
                            <ScrollableTableShell compact={isNarrow} className="border-0 bg-bkpk-bg">
                                <table className="bkpk-table text-[15px] text-left min-w-[520px]">
                                    <thead>
                                        <tr>
                                            <th className="h-12 px-3 sm:px-5 w-10 sm:w-12 text-center">#</th>
                                            <th className="h-12 px-3 sm:px-5 text-left sticky left-0 z-10 shadow-[1px_0_0_var(--c-ink-500)]">Zawodnik</th>
                                            <th className="h-12 px-3 sm:px-5 text-left whitespace-nowrap">Drużyna</th>
                                            <th className="h-12 px-3 sm:px-5 text-center">M</th>
                                            <th className="h-12 px-3 sm:px-5 text-center whitespace-nowrap">
                                                {currentCatInfo.totalLabel}
                                            </th>
                                            <th className="h-12 px-3 sm:px-5 text-center shadow-[inset_0_-3px_0_var(--c-red-500)]">
                                                {currentCatInfo.unit}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaders.slice(3).map((player, index) => {
                                            const isBkpk = player.team?.toLowerCase().includes('bekapaka');
                                            const stats = getCategoryStats(player, activeCategory);
                                            // Nieparzyste wiersze: nieprzezroczyste tło pod przyklejoną kolumną
                                            const isOddRow = index % 2 === 0;
                                            return (
                                                <motion.tr
                                                    key={player.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: index * 0.02 }}
                                                    className={cn(
                                                        "transition-colors",
                                                        isBkpk
                                                            ? "bkpk-row-highlight"
                                                            : isOddRow && "[&>*]:bg-bkpk-bg hover:[&>*]:bg-ink-700"
                                                    )}
                                                >
                                                    <td className="h-12 px-3 sm:px-5 text-center text-bkpk-text-secondary tabular-nums">
                                                        {index + 4}
                                                    </td>
                                                    <td className="h-12 px-3 sm:px-5 font-semibold sticky left-0 z-10 shadow-[1px_0_0_var(--c-ink-500)] text-bkpk-text-primary">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 overflow-hidden shrink-0 border border-bkpk-border-strong">
                                                                <PlayerAvatar player={leaderPhotoSource(player)} className="w-full h-full" />
                                                            </div>
                                                            <NameLink player={player} />
                                                        </div>
                                                    </td>
                                                    <td className="h-12 px-3 sm:px-5 text-bkpk-text-secondary text-[13px] max-w-[160px] truncate">{player.team}</td>
                                                    <td className="h-12 px-3 sm:px-5 text-center text-bkpk-text-secondary tabular-nums">{player.matchesPlayed ?? player.raw?.mecze_rozegrane ?? 0}</td>
                                                    <td className="h-12 px-3 sm:px-5 text-center text-bkpk-text-secondary tabular-nums">{stats.sub}</td>
                                                    <td className="h-12 px-3 sm:px-5 text-center font-display text-[19px] leading-none text-bkpk-text-primary tabular-nums">
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
