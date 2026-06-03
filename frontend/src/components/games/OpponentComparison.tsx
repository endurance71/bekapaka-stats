import { Swords } from 'lucide-react';
import BkpkCard from '../../shared/ui/BkpkCard';
import { cn } from '../../shared/lib/utils';

interface TeamStats {
    name: string;
    isBekapaka: boolean;
    pts?: number;
    fgm?: number;
    fga?: number;
    three_pm?: number;
    three_pa?: number;
    ftm?: number;
    fta?: number;
    reb?: number;
    ast?: number;
    stl?: number;
    blk?: number;
    tov?: number;
}

interface OpponentComparisonProps {
    bekapaka: TeamStats;
    opponent: TeamStats;
}

export default function OpponentComparison({ bekapaka, opponent }: OpponentComparisonProps) {
    const renderStatRow = (label: string, bkValue: any, oppValue: any, target: 'higher' | 'lower' = 'higher') => {
        const bkNum = parseFloat(bkValue) || 0;
        const oppNum = parseFloat(oppValue) || 0;

        const bkWinner = target === 'higher' ? bkNum > oppNum : bkNum < oppNum;
        const oppWinner = target === 'higher' ? oppNum > bkNum : oppNum < bkNum;

        return (
            <div className="flex items-center justify-between p-3 border-b border-bkpk-border-strong last:border-0 hover:bg-bkpk-surface-tint-2 transition-colors rounded-lg">
                <div className={cn(
                    "w-16 text-right font-black font-outfit text-lg",
                    bkWinner ? "text-bkpk-success" : "text-bkpk-text-muted"
                )}>
                    {bkValue}
                </div>
                <div className="flex-1 text-center text-xs font-bold text-bkpk-text-muted uppercase tracking-widest px-2">
                    {label}
                </div>
                <div className={cn(
                    "w-16 text-left font-black font-outfit text-lg",
                    oppWinner ? "text-bkpk-text-danger" : "text-bkpk-text-muted"
                )}>
                    {oppValue}
                </div>
            </div>
        );
    };

    const formatPct = (m?: number, a?: number) => a ? `${((m || 0) / a * 100).toFixed(1)}%` : '0%';

    return (
        <BkpkCard variant="glass" className="space-y-6">
            <div className="flex items-center gap-2 border-b border-bkpk-border-strong pb-4">
                <Swords className="w-5 h-5 text-bkpk-warning" />
                <h3 className="text-xl font-bold text-bkpk-text-primary font-outfit">Porównanie Drużyn</h3>
            </div>

            <div className="flex justify-between items-center text-sm font-bold text-bkpk-text-secondary px-4 pb-2">
                <span className="text-bkpk-primary">{bekapaka.name}</span>
                <span className="text-2xs uppercase tracking-widest text-bkpk-text-muted">VS</span>
                <span>{opponent.name}</span>
            </div>

            <div className="space-y-1">
                {renderStatRow('Punkty', bekapaka.pts || 0, opponent.pts || 0)}
                {renderStatRow('FG%', formatPct(bekapaka.fgm, bekapaka.fga), formatPct(opponent.fgm, opponent.fga))}
                {renderStatRow('3P%', formatPct(bekapaka.three_pm, bekapaka.three_pa), formatPct(opponent.three_pm, opponent.three_pa))}
                {renderStatRow('FT%', formatPct(bekapaka.ftm, bekapaka.fta), formatPct(opponent.ftm, opponent.fta))}
                {renderStatRow('Zbiórki', bekapaka.reb || 0, opponent.reb || 0)}
                {renderStatRow('Asysty', bekapaka.ast || 0, opponent.ast || 0)}
                {renderStatRow('Straty', bekapaka.tov || 0, opponent.tov || 0, 'lower')}
                {renderStatRow('Przechwyty', bekapaka.stl || 0, opponent.stl || 0)}
                {renderStatRow('Bloki', bekapaka.blk || 0, opponent.blk || 0)}
            </div>
        </BkpkCard>
    );
}
