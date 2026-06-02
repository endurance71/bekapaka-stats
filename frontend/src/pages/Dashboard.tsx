import { useCallback, useEffect, useState } from 'react';
import { fetchJSON, postJSON } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import AiAnalysisBlock from '../components/ai/AiAnalysisBlock';
import { Activity, Database, Calendar } from 'lucide-react';
import BkpkCard from '../shared/ui/BkpkCard';
import KalkEmptyState from '../shared/ui/KalkEmptyState';

// 2026 UI Components
import DashboardLayout from '../features/dashboard/DashboardLayout';
import { WinCard, PPGCard, RatingCard } from '../features/dashboard/HeroStatsCards';
import { FormTrendMiniChart } from '../features/dashboard/FormTrendMiniChart';
import { NextChallengeWidget } from '../features/dashboard/NextChallengeWidget';

// Temporary Legacy Components (until refactored)
import TopPlayersCard from '../components/dashboard/TopPlayersCard';
import ScoutingCard from '../components/dashboard/ScoutingCard';
import DashboardMomentum from '../components/games/DashboardMomentum';
import { useSeasonPreferenceContext } from '../context/SeasonPreferenceContext';

type Game = {
  id: string;
  date: string;
  opponent: string;
  result?: 'W' | 'L' | null;
  scoreUs?: number | null;
  scoreThem?: number | null;
  homeAway?: string;
  mvp?: string | null;
  fiveMinute?: any[];
};

type Player = {
  id: string;
  firstName: string;
  lastName: string;
  ppg: number;
  rpg?: number;
  apg?: number;
  eval?: number | null;
  photo?: string | null;
  data?: any;
  kalkPlayer?: any;
};

export default function Dashboard() {
  const [games, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordStats, setRecordStats] = useState({ wins: 0, losses: 0, total: 0, remaining: 0 });
  const [nextMatch, setNextMatch] = useState<any>(null);
  const [scoutingData, setScoutingData] = useState<any>(null);
  const [lastGameFull, setLastGameFull] = useState<any>(null);
  const [teamStats, setTeamStats] = useState<any>(null);
  const [briefing, setBriefing] = useState<{ contentMd?: string; generatedAt?: string; model?: string; stale?: boolean } | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { seasonId } = useSeasonPreferenceContext();

  const fetchDashboardData = useCallback(async () => {
    if (!seasonId) return;
    setLoading(true);
    try {
      const scoutingQ = new URLSearchParams({ seasonId });
      const [gamesData, playersData, scheduleData, scouting, tStats, briefingData] = await Promise.all([
        fetchJSON<Game[]>('/api/games'),
        fetchJSON<Player[]>('/api/players'),
        fetchJSON<any[]>(`/api/league/schedule?seasonId=${encodeURIComponent(seasonId)}`),
        fetchJSON<any>(`/api/scouting/next?${scoutingQ.toString()}`),
        fetchJSON<any>('/api/team/stats'),
        fetchJSON<any>('/api/ai/briefing').catch(() => null)
      ]);

      const played = (gamesData || []).filter(g => g.result);
      const wins = played.filter(g => g.result === 'W').length;
      const losses = played.filter(g => g.result === 'L').length;

      setGames(gamesData || []);
      setPlayers(playersData || []);
      setScoutingData(scouting);
      setTeamStats(tStats);
      setBriefing(briefingData);

      const ourSchedule = (scheduleData || []).filter(m =>
        m.homeTeam?.toLowerCase().includes('bekapaka') ||
        m.guestTeam?.toLowerCase().includes('bekapaka')
      );

      setRecordStats({
        wins,
        losses,
        total: ourSchedule.length,
        remaining: ourSchedule.filter(m => !m.isFinished).length
      });

      const sortedFuture = ourSchedule
        .filter(m => !m.isFinished && new Date(m.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setNextMatch(sortedFuture[0] || null);

      if (played.length > 0) {
        const full = await fetchJSON<any>(`/api/games/${played[0].id}`);
        setLastGameFull(full);
      }
    } catch (error) {
      console.error('Błąd pobierania danych:', error);
    } finally {
      setLoading(false);
    }
  }, [seasonId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleGenerateBriefing = async (force = false) => {
    setBriefingLoading(true);
    try {
      const result = await postJSON<{ contentMd: string; generatedAt: string; model?: string }>(
        '/api/ai/briefing/generate',
        { force }
      );
      setBriefing({
        contentMd: result.contentMd,
        generatedAt: result.generatedAt,
        model: result.model,
        stale: false
      });
    } catch (error: any) {
      alert(error?.message || 'Nie udało się wygenerować briefingu');
    } finally {
      setBriefingLoading(false);
    }
  };

  const ppg = players.reduce((acc, p) => acc + p.ppg, 0) / (players.length || 1);
  const recentTrendMatches = games.filter(g => g.result).slice(0, 10).map(g => ({
    id: g.id,
    result: g.result as 'W' | 'L',
    score: `${g.scoreUs}-${g.scoreThem}`,
    date: g.date
  }));

  return (
    <DashboardLayout
      header={
        <>
          <h1 className="text-3xl font-bold text-bkpk-text-primary font-outfit">Pulpit</h1>
          <div className="flex items-center gap-2">
            <p className="text-bkpk-text-secondary text-sm">Witamy w centrum dowodzenia BeKaPaKa 2026</p>
            <span className="text-xs bg-bkpk-primary/20 text-bkpk-primary px-2 py-0.5 rounded-full font-bold border border-bkpk-primary/30">v3.1</span>
          </div>
        </>
      }
      hero={
        <>
          <WinCard
            winPercentage={recordStats.total > 0 ? (recordStats.wins / (recordStats.wins + recordStats.losses)) * 100 : 0}
            wins={recordStats.wins}
            losses={recordStats.losses}
            loading={loading}
          />
          <PPGCard ppg={teamStats?.ppg || 0} trend={teamStats?.trend || 0} />
          <RatingCard offRating={teamStats?.offRating || 0} defRating={teamStats?.defRating || 0} />
        </>
      }
      main={
        <div className="space-y-8">
          <AiAnalysisBlock
            title="Briefing tygodniowy (AI)"
            content={briefing?.contentMd}
            generatedAt={briefing?.generatedAt}
            model={briefing?.model}
            canGenerate={isAdmin}
            loading={briefingLoading}
            onGenerate={handleGenerateBriefing}
            staleHint={
              briefing?.stale
                ? 'Briefing może być nieaktualny (nowy mecz, scrape KALK). Admin: wygeneruj ponownie.'
                : null
            }
            emptyHint="Brak briefingu. Administrator może wygenerować podsumowanie tygodnia dla drużyny."
          />

          <FormTrendMiniChart matches={recentTrendMatches} loading={loading} />

          {lastGameFull?.data?.fiveMinute || lastGameFull?.data?.quarters ? (
            <DashboardMomentum
              data={lastGameFull.data.fiveMinute || (() => {
                const isHome = lastGameFull.homeAway === 'home';
                let homeSum = 0;
                let awaySum = 0;
                const homePoints: number[] = [];
                const awayPoints: number[] = [];

                lastGameFull.data.quarters.forEach((q: any) => {
                  homeSum += q.home;
                  awaySum += q.away;
                  homePoints.push(homeSum);
                  awayPoints.push(awaySum);
                });

                return [
                  { team: 'BB', points: isHome ? homePoints : awayPoints },
                  { team: 'OP', points: isHome ? awayPoints : homePoints }
                ];
              })()}
              bkCode="BB"
              oppCode="OP"
              step={lastGameFull.data.fiveMinute ? 5 : 10}
            />
          ) : !loading && (
            <div className="p-2 border border-dashed border-bkpk-border-strong rounded-bkpk-lg bg-bkpk-surface-tint-2 flex items-center justify-center gap-3">
              <Database className="w-4 h-4 text-bkpk-text-muted" />
              <span className="text-sm font-bold text-bkpk-text-muted uppercase tracking-widest">Brak danych o dynamice meczu</span>
            </div>
          )}

          <ScoutingCard data={scoutingData} loading={loading} />
        </div>
      }
      sidebar={
        <div className="space-y-8">
          {nextMatch ? (
            <NextChallengeWidget
              opponent={nextMatch.homeTeam?.toLowerCase().includes('bekapaka') ? nextMatch.guestTeam : nextMatch.homeTeam}
              date={new Date(nextMatch.date).toLocaleDateString('pl-PL')}
              time={new Date(nextMatch.date).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
              location={nextMatch.venue || "Hala Sportowa"}
              difficulty={3}
              homeAway={nextMatch.homeTeam?.toLowerCase().includes('bekapaka') ? 'Dom' : 'Wyjazd'}
            />
          ) : !loading && (
            <div className="p-8 bg-bkpk-surface-tint-2 border-2 border-dashed border-bkpk-border-strong rounded-3xl text-center space-y-4">
              <Calendar className="w-8 h-8 text-bkpk-text-muted mx-auto" />
              <div className="space-y-1">
                <p className="font-bold text-bkpk-text-primary uppercase tracking-tight">Brak zaplanowanych meczów</p>
                <p className="text-xs text-bkpk-text-muted">Uruchom scraper w Administracji, aby pobrać aktualny terminarz.</p>
              </div>
            </div>
          )}
          <TopPlayersCard players={players} loading={loading} />
        </div>
      }
    />
  );
}
