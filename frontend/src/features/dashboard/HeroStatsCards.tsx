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

export interface RatingCardProps {
    offRating: number;
    defRating: number;
}

export function RatingCard({ offRating, defRating }: RatingCardProps) {
    const [mode, setMode] = useState<'OFF' | 'DEF' | 'NET'>('NET');

    const getValue = () => {
        if (mode === 'OFF') return offRating;
        if (mode === 'DEF') return defRating;
        return offRating - defRating; // NET
    };

    const getLabel = () => {
        if (mode === 'OFF') return 'Rating Ofensywny';
        if (mode === 'DEF') return 'Rating Defensywny';
        return 'Efektywność Netto';
    };

    const value = getValue();

    return (
        <BkpkCard variant="glass" overflowVisible className="h-full relative group">
            <div className="flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-bkpk-primary text-xs font-bold uppercase tracking-wider">{getLabel()}</span>
                            <BkpkTooltip content={
                                mode === 'OFF' ? "Punkty na 100 posiadań. Pokazuje realną jakość ataku, niezależnie od tempa meczu." :
                                    mode === 'DEF' ? "Punkty stracone na 100 posiadań. Im niższy, tym skuteczniej ograniczacie rywali." :
                                        "Ogólna różnica między atakiem a obroną. Dodatni wynik oznacza statystyczną dominację nad rywalami."
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
                                    {value > 0 ? `+${formatStatFixed(value)}` : formatStatFixed(value)}
                                </motion.h2>
                            </AnimatePresence>
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
                    <div className="w-full h-1.5 bg-bkpk-surface-tint-2 rounded-full overflow-hidden">
                        <motion.div
                            className={clsx(
                                "h-full rounded-full",
                                value >= 0 ? "bg-bkpk-success" : "bg-bkpk-danger"
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(Math.max(Math.abs(value) * 5, 10), 100)}%` }} // Simple visualization
                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-xs font-bold text-bkpk-text-muted uppercase tracking-[0.1em]">
                        <span>Słabo</span>
                        <div className="flex items-center gap-1">
                            <span>Średnio</span>
                            <BkpkTooltip content="Skala porównawcza względem ligi. 'Elita' to poziom czołowych zespołów, 'Słabo' sygnalizuje potrzebę zmian treningowych." />
                        </div>
                        <span>Elita</span>
                    </div>
                </div>
            </div>
        </BkpkCard>
    );
}

