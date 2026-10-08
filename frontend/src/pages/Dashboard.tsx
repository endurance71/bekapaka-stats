import { useCallback, useEffect, useState } from 'react';
import { fetchJSON, postJSON } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import AiAnalysisBlock from '../components/ai/AiAnalysisBlock';
import { Activity } from 'lucide-react';
import { CalendarIcon as Calendar } from '../shared/ui/BrandIcon';
import BkpkCard from '../shared/ui/BkpkCard';
import KalkEmptyState from '../shared/ui/KalkEmptyState';
import PageHeader from '../shared/ui/PageHeader';

// 2026 UI Components
import DashboardLayout from '../features/dashboard/DashboardLayout';
import { WinCard, PPGCard, RatingCard } from '../features/dashboard/HeroStatsCards';
import { FormTrendMiniChart } from '../features/dashboard/FormTrendMiniChart';
import { NextChallengeWidget } from '../features/dashboard/NextChallengeWidget';

// Temporary Legacy Components (until refactored)
import TopPlayersCard from '../components/dashboard/TopPlayersCard';
import ScoutingCard from '../components/dashboard/ScoutingCard';
import { useSeasonPreferenceContext } from '../context/SeasonPreferenceContext';
import { normalizePlayerIdentity } from '../shared/lib/playerIdentity';
import { difficultyFromOpponent, formatMatchDate, formatMatchTime, isBekapakaName } from '../shared/lib/matchUtils';

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
  const [allTimeTeams, setAllTimeTeams] = useState<Array<{ kalkId: string; headToHead: { wins: number; losses: number } | null }>>([]);
  const [teamStats, setTeamStats] = useState<any>(null);
  const [briefing, setBriefing] = useState<{ contentMd?: string; generatedAt?: string; model?: string; stale?: boolean } | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { seasonId, selectedSeason } = useSeasonPreferenceContext();

  const fetchDashboardData = useCallback(async () => {
    if (!seasonId) return;
    setLoading(true);
    try {
      const q = new URLSearchParams({ seasonId }).toString();
      const settled = await Promise.allSettled([
        fetchJSON<Game[]>(`/api/games?${q}`),
        fetchJSON<Player[]>(`/api/players?${q}`),
        fetchJSON<any[]>(`/api/league/schedule?${q}`),
        fetchJSON<any>(`/api/scouting/next?${q}`),
        fetchJSON<any>(`/api/team/stats?${q}`),
        fetchJSON<any>(`/api/ai/briefing?${q}`),
        fetchJSON<{ teams: Array<{ kalkId: string; headToHead: { wins: number; losses: number } | null }> }>('/api/league/all-time')
      ]);

      const pick = <T,>(idx: number, fallback: T): T =>
        settled[idx].status === 'fulfilled' ? (settled[idx] as PromiseFulfilledResult<T>).value : fallback;

      const gamesData = pick<Game[]>(0, []);
      const playersData = pick<Player[]>(1, []).map((p) => normalizePlayerIdentity(p));
      const scheduleData = pick<any[]>(2, []);
      const scouting = pick<any>(3, null);
      const tStats = pick<any>(4, null);
      const briefingData = pick<any>(5, null);
      setAllTimeTeams(pick<{ teams: any[] } | null>(6, null)?.teams ?? []);

      const played = (gamesData || []).filter(g => g.result);
      const wins = played.filter(g => g.result === 'W').length;
      const losses = played.filter(g => g.result === 'L').length;

      setGames(gamesData || []);
      setPlayers(playersData || []);
      setScoutingData(scouting);
      setTeamStats(tStats);
      setBriefing(briefingData);

      const ourSchedule = (scheduleData || []).filter(m => isBekapakaName(m.homeTeam) || isBekapakaName(m.guestTeam));

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
        { force, seasonId }
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

  // Poziom trudności następnego rywala: bilans w sezonie (scouting, gdy dotyczy tego rywala) + bilans bezpośredni
  const nextOpponentDifficulty = (() => {
    if (!nextMatch) return null;
    const usHome = isBekapakaName(nextMatch.homeTeam);
    const oppName = String(usHome ? nextMatch.guestTeam : nextMatch.homeTeam || '').toLowerCase();
    const oppKalkId = usHome ? nextMatch.guestTeamKalkId : nextMatch.homeTeamKalkId;
    const sameOpponent = scoutingData?.opponent && oppName.includes(String(scoutingData.opponent).toLowerCase());
    const h2h = allTimeTeams.find((t) => t.kalkId === oppKalkId)?.headToHead ?? null;
    return difficultyFromOpponent({
      wins: sameOpponent ? scoutingData.wins : null,
      losses: sameOpponent ? scoutingData.losses : null,
      h2h
    });
  })();
  const recentTrendMatches = games.filter(g => g.result).slice(0, 10).map(g => ({
    id: g.id,
    result: g.result as 'W' | 'L',
    score: `${g.scoreUs}-${g.scoreThem}`,
    date: g.date
  }));

  return (
    <DashboardLayout
      header={
        <PageHeader
          kicker="Centrum drużyny"
          title="Pulpit"
          description={selectedSeason ? `Najważniejsze informacje drużyny — ${selectedSeason.label}.` : 'Najważniejsze informacje drużyny.'}
        />
      }
      hero={
        <>
          <WinCard
            winPercentage={
              recordStats.wins + recordStats.losses > 0
                ? (recordStats.wins / (recordStats.wins + recordStats.losses)) * 100
                : 0
            }
            wins={recordStats.wins}
            losses={recordStats.losses}
            loading={loading}
          />
          <PPGCard ppg={teamStats?.ppg || 0} trend={teamStats?.trend ?? null} />
          <RatingCard
            offRating={teamStats?.offRating || 0}
            defRating={teamStats?.defRating || 0}
            league={teamStats?.league ?? null}
            tiers={teamStats?.tiers ?? null}
          />
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
                ? 'Briefing może być nieaktualny (nowy mecz) — wygeneruj ponownie.'
                : null
            }
            emptyHint="Brak briefingu — użyj „Generuj”, by podsumować tydzień."
            playerEmptyHint="Podsumowanie tygodnia pojawi się, gdy trener je przygotuje."
          />

          <FormTrendMiniChart matches={recentTrendMatches} loading={loading} />

          <ScoutingCard data={scoutingData} loading={loading} />
        </div>
      }
      sidebar={
        <div className="space-y-8">
          {nextMatch ? (
            <NextChallengeWidget
              opponent={isBekapakaName(nextMatch.homeTeam) ? nextMatch.guestTeam : nextMatch.homeTeam}
              date={formatMatchDate(nextMatch.date)}
              time={formatMatchTime(nextMatch.date)}
              location={nextMatch.venue}
              difficulty={nextOpponentDifficulty}
              host={nextMatch.homeTeam}
            />
          ) : !loading && (
            <div className="p-8 bg-bkpk-surface border border-dashed border-bkpk-border-strong text-center space-y-4">
              <Calendar className="w-8 h-8 text-bkpk-text-muted mx-auto" aria-hidden="true" />
              <div className="space-y-1">
                <p className="font-display text-xl text-bkpk-text-primary uppercase">Brak zaplanowanych meczów</p>
                <p className="text-sm text-bkpk-text-muted">Terminarz pojawi się, gdy liga KALK opublikuje kolejne mecze.</p>
              </div>
            </div>
          )}
          <TopPlayersCard players={players} loading={loading} />
        </div>
      }
    />
  );
}
