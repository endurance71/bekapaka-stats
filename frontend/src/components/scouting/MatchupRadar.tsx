import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import BkpkCard from '../../shared/ui/BkpkCard';
import { Crosshair } from 'lucide-react';
import { MatchupStatCards } from './MatchupStatCards';
import {
  chartColors,
  chartTooltipItemStyle,
  chartTooltipLabelStyle,
  chartTooltipStyle
} from '../../shared/lib/chartTheme';

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

const CHART_HEIGHT = 300;

function normalizeRadarValue(value: number, maxHint: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (maxHint > 0 && value <= maxHint) {
    return Math.min(100, Math.round((value / maxHint) * 100));
  }
  return Math.min(100, Math.round(value));
}

function buildRadarSeries(bekapaka: Stats, opponent: Stats) {
  const paceMax = Math.max(bekapaka.pace, opponent.pace, 1);
  const threeMax = Math.max(bekapaka.threePtPct, opponent.threePtPct, 1);
  const ppgMax = Math.max(bekapaka.ppg, opponent.ppg, 1);

  return [
    {
      subject: 'Ofensywa',
      A: normalizeRadarValue(bekapaka.ppg, ppgMax),
      B: normalizeRadarValue(opponent.ppg, ppgMax),
      fullMark: 100
    },
    {
      subject: 'Defensywa',
      A: normalizeRadarValue(Math.max(0, 100 - bekapaka.oppg), 100),
      B: normalizeRadarValue(Math.max(0, 100 - opponent.oppg), 100),
      fullMark: 100
    },
    {
      subject: 'Tempo',
      A: normalizeRadarValue(bekapaka.pace, paceMax),
      B: normalizeRadarValue(opponent.pace, paceMax),
      fullMark: 100
    },
    {
      subject: '3PT%',
      A: normalizeRadarValue(bekapaka.threePtPct, threeMax),
      B: normalizeRadarValue(opponent.threePtPct, threeMax),
      fullMark: 100
    },
    {
      subject: 'Wygrane%',
      A: normalizeRadarValue(bekapaka.winPct, 100),
      B: normalizeRadarValue(opponent.winPct, 100),
      fullMark: 100
    }
  ];
}

function hasVisibleRadarShape(bekapaka: Stats, opponent: Stats): boolean {
  const values = [
    bekapaka.ppg,
    opponent.ppg,
    bekapaka.winPct,
    opponent.winPct,
    bekapaka.oppg,
    opponent.oppg
  ];
  return values.some((v) => Number.isFinite(v) && v > 0);
}

export function MatchupRadar({ opponent, bekapaka }: Props) {
  const data = buildRadarSeries(bekapaka, opponent);
  const showChart = hasVisibleRadarShape(bekapaka, opponent);

  return (
    <BkpkCard
      title="Porównanie drużyn"
      icon={<Crosshair className="h-5 w-5 text-bkpk-primary" />}
      variant="flat"
      overflowVisible
    >
      {showChart ? (
        <div className="w-full" style={{ height: CHART_HEIGHT }}>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
              <PolarGrid stroke={chartColors.grid} strokeDasharray="2 4" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: chartColors.axis, fontSize: 12, fontWeight: 600 }}
              />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name={bekapaka.name}
                dataKey="A"
                stroke={chartColors.team}
                strokeWidth={2.5}
                fill={chartColors.team}
                fillOpacity={0.2}
              />
              <Radar
                name={opponent.name}
                dataKey="B"
                stroke={chartColors.opponent}
                strokeWidth={2}
                strokeDasharray="5 4"
                fill={chartColors.opponent}
                fillOpacity={0.08}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-text)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
                iconType="square"
                iconSize={10}
              />
              <Tooltip
                contentStyle={chartTooltipStyle}
                itemStyle={chartTooltipItemStyle}
                labelStyle={chartTooltipLabelStyle}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="border border-dashed border-bkpk-border-strong px-3 py-2 text-center text-sm text-bkpk-text-muted">
          Brak wystarczających danych do wykresu — poniżej porównanie liczbowe.
        </p>
      )}

      <div className={showChart ? 'mt-4 border-t border-bkpk-border-subtle pt-4' : 'mt-3'}>
        <MatchupStatCards opponent={opponent} bekapaka={bekapaka} compact />
      </div>
    </BkpkCard>
  );
}
