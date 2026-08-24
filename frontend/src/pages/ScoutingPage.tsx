
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchJSON, postJSON } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { DNASection } from '../components/scouting/DNASection';
import { MatchupComparison } from '../components/scouting/MatchupComparison';
import { ScoutingProtocolBanner } from '../components/scouting/ScoutingProtocolBanner';
import AiAnalysisBlock from '../components/ai/AiAnalysisBlock';
import BkpkCard from '../shared/ui/BkpkCard';
import { ArrowLeft, Users, History } from 'lucide-react';
import { cn } from '../shared/lib/utils';
import { motion } from 'framer-motion';
import { ScoutingMatchHeader } from '../components/scouting/ScoutingMatchHeader';
import { MobileDataCard, MobileDataList } from '../shared/ui/MobileDataCard';
import ScrollableTableShell from '../shared/ui/ScrollableTableShell';
import { usePortraitMobile } from '../hooks/useIsMobile';
import { formatStatFixed } from '../shared/lib/formatStat';

import { useSeasonPreferenceContext } from '../context/SeasonPreferenceContext';

interface KeyPlayerRow {
  name: string;
  matches: number;
  ppg: number;
  threePointStats?: string;
  totalPoints: number;
}

export default function ScoutingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const { user } = useAuth();
  const { seasonId } = useSeasonPreferenceContext();
  const isAdmin = user?.role === 'ADMIN';
  const showPlayerCards = usePortraitMobile();

  const loadScouting = async () => {
    setLoading(true);
    try {
      const opponent = searchParams.get('opponent');
      const q = new URLSearchParams();
      if (opponent) q.set('opponent', opponent);
      if (seasonId) q.set('seasonId', seasonId);
      const queryStr = q.toString() ? `?${q.toString()}` : '';
      const res = await fetchJSON(`/api/scouting/detailed${queryStr}`);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScouting();
  }, [searchParams, seasonId]);

  const handleGenerateScoutingAi = async (force = false) => {
    setAiLoading(true);
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
      alert(message);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-bkpk-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-bkpk-primary/20 border-t-bkpk-primary rounded-full animate-spin" />
          <span className="text-bkpk-text-secondary font-bold tracking-widest uppercase text-sm">
            Ładowanie raportu...
          </span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[100dvh] bg-bkpk-bg flex items-center justify-center">
        <div className="text-bkpk-text-secondary font-bold text-xl">Brak danych o rywalu.</div>
      </div>
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
      ? 'Gemini + uzupełnienie'
      : 'Gemini'
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
    <div className="bg-bkpk-bg pb-[max(2rem,env(safe-area-inset-bottom,0px))] text-bkpk-text-primary">
      <div className="relative border-b border-bkpk-border-strong bg-gradient-to-b from-bkpk-navy-light/40 to-transparent px-4 pb-6 pt-5 md:px-6 md:pb-8 md:pt-6">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-32 -translate-y-1/2 bg-bkpk-primary/5 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="group mb-5 flex items-center gap-2 text-bkpk-text-secondary transition-colors hover:text-bkpk-text-primary"
          >
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            <span className="text-xs font-bold uppercase tracking-widest sm:text-sm">Powrót do pulpitu</span>
          </button>

          <ScoutingMatchHeader bekapaka={bekapaka} opponent={opponent} />
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-5 px-4 md:space-y-6 md:px-6">
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
                ? 'Raport może być nieaktualny (nowe dane KALK). Admin: Odśwież lub wymuś generację.'
                : aiMeta?.needsRegeneration && aiMeta?.fromGemini
                  ? 'Raport AI jest niepełny — użyj „Wymuś ponowną generację” poniżej przycisków.'
                  : null
            }
            emptyHint="Brak raportu AI. Administrator może wygenerować plan meczowy (Gemini)."
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <MatchupComparison opponent={radarOpponent} bekapaka={radarBeKaPaKa} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <AiAnalysisBlock
            title="Analiza kadry (AI)"
            content={personnelMd}
            generatedAt={aiMeta?.generatedAt}
            model={aiMeta?.model}
            sourceLabel={personnelMd ? (aiMeta?.fromGemini ? 'Gemini' : 'Szablon danych') : null}
            canGenerate={isAdmin}
            loading={aiLoading}
            compactActions
            onGenerate={(force) => void handleGenerateScoutingAi(force)}
            emptyHint="Kadra AI powstaje razem z planem meczowym — wygeneruj raport scoutingu (admin)."
          />
        </motion.div>

        {hasProtocolDna ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <DNASection data={advancedStats as Parameters<typeof DNASection>[0]['data']} />
          </motion.div>
        ) : null}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <BkpkCard
              title="Kluczowi gracze rywala"
              icon={<Users className="h-5 w-5 text-bkpk-primary" />}
              variant="glass"
              className="h-full"
              overflowVisible
            >
              {showPlayerCards ? (
                <MobileDataList className="p-0 pb-3">
                  {keyPlayers.map((p, i) => (
                    <MobileDataCard
                      key={`${p.name}-${i}`}
                      rank={i + 1}
                      title={p.name}
                      highlight={
                        <div>
                          <div className="font-outfit text-xl font-black tabular-nums text-bkpk-primary">
                            {formatStatFixed(p.ppg)}
                          </div>
                          <div className="text-[10px] font-bold uppercase text-bkpk-text-muted">PPG</div>
                        </div>
                      }
                      stats={[
                        { label: 'Mecze', value: p.matches },
                        { label: '3PT', value: p.threePointStats || '—' },
                        { label: 'Pkt łącznie', value: p.totalPoints, emphasize: true }
                      ]}
                    />
                  ))}
                </MobileDataList>
              ) : (
                <ScrollableTableShell compact className="mx-0 rounded-none border-0">
                  <table className="w-full min-w-[480px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-bkpk-border-strong text-sm font-bold uppercase tracking-widest text-bkpk-text-muted">
                        <th className="pb-3 pl-2">Zawodnik</th>
                        <th className="pb-3 text-center">Mecze</th>
                        <th className="pb-3 text-center">PPG</th>
                        <th className="pb-3 text-center">3PT</th>
                        <th className="pb-3 text-center">PTS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keyPlayers.map((p, i) => (
                        <tr
                          key={i}
                          className="border-b border-bkpk-border-strong transition-colors last:border-0 hover:bg-bkpk-surface-tint-3"
                        >
                          <td className="py-3 pl-2 font-bold text-bkpk-text-primary">
                            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded bg-bkpk-surface-tint-4 text-caption text-bkpk-text-secondary">
                              {i + 1}
                            </span>
                            {p.name}
                          </td>
                          <td className="py-3 text-center font-mono text-bkpk-text-secondary">{p.matches}</td>
                          <td className="py-3 text-center font-black text-bkpk-primary">{formatStatFixed(p.ppg)}</td>
                          <td className="py-3 text-center font-mono text-bkpk-text-secondary">
                            {p.threePointStats || '-'}
                          </td>
                          <td className="py-3 text-center font-bold text-bkpk-text-secondary">{p.totalPoints}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollableTableShell>
              )}
            </BkpkCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <BkpkCard
              title="Ostatnie mecze rywala"
              icon={<History className="h-5 w-5 text-bkpk-primary" />}
              variant="glass"
              className="h-full"
              overflowVisible
            >
              <div className="space-y-3">
                {form.map((m, i) => (
                  <div
                    key={i}
                    className="group flex items-center justify-between rounded-xl border border-bkpk-border-strong bg-bkpk-surface-tint-2 p-3 transition-colors hover:bg-bkpk-surface-tint-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-black shadow-lg',
                          m.result === 'W'
                            ? 'border-bkpk-success/30 bg-bkpk-success/20 text-bkpk-success'
                            : 'border-bkpk-danger/30 bg-bkpk-danger/15 text-bkpk-text-danger-subtle'
                        )}
                      >
                        {m.result === 'W' ? 'Z' : 'P'}
                      </div>
                      <div className="flex flex-col">
                        <span className="mb-0.5 text-caption-bold uppercase tracking-widest text-bkpk-text-muted">
                          Przeciwnik
                        </span>
                        <span className="text-body-bold text-bkpk-text-primary transition-colors group-hover:text-bkpk-primary">
                          vs {m.opponent}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-outfit text-lg font-black tracking-tight text-bkpk-text-primary">
                        {m.score}
                      </span>
                      <span className="text-xs font-medium text-bkpk-text-muted">{m.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </BkpkCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
