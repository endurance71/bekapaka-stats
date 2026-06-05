import BkpkCard from '../../shared/ui/BkpkCard';
import { bkpkActivePillClass } from '../../shared/ui/BkpkButton';
import { motion, AnimatePresence } from 'framer-motion';
import BkpkTooltip from '../../shared/ui/BkpkTooltip';
import { useState } from 'react';
import { clsx } from 'clsx';
import { formatStatFixed } from '../../shared/lib/formatStat';

export interface WinCardProps {
    winPercentage: number;
    wins: number;
    losses: number;
    loading?: boolean;
}

export function WinCard({ winPercentage, wins, losses, loading }: WinCardProps) {
    return (
        <BkpkCard hoverEffect className="relative h-full">
            <div className="flex flex-col h-full justify-between">
                <div>
                    <span className="text-bkpk-primary text-xs font-bold uppercase tracking-wider">Bilans Sezonu</span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <h2 className="text-4xl lg:text-5xl font-bold font-outfit text-bkpk-text-primary">
                            {Math.round(winPercentage)}%
                        </h2>
                        <span className="text-bkpk-text-secondary text-sm font-bold uppercase tracking-tighter">Zwycięstw</span>
                    </div>
                </div>

                <div className="mt-6 flex items-end justify-between">
                    <div className="flex flex-col">
                        <span className="text-bkpk-text-secondary text-sm uppercase font-bold">Wygrane</span>
                        <span className="text-2xl font-bold text-bkpk-success">{wins}</span>
                    </div>
                    <div className="h-8 w-px bg-bkpk-surface-tint-4 mx-4" />
                    <div className="flex flex-col text-right">
                        <span className="text-bkpk-text-secondary text-sm uppercase font-bold">Mecze</span>
                        <span className="text-2xl font-bold text-bkpk-text-primary">{wins + losses}</span>
                    </div>
                </div>
            </div>

            {/* Decorative background element */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-bkpk-primary/5 rounded-full blur-3xl pointer-events-none" />
        </BkpkCard>
    );
}

export interface PPGCardProps {
    ppg: number;
    trend: number; // percentage change or points delta
}

export function PPGCard({ ppg, trend }: PPGCardProps) {
    const isPositive = trend >= 0;

    return (
        <BkpkCard hoverEffect overflowVisible className="relative h-full">
            <div className="flex flex-col h-full justify-between">
                <div>
                    <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-bkpk-primary text-xs font-bold uppercase tracking-wider">Siła Ofensywna</span>
                        <BkpkTooltip content="Średnia liczba punktów na mecz. Określa potencjał punktowy - im wyższa, tym łatwiej o zwycięstwo przy stabilnej obronie." />
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                        <h2 className="text-4xl lg:text-5xl font-bold font-outfit text-bkpk-text-primary">
                            {formatStatFixed(ppg)}
                        </h2>
                        <span className="text-bkpk-text-secondary text-sm font-medium uppercase tracking-tighter">PKT/Mecz</span>
                    </div>
                </div>

                <div className="mt-6 flex items-center gap-2">
                    <div className={clsx(
                        "px-2 py-1 rounded-md flex items-center gap-1 text-xs font-bold",
                        isPositive ? "bg-bkpk-success/20 text-bkpk-success" : "bg-bkpk-danger/15 text-bkpk-text-danger-subtle"
                    )}>
                        {isPositive ? "↑" : "↓"} {Math.abs(trend)}%
                    </div>
                    <span className="text-bkpk-text-secondary text-xs font-bold uppercase tracking-tighter italic">vs ostatnie 3 mecze</span>
                </div>
            </div>
        </BkpkCard>
    );
}

export type RatingLeagueTier = 'weak' | 'average' | 'elite';

export interface TeamRatingLeagueBenchmark {
    offRating: number;
    defRating: number;
    netRating: number;
}

export interface RatingCardProps {
    offRating: number;
    defRating: number;
    league?: TeamRatingLeagueBenchmark | null;
    tiers?: { off: RatingLeagueTier; def: RatingLeagueTier; net: RatingLeagueTier } | null;
}

const RATING_LEAGUE_SPREAD = 12;

function ratingLeagueDelta(
    teamVal: number,
    leagueVal: number,
    higherIsBetter: boolean
): number {
    return higherIsBetter ? teamVal - leagueVal : leagueVal - teamVal;
}

function ratingBarPercent(delta: number): number {
    return Math.min(100, Math.max(5, 50 + (delta / (RATING_LEAGUE_SPREAD / 2)) * 50));
}

const TIER_LABELS: Record<RatingLeagueTier, string> = {
    weak: 'Słabo',
    average: 'Średnio',
    elite: 'Elita'
};

export function RatingCard({ offRating, defRating, league, tiers }: RatingCardProps) {
    const [mode, setMode] = useState<'OFF' | 'DEF' | 'NET'>('NET');
    const netRating = offRating - defRating;

    const getValue = () => {
        if (mode === 'OFF') return offRating;
        if (mode === 'DEF') return defRating;
        return netRating;
    };

    const getLeagueValue = () => {
        if (!league) return null;
        if (mode === 'OFF') return league.offRating;
        if (mode === 'DEF') return league.defRating;
        return league.netRating;
    };

    const getTier = (): RatingLeagueTier | null => {
        if (!tiers) return null;
        if (mode === 'OFF') return tiers.off;
        if (mode === 'DEF') return tiers.def;
        return tiers.net;
    };

    const getLabel = () => {
        if (mode === 'OFF') return 'Rating Ofensywny';
        if (mode === 'DEF') return 'Rating Defensywny';
        return 'Efektywność Netto';
    };

    const value = getValue();
    const leagueValue = getLeagueValue();
    const tier = getTier();
    const higherIsBetter = mode !== 'DEF';
    const leagueDelta = leagueValue != null
        ? ratingLeagueDelta(value, leagueValue, higherIsBetter)
        : null;
    const barWidth = leagueDelta != null ? ratingBarPercent(leagueDelta) : Math.min(Math.max(Math.abs(value) * 5, 10), 100);
    const barPositive = leagueDelta != null ? leagueDelta >= 0 : value >= 0;

    return (
        <BkpkCard variant="glass" overflowVisible className="h-full relative group">
            <div className="flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-bkpk-primary text-xs font-bold uppercase tracking-wider">{getLabel()}</span>
                            <BkpkTooltip content={
                                mode === 'OFF' ? "Punkty na 100 posiadań. Porównanie ze średnią dywizji z box score'ów KALK." :
                                    mode === 'DEF' ? "Punkty stracone na 100 posiadań. Im niższy od średniej ligi, tym lepsza obrona." :
                                        "Różnica ORtg − DefRtg. Dodatnia wartość powyżej średniej ligi oznacza przewagę nad rywalami."
                            } />
                        </div>
                        <div className="flex items-baseline gap-2 mt-1">
                            <AnimatePresence mode="wait">
                                <motion.h2
                                    key={mode}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="text-4xl lg:text-5xl font-bold font-outfit text-bkpk-text-primary"
                                >
                                    {mode === 'NET' && value > 0 ? `+${formatStatFixed(value)}` : formatStatFixed(value)}
                                </motion.h2>
                            </AnimatePresence>
                            {leagueValue != null && (
                                <span className="text-xs font-bold text-bkpk-text-muted uppercase tracking-tighter">
                                    Liga {mode === 'NET' && leagueValue > 0 ? `+${formatStatFixed(leagueValue)}` : formatStatFixed(leagueValue)}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex bg-bkpk-surface-tint-2 p-1 rounded-lg border border-bkpk-border-strong">
                        {(['OFF', 'DEF', 'NET'] as const).map((m) => (
                            <button
                                key={m}
                                onClick={() => setMode(m)}
                                className={clsx(
                                    "px-2 py-1 text-xs font-bold rounded-md transition-all",
                                    mode === m
                                        ? bkpkActivePillClass
                                        : "text-bkpk-text-secondary hover:text-bkpk-text-primary"
                                )}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-6">
                    <div className="relative w-full h-1.5 bg-bkpk-surface-tint-2 rounded-full overflow-hidden">
                        {leagueDelta != null && (
                            <div
                                className="absolute top-0 bottom-0 w-0.5 bg-bkpk-text-muted/50 z-10"
                                style={{ left: '50%' }}
                                aria-hidden
                            />
                        )}
                        <motion.div
                            className={clsx(
                                "h-full rounded-full",
                                barPositive ? "bg-bkpk-success" : "bg-bkpk-danger"
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${barWidth}%` }}
                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-xs font-bold uppercase tracking-[0.1em]">
                        {(['weak', 'average', 'elite'] as const).map((tierKey) => (
                            <div
                                key={tierKey}
                                className={clsx(
                                    "flex items-center gap-1",
                                    tier === tierKey
                                        ? tierKey === 'elite'
                                            ? "text-bkpk-success"
                                            : tierKey === 'weak'
                                                ? "text-bkpk-text-danger"
                                                : "text-bkpk-primary"
                                        : "text-bkpk-text-muted"
                                )}
                            >
                                <span>{TIER_LABELS[tierKey]}</span>
                                {tierKey === 'average' && (
                                    <BkpkTooltip content="Pozycja względem średniej dywizji (box score KALK). ±3 pkt ratingu od średniej = Średnio." />
                                )}
                            </div>
                        ))}
                    </div>
                    {leagueDelta != null && tier && (
                        <p className="mt-2 text-[10px] font-bold text-bkpk-text-muted uppercase tracking-widest text-center">
                            {leagueDelta >= 0 ? '+' : ''}{formatStatFixed(leagueDelta)} vs średnia ligi
                        </p>
                    )}
                </div>
            </div>
        </BkpkCard>
    );
}

