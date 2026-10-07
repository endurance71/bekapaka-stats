import { useEffect, useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar
} from 'recharts';
import { fetchJSON } from '../lib/api';
import { PieChart, Target, Zap, Activity } from 'lucide-react';
import { cn } from '../shared/lib/utils';
import BkpkCard from '../shared/ui/BkpkCard';
import useIsMobile from '../hooks/useIsMobile';
import PageContainer from '../shared/ui/PageContainer';
import PageHeader from '../shared/ui/PageHeader';
import PageLoader from '../shared/ui/PageLoader';
import {
  chartAxisProps,
  chartCategorical,
  chartColors,
  chartGridProps,
  chartTooltipItemStyle,
  chartTooltipLabelStyle,
  chartTooltipStyle,
} from '../shared/lib/chartTheme';

interface TeamTrend {
  gameId: string;
  date: string;
  opponent: string;
  efg: number;
  tovPct: number;
  orbPct: number;
  ftRate: number;
  offRtg: number;
  pace: number;
  scoreUs: number;
  scoreThem: number;
  fastBreakPoints: number;
  pointsOffTO: number;
  benchPoints: number;
  secondChancePoints: number;
}

interface LeagueComparison {
  bekapaka: {
    ppg: number;
    oppg: number;
    winPct: number;
  };
  league: {
    ppg: number;
    oppg: number;
    winPct: number;
  };
  rankings: {
    points: string;
    defense: string;
  };
}

import { useSeasonPreferenceContext } from '../context/SeasonPreferenceContext';

export default function Trends() {
  const [trends, setTrends] = useState<TeamTrend[]>([]);
  const [comparison, setComparison] = useState<LeagueComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const { seasonId } = useSeasonPreferenceContext();

  useEffect(() => {
    setLoading(true);
    const q = seasonId ? `?seasonId=${encodeURIComponent(seasonId)}` : '';
    Promise.all([
      fetchJSON<TeamTrend[]>(`/api/trends/team${q}`),
      fetchJSON<LeagueComparison>(`/api/trends/league${q}`)
    ]).then(([trendsData, compData]) => {
      setTrends((trendsData || []).filter(t => t !== null && t !== undefined).map(t => ({
        ...t,
        formattedDate: new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        benchPoints: Number(t.benchPoints || 0),
        fastBreakPoints: Number(t.fastBreakPoints || 0),
        pointsOffTO: Number(t.pointsOffTO || 0),
        secondChancePoints: Number(t.secondChancePoints || 0)
      })));
      setComparison(compData);
    }).catch(err => console.error('Error fetching trends:', err))
      .finally(() => setLoading(false));
  }, [seasonId]);

  const radarData = useMemo(() => {
    if (!comparison) return [];
    return [
      { subject: 'Atak (PPG)', A: (comparison.bekapaka.ppg / (comparison.league.ppg || 1)) * 100, fullMark: 150 },
      { subject: 'Obrona (pPPG)', A: (comparison.league.oppg / (comparison.bekapaka.oppg || 1)) * 100, fullMark: 150 },
      { subject: '% Zwycięstw', A: (comparison.bekapaka.winPct / (comparison.league.winPct || 1)) * 100, fullMark: 150 },
    ];
  }, [comparison]);

  const hasTrends = trends.length > 0;
  const hasLeagueData = Boolean(comparison && (comparison.bekapaka.ppg > 0 || comparison.league.ppg > 0));

  if (loading) {
    return <PageLoader fullScreen label="Analizowanie DNA wyników..." />;
  }

  const sectionIconClass = "w-9 h-9 border border-bkpk-border-strong flex items-center justify-center shrink-0";
  const emptyIconClass = "w-12 h-12 border border-bkpk-border-subtle flex items-center justify-center";

  return (
    <PageContainer>
      <PageHeader
        kicker="Centrum Analityczne"
        title={<>Analizy i <span className="text-bkpk-primary">Trendy</span></>}
        description="Szczegółowa ewolucja wyników drużyny i porównanie z ligą."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

        {/* Main Trend Chart */}
        <div className="lg:col-span-8 space-y-6 lg:space-y-8">
          <BkpkCard variant="flat" className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className={sectionIconClass}>
                  <Activity className="w-4 h-4 text-bkpk-primary" />
                </span>
                <h3 className="text-[22px] sm:text-[24px] text-bkpk-text-primary">Ewolucja Efektywności</h3>
              </div>
              {hasTrends && (
                <div className="flex gap-5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-[3px]" style={{ backgroundColor: chartColors.team }} aria-hidden="true" />
                    <span className="label-caps text-[11px] text-bkpk-text-secondary">Rtg Ofensywny</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-0 border-t-2 border-dashed" style={{ borderColor: chartColors.secondary }} aria-hidden="true" />
                    <span className="label-caps text-[11px] text-bkpk-text-secondary">Tempo</span>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full mt-4" style={{ height: isMobile ? '220px' : '400px' }}>
              {hasTrends ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends}>
                    <CartesianGrid {...chartGridProps} />
                    <XAxis
                      dataKey="formattedDate"
                      {...chartAxisProps}
                      dy={10}
                      interval={isMobile ? Math.ceil(trends.length / 4) : 0}
                    />
                    <YAxis
                      yAxisId="left"
                      {...chartAxisProps}
                      dx={-10}
                      width={isMobile ? 25 : 40}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
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
                      yAxisId="left"
                      type="monotone"
                      dataKey="offRtg"
                      stroke={chartColors.team}
                      strokeWidth={3}
                      fill={chartColors.team}
                      fillOpacity={0.12}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="pace"
                      stroke={chartColors.secondary}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fill="transparent"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                  <span className={emptyIconClass}>
                    <Activity className="w-6 h-6 text-bkpk-text-muted" />
                  </span>
                  <div className="space-y-1">
                    <p className="label-caps text-[13px] text-bkpk-text-primary">Brak danych o efektywności</p>
                    <p className="text-sm text-bkpk-text-muted max-w-sm">Wykres ewolucji ratingu ofensywnego i tempa gry pojawi się po rozegraniu pierwszych meczów w tym sezonie.</p>
                  </div>
                </div>
              )}
            </div>
          </BkpkCard>

          {/* Point Contributors Bar Chart */}
          <BkpkCard variant="flat" className="space-y-6">
            <div className="flex items-center gap-3">
              <span className={sectionIconClass}>
                <PieChart className="w-4 h-4 text-bkpk-primary" />
              </span>
              <h3 className="text-[22px] sm:text-[24px] text-bkpk-text-primary">DNA Zdobywanych Punktów</h3>
            </div>

            <div className="w-full" style={{ height: isMobile ? '200px' : '300px' }}>
              {hasTrends && trends.some(t => (t.benchPoints || 0) + (t.fastBreakPoints || 0) + (t.pointsOffTO || 0) + (t.secondChancePoints || 0) > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends}>
                    <CartesianGrid {...chartGridProps} />
                    <XAxis dataKey="formattedDate" {...chartAxisProps} interval={isMobile ? Math.ceil(trends.length / 4) : 0} />
                    <YAxis {...chartAxisProps} width={isMobile ? 25 : 35} />
                    <Tooltip
                      trigger={isMobile ? 'click' : 'hover'}
                      cursor={{ fill: chartColors.cursor }}
                      contentStyle={chartTooltipStyle}
                      itemStyle={chartTooltipItemStyle}
                      labelStyle={chartTooltipLabelStyle}
                    />
                    <Bar dataKey="benchPoints" name="Ławka" stackId="a" fill={chartCategorical[0]} />
                    <Bar dataKey="fastBreakPoints" name="Szybki Atak" stackId="a" fill={chartCategorical[1]} />
                    <Bar dataKey="pointsOffTO" name="Po Stratach" stackId="a" fill={chartCategorical[2]} />
                    <Bar dataKey="secondChancePoints" name="2. Szansa" stackId="a" fill={chartCategorical[3]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                  <span className={emptyIconClass}>
                    <PieChart className="w-6 h-6 text-bkpk-text-muted" />
                  </span>
                  <div className="space-y-1">
                    <p className="label-caps text-[13px] text-bkpk-text-primary">Brak szczegółowych danych o punktach</p>
                    <p className="text-sm text-bkpk-text-muted max-w-sm">Struktura punktów (ławka, szybki atak, punkty po stratach) zostanie wygenerowana z protokołów meczowych.</p>
                  </div>
                </div>
              )}
            </div>
          </BkpkCard>
        </div>

        {/* Sidebar Stats & Radar */}
        <div className="lg:col-span-4 space-y-6 lg:space-y-8">
          {/* Radar Chart Card */}
          <BkpkCard variant="flat" className="flex flex-col items-center">
            <div className="w-full mb-6 space-y-1">
              <h3 className="text-[22px] text-bkpk-text-primary">Porównanie z Ligą</h3>
              <p className="label-caps text-[11px] text-bkpk-text-secondary">Względem średniej (100%)</p>
            </div>
            <div className="w-full" style={{ height: isMobile ? '220px' : '300px' }}>
              {hasLeagueData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius={isMobile ? '65%' : '80%'} data={radarData}>
                    <PolarGrid stroke={chartColors.grid} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: chartColors.axis, fontSize: 11, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                    <Radar
                      name="BeKaPaKa"
                      dataKey="A"
                      stroke={chartColors.team}
                      fill={chartColors.team}
                      fillOpacity={0.2}
                      strokeWidth={3}
                    />
                    <Tooltip
                      trigger={isMobile ? 'click' : 'hover'}
                      contentStyle={chartTooltipStyle}
                      itemStyle={chartTooltipItemStyle}
                      labelStyle={chartTooltipLabelStyle}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                  <span className={emptyIconClass}>
                    <Target className="w-6 h-6 text-bkpk-text-muted" />
                  </span>
                  <div className="space-y-1">
                    <p className="label-caps text-[13px] text-bkpk-text-primary">Brak danych porównawczych</p>
                    <p className="text-sm text-bkpk-text-muted max-w-xs">Porównanie parametrów z ligą wymaga rozegrania spotkań w tym sezonie.</p>
                  </div>
                </div>
              )}
            </div>
          </BkpkCard>

          {/* Efficiency Summary */}
          <BkpkCard variant="flat" className="space-y-5">
            <h3 className="text-[22px] text-bkpk-text-primary border-b border-bkpk-border-subtle pb-4">Kwadrant Efektywności</h3>
            <div className="divide-y divide-bkpk-border-subtle border-y border-bkpk-border-subtle">
              <div className="flex items-center justify-between gap-4 py-4">
                <div className="space-y-1">
                  <div className="label-caps text-[11px] text-bkpk-text-secondary">Status Ataku</div>
                  <div className="text-base font-semibold text-bkpk-text-primary">{hasLeagueData ? comparison?.rankings.points : 'Brak danych'}</div>
                </div>
                <span className={sectionIconClass}>
                  <Target className={cn("w-5 h-5", hasLeagueData && comparison?.rankings.points === 'Powyżej średniej' ? "text-bkpk-success" : "text-bkpk-text-muted")} />
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 py-4">
                <div className="space-y-1">
                  <div className="label-caps text-[11px] text-bkpk-text-secondary">Status Obrony</div>
                  <div className="text-base font-semibold text-bkpk-text-primary">{hasLeagueData ? comparison?.rankings.defense : 'Brak danych'}</div>
                </div>
                <span className={sectionIconClass}>
                  <Zap className={cn("w-5 h-5", hasLeagueData && comparison?.rankings.defense === 'Lepsza niż średnia' ? "text-bkpk-success" : "text-bkpk-text-muted")} />
                </span>
              </div>
            </div>

            <div className="pl-4 border-l-2 border-bkpk-primary space-y-3">
              <span className="kicker">Wnioski Trenerskie</span>
              <p className="text-sm text-bkpk-text-secondary leading-relaxed">
                {!hasLeagueData
                  ? "Brak danych meczowych do wyciągnięcia wniosków taktycznych. Rozegraj pierwsze mecze w sezonie, aby aktywować analizę kwadrantu."
                  : comparison?.rankings.points === 'Powyżej średniej' && comparison?.rankings.defense === 'Lepsza niż średnia'
                    ? "Wykryto dominację. Drużyna radzi sobie lepiej niż reszta ligi po obu stronach parkietu. Utrzymać tempo."
                    : comparison?.rankings.points === 'Powyżej średniej'
                      ? "Atak powyżej średniej ligi — utrzymać jakość rzutów. Obrona wymaga pracy: stracone punkty przewyższają średnią dywizji."
                      : comparison?.rankings.defense === 'Lepsza niż średnia'
                        ? "Obrona lepsza niż średnia ligi. Priorytet: poprawa skuteczności ataku i konwersji posiadań na punkty."
                        : "Atak i obrona poniżej średniej ligi. Skup się na redukcji strat i skuteczności rzutów z gry oraz spod kosza."}
              </p>
            </div>
          </BkpkCard>

          {/* KPI Overview */}
          <div className="grid grid-cols-2 gap-4">
            <BkpkCard variant="flat" className="text-center py-6">
              <div className="label-caps text-[11px] text-bkpk-text-secondary mb-2">Śr. Punktów</div>
              <div className="text-[36px] font-display leading-none tabular-nums text-bkpk-text-primary">{hasLeagueData && comparison?.bekapaka.ppg ? comparison.bekapaka.ppg.toFixed(1) : '0.0'}</div>
              <div className="text-xs font-medium text-bkpk-text-muted mt-2 tabular-nums">średnia {hasLeagueData && comparison?.league.ppg ? comparison.league.ppg.toFixed(1) : '0.0'}</div>
            </BkpkCard>
            <BkpkCard variant="flat" className="text-center py-6">
              <div className="label-caps text-[11px] text-bkpk-text-secondary mb-2">Obrona</div>
              <div className="text-[36px] font-display leading-none tabular-nums text-bkpk-text-primary">{hasLeagueData && comparison?.bekapaka.oppg ? comparison.bekapaka.oppg.toFixed(1) : '0.0'}</div>
              <div className="text-xs font-medium text-bkpk-text-muted mt-2 tabular-nums">średnia {hasLeagueData && comparison?.league.oppg ? comparison.league.oppg.toFixed(1) : '0.0'}</div>
            </BkpkCard>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
