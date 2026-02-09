import {
    Radar, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    Tooltip
} from 'recharts';
import styles from './FourFactorsChart.module.css';

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
    if (!data) {
        return (
            <div className={styles.container}>
                <h3 className={styles.title}>{title}</h3>
                <div className={styles.noData}>Brak danych Four Factors</div>
            </div>
        );
    }

    // Normalize data for radar chart (0-100 scale)
    // eFG: 0.50 -> 50
    // TOV%: 0.15 -> 15 (lower is better, but we show raw value or inverse)
    // ORB%: 0.30 -> 30
    // FTR: 0.25 -> 25
    const chartData = [
        { subject: 'eFG%', value: Math.round(data.efg * 100), fullMark: 100 },
        { subject: 'TOV%', value: Math.round(data.tovPct * 100), fullMark: 100 },
        { subject: 'ORB%', value: Math.round(data.orbPct * 100), fullMark: 100 },
        { subject: 'FT Rate', value: Math.round(data.ftRate * 100), fullMark: 100 },
    ];

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>{title}</h3>
            <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height={300}>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                        <PolarGrid stroke="var(--bkpk-surface-tint-3)" />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: 'var(--bkpk-text-secondary)', fontSize: 12 }}
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
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--bkpk-color-surface-elevated)',
                                border: '1px solid var(--bkpk-border-strong)',
                                borderRadius: '8px',
                                color: 'var(--bkpk-text-primary)'
                            }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <span className={styles.efgColor}></span>
                    <span>eFG%: Skuteczność efektywna</span>
                </div>
                <div className={styles.legendItem}>
                    <span className={styles.tovColor}></span>
                    <span>TOV%: Straty (im mniej tym lepiej)</span>
                </div>
            </div>
        </div>
    );
}
