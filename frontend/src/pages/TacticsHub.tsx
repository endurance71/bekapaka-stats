import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Sparkles,
  Users,
  Shield,
  BookOpen,
  Film,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import BkpkCard from '../shared/ui/BkpkCard';
import BkpkButton from '../shared/ui/BkpkButton';
import BasketballCourtCanvas from '../components/tactics/BasketballCourtCanvas';
import PlaybookList, { PlayItem } from '../components/tactics/PlaybookList';
import AiPlayGeneratorModal from '../components/tactics/AiPlayGeneratorModal';
import SynergyMatrix, { DuoRecord } from '../components/tactics/SynergyMatrix';
import PreGameMatchCard, { PreGameData } from '../components/tactics/PreGameMatchCard';
import { fetchJSON } from '../lib/api';
import { useSeasonPreferenceContext } from '../context/SeasonPreferenceContext';
import { cn } from '../shared/lib/utils';
import { useAuth } from '../context/AuthContext';
import PageContainer from '../shared/ui/PageContainer';
import PageHeader from '../shared/ui/PageHeader';

// Zakładki — jak `.tabs` na bekapaka.pl: wersaliki, 3 px czerwone podkreślenie aktywnej
const TAB_BASE = cn(
  "relative inline-flex items-center gap-2 min-h-[48px] shrink-0 whitespace-nowrap label-caps text-[13px] sm:text-sm transition-colors duration-200",
  "after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:bg-bkpk-primary after:origin-left after:transition-transform after:duration-200"
);

export default function TacticsHub() {
  const [activeTab, setActiveTab] = useState<'playbook' | 'synergy' | 'pregame'>('playbook');

  // Playbook State
  const [plays, setPlays] = useState<PlayItem[]>([]);
  const [selectedPlay, setSelectedPlay] = useState<PlayItem | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Synergy State
  const [synergyData, setSynergyData] = useState<{
    duos: DuoRecord[];
    bestOffensivePair: DuoRecord | null;
    bestDefensivePair: DuoRecord | null;
    gamesAnalyzed: number;
  }>({ duos: [], bestOffensivePair: null, bestDefensivePair: null, gamesAnalyzed: 0 });
  const [loadingSynergy, setLoadingSynergy] = useState(false);

  // PreGame State
  const [pregameBriefing, setPregameBriefing] = useState<PreGameData | null>(null);
  const [pregameOpponent, setPregameOpponent] = useState<string | null>(null);

  const { seasonId } = useSeasonPreferenceContext();
  const { user } = useAuth();
  const canManageTactics = user?.role === 'ADMIN';
  const playerSectionRef = useRef<HTMLDivElement>(null);

  const loadPlays = useCallback(async () => {
    try {
      const data = await fetchJSON<PlayItem[]>('/api/tactics/plays');
      setPlays(data || []);
      if (data && data.length > 0 && !selectedPlay) {
        setSelectedPlay(data[0]);
      }
    } catch (err) {
      console.error('Error fetching plays:', err);
    }
  }, [selectedPlay]);

  const loadSynergy = useCallback(async () => {
    setLoadingSynergy(true);
    try {
      const res = await fetchJSON<any>(`/api/tactics/synergy?seasonId=${seasonId}`);
      setSynergyData(res);
    } catch (err) {
      console.error('Error fetching synergy:', err);
    } finally {
      setLoadingSynergy(false);
    }
  }, [seasonId]);

  const loadPreGame = useCallback(async () => {
    try {
      const res = await fetchJSON<any>(`/api/tactics/pregame?seasonId=${seasonId}`);
      setPregameBriefing(res?.briefing || null);
      setPregameOpponent(res?.opponent || null);
    } catch (err) {
      console.error('Error fetching pregame briefing:', err);
    }
  }, [seasonId]);

  useEffect(() => {
    loadPlays();
  }, [loadPlays]);

  useEffect(() => {
    if (activeTab === 'synergy') loadSynergy();
    if (activeTab === 'pregame') loadPreGame();
  }, [activeTab, seasonId, loadSynergy, loadPreGame]);

  const handleSelectPlay = (play: PlayItem) => {
    setSelectedPlay(play);
    if (playerSectionRef.current) {
      playerSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <PageContainer className="max-w-[1280px]">
      {/* Header Huba Taktycznego */}
      <PageHeader
        kicker={<>Smart Coaching &amp; Strategy</>}
        title={<>Centrum Taktyczne <span className="text-bkpk-primary">BeKaPaKa</span></>}
      />

      {/* Zakładki Nawigacyjne — jak `.tabs` na bekapaka.pl */}
      <div className="flex overflow-x-auto no-scrollbar max-w-full gap-6 sm:gap-8 border-b border-bkpk-border-subtle">
        <button
          onClick={() => setActiveTab('playbook')}
          className={cn(
            TAB_BASE,
            activeTab === 'playbook'
              ? "text-bkpk-text-primary after:scale-x-100"
              : "text-bkpk-text-muted hover:text-bkpk-text-primary after:scale-x-0"
          )}
        >
          <Film className="w-4 h-4 shrink-0" />
          Animowane Zagrywki
        </button>

        <button
          onClick={() => setActiveTab('synergy')}
          className={cn(
            TAB_BASE,
            activeTab === 'synergy'
              ? "text-bkpk-text-primary after:scale-x-100"
              : "text-bkpk-text-muted hover:text-bkpk-text-primary after:scale-x-0"
          )}
        >
          <Users className="w-4 h-4 shrink-0" />
          Synergia Duetów
        </button>

        <button
          onClick={() => setActiveTab('pregame')}
          className={cn(
            TAB_BASE,
            activeTab === 'pregame'
              ? "text-bkpk-text-primary after:scale-x-100"
              : "text-bkpk-text-muted hover:text-bkpk-text-primary after:scale-x-0"
          )}
        >
          <Shield className="w-4 h-4 shrink-0" />
          Odprawa Przedmeczowa
        </button>
      </div>

      {/* Zawartość Zakładek */}
      <AnimatePresence mode="wait">
        {activeTab === 'playbook' && (
          <motion.div
            key="playbook"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Sekcja 1: Główny Odtwarzacz Animacji Zagrywki */}
            <div ref={playerSectionRef} className="space-y-4">
              {selectedPlay ? (
                <BasketballCourtCanvas
                  initialData={selectedPlay.diagramData}
                  playName={selectedPlay.name}
                  category={selectedPlay.category}
                  targetDefense={selectedPlay.targetDefense || undefined}
                />
              ) : (
                <BkpkCard variant="glass" className="text-center py-16">
                  <Film className="w-12 h-12 text-bkpk-text-muted mx-auto mb-3" />
                  <h3 className="text-[20px] text-bkpk-text-primary mb-2">
                    Wybierz zagrywkę z katalogu poniżej
                  </h3>
                  <p className="text-[14px] text-bkpk-text-muted max-w-md mx-auto">
                    Kliknij dowolny preset, aby uruchomić interaktywną animację ruchu zawodników na boisku.
                  </p>
                </BkpkCard>
              )}
            </div>

            {/* Sekcja 2: Pasek Akcji i Katalog Gotowych Presetów */}
            <div className="space-y-4 pt-6 border-t border-bkpk-border-subtle">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-[22px] sm:text-[24px] leading-tight text-bkpk-text-primary">
                    Biblioteka Gotowych Presetów (<span className="font-display tabular-nums">{plays.length}</span>)
                  </h3>
                  <p className="text-[14px] text-bkpk-text-muted">
                    Wybierz zagrywkę taktyczną lub wygeneruj nowy wariant z pomocą AI
                  </p>
                </div>

                {canManageTactics && (
                  <BkpkButton variant="primary" size="sm" onClick={() => setIsAiModalOpen(true)}>
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    Generuj Nowy Preset AI
                  </BkpkButton>
                )}
              </div>

              {/* Lista Presetów */}
              <PlaybookList
                plays={plays}
                selectedPlayId={selectedPlay?.id}
                onSelectPlay={handleSelectPlay}
                onPlayDeleted={(id) => {
                  setPlays((prev) => prev.filter((p) => p.id !== id));
                  if (selectedPlay?.id === id) setSelectedPlay(null);
                }}
                onPlayUpdated={(updated) =>
                  setPlays((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
                }
                canManage={canManageTactics}
              />
            </div>
          </motion.div>
        )}

        {activeTab === 'synergy' && (
          <motion.div
            key="synergy"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <SynergyMatrix
              duos={synergyData.duos}
              bestOffensivePair={synergyData.bestOffensivePair}
              bestDefensivePair={synergyData.bestDefensivePair}
              gamesAnalyzed={synergyData.gamesAnalyzed}
              loading={loadingSynergy}
            />
          </motion.div>
        )}

        {activeTab === 'pregame' && (
          <motion.div
            key="pregame"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <PreGameMatchCard
              briefing={pregameBriefing}
              opponent={pregameOpponent}
              seasonId={seasonId}
              onRefresh={loadPreGame}
              canGenerate={canManageTactics}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Generatora AI */}
      {canManageTactics && <AiPlayGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onPlayGenerated={(generatedPlay) => {
          setPlays((prev) => [generatedPlay, ...prev]);
          handleSelectPlay(generatedPlay);
        }}
      />}
    </PageContainer>
  );
}
