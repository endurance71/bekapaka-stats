import { MatchPresentationEditor } from '../components/games/MatchPresentationEditor';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchJSON, postJSON } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import AiAnalysisBlock from '../components/ai/AiAnalysisBlock';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Calendar,
  MapPin,
  Trophy,
  Zap,
  BarChart2,
} from 'lucide-react';
import { cn } from '../shared/lib/utils';
import BkpkCard from '../shared/ui/BkpkCard';
import PageContainer from '../shared/ui/PageContainer';
import PageLoader from '../shared/ui/PageLoader';
import { bkpkActivePillClass } from '../shared/ui/BkpkButton';
import BoxScoreModern from '../features/games/BoxScoreModern';
import TeamStats from '../components/games/TeamStats';
import DashboardMomentum from '../components/games/DashboardMomentum';
import OpponentComparison from '../components/games/OpponentComparison';

export default function GameDetail() {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bekapaka' | 'opponent'>('bekapaka');
  const [aiLoading, setAiLoading] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const fetchGame = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await fetchJSON<any>(`/api/games/${id}`);
      setGame(data);
    } catch (error) {
      console.error('Błąd podczas pobierania meczu:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchGame();
  }, [fetchGame]);

  const handleGenerateAi = async (force = false) => {
    if (!id) return;
    setAiLoading(true);
    try {
      const result = await postJSON<{
        aiSummary: string;
        aiSummaryAt: string;
        model?: string;
        cached?: boolean;
      }>(`/api/games/${id}/analyze`, { force, seasonId: game?.seasonId });
      setGame((prev: any) => ({
        ...prev,
        aiSummary: result.aiSummary,
        aiSummaryAt: result.aiSummaryAt,
        aiSummaryModel: result.model ?? prev?.aiSummaryModel,
        aiSummaryStale: false
      }));
    } catch (error: any) {
      alert(error?.message || 'Nie udało się wygenerować analizy AI');
    } finally {
      setAiLoading(false);
    }
  };

  const bekapaka = useMemo(() => game?.teams?.find((t: any) => t.isBekapaka) || game?.teams?.[0] || { name: 'BeKaPaKa', isBekapaka: true, players: [] }, [game]);
  const opponentTeam = useMemo(() => game?.teams?.find((t: any) => !t.isBekapaka) || game?.teams?.[1] || { name: game?.opponent || 'Rywal', isBekapaka: false, players: [] }, [game]);
  const isWin = game?.result === 'W';
  const isLoss = game?.result === 'L';

  if (loading) {
    return <PageLoader fullScreen label="Pobieranie danych meczu..." />;
  }

  if (!game) return null;

  return (
    <div className="bg-bkpk-bg">
      <PageContainer>
        <Link to="/games" className="group inline-flex items-center gap-3 min-h-[44px] text-bkpk-text-secondary hover:text-bkpk-text-primary transition-colors">
          <div className="w-8 h-8 border border-bkpk-border-strong flex items-center justify-center group-hover:border-bkpk-text-primary transition-colors">
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </div>
          <span className="label-caps text-xs">Powrót do meczów</span>
        </Link>

        {/* Scoreboard Header — jak MatchHero/ScoreBoard na bekapaka.pl: BeKaPaKa po lewej, przegrany konturem */}
        <section className="relative overflow-hidden bg-bkpk-surface border border-bkpk-border-subtle border-t-2 border-t-bkpk-primary p-5 sm:p-8 md:p-10 lg:p-12">
          <h1 className="sr-only">Mecz: {bekapaka.name} – {opponentTeam.name}</h1>
          {(isWin || isLoss) && (
            <div className="flex justify-center md:justify-start mb-6 md:mb-8">
              <span className={cn(
                'status-flag',
                isWin ? 'bg-bkpk-text-primary border-bkpk-text-primary text-bkpk-bg' : 'text-bkpk-text-primary'
              )}>
                {isWin ? 'Wygrana' : 'Porażka'}
              </span>
            </div>
          )}

          <div className="relative flex flex-row items-center justify-between gap-3 md:gap-10">
            {/* Home Team */}
            <div className="flex-1 flex flex-col items-center md:items-start gap-2 md:gap-4 min-w-0">
              <div className="w-12 h-12 md:w-20 md:h-20 bg-bkpk-primary flex items-center justify-center shrink-0">
                <span className="font-display text-xl md:text-4xl leading-none text-bkpk-text-primary">BK</span>
              </div>
              <h2 className="text-base sm:text-xl md:text-3xl xl:text-5xl leading-[0.95] text-bkpk-text-primary w-full text-center md:text-left break-words [text-wrap:balance]">
                {bekapaka.name}
              </h2>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="font-display flex items-baseline gap-1 sm:gap-2 md:gap-4 tabular-nums leading-[0.85] tracking-[-0.02em] text-bkpk-text-primary text-6xl sm:text-7xl md:text-8xl lg:text-[128px]">
                <span className={cn(isLoss && 'outline-text')}>
                  {game.scoreUs ?? 0}
                </span>
                <span className="text-bkpk-text-muted text-[0.6em] -translate-y-[0.12em]" aria-hidden="true">:</span>
                <span className={cn(isWin && 'outline-text')}>
                  {game.scoreThem ?? 0}
                </span>
              </div>
            </div>

            {/* Away Team */}
            <div className="flex-1 flex flex-col items-center md:items-end gap-2 md:gap-4 min-w-0">
              <div className="w-12 h-12 md:w-20 md:h-20 bg-bkpk-surface-elevated border-[1.5px] border-bkpk-border-strong flex items-center justify-center shrink-0">
                <span className="font-display text-xl md:text-4xl leading-none text-bkpk-text-secondary">OP</span>
              </div>
              <h2 className="text-base sm:text-xl md:text-3xl xl:text-5xl leading-[0.95] text-bkpk-text-secondary w-full text-center md:text-right break-words [text-wrap:balance]">
                {opponentTeam.name}
              </h2>
            </div>
          </div>

          {/* Meta: termin i hala */}
          <div className="mt-6 md:mt-10 pt-4 border-t border-bkpk-border-subtle flex flex-wrap items-center justify-center md:justify-between gap-x-6 gap-y-2">
            <div className="hidden sm:flex items-center gap-6 label-caps text-xs text-bkpk-text-secondary">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-bkpk-primary" aria-hidden="true" />
                <span className="tabular-nums">{new Date(game.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-bkpk-primary" aria-hidden="true" />
                {game.venue || 'KOSiR Koszalin'}
              </div>
            </div>

            {/* Mobile Info Badge */}
            <div className="sm:hidden flex items-center justify-center gap-2.5 label-caps text-[11px] text-bkpk-text-secondary">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-bkpk-primary" aria-hidden="true" />
                <span className="tabular-nums">{new Date(game.date).toLocaleDateString()}</span>
              </div>
              <div className="w-px h-3 bg-bkpk-border-strong" aria-hidden="true" />
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-bkpk-primary" aria-hidden="true" />
                {game.venue || 'KOSiR Koszalin'}
              </div>
            </div>

            {(game.dataSource === 'kalk' || game.isFromKalkMatch) ? (
              <p className="status-flag text-bkpk-text-secondary">
                Dane z KALK
              </p>
            ) : null}
          </div>

          {game.hasBoxScore === false && game.boxScoreMissingHint ? (
            <p className="mt-3 text-center md:text-left text-sm text-bkpk-text-secondary max-w-lg md:max-w-none mx-auto">
              {game.boxScoreMissingHint}
            </p>
          ) : null}

          {/* Quarter Scores */}
          {game.quarters?.length ? (
            <div className="mt-6 flex justify-center md:justify-start overflow-x-auto no-scrollbar">
              <div className="flex border border-bkpk-border-subtle divide-x divide-bkpk-border-subtle">
                {game.quarters.map((q: any, i: number) => (
                  <div key={i} className="flex flex-col items-center gap-1 min-w-[64px] px-3 py-2 sm:px-4">
                    <span className="label-caps text-[11px] text-bkpk-text-muted">Q{i + 1}</span>
                    <span className="font-display text-lg sm:text-xl leading-none tabular-nums text-bkpk-text-primary">{q.home}-{q.away}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-10 md:space-y-12">

            {/* Intelligent Insights */}
            <AnimatePresence>
              {game.insights && game.insights.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 border border-bkpk-border-strong shrink-0">
                      <Zap className="w-5 h-5 text-bkpk-primary" aria-hidden="true" />
                    </div>
                    <h3 className="text-[22px] sm:text-[24px] text-bkpk-text-primary">Inteligentne Wnioski</h3>
                  </div>
                  <div className="grid gap-2">
                    {game.insights.map((insight: any, idx: number) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={cn(
                          "p-4 bg-bkpk-surface border border-bkpk-border-subtle border-l-4 flex gap-4 items-start text-bkpk-text-primary",
                          insight.type === 'success' ? "border-l-bkpk-success" :
                            insight.type === 'warning' ? "border-l-bkpk-danger" :
                              "border-l-bkpk-border-strong"
                        )}
                      >
                        <div className={cn(
                          "w-7 h-7 shrink-0 inline-grid place-items-center border-[1.5px] text-xs font-semibold leading-none",
                          insight.type === 'success' ? "border-bkpk-success text-bkpk-success" :
                            insight.type === 'warning' ? "border-bkpk-danger text-bkpk-text-danger" :
                              "border-bkpk-border-strong text-bkpk-text-secondary"
                        )}>
                          {insight.type === 'success' ? '✓' : insight.type === 'warning' ? '!' : 'i'}
                        </div>
                        <p className="text-sm font-medium leading-relaxed">{insight.text}</p>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}
            </AnimatePresence>

            <AiAnalysisBlock
              title="Analiza meczu (AI)"
              content={game.aiSummary}
              generatedAt={game.aiSummaryAt}
              model={game.aiSummaryModel}
              canGenerate={isAdmin}
              loading={aiLoading}
              onGenerate={handleGenerateAi}
              staleHint={
                game.aiSummaryStale
                  ? 'Analiza może być nieaktualna (zmieniły się statystyki meczu). Admin: użyj Odśwież lub wymuszenia.'
                  : null
              }
            />

            {/* Box Score Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center w-9 h-9 border border-bkpk-border-strong shrink-0">
                    <BarChart2 className="w-5 h-5 text-bkpk-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-[22px] sm:text-[24px] text-bkpk-text-primary">Statystyki Zawodników (Box Score)</h3>
                </div>

                <div className="flex shrink-0 border border-bkpk-border-strong">
                  <button
                    onClick={() => setActiveTab('bekapaka')}
                    className={cn(
                      "px-4 py-1.5 min-h-[44px] label-caps text-xs transition-colors",
                      activeTab === 'bekapaka' ? bkpkActivePillClass : "text-bkpk-text-secondary hover:text-bkpk-text-primary"
                    )}
                  >
                    BKPK
                  </button>
                  <button
                    onClick={() => setActiveTab('opponent')}
                    className={cn(
                      "px-4 py-1.5 min-h-[44px] label-caps text-xs transition-colors",
                      activeTab === 'opponent' ? bkpkActivePillClass : "text-bkpk-text-secondary hover:text-bkpk-text-primary"
                    )}
                  >
                    OPP
                  </button>
                </div>
              </div>

              {isAdmin && <MatchPresentationEditor game={game} onSaved={() => void fetchGame()} />}
              <BoxScoreModern
                playerStats={(activeTab === 'bekapaka' ? bekapaka : opponentTeam)?.players?.map((p: any) => ({
                  name: p.name,
                  number: p.number,
                  minutes: p.min,
                  points: p.pts,
                  rebounds: p.reb || (p.orb + p.drb) || 0,
                  assists: p.ast,
                  steals: p.stl,
                  blocks: p.blk,
                  turnovers: p.tov,
                  fg: `${p.fgm}/${p.fga}`,
                  threeP: `${p.three_pm}/${p.three_pa}`,
                  ft: `${p.ftm}/${p.fta}`,
                  plusMinus: p.plusMinus,
                  eval: p.eval
                })) || []}
              />
            </section>
          </div>

          {/* Sidebar Area */}
          <aside className="lg:col-span-4 space-y-8">
            {/* Match MVP */}
            {game.mvp && (
              <BkpkCard variant="glass" className="relative overflow-hidden group border-t-2 border-t-bkpk-medal-gold">
                <div className="relative z-10 space-y-4 text-center">
                  <span className="label-caps text-xs text-bkpk-medal-gold">Najbardziej Wartościowy Zawodnik (MVP)</span>
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 flex items-center justify-center border-[1.5px] border-bkpk-medal-gold mb-4">
                      <Trophy className="w-8 h-8 text-bkpk-medal-gold" aria-hidden="true" />
                    </div>
                    <h4 className="text-3xl leading-none font-display font-extrabold uppercase text-bkpk-text-primary">{game.mvp}</h4>
                  </div>
                </div>
              </BkpkCard>
            )}

            {/* Comparison Cards (Temporary wrappers for legacy sidebar components) */}
            <div className="space-y-8">
              <TeamStats teamStats={bekapaka?.fourFactors || null} />
              <OpponentComparison
                bekapaka={{ ...bekapaka, ...bekapaka.fourFactors }}
                opponent={{ ...opponentTeam, ...opponentTeam.fourFactors }}
              />
              {game.fiveMinute && (
                <DashboardMomentum
                  data={game.fiveMinute}
                  bkCode={bekapaka.id || 'BB'}
                  oppCode={opponentTeam.id || 'PR'}
                />
              )}
            </div>
          </aside>
        </div>
      </PageContainer>
    </div>
  );
}
