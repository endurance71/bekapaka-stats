import { InfoIcon as Info } from '../../shared/ui/BrandIcon';
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
                    <p className="label-caps text-bkpk-text-muted text-xs">Ładowanie statystyk...</p>
                </div>
            </BkpkCard>
        );
    }

    if (!teamStats) {
        return (
            <BkpkCard variant="glass" className="p-8 text-center">
                <p className="text-bkpk-text-muted text-sm">Brak statystyk zespołowych dla tego meczu</p>
            </BkpkCard>
        );
    }

    const formatPercent = (value?: number) =>
        value !== undefined && value !== null ? `${(value * 100).toFixed(1)}%` : '-';

    const formatNumber = (value?: number, decimals = 1) =>
        value !== undefined && value !== null ? value.toFixed(decimals) : '-';

    const StatItem = ({ label, value, desc, valueClass }: { label: string, value: string | number, desc: string, valueClass?: string }) => (
        <div className="flex flex-col p-3 sm:p-4 bg-bkpk-bg border border-bkpk-border-subtle hover:border-bkpk-border-strong transition-colors">
            <span className="label-caps text-[11px] text-bkpk-text-secondary mb-1.5">{label}</span>
            <span className={cn("text-3xl leading-none font-display font-extrabold tabular-nums text-bkpk-text-primary", valueClass)}>{value}</span>
            <span className="text-xs text-bkpk-text-muted truncate mt-1.5">{desc}</span>
        </div>
    );

    return (
        <BkpkCard variant="glass" className="space-y-6">
            <div className="flex items-center gap-3 border-b border-bkpk-border-subtle pb-4">
                <span className="w-6 h-[3px] bg-bkpk-primary shrink-0" aria-hidden="true" />
                <h3 className="text-[22px] sm:text-[24px] text-bkpk-text-primary">Statystyki Zespołowe</h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
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
                />
            </div>

            <div className="flex items-start gap-3 p-4 border-l-2 border-bkpk-primary bg-bkpk-bg">
                <Info className="w-5 h-5 text-bkpk-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-2">
                    <h4 className="label-caps text-xs text-bkpk-text-primary">Advanced Stats</h4>
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
