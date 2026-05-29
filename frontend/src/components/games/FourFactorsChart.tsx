import {
    Radar, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    Tooltip
} from 'recharts';
import BkpkCard from '../../shared/ui/BkpkCard';
import useIsMobile from '../../hooks/useIsMobile';
import { Target } from 'lucide-react';

interface FourFactors {
    efg: number;
    tovPct: number;
    orbPct: number;
    ftRate: number;
}

interface FourFactorsChartProps {
    data: FourFactors | null;
    title?: string;
}

export default function FourFactorsChart({ data, title = "Four Factors" }: FourFactorsChartProps) {
    const isMobile = useIsMobile();

    if (!data) {
        return (
            <BkpkCard variant="glass" className="w-full">
                <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-bkpk-primary" />
                    <h3 className="text-lg font-bold text-bkpk-text-primary font-outfit">{title}</h3>
                </div>
                <div className="h-[200px] flex items-center justify-center text-bkpk-text-muted text-sm italic border border-dashed border-bkpk-border-strong rounded-2xl">
                    Brak danych Four Factors
                </div>
            </BkpkCard>
        );
    }

    const chartData = [
        { subject: 'eFG%', value: Math.round(data.efg * 100), fullMark: 100 },
        { subject: 'TOV%', value: Math.round(data.tovPct * 100), fullMark: 100 },
        { subject: 'ORB%', value: Math.round(data.orbPct * 100), fullMark: 100 },
        { subject: 'FT Rate', value: Math.round(data.ftRate * 100), fullMark: 100 },
    ];

    return (
        <BkpkCard variant="glass" className="w-full space-y-6">
            <div className="flex items-center gap-2 border-b border-bkpk-border-strong pb-4">
                <Target className="w-5 h-5 text-bkpk-primary" />
                <h3 className="text-xl font-bold text-bkpk-text-primary font-outfit">{title}</h3>
            </div>

            <div className="w-full flex justify-center items-center" style={{ height: isMobile ? '220px' : '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius={isMobile ? '60%' : '80%'} data={chartData}>
                        <PolarGrid stroke="var(--bkpk-surface-tint-3)" />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: 'var(--bkpk-text-secondary)', fontSize: isMobile ? 10 : 12, fontWeight: 700 }}
                        />
                        <PolarRadiusAxis
                            angle={30}
                            domain={[0, 100]}
                            tick={false}
                            axisLine={false}
                        />
                        <Radar
                            name="My"
                            dataKey="value"
                            stroke="var(--bkpk-color-primary)"
                            fill="var(--bkpk-color-primary)"
                            fillOpacity={0.5}
                            strokeWidth={2}
                        />
                        <Tooltip
                            trigger={isMobile ? 'click' : 'hover'}
                            contentStyle={{
                                backgroundColor: 'var(--bkpk-color-surface-elevated)',
                                border: '1px solid var(--bkpk-border-strong)',
                                borderRadius: '12px',
                                color: 'var(--bkpk-text-primary)',
                                fontSize: '12px'
                            }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            <div className="flex flex-col gap-2 pt-4 border-t border-bkpk-border-strong text-xs text-bkpk-text-muted">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-bkpk-primary rounded-sm"></span>
                    <span><strong>eFG%</strong>: Skuteczność efektywna (rzuty z gry)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-bkpk-border-strong rounded-sm"></span>
                    <span><strong>TOV%</strong>: Straty posiadania (im mniej tym lepiej)</span>
                </div>
            </div>
        </BkpkCard>
    );
}
