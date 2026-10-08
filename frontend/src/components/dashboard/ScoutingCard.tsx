import { BkpkCard } from '../../shared/ui/BkpkCard';
import { Target, TrendingUp, TrendingDown, Users, ChevronRight } from 'lucide-react';
import { CalendarIcon as Calendar } from '../../shared/ui/BrandIcon';
import { cn } from '../../shared/lib/utils';
import BkpkButton from '../../shared/ui/BkpkButton';
import { useNavigate } from 'react-router-dom';
import KalkEmptyState from '../../shared/ui/KalkEmptyState';
import { formatStatFixed } from '../../shared/lib/formatStat';

interface ScoutingMatch {
    result: 'W' | 'L';
    scoreUs: number;
    scoreThem: number;
    opponent: string;
    date: string;
}

interface ScoutingPlayer {
    name: string;
    ppg: number;
}

interface ScoutingData {
    opponent: string;
    rank: number | null;
    wins: number;
    losses: number;
    form: ScoutingMatch[];
    ppg: number;
    oppg: number;
    keyPlayers: ScoutingPlayer[];
    scoutingMode?: 'upcoming' | 'lastFinished';
    usingLastMatchFallback?: boolean;
    matchDate?: string | null;
}

interface ScoutingCardProps {
    data: ScoutingData | null;
    loading?: boolean;
}

export default function ScoutingCard({ data, loading }: ScoutingCardProps) {
    const navigate = useNavigate();

    if (loading) {
        return (
            <BkpkCard title="Scouting Rywala" icon={<Users className="w-5 h-5 text-bkpk-primary" />}>
                <div className="py-12 flex justify-center">
                    <div className="w-6 h-6 border-4 border-bkpk-border-strong border-t-bkpk-primary rounded-full animate-spin" />
                </div>
            </BkpkCard>
        );
    }

    if (!data) {
        return (
            <BkpkCard
                title="Scouting Rywala"
                icon={<Users className="w-5 h-5 text-bkpk-primary" />}
                className="h-full flex flex-col"
            >
                <div className="flex-1 flex items-center justify-center min-h-[220px]">
                    <KalkEmptyState
                        title="Brak nadchodzącego rywala"
                        message="Brak zaplanowanych meczów w terminarzu wybranego sezonu."
                        className="border-none shadow-none bg-transparent p-4 text-center"
                    />
                </div>
            </BkpkCard>
        );
    }

    return (
        <BkpkCard
            title="Scouting Rywala"
            icon={<Users className="w-5 h-5 text-bkpk-primary" />}
            className="h-full flex flex-col"
        >
            <div className="flex-1 space-y-6">
                {data.usingLastMatchFallback ? (
                    <p className="label-caps text-[11px] text-bkpk-text-secondary border-l-2 border-bkpk-primary pl-2">
                        Brak nadchodzącego meczu — dane z ostatniego spotkania
                        {data.matchDate ? ` (${data.matchDate})` : ''}
                    </p>
                ) : null}
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <h4 className="text-2xl leading-none font-display font-extrabold uppercase text-bkpk-text-primary">
                            {data.opponent}
                        </h4>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="label-caps text-xs text-bkpk-text-secondary">Bilans:</span>
                            <span className="font-display text-lg leading-none tabular-nums text-bkpk-text-primary">{data.wins}-{data.losses}</span>
                        </div>
                    </div>
                    {data.rank && (
                        <div className="border border-bkpk-border-strong px-3 py-1.5 flex flex-col items-center">
                            <span className="label-caps text-[11px] text-bkpk-text-secondary">Miejsce</span>
                            <span className="font-display text-2xl leading-none tabular-nums text-bkpk-text-primary">{data.rank}.</span>
                        </div>
                    )}
                </div>

                <div className="space-y-2 min-w-0">
                    <label className="block label-caps text-xs text-bkpk-text-secondary">Ostatnia Forma</label>
                    <div className="grid grid-cols-3 gap-1.5 min-w-0">
                        {data.form.slice(0, 3).map((match, i) => (
                            <div
                                key={i}
                                className="min-w-0 bg-bkpk-bg border border-bkpk-border-subtle p-2 hover:border-bkpk-border-strong transition-colors overflow-hidden"
                            >
                                <div className={cn(
                                    "w-7 h-7 inline-grid place-items-center border-[1.5px] text-xs font-semibold leading-none mb-1.5",
                                    match.result === 'W'
                                        ? "bg-bkpk-text-primary border-bkpk-text-primary text-bkpk-bg"
                                        : "bg-transparent border-bkpk-text-secondary text-bkpk-text-primary"
                                )}>
                                    {match.result}
                                </div>
                                <div className="font-display text-base leading-none text-bkpk-text-primary truncate tabular-nums">{match.scoreUs}:{match.scoreThem}</div>
                                <div className="text-[11px] text-bkpk-text-muted truncate uppercase mt-1 leading-tight" title={match.opponent}>
                                    {match.opponent}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-bkpk-bg p-3 border border-bkpk-border-subtle">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-3.5 h-3.5 text-bkpk-success" aria-hidden="true" />
                            <span className="label-caps text-xs text-bkpk-text-secondary">Atak</span>
                        </div>
                        <div className="text-3xl leading-none font-display font-extrabold tabular-nums text-bkpk-text-primary">{formatStatFixed(data.ppg)} <span className="label-caps text-[11px] text-bkpk-text-muted">PPG</span></div>
                    </div>
                    <div className="bg-bkpk-bg p-3 border border-bkpk-border-subtle">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingDown className="w-3.5 h-3.5 text-bkpk-text-danger" aria-hidden="true" />
                            <span className="label-caps text-xs text-bkpk-text-secondary">Obrona</span>
                        </div>
                        <div className="text-3xl leading-none font-display font-extrabold tabular-nums text-bkpk-text-primary">{formatStatFixed(data.oppg)} <span className="label-caps text-[11px] text-bkpk-text-muted">PPG</span></div>
                    </div>
                </div>

                {data.keyPlayers && data.keyPlayers.length > 0 && (
                    <div className="space-y-2">
                        <label className="block label-caps text-xs text-bkpk-text-secondary">Kluczowi Gracze</label>
                        <div className="border-t border-bkpk-border-subtle">
                            {data.keyPlayers.map((player, i) => (
                                <div key={i} className="flex items-center justify-between px-2 py-2.5 border-b border-bkpk-border-subtle hover:bg-bkpk-surface-elevated transition-colors">
                                    <span className="text-sm font-semibold text-bkpk-text-primary">{player.name}</span>
                                    <span className="font-display text-lg leading-none tabular-nums text-bkpk-text-primary">{formatStatFixed(player.ppg)} <span className="label-caps text-[11px] text-bkpk-text-muted">pkt</span></span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <BkpkButton
                variant="ghost"
                className="w-full mt-6 group"
                onClick={() => navigate(`/scouting?opponent=${encodeURIComponent(data.opponent)}`)}
            >
                Pełny Raport
                <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </BkpkButton>
        </BkpkCard>
    );
}
