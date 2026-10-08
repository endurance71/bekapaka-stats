import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { fetchJSON, postJSON } from '../lib/api';
import { useIsAdmin } from '../context/AuthContext';
import { CalendarIcon as Calendar } from '../shared/ui/BrandIcon';
import PageHeader from '../shared/ui/PageHeader';
import DashboardLayout from '../features/dashboard/DashboardLayout';
import { FormTrendMiniChart } from '../features/dashboard/FormTrendMiniChart';
import { NextChallengeWidget } from '../features/dashboard/NextChallengeWidget';
import MyLastGameCard, { type MyLastGame } from '../features/dashboard/MyLastGameCard';
import TeamStandingCard, { type TeamStanding } from '../features/dashboard/TeamStandingCard';
import MatchDayCard, { type MatchDay } from '../features/match/MatchDayCard';
import TopPlayersCard from '../components/dashboard/TopPlayersCard';
import { useSeasonPreferenceContext } from '../context/SeasonPreferenceContext';
import { normalizePlayerIdentity } from '../shared/lib/playerIdentity';
import { difficultyFromOpponent, formatMatchDate, formatMatchTime } from '../shared/lib/matchUtils';
import LoadError from '../shared/ui/LoadError';
import { useRefetchOnFocus } from '../hooks/useRefetchOnFocus';

// Leniwie: blok AI ciągnie bibliotekę markdown (~150 kB), a zawodnik zwykle go nie widzi
const AiAnalysisBlock = lazy(() => import('../components/ai/AiAnalysisBlock'));

type Game = {
  id: string;
  date: string;
  opponent: string;
  result?: 'W' | 'L' | null;
  scoreUs?: number | null;
  scoreThem?: number | null;
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

/** GET /api/me/home (backend/kalk/v2/home.js). */
interface PlayerHome {
  team: TeamStanding | null;
  teamsInLeague: number;
  remainingGames: number;
  myLastGame: MyLastGame | null;
  nextMatch: {
    id: string;
    date: string;
    venue: string | null;
    roundLabel: string | null;
    host: string;
    opponent: string;
    opponentKalkId: string | null;
    opponentTable: (TeamStanding & { name: string }) | null;
    matchDay: MatchDay | null;
  } | null;
}

type AllTimeTeam = { kalkId: string; headToHead: { wins: number; losses: number } | null };

/**
 * Start: odpowiada zawodnikowi na trzy pytania bez przewijania — kiedy i gdzie gramy, jak mi poszło, jak stoimy.
 * Wskaźniki drużyny na 100 akcji są w Analizach (sekcja trenera).
 */
export default function Dashboard() {
  const [home, setHome] = useState<PlayerHome | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [allTimeTeams, setAllTimeTeams] = useState<AllTimeTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [homeError, setHomeError] = useState<unknown>(null);
  const [briefing, setBriefing] = useState<{ contentMd?: string; generatedAt?: string; model?: string; stale?: boolean } | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const isAdmin = useIsAdmin();
  const { seasonId, selectedSeason } = useSeasonPreferenceContext();

  const fetchDashboardData = useCallback(async () => {
    if (!seasonId) return;
    setLoading(true);
    try {
      const q = new URLSearchParams({ seasonId }).toString();
      const settled = await Promise.allSettled([
        fetchJSON<PlayerHome>(`/api/me/home?${q}`),
        fetchJSON<Game[]>(`/api/games?${q}`),
        fetchJSON<Player[]>(`/api/players?${q}`),
        fetchJSON<any>(`/api/ai/briefing?${q}`),
        fetchJSON<{ teams: AllTimeTeam[] }>('/api/league/all-time')
      ]);
      const pick = <T,>(idx: number, fallback: T): T =>
        settled[idx].status === 'fulfilled' ? (settled[idx] as PromiseFulfilledResult<T>).value : fallback;

      setHome(pick<PlayerHome | null>(0, null));
      setHomeError(settled[0].status === 'rejected' ? settled[0].reason : null);
      setGames(pick<Game[]>(1, []) || []);
      setPlayers((pick<Player[]>(2, []) || []).map((p) => normalizePlayerIdentity(p)));
      setBriefing(pick<any>(3, null));
      setAllTimeTeams(pick<{ teams: AllTimeTeam[] } | null>(4, null)?.teams ?? []);
    } finally {
      setLoading(false);
    }
  }, [seasonId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  useRefetchOnFocus(() => void fetchDashboardData());

  const handleGenerateBriefing = async (force = false) => {
    setBriefingLoading(true);
    setAiError(null);
    try {
      const result = await postJSON<{ contentMd: string; generatedAt: string; model?: string }>('/api/ai/briefing/generate', { force, seasonId });
      setBriefing({ contentMd: result.contentMd, generatedAt: result.generatedAt, model: result.model, stale: false });
    } catch (error: any) {
      setAiError(error?.message || 'Nie udało się wygenerować podsumowania');
    } finally {
      setBriefingLoading(false);
    }
  };

  const nextMatch = home?.nextMatch ?? null;
  const difficulty = nextMatch
    ? difficultyFromOpponent({
        wins: nextMatch.opponentTable?.wins,
        losses: nextMatch.opponentTable?.losses,
        h2h: allTimeTeams.find((t) => t.kalkId === nextMatch.opponentKalkId)?.headToHead ?? null
      })
    : null;
  const recentForm = games
    .filter((g) => g.result)
    .slice(0, 10)
    .map((g) => ({ id: g.id, result: g.result as 'W' | 'L', score: `${g.scoreUs}:${g.scoreThem}`, date: g.date }));

  return (
    <DashboardLayout
      header={
        <PageHeader
          kicker="BeKaPaKa Bobolice"
          title="Start"
          description={selectedSeason ? `Sezon ${selectedSeason.label.replace(/^Sezon\s*/i, '')}` : undefined}
        />
      }
      hero={
        <>
          {nextMatch ? (
            <NextChallengeWidget
              opponent={nextMatch.opponent}
              opponentInfo={nextMatch.opponentTable ? `${nextMatch.opponentTable.position ?? '–'}. miejsce · ${nextMatch.opponentTable.wins}–${nextMatch.opponentTable.losses}` : null}
              date={formatMatchDate(nextMatch.date)}
              time={formatMatchTime(nextMatch.date)}
              location={nextMatch.venue}
              difficulty={difficulty}
              host={nextMatch.host}
              matchId={nextMatch.id}
            >
              <div className="pt-4 border-t border-bkpk-border-subtle">
                <MatchDayCard variant="inline" matchId={nextMatch.id} seasonId={seasonId} matchDay={nextMatch.matchDay} />
              </div>
            </NextChallengeWidget>
          ) : homeError && !loading ? (
            <LoadError title="Nie udało się wczytać Startu" error={homeError} onRetry={() => void fetchDashboardData()} />
          ) : (
            <div className="p-6 bg-bkpk-surface border border-dashed border-bkpk-border-strong space-y-3">
              <Calendar className="w-8 h-8 text-bkpk-text-muted" aria-hidden="true" />
              <p className="font-display text-xl text-bkpk-text-primary uppercase">{loading ? 'Wczytywanie…' : 'Brak zaplanowanych meczów'}</p>
              {!loading && <p className="text-sm text-bkpk-text-muted">Terminarz pojawi się, gdy liga KALK opublikuje kolejne mecze.</p>}
            </div>
          )}
          <MyLastGameCard game={home?.myLastGame ?? null} loading={loading} />
          <TeamStandingCard team={home?.team ?? null} teamsInLeague={home?.teamsInLeague ?? 0} remainingGames={home?.remainingGames ?? 0} loading={loading} />
        </>
      }
      main={
        <div className="space-y-8">
          <FormTrendMiniChart matches={recentForm} loading={loading} />
          {/* Zawodnik nie widzi pustego bloku — tylko gotowe podsumowanie; trener widzi zawsze (przycisk Generuj) */}
          {(isAdmin || briefing?.contentMd) && (
          <Suspense fallback={null}>
          <AiAnalysisBlock
            title="Podsumowanie tygodnia (AI)"
            errorMessage={aiError}
            content={briefing?.contentMd}
            generatedAt={briefing?.generatedAt}
            model={briefing?.model}
            canGenerate={isAdmin}
            loading={briefingLoading}
            onGenerate={handleGenerateBriefing}
            staleHint={briefing?.stale ? 'Podsumowanie może być nieaktualne (nowy mecz) — wygeneruj ponownie.' : null}
            emptyHint="Brak podsumowania — użyj „Generuj”."
            playerEmptyHint="Podsumowanie tygodnia pojawi się, gdy trener je przygotuje."
          />
          </Suspense>
          )}
        </div>
      }
      sidebar={<TopPlayersCard players={players} loading={loading} />}
    />
  );
}
