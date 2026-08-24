import { BkpkCard } from '../../shared/ui/BkpkCard';
import { Target, TrendingUp, TrendingDown, Users, Calendar, ChevronRight } from 'lucide-react';
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
                    <div className="w-6 h-6 border-4 border-bkpk-primary/20 border-t-bkpk-primary rounded-full animate-spin" />
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
                    <p className="text-[10px] font-bold text-bkpk-warning uppercase tracking-widest px-1">
                        Brak nadchodzącego meczu — dane z ostatniego spotkania
                        {data.matchDate ? ` (${data.matchDate})` : ''}
                    </p>
                ) : null}
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <h4 className="text-xl font-black font-outfit text-bkpk-text-primary group-hover:text-bkpk-primary transition-colors">
                            {data.opponent}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-bkpk-text-secondary uppercase tracking-widest">Bilans:</span>
                            <span className="text-sm font-black text-bkpk-text-primary">{data.wins}-{data.losses}</span>
                        </div>
                    </div>
                    {data.rank && (
                        <div className="bg-bkpk-surface-tint-2 border border-bkpk-border-strong px-3 py-1.5 rounded-xl flex flex-col items-center">
                            <span className="text-xs text-bkpk-text-secondary font-bold uppercase tracking-tighter">Miejsce</span>
                            <span className="text-base font-black text-bkpk-primary">{data.rank}.</span>
                        </div>
                    )}
                </div>

                <div className="space-y-2 min-w-0">
                    <label className="text-xs font-bold text-bkpk-text-secondary uppercase tracking-widest pl-1">Ostatnia Forma</label>
                    <div className="grid grid-cols-3 gap-1.5 min-w-0">
                        {data.form.slice(0, 3).map((match, i) => (
                            <div
                                key={i}
                                className="min-w-0 bg-bkpk-surface-tint-1 border border-bkpk-border-strong p-2 rounded-xl hover:bg-bkpk-surface-tint-2 transition-colors overflow-hidden"
                            >
                                <div className={cn(
                                    "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black mb-1.5",
                                    match.result === 'W' ? "bg-bkpk-success-fill text-white" : "bg-bkpk-danger-fill text-white"
                                )}>
                                    {match.result}
                                </div>
                                <div className="text-[11px] font-black text-bkpk-text-primary truncate tabular-nums">{match.scoreUs}:{match.scoreThem}</div>
                                <div className="text-[9px] text-bkpk-text-muted truncate uppercase mt-0.5 leading-tight" title={match.opponent}>
                                    {match.opponent}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-bkpk-surface-tint-2 p-3 rounded-2xl border border-bkpk-border-strong">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-3 h-3 text-bkpk-success" />
                            <span className="text-xs font-bold text-bkpk-text-secondary uppercase tracking-tighter">Atak</span>
                        </div>
                        <div className="text-lg font-black font-outfit text-bkpk-text-primary">{formatStatFixed(data.ppg)} <span className="text-2xs text-bkpk-text-muted uppercase">PPG</span></div>
                    </div>
                    <div className="bg-bkpk-surface-tint-2 p-3 rounded-2xl border border-bkpk-border-strong">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingDown className="w-3 h-3 text-bkpk-text-danger" />
                            <span className="text-xs font-bold text-bkpk-text-secondary uppercase tracking-tighter">Obrona</span>
                        </div>
                        <div className="text-lg font-black font-outfit text-bkpk-text-primary">{formatStatFixed(data.oppg)} <span className="text-2xs text-bkpk-text-muted uppercase">PPG</span></div>
                    </div>
                </div>

                {data.keyPlayers && data.keyPlayers.length > 0 && (
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-bkpk-text-secondary uppercase tracking-widest pl-1">Kluczowi Gracze</label>
                        <div className="space-y-1">
                            {data.keyPlayers.map((player, i) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-bkpk-surface-tint-2 transition-colors">
                                    <span className="text-sm font-bold text-bkpk-text-primary">{player.name}</span>
                                    <span className="text-sm font-black text-bkpk-primary">{formatStatFixed(player.ppg)} <span className="text-xs opacity-60 uppercase tracking-tighter">pkt</span></span>
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
