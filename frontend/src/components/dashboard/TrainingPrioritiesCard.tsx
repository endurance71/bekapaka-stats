import { BkpkCard } from '../../shared/ui/BkpkCard';
import { Target, AlertCircle, Info, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '../../shared/lib/utils';

interface TeamStats {
    ftPercentage?: number;
    turnovers?: number;
    rebounds?: number;
    assists?: number;
    efg?: number;
    fouls?: number;
    defense?: number;
}

interface Priority {
    level: 'high' | 'medium' | 'low';
    title: string;
    current: string;
    target: string;
    icon: any;
}

interface TrainingPrioritiesCardProps {
    teamStats?: TeamStats;
    leagueAverage?: TeamStats;
    loading?: boolean;
}

export default function TrainingPrioritiesCard({
    teamStats,
    leagueAverage,
    loading
}: TrainingPrioritiesCardProps) {

    const priorities: Priority[] = [];

    if (teamStats) {
        if (teamStats.ftPercentage !== undefined && teamStats.ftPercentage < 65) {
            priorities.push({
                level: teamStats.ftPercentage < 55 ? 'high' : 'medium',
                title: 'Rzuty wolne',
                current: `${teamStats.ftPercentage.toFixed(0)}%`,
                target: '70%',
                icon: Target
            });
        }

        if (teamStats.turnovers !== undefined && leagueAverage?.turnovers) {
            if (teamStats.turnovers > leagueAverage.turnovers * 1.1) {
                priorities.push({
                    level: teamStats.turnovers > leagueAverage.turnovers * 1.2 ? 'high' : 'medium',
                    title: 'Obrona piłki',
                    current: `${teamStats.turnovers.toFixed(1)} strat`,
                    target: `<${leagueAverage.turnovers.toFixed(0)}`,
                    icon: Shield
                });
            }
        }

        if (teamStats.rebounds !== undefined && teamStats.rebounds < 30) {
            priorities.push({
                level: teamStats.rebounds < 25 ? 'high' : 'medium',
                title: 'Zbiórki w ataku',
                current: `${teamStats.rebounds.toFixed(0)}%`,
                target: '35%',
                icon: TrendingUp
            });
        }

        if (teamStats.efg !== undefined && teamStats.efg < 45) {
            priorities.push({
                level: teamStats.efg < 38 ? 'high' : 'medium',
                title: 'Selekcja rzutów',
                current: `${teamStats.efg.toFixed(0)}% eFG`,
                target: '50%',
                icon: Target
            });
        }

        if (teamStats.defense !== undefined && leagueAverage?.defense) {
            if (teamStats.defense > leagueAverage.defense * 1.05) {
                priorities.push({
                    level: teamStats.defense > leagueAverage.defense * 1.15 ? 'high' : 'medium',
                    title: 'Powrót do obrony',
                    current: `${teamStats.defense.toFixed(0)} pkt strac.`,
                    target: `<${leagueAverage.defense.toFixed(0)}`,
                    icon: AlertCircle
                });
            }
        }
    }

    const levelOrder = { high: 0, medium: 1, low: 2 };
    priorities.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);

    if (loading) {
        return (
            <BkpkCard title="Priorytety Treningowe" icon={<Target className="w-5 h-5" />}>
                <div className="py-12 flex justify-center">
                    <div className="w-6 h-6 border-4 border-bkpk-primary/20 border-t-bkpk-primary rounded-full animate-spin" />
                </div>
            </BkpkCard>
        );
    }

    if (priorities.length === 0) {
        return (
            <BkpkCard title="Priorytety Treningowe" icon={<Target className="w-5 h-5 text-bkpk-primary" />}>
                <div className="py-12 text-center">
                    <p className="text-bkpk-text-muted font-bold uppercase tracking-widest text-xs">🎉 Świetna forma! Brak priorytetów.</p>
                </div>
            </BkpkCard>
        );
    }

    return (
        <BkpkCard title="Priorytety Treningowe" icon={<Target className="w-5 h-5 text-bkpk-primary" />}>
            <div className="space-y-3">
                {priorities.map((priority, index) => {
                    const Icon = priority.icon;
                    return (
                        <div
                            key={index}
                            className={cn(
                                "group p-4 rounded-xl border transition-all duration-300",
                                priority.level === 'high' ? "bg-bkpk-danger/5 border-bkpk-danger/20" :
                                    priority.level === 'medium' ? "bg-bkpk-warning/5 border-bkpk-warning/20" :
                                                "bg-bkpk-surface-tint-1 border-bkpk-border-strong"
                            )}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "p-2 rounded-lg",
                                        priority.level === 'high' ? "bg-bkpk-danger/10 text-bkpk-danger" :
                                            priority.level === 'medium' ? "bg-bkpk-warning/10 text-bkpk-warning" :
                                                "bg-bkpk-surface-tint-2 text-bkpk-text-muted"
                                    )}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <span className="font-bold font-outfit text-bkpk-text-primary text-base">{priority.title}</span>
                                </div>
                                <div className={cn(
                                    "px-2 py-0.5 rounded text-xs font-black uppercase tracking-widest",
                                    priority.level === 'high' ? "bg-bkpk-danger-fill text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]" :
                                        priority.level === 'medium' ? "bg-bkpk-warning-fill text-white" :
                                            "bg-bkpk-border-strong text-white"
                                )}>
                                    {priority.level === 'high' ? 'Krytyczny' : priority.level === 'medium' ? 'Ważny' : 'Niski'}
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-xs text-bkpk-text-secondary font-bold uppercase tracking-tighter">Obecnie</span>
                                    <span className="text-base font-black text-bkpk-text-primary">{priority.current}</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-bkpk-text-muted" />
                                <div className="flex flex-col text-right">
                                    <span className="text-xs text-bkpk-text-secondary font-bold uppercase tracking-tighter">Cel</span>
                                    <span className="text-base font-black text-bkpk-primary">{priority.target}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </BkpkCard>
    );
}

import { Shield } from 'lucide-react';
