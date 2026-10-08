import { Swords } from 'lucide-react';
import BkpkCard from '../../shared/ui/BkpkCard';
import { cn } from '../../shared/lib/utils';
import { fmtShotPct } from '../../shared/lib/formatStat';

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
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-bkpk-border-subtle last:border-0 hover:bg-bkpk-surface-elevated transition-colors">
                <div className={cn(
                    "w-16 text-right font-display font-extrabold text-xl leading-none tabular-nums",
                    bkWinner ? "text-bkpk-text-primary" : "text-bkpk-text-muted"
                )}>
                    {bkValue}
                </div>
                <div className="flex-1 text-center label-caps text-[11px] text-bkpk-text-secondary px-2">
                    {label}
                </div>
                <div className={cn(
                    "w-16 text-left font-display font-extrabold text-xl leading-none tabular-nums",
                    oppWinner ? "text-bkpk-text-primary" : "text-bkpk-text-muted"
                )}>
                    {oppValue}
                </div>
            </div>
        );
    };

    const formatPct = (m?: number, a?: number) => fmtShotPct(m, a);

    return (
        <BkpkCard variant="glass" className="space-y-6">
            <div className="flex items-center gap-3 border-b border-bkpk-border-subtle pb-4">
                <div className="flex items-center justify-center w-9 h-9 border border-bkpk-border-strong shrink-0">
                    <Swords className="w-5 h-5 text-bkpk-primary" aria-hidden="true" />
                </div>
                <h3 className="text-[22px] sm:text-[24px] text-bkpk-text-primary">Porównanie Drużyn</h3>
            </div>

            <div className="flex justify-between items-center gap-3 px-3 pb-2 border-b-2 border-bkpk-text-primary">
                <span className="font-display font-extrabold uppercase text-base leading-tight text-bkpk-text-primary min-w-0 break-words">{bekapaka.name}</span>
                <span className="label-caps text-[11px] text-bkpk-primary shrink-0">VS</span>
                <span className="font-display font-extrabold uppercase text-base leading-tight text-bkpk-text-secondary min-w-0 break-words text-right">{opponent.name}</span>
            </div>

            <div>
                {renderStatRow('Punkty', bekapaka.pts || 0, opponent.pts || 0)}
                {renderStatRow('Z gry %', formatPct(bekapaka.fgm, bekapaka.fga), formatPct(opponent.fgm, opponent.fga))}
                {renderStatRow('Za 3 %', formatPct(bekapaka.three_pm, bekapaka.three_pa), formatPct(opponent.three_pm, opponent.three_pa))}
                {renderStatRow('Wolne %', formatPct(bekapaka.ftm, bekapaka.fta), formatPct(opponent.ftm, opponent.fta))}
                {renderStatRow('Zbiórki', bekapaka.reb || 0, opponent.reb || 0)}
                {renderStatRow('Asysty', bekapaka.ast || 0, opponent.ast || 0)}
                {renderStatRow('Straty', bekapaka.tov || 0, opponent.tov || 0, 'lower')}
                {renderStatRow('Przechwyty', bekapaka.stl || 0, opponent.stl || 0)}
                {renderStatRow('Bloki', bekapaka.blk || 0, opponent.blk || 0)}
            </div>
        </BkpkCard>
    );
}
