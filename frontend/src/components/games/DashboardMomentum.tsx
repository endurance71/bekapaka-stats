import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Activity } from 'lucide-react';
import BkpkCard from '../../shared/ui/BkpkCard';
import useIsMobile from '../../hooks/useIsMobile';
import {
    chartAxisProps,
    chartColors,
    chartGridProps,
    chartTooltipItemStyle,
    chartTooltipLabelStyle,
    chartTooltipStyle,
} from '../../shared/lib/chartTheme';

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
            <div className="flex items-center gap-3 border-b border-bkpk-border-subtle pb-4">
                <div className="flex items-center justify-center w-9 h-9 border border-bkpk-border-strong shrink-0">
                    <Activity className="w-5 h-5 text-bkpk-primary" aria-hidden="true" />
                </div>
                <h3 className="text-[22px] sm:text-[24px] text-bkpk-text-primary">
                    Dynamika Meczu ({step === 5 ? '5' : '10'}-min bloki)
                </h3>
            </div>

            <div className="w-full" style={{ height: isMobile ? '200px' : '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <CartesianGrid {...chartGridProps} />
                        <XAxis
                            dataKey="time"
                            {...chartAxisProps}
                            interval={isMobile ? Math.ceil(chartData.length / 5) : 0}
                        />
                        <YAxis
                            {...chartAxisProps}
                            width={isMobile ? 25 : 40}
                        />
                        <Tooltip
                            trigger={isMobile ? 'click' : 'hover'}
                            contentStyle={chartTooltipStyle}
                            itemStyle={chartTooltipItemStyle}
                            labelStyle={chartTooltipLabelStyle}
                            cursor={{ stroke: chartColors.axis, strokeDasharray: '2 4' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="diff"
                            name="Różnica (BK - OPP)"
                            stroke={chartColors.team}
                            fill={chartColors.team}
                            fillOpacity={0.14}
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-2 label-caps text-xs text-bkpk-text-secondary">
                <span className="w-6 h-[3px] bg-bkpk-primary" aria-hidden="true"></span>
                <span>Przewaga punktowa BeKaPaKa</span>
            </div>
        </BkpkCard>
    );
}
