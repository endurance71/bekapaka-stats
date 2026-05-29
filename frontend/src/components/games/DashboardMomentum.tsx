import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Activity } from 'lucide-react';
import BkpkCard from '../../shared/ui/BkpkCard';
import useIsMobile from '../../hooks/useIsMobile';

interface MomentumPoint {
    time: string;
    bekapaka: number;
    opponent: number;
    diff: number;
}

interface DashboardMomentumProps {
    data: any[];
    bkCode: string;
    oppCode: string;
    step?: number; // Time interval in minutes (5 for granular, 10 for quarters)
}

export default function DashboardMomentum({ data, bkCode, oppCode, step = 5 }: DashboardMomentumProps) {
    const isMobile = useIsMobile();

    if (!data || data.length === 0) return null;

    // Transform raw data: [{team: 'BB', points: [...]}, {team: 'PR', points: [...]}]
    const bkPoints = data.find(d => d.team === bkCode)?.points || [];
    const oppPoints = data.find(d => d.team === oppCode)?.points || [];

    const chartData: MomentumPoint[] = bkPoints.map((pts: number, idx: number) => ({
        time: `${(idx + 1) * step}'`,
        bekapaka: pts,
        opponent: oppPoints[idx] || 0,
        diff: pts - (oppPoints[idx] || 0)
    }));

    // Add 0,0 point
    chartData.unshift({ time: '0\'', bekapaka: 0, opponent: 0, diff: 0 });

    return (
        <BkpkCard variant="glass" className="space-y-6 overflow-hidden w-full">
            <div className="flex items-center gap-2 border-b border-bkpk-border-strong pb-4">
                <Activity className="w-5 h-5 text-bkpk-primary" />
                <h3 className="text-xl font-bold text-bkpk-text-primary font-outfit">
                    Dynamika Meczu ({step === 5 ? '5' : '10'}-min bloki)
                </h3>
            </div>

            <div className="w-full" style={{ height: isMobile ? '200px' : '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorDiff" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-bkpk-primary)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--color-bkpk-primary)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--bkpk-surface-tint-2)" />
                        <XAxis
                            dataKey="time"
                            stroke="var(--bkpk-text-muted)"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            interval={isMobile ? Math.ceil(chartData.length / 5) : 0}
                        />
                        <YAxis
                            stroke="var(--bkpk-text-muted)"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            width={isMobile ? 25 : 40}
                        />
                        <Tooltip
                            trigger={isMobile ? 'click' : 'hover'}
                            contentStyle={{
                                backgroundColor: 'var(--bkpk-color-surface-elevated)',
                                border: '1px solid var(--bkpk-border-strong)',
                                borderRadius: '12px',
                                backdropFilter: 'blur(10px)',
                                fontSize: '12px'
                            }}
                            itemStyle={{ color: 'var(--bkpk-text-primary)', fontWeight: 'bold' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="diff"
                            name="Różnica (BK - OPP)"
                            stroke="var(--color-bkpk-primary)"
                            fillOpacity={1}
                            fill="url(#colorDiff)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-bold text-bkpk-text-secondary uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-bkpk-primary shadow-[0_0_10px_rgba(255,107,53,0.5)]"></span>
                <span>Przewaga punktowa BeKaPaKa</span>
            </div>
        </BkpkCard>
    );
}
