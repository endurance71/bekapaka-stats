
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchJSON, postJSON } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { DNASection } from '../components/scouting/DNASection';
import { MatchupComparison } from '../components/scouting/MatchupComparison';
import { ScoutingProtocolBanner } from '../components/scouting/ScoutingProtocolBanner';
import AiAnalysisBlock from '../components/ai/AiAnalysisBlock';
import BkpkCard from '../shared/ui/BkpkCard';
import { Users, History } from 'lucide-react';
import PreGameMatchCard, { type PreGameData } from '../components/tactics/PreGameMatchCard';
import { cn } from '../shared/lib/utils';
import { motion } from 'framer-motion';
import { ScoutingMatchHeader } from '../components/scouting/ScoutingMatchHeader';
import { MobileDataCard, MobileDataList } from '../shared/ui/MobileDataCard';
import ScrollableTableShell from '../shared/ui/ScrollableTableShell';
import { usePortraitMobile } from '../hooks/useIsMobile';
import { formatStatFixed } from '../shared/lib/formatStat';
import PageContainer from '../shared/ui/PageContainer';
import PageHeader from '../shared/ui/PageHeader';
import PageLoader from '../shared/ui/PageLoader';

import { useSeasonPreferenceContext } from '../context/SeasonPreferenceContext';
import MatchDayCard, { type MatchDay } from '../features/match/MatchDayCard';
import { formatMatchDate, formatMatchTime } from '../shared/lib/matchUtils';
import LoadError from '../shared/ui/LoadError';

type HomeNextMatch = { id: string; date: string; venue: string | null; opponent: string; matchDay: MatchDay | null };
/** „3/9 (33.3%)” z KALK → „3/9 (33,3%)”; bez prób („0/0”) → „–”. */
const threesText = (v?: string | null) => (!v || /^0\/0\b/.test(v.trim()) ? '–' : v.replace(/(\d)\.(\d)/g, '$1,$2'));
const sameName = (a?: string | null, b?: string | null) => Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());

interface KeyPlayerRow {
  name: string;
  matches: number;
  ppg: number;
  threePointStats?: string;
  totalPoints: number;
}

export default function ScoutingPage() {
  const [searchParams] = useSearchParams();
  // Odprawa przedmeczowa (dawniej Taktyka → Odprawa) — ten sam rywal co raport
  const [pregame, setPregame] = useState<{ briefing: PreGameData | null; opponent: string | null }>({ briefing: null, opponent: null });
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const { user } = useAuth();
  const { seasonId } = useSeasonPreferenceContext();
  const isAdmin = user?.role === 'ADMIN';
  const showPlayerCards = usePortraitMobile();
  const [nextMatch, setNextMatch] = useState<HomeNextMatch | null>(null);

  useEffect(() => {
    if (!seasonId) return;
    fetchJSON<{ nextMatch: HomeNextMatch | null }>(`/api/me/home?seasonId=${encodeURIComponent(seasonId)}`)
      .then((res) => setNextMatch(res?.nextMatch ?? null))
      .catch(() => setNextMatch(null));
  }, [seasonId]);

  const loadScouting = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const opponent = searchParams.get('opponent');
      const q = new URLSearchParams();
      if (opponent) q.set('opponent', opponent);
      if (seasonId) q.set('seasonId', seasonId);
      const queryStr = q.toString() ? `?${q.toString()}` : '';
      const res = await fetchJSON<Record<string, unknown>>(`/api/scouting/detailed${queryStr}`);
      setData(res);
    } catch (err) {
      console.error(err);
      setLoadError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScouting();
  }, [searchParams, seasonId]);

  const opponentName = (data?.teamInfo as { opponent?: { name?: string } } | undefined)?.opponent?.name ?? searchParams.get('opponent');
  const loadPreGame = useCallback(async () => {
    if (!opponentName) return;
    try {
      const q = new URLSearchParams({ opponent: opponentName });
      if (seasonId) q.set('seasonId', seasonId);
      const res = await fetchJSON<{ briefing?: PreGameData | null; opponent?: string | null }>(`/api/tactics/pregame?${q.toString()}`);
      setPregame({ briefing: res?.briefing ?? null, opponent: res?.opponent ?? opponentName });
    } catch (err) {
      console.error('Error fetching pregame briefing:', err);
    }
  }, [opponentName, seasonId]);

  useEffect(() => {
    loadPreGame();
  }, [loadPreGame]);

  const handleGenerateScoutingAi = async (force = false) => {
    setAiLoading(true);
    setAiError(null);
    try {
      const opponent = searchParams.get('opponent') || (data?.teamInfo as { opponent?: { name?: string } })?.opponent?.name;
      const q = new URLSearchParams();
      if (opponent) q.set('opponent', opponent);
      if (seasonId) q.set('seasonId', seasonId);
      const queryStr = q.toString() ? `?${q.toString()}` : '';
      await postJSON(`/api/scouting/analyze${queryStr}`, { force });
      await loadScouting();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Błąd generacji scoutingu AI';
      setAiError(message);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return <PageLoader label="Ładowanie raportu..." />;
  }

  if (!data) {
    return (
      <PageContainer width="narrow">
        {loadError ? (
          <>
            <PageHeader kicker="Następny rywal" title="Raport o rywalu" />
            <LoadError title="Nie udało się wczytać raportu" error={loadError} onRetry={() => void loadScouting()} />
          </>
        ) : (
          <PageHeader kicker="Następny rywal" title="Brak rywala" description="Raport pojawi się, gdy w terminarzu będzie kolejny mecz BeKaPaKa." />
        )}
      </PageContainer>
    );
  }

  const teamInfo = data.teamInfo as {
    opponent: { name: string; rank: number | null; record: string; ppg: number; oppg: number };
    bekapaka: { name: string; rank: number | null; record: string; ppg: number; oppg: number };
  };
  const keyPlayers = (data.keyPlayers || []) as KeyPlayerRow[];
  const form = (data.form || []) as Array<{
    opponent: string;
    score: string;
    result: string;
    date: string;
  }>;
  const aiAnalysis = data.aiAnalysis as {
    summary: string;
    offense: string;
    defense: string;
    verdict: string;
    lockerRoom?: string[];
  } | undefined;
  const advancedStats = data.advancedStats as {
    pace?: number;
    threePointAccuracy?: number;
    fallbackBasicOnly?: boolean;
    fallbackFromPreviousMatch?: boolean;
    sourceMatchLabel?: string | null;
    sourceMatchDate?: string | null;
  } | null;
  const scoutingSummaryMd = data.scoutingSummaryMd as string | null | undefined;
  const personnelMd = data.personnelMd as string | null | undefined;
  const aiMeta = data.aiMeta as {
    fromGemini?: boolean;
    generatedAt?: string;
    model?: string;
    needsRegeneration?: boolean;
    mergedWithTemplate?: boolean;
    stale?: boolean;
  } | undefined;

  const planSourceLabel = aiMeta?.fromGemini
    ? aiMeta.mergedWithTemplate
      ? 'AI + uzupełnienie'
      : 'AI'
    : scoutingSummaryMd
      ? 'Szablon danych'
      : null;

  const { opponent, bekapaka } = teamInfo;
  const hasProtocolDna = Boolean(advancedStats && !advancedStats.fallbackBasicOnly);

  const parseWinPct = (record: string) => {
    if (!record) return 0;
    const [w, l] = record.split('-').map(Number);
    if (isNaN(w) || isNaN(l)) return 0;
    const total = w + l;
    return total > 0 ? Math.round((w / total) * 100) : 0;
  };

  const radarOpponent = {
    name: opponent.name,
    ppg: opponent.ppg,
    oppg: opponent.oppg,
    winPct: parseWinPct(opponent.record),
    pace: advancedStats?.pace || 0,
    threePtPct: advancedStats?.threePointAccuracy || 0
  };

  const radarBeKaPaKa = {
    name: bekapaka.name,
    ppg: bekapaka.ppg,
    oppg: bekapaka.oppg,
    winPct: parseWinPct(bekapaka.record),
    pace: (data.bekapakaAdvancedStats as { pace?: number })?.pace || 0,
    threePtPct: (data.bekapakaAdvancedStats as { threePointAccuracy?: number })?.threePointAccuracy || 0
  };

  const showProtocolBanner =
    advancedStats?.fallbackBasicOnly || advancedStats?.fallbackFromPreviousMatch;

  return (
    <PageContainer
      width="narrow"
      className="text-bkpk-text-primary pb-[max(2rem,env(safe-area-inset-bottom,0px))] space-y-6 md:space-y-8"
    >
      <div className="space-y-6">
        <PageHeader kicker="Następny rywal" title={opponent.name} description="Odprawa, porównanie drużyn i kluczowi gracze rywala." />

        <ScoutingMatchHeader bekapaka={bekapaka} opponent={opponent} />
      </div>

      {nextMatch && sameName(nextMatch.opponent, opponent.name) && (
        <BkpkCard variant="glass" className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="kicker text-bkpk-text-primary">Dzień meczowy</span>
            <span className="text-sm font-semibold tabular-nums text-bkpk-text-primary">
              {formatMatchDate(nextMatch.date)}, {formatMatchTime(nextMatch.date)}
              {nextMatch.venue && <span className="font-normal text-bkpk-text-muted"> · {nextMatch.venue}</span>}
            </span>
          </div>
          <MatchDayCard variant="inline" matchId={nextMatch.id} seasonId={seasonId} matchDay={nextMatch.matchDay} />
        </BkpkCard>
      )}

      <div className="space-y-5 md:space-y-6">
        <PreGameMatchCard
          briefing={pregame.briefing}
          schedule={
            nextMatch && sameName(nextMatch.opponent, opponent.name)
              ? { date: nextMatch.date, venue: nextMatch.venue, gatheringTime: nextMatch.matchDay?.gatheringTime, kit: nextMatch.matchDay?.kit }
              : null
          }
          opponent={pregame.opponent || opponent.name}
          seasonId={seasonId}
          onRefresh={loadPreGame}
          canGenerate={isAdmin}
        />

        {showProtocolBanner ? (
          <ScoutingProtocolBanner
            fallbackBasicOnly={advancedStats?.fallbackBasicOnly}
            fallbackFromPreviousMatch={advancedStats?.fallbackFromPreviousMatch}
            sourceMatchLabel={advancedStats?.sourceMatchLabel}
            sourceMatchDate={advancedStats?.sourceMatchDate}
          />
        ) : null}

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <AiAnalysisBlock
            title="Plan meczowy (AI)"
            errorMessage={aiError}
            content={scoutingSummaryMd}
            structuredContent={aiAnalysis?.summary ? aiAnalysis : null}
            generatedAt={aiMeta?.generatedAt}
            model={aiMeta?.model}
            sourceLabel={planSourceLabel}
            canGenerate={isAdmin}
            loading={aiLoading}
            compactActions
            onGenerate={(force) => void handleGenerateScoutingAi(force)}
            staleHint={
              aiMeta?.stale
                ? 'Raport może być nieaktualny (nowe dane KALK) — odśwież.'
                : aiMeta?.needsRegeneration && aiMeta?.fromGemini
                  ? 'Raport AI jest niepełny — użyj „Wymuś ponowną generację” poniżej przycisków.'
                  : null
            }
            emptyHint="Brak planu meczowego — użyj „Generuj”."
            playerEmptyHint="Plan meczowy pojawi się, gdy trener go przygotuje."
          />
        </motion.div>

        <motion.div
        >
          <MatchupComparison opponent={radarOpponent} bekapaka={radarBeKaPaKa} />
        </motion.div>

        <motion.div
        >
          <AiAnalysisBlock
            title="Analiza kadry (AI)"
            content={personnelMd}
            generatedAt={aiMeta?.generatedAt}
            model={aiMeta?.model}
            sourceLabel={personnelMd ? (aiMeta?.fromGemini ? 'AI' : 'Szablon danych') : null}
            canGenerate={isAdmin}
            loading={aiLoading}
            compactActions
            onGenerate={(force) => void handleGenerateScoutingAi(force)}
            emptyHint="Analiza kadry powstaje razem z planem meczowym — wygeneruj plan powyżej."
            playerEmptyHint="Analiza kadry rywala pojawi się razem z planem meczowym."
          />
        </motion.div>

        {hasProtocolDna ? (
          <motion.div
          >
            <DNASection data={advancedStats as Parameters<typeof DNASection>[0]['data']} />
          </motion.div>
        ) : null}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
          <motion.div
          >
            <BkpkCard
              title="Kluczowi gracze rywala"
              icon={<Users className="h-5 w-5 text-bkpk-primary" />}
              variant="flat"
              className="h-full"
              overflowVisible
            >
              {keyPlayers.length === 0 ? (
                <p className="py-6 text-sm text-bkpk-text-secondary">Rywal nie ma jeszcze statystyk zawodników w tym sezonie.</p>
              ) : showPlayerCards ? (
                <MobileDataList className="p-0 pb-3">
                  {keyPlayers.map((p, i) => (
                    <MobileDataCard
                      key={`${p.name}-${i}`}
                      rank={i + 1}
                      title={p.name}
                      highlight={
                        <div className="text-right">
                          <div className="font-display text-xl leading-none tabular-nums text-bkpk-text-primary">
                            {formatStatFixed(p.ppg)}
                          </div>
                          <div className="label-caps text-[11px] text-bkpk-text-muted mt-1">pkt/m</div>
                        </div>
                      }
                      stats={[
                        { label: 'Mecze', value: p.matches },
                        { label: 'Za 3', value: threesText(p.threePointStats) },
                        { label: 'Pkt łącznie', value: p.totalPoints, emphasize: true }
                      ]}
                    />
                  ))}
                </MobileDataList>
              ) : (
                <ScrollableTableShell compact className="mx-0 border-0 bg-bkpk-bg">
                  <table className="bkpk-table min-w-[480px] text-left text-[14px]">
                    <thead>
                      <tr>
                        <th className="h-11 pl-3 text-left">Zawodnik</th>
                        <th className="h-11 text-center">Mecze</th>
                        <th className="h-11 text-center shadow-[inset_0_-3px_0_var(--c-red-500)]">Pkt/m</th>
                        <th className="h-11 text-center">Za 3</th>
                        <th className="h-11 text-center">Pkt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keyPlayers.map((p, i) => (
                        <tr key={i} className="transition-colors">
                          <td className="h-11 pl-3 font-semibold text-bkpk-text-primary">
                            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center border border-bkpk-border-strong font-display text-[13px] tabular-nums text-bkpk-text-secondary">
                              {i + 1}
                            </span>
                            {p.name}
                          </td>
                          <td className="h-11 text-center tabular-nums text-bkpk-text-secondary">{p.matches}</td>
                          <td className="h-11 text-center font-display text-[18px] leading-none tabular-nums text-bkpk-text-primary">{formatStatFixed(p.ppg)}</td>
                          <td className="h-11 text-center tabular-nums text-bkpk-text-secondary">
                            {threesText(p.threePointStats)}
                          </td>
                          <td className="h-11 text-center font-semibold tabular-nums text-bkpk-text-secondary">{p.totalPoints}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollableTableShell>
              )}
            </BkpkCard>
          </motion.div>

          <motion.div
          >
            <BkpkCard
              title="Ostatnie mecze rywala"
              icon={<History className="h-5 w-5 text-bkpk-primary" />}
              variant="flat"
              className="h-full"
              overflowVisible
            >
              {form.length === 0 && <p className="py-6 text-sm text-bkpk-text-secondary">Rywal nie rozegrał jeszcze meczu w tym sezonie.</p>}
              <div className={form.length ? 'border-y border-bkpk-border-subtle' : 'hidden'}>
                {form.map((m, i) => (
                  <div
                    key={i}
                    className="group flex items-center justify-between gap-3 px-2 py-3 transition-colors even:bg-bkpk-bg hover:bg-bkpk-surface-elevated"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Forma: wygrana pełny kwadrat, porażka kontur — litera zawsze widoczna */}
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center border-[1.5px] font-display text-lg',
                          m.result === 'W'
                            ? 'border-bkpk-text-primary bg-bkpk-text-primary text-bkpk-bg'
                            : 'border-bkpk-text-secondary text-bkpk-text-primary'
                        )}
                      >
                        {m.result === 'W' ? 'W' : 'P'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="label-caps text-[11px] text-bkpk-text-muted">
                          {m.result === 'W' ? 'Wygrana' : 'Porażka'}
                        </span>
                        <span className="font-semibold text-bkpk-text-primary truncate">
                          vs {m.opponent}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="font-display text-xl leading-none tabular-nums text-bkpk-text-primary">
                        {String(m.score).replace('-', ':')}
                      </span>
                      <span className="text-xs font-medium text-bkpk-text-muted mt-1 tabular-nums">{m.date ? formatMatchDate(m.date) : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            </BkpkCard>
          </motion.div>
        </div>
      </div>
    </PageContainer>
  );
}
