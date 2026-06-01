
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import BkpkCard from '../../shared/ui/BkpkCard';
import { Crosshair } from 'lucide-react';
import useIsMobile from '../../hooks/useIsMobile';

interface Stats {
    ppg: number;
    oppg: number;
    winPct: number;
    pace: number;
    threePtPct: number;
}

interface Props {
    opponent: Stats & { name: string };
    bekapaka: Stats & { name: string };
}

export const MatchupRadar: React.FC<Props> = ({ opponent, bekapaka }) => {
    const isMobile = useIsMobile();

    const data = [
        { subject: 'Ofensywa', A: Number(bekapaka.ppg.toFixed(2)), B: Number(opponent.ppg.toFixed(2)), fullMark: 100 },
        { subject: 'Defensywa', A: Number((100 - bekapaka.oppg).toFixed(2)), B: Number((100 - opponent.oppg).toFixed(2)), fullMark: 100 },
        { subject: 'Tempo', A: Number(bekapaka.pace.toFixed(2)), B: Number(opponent.pace.toFixed(2)), fullMark: 100 },
        { subject: '3PT%', A: Number(bekapaka.threePtPct.toFixed(2)), B: Number(opponent.threePtPct.toFixed(2)), fullMark: 100 },
        { subject: 'Zwycięstwa%', A: Number(bekapaka.winPct.toFixed(2)), B: Number(opponent.winPct.toFixed(2)), fullMark: 100 },
    ];

    return (
        <BkpkCard
            title="Analiza Porównawcza"
            icon={<Crosshair className="w-5 h-5 text-bkpk-primary" />}
            variant="glass"
            className="h-full min-h-[350px]"
        >
            <div className="flex flex-col h-full">
                <div className="flex-1 w-full md:-ml-4" style={{ height: isMobile ? '220px' : '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius={isMobile ? '58%' : '70%'} data={data}>
                            <PolarGrid stroke="var(--bkpk-border-subtle)" strokeDasharray="3 3" />
                            <PolarAngleAxis
                                dataKey="subject"
                                tick={{ fill: 'var(--bkpk-text-secondary)', fontSize: isMobile ? 10 : 12, fontWeight: 700 }}
                            />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />

                            <Radar
                                name={bekapaka.name}
                                dataKey="A"
                                stroke="var(--bkpk-color-primary)"
                                strokeWidth={3}
                                fill="var(--bkpk-color-primary)"
                                fillOpacity={0.4}
                            />
                            <Radar
                                name={opponent.name}
                                dataKey="B"
                                stroke="var(--bkpk-color-danger)"
                                strokeWidth={3}
                                fill="var(--bkpk-color-danger)"
                                fillOpacity={0.4}
                            />
                            <Legend
                                wrapperStyle={{ fontSize: isMobile ? '10px' : '12px', fontWeight: 'bold' }}
                                iconSize={isMobile ? 8 : 10}
                            />
                            <Tooltip
                                trigger={isMobile ? 'click' : 'hover'}
                                contentStyle={{ background: 'var(--bkpk-color-surface-elevated)', border: '1px solid var(--bkpk-border-strong)', borderRadius: 12, color: 'var(--bkpk-text-primary)', fontSize: '12px' }}
                                itemStyle={{ color: 'var(--bkpk-text-primary)', fontSize: isMobile ? '11px' : '12px', fontWeight: 'bold' }}
                                labelStyle={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-4 pt-4 border-t border-bkpk-border-strong text-center">
                    <div className="text-xs text-bkpk-text-muted mb-1">
                        Porównanie potencjału w 5 kluczowych obszarach
                    </div>
                    <div className="text-sm font-bold text-bkpk-primary">
                        Szukaj przewag tam, gdzie Twój wykres jest szerszy.
                    </div>
                </div>
            </div>
        </BkpkCard>
    );
};
