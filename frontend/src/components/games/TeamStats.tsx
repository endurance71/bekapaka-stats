import { Info } from 'lucide-react';
import BkpkCard from '../../shared/ui/BkpkCard';
import { cn } from '../../shared/lib/utils';

interface TeamStatsData {
    efg?: number;  // Effective Field Goal %
    tovPct?: number;  // Turnover %
    orbPct?: number;  // Offensive Rebound %
    ftRate?: number;  // Free Throw Rate
    offRtg?: number;
    defRtg?: number;
    netRtg?: number;
    possessions?: number;
    pace?: number;
}

interface TeamStatsProps {
    teamStats: TeamStatsData | null;
    loading?: boolean;
}

export default function TeamStats({ teamStats, loading }: TeamStatsProps) {
    if (loading) {
        return (
            <BkpkCard variant="glass" className="h-48 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-bkpk-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-bkpk-text-muted text-xs uppercase tracking-widest font-bold">Ładowanie statystyk...</p>
                </div>
            </BkpkCard>
        );
    }

    if (!teamStats) {
        return (
            <BkpkCard variant="glass" className="p-8 text-center">
                <p className="text-bkpk-text-muted text-sm italic">Brak statystyk zespołowych dla tego meczu</p>
            </BkpkCard>
        );
    }

    const formatPercent = (value?: number) =>
        value !== undefined && value !== null ? `${(value * 100).toFixed(1)}%` : '-';

    const formatNumber = (value?: number, decimals = 1) =>
        value !== undefined && value !== null ? value.toFixed(decimals) : '-';

    const StatItem = ({ label, value, desc, valueClass }: { label: string, value: string | number, desc: string, valueClass?: string }) => (
        <div className="flex flex-col p-4 bg-bkpk-surface-tint-2 rounded-xl border border-bkpk-border-strong hover:border-bkpk-primary/40 transition-colors">
            <span className="text-xs font-bold text-bkpk-text-muted uppercase tracking-widest mb-1">{label}</span>
            <span className={cn("text-2xl font-black font-outfit text-bkpk-text-primary", valueClass)}>{value}</span>
            <span className="text-xs text-bkpk-text-muted truncate">{desc}</span>
        </div>
    );

    return (
        <BkpkCard variant="glass" className="space-y-6">
            <div className="flex items-center gap-2 border-b border-bkpk-border-strong pb-4">
                <span className="w-2 h-8 rounded-full bg-bkpk-primary" />
                <h3 className="text-xl font-bold text-bkpk-text-primary font-outfit">Statystyki Zespołowe</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <StatItem
                    label="EFG%"
                    value={formatPercent(teamStats.efg)}
                    desc="Efektywność rzutów"
                />
                <StatItem
                    label="TO%"
                    value={formatPercent(teamStats.tovPct)}
                    desc="Procent strat"
                />
                <StatItem
                    label="OffRtg"
                    value={formatNumber(teamStats.offRtg)}
                    desc="Pkt / 100 posiadań"
                    valueClass="text-bkpk-primary"
                />
                <StatItem
                    label="DefRtg"
                    value={formatNumber(teamStats.defRtg)}
                    desc="Pkt stracone / 100 pos"
                />
                <StatItem
                    label="NetRtg"
                    value={`${teamStats.netRtg && teamStats.netRtg > 0 ? '+' : ''}${formatNumber(teamStats.netRtg)}`}
                    desc="Różnica efektywności"
                    valueClass={teamStats.netRtg && teamStats.netRtg > 0 ? "text-bkpk-success" : "text-bkpk-text-danger"}
                />
                <StatItem
                    label="Pace"
                    value={formatNumber(teamStats.pace)}
                    desc="Tempo (pos/40min)"
                    valueClass="text-bkpk-warning"
                />
            </div>

            <div className="flex items-start gap-3 p-4 bg-bkpk-primary/5 rounded-xl border border-bkpk-primary/10">
                <Info className="w-5 h-5 text-bkpk-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                    <h4 className="text-xs font-bold text-bkpk-primary uppercase tracking-widest">Advanced Stats</h4>
                    <p className="text-xs text-bkpk-text-secondary leading-relaxed">
                        <strong>OffRtg/DefRtg</strong> mierzą efektywność na 100 posiadań.
                        <strong> NetRtg</strong> to różnica (plus = dobrze).
                        <strong> Pace</strong> to szacowana liczba posiadań.
                    </p>
                </div>
            </div>
        </BkpkCard>
    );
}
