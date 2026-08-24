import { useEffect, useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend as RechartsLegend,
  BarChart, Bar
} from 'recharts';
import { fetchJSON } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, PieChart, Target, Zap, Activity, Info, BarChart2 } from 'lucide-react';
import { cn } from '../shared/lib/utils';
import BkpkCard from '../shared/ui/BkpkCard';
import useIsMobile from '../hooks/useIsMobile';

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
    return (
      <div className="min-h-[100dvh] bg-bkpk-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-bkpk-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-bkpk-text-muted font-bold uppercase tracking-widest text-xs italic">Analizowanie DNA wyników...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bkpk-bg p-4 md:p-8 lg:p-12">
      <div className="max-w-[1400px] mx-auto space-y-12">

        {/* Header Section */}
        <header className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-bkpk-primary font-bold uppercase tracking-[0.2em] text-xs"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Centrum Analityczne</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black font-outfit text-bkpk-text-primary tracking-tight"
          >
            Analizy i <span className="text-bkpk-primary">Trendy</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-bkpk-text-secondary text-lg max-w-xl"
          >
            Szczegółowa ewolucja wyników drużyny i porównanie z ligą.
          </motion.p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Main Trend Chart */}
          <div className="lg:col-span-8 space-y-8">
            <BkpkCard variant="glass" className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-bkpk-primary" />
                  <h3 className="text-xl font-bold text-bkpk-text-primary font-outfit">Ewolucja Efektywności</h3>
                </div>
                {hasTrends && (
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-bkpk-primary shadow-bkpk-glow" />
                      <span className="text-xs font-bold text-bkpk-text-secondary uppercase tracking-widest">Rtg Ofensywny</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-bkpk-warning shadow-bkpk-glow" />
                      <span className="text-xs font-bold text-bkpk-text-secondary uppercase tracking-widest">Tempo</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full mt-4" style={{ height: isMobile ? '220px' : '400px' }}>
                {hasTrends ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends}>
                      <defs>
                        <linearGradient id="colorOffRtgTrends" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-bkpk-primary)" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="var(--color-bkpk-primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--bkpk-surface-tint-3)" />
                      <XAxis
                        dataKey="formattedDate"
                        stroke="var(--bkpk-text-muted)"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                        interval={isMobile ? Math.ceil(trends.length / 4) : 0}
                      />
                      <YAxis
                        yAxisId="left"
                        stroke="var(--bkpk-text-muted)"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        dx={-10}
                        width={isMobile ? 25 : 40}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
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
                        yAxisId="left"
                        type="monotone"
                        dataKey="offRtg"
                        stroke="var(--color-bkpk-primary)"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorOffRtgTrends)"
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="pace"
                        stroke="var(--color-bkpk-warning)"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        fill="transparent"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                    <Activity className="w-10 h-10 text-bkpk-text-muted opacity-30" />
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-bkpk-text-primary uppercase tracking-tight">Brak danych o efektywności</p>
                      <p className="text-xs text-bkpk-text-muted max-w-sm">Wykres ewolucji ratingu ofensywnego i tempa gry pojawi się po rozegraniu pierwszych meczów w tym sezonie.</p>
                    </div>
                  </div>
                )}
              </div>
            </BkpkCard>

            {/* Point Contributors Bar Chart */}
            <BkpkCard variant="glass" className="space-y-6">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-bkpk-success" />
                <h3 className="text-xl font-bold text-bkpk-text-primary font-outfit">DNA Zdobywanych Punktów</h3>
              </div>

              <div className="w-full" style={{ height: isMobile ? '200px' : '300px' }}>
                {hasTrends && trends.some(t => (t.benchPoints || 0) + (t.fastBreakPoints || 0) + (t.pointsOffTO || 0) + (t.secondChancePoints || 0) > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--bkpk-surface-tint-3)" />
                      <XAxis dataKey="formattedDate" stroke="var(--bkpk-text-muted)" fontSize={10} tickLine={false} axisLine={false} interval={isMobile ? Math.ceil(trends.length / 4) : 0} />
                      <YAxis stroke="var(--bkpk-text-muted)" fontSize={10} tickLine={false} axisLine={false} width={isMobile ? 25 : 35} />
                      <Tooltip
                        trigger={isMobile ? 'click' : 'hover'}
                        cursor={{ fill: 'var(--bkpk-surface-tint-1)' }}
                        contentStyle={{
                          backgroundColor: 'var(--bkpk-color-surface-elevated)',
                          border: '1px solid var(--bkpk-border-strong)',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="benchPoints" name="Ławka" stackId="a" fill="var(--color-bkpk-success)" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="fastBreakPoints" name="Szybki Atak" stackId="a" fill="var(--color-bkpk-primary)" />
                      <Bar dataKey="pointsOffTO" name="Po Stratach" stackId="a" fill="var(--color-bkpk-danger)" />
                      <Bar dataKey="secondChancePoints" name="2. Szansa" stackId="a" fill="var(--color-bkpk-warning)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                    <PieChart className="w-10 h-10 text-bkpk-text-muted opacity-30" />
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-bkpk-text-primary uppercase tracking-tight">Brak szczegółowych danych o punktach</p>
                      <p className="text-xs text-bkpk-text-muted max-w-sm">Struktura punktów (ławka, szybki atak, punkty po stratach) zostanie wygenerowana z protokołów meczowych.</p>
                    </div>
                  </div>
                )}
              </div>
            </BkpkCard>
          </div>

          {/* Sidebar Stats & Radar */}
          <div className="lg:col-span-4 space-y-8">
            {/* Radar Chart Card */}
            <BkpkCard variant="glass" className="flex flex-col items-center">
              <div className="w-full mb-6">
                <h3 className="text-lg font-bold text-bkpk-text-primary font-outfit">Porównanie z Ligą</h3>
                <p className="text-xs text-bkpk-text-secondary uppercase tracking-widest font-bold">Względem średniej (100%)</p>
              </div>
              <div className="w-full" style={{ height: isMobile ? '220px' : '300px' }}>
                {hasLeagueData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius={isMobile ? '65%' : '80%'} data={radarData}>
                      <PolarGrid stroke="var(--bkpk-surface-tint-3)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--bkpk-text-secondary)', fontSize: isMobile ? 9 : 11, fontWeight: 'bold' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                      <Radar
                        name="BeKaPaKa"
                        dataKey="A"
                        stroke="var(--color-bkpk-primary)"
                        fill="var(--color-bkpk-primary)"
                        fillOpacity={0.3}
                        strokeWidth={3}
                      />
                      <Tooltip
                        trigger={isMobile ? 'click' : 'hover'}
                        contentStyle={{
                          backgroundColor: 'var(--bkpk-color-surface-elevated)',
                          border: '1px solid var(--bkpk-border-strong)',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                    <Target className="w-10 h-10 text-bkpk-text-muted opacity-30" />
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-bkpk-text-primary uppercase tracking-tight">Brak danych porównawczych</p>
                      <p className="text-xs text-bkpk-text-muted max-w-xs">Porównanie parametrów z ligą wymaga rozegrania spotkań w tym sezonie.</p>
                    </div>
                  </div>
                )}
              </div>
            </BkpkCard>

            {/* Efficiency Summary */}
            <BkpkCard variant="glass" className="space-y-6">
              <h3 className="text-lg font-bold text-bkpk-text-primary font-outfit border-b border-bkpk-border-strong pb-4">Kwadrant Efektywności</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-bkpk-surface-tint-2 rounded-2xl border border-bkpk-border-strong">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-bkpk-text-secondary uppercase tracking-widest">Status Ataku</div>
                    <div className="text-sm font-bold text-bkpk-text-primary">{hasLeagueData ? comparison?.rankings.points : 'Brak danych'}</div>
                  </div>
                  <Target className={cn("w-8 h-8", hasLeagueData && comparison?.rankings.points === 'Powyżej średniej' ? "text-bkpk-success" : "text-bkpk-text-muted")} />
                </div>

                <div className="flex items-center justify-between p-4 bg-bkpk-surface-tint-2 rounded-2xl border border-bkpk-border-strong">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-bkpk-text-secondary uppercase tracking-widest">Status Obrony</div>
                    <div className="text-sm font-bold text-bkpk-text-primary">{hasLeagueData ? comparison?.rankings.defense : 'Brak danych'}</div>
                  </div>
                  <Zap className={cn("w-8 h-8", hasLeagueData && comparison?.rankings.defense === 'Lepsza niż średnia' ? "text-bkpk-success" : "text-bkpk-text-muted")} />
                </div>
              </div>

              <div className="p-4 bg-bkpk-primary/5 rounded-2xl border border-bkpk-primary/10 space-y-3">
                <div className="flex items-center gap-2 text-bkpk-primary">
                  <span className="text-xs font-bold uppercase tracking-widest">Wnioski Trenerskie</span>
                </div>
                <p className="text-xs text-bkpk-text-secondary leading-relaxed italic">
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
              <BkpkCard variant="glass" className="text-center py-6">
                <div className="text-xs font-bold text-bkpk-text-secondary uppercase tracking-widest mb-1">Śr. Punktów</div>
                <div className="text-2xl font-black font-outfit text-bkpk-text-primary">{hasLeagueData && comparison?.bekapaka.ppg ? comparison.bekapaka.ppg.toFixed(1) : '0.0'}</div>
                <div className="text-xs font-medium text-bkpk-text-muted">średnia {hasLeagueData && comparison?.league.ppg ? comparison.league.ppg.toFixed(1) : '0.0'}</div>
              </BkpkCard>
              <BkpkCard variant="glass" className="text-center py-6">
                <div className="text-xs font-bold text-bkpk-text-secondary uppercase tracking-widest mb-1">Obrona</div>
                <div className="text-2xl font-black font-outfit text-bkpk-text-primary">{hasLeagueData && comparison?.bekapaka.oppg ? comparison.bekapaka.oppg.toFixed(1) : '0.0'}</div>
                <div className="text-xs font-medium text-bkpk-text-muted">średnia {hasLeagueData && comparison?.league.oppg ? comparison.league.oppg.toFixed(1) : '0.0'}</div>
              </BkpkCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
