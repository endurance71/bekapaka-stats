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
import BasketballCourtCanvas, { DiagramData } from '../components/tactics/BasketballCourtCanvas';
import PlaybookList, { PlayItem } from '../components/tactics/PlaybookList';
import AiPlayGeneratorModal from '../components/tactics/AiPlayGeneratorModal';
import SynergyMatrix, { DuoRecord } from '../components/tactics/SynergyMatrix';
import PreGameMatchCard, { PreGameData } from '../components/tactics/PreGameMatchCard';
import { fetchJSON } from '../lib/api';
import { useSeasonPreferenceContext } from '../context/SeasonPreferenceContext';
import { cn } from '../shared/lib/utils';

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
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 py-4">
      {/* Header Huba Taktycznego */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-bkpk-primary block mb-1">
            Smart Coaching &amp; Strategy
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-bkpk-text-primary tracking-tight font-outfit uppercase">
            Centrum Taktyczne <span className="text-bkpk-primary">BeKaPaKa</span>
          </h1>
        </div>

        {/* Zakładki Nawigacyjne (Pill Tabs) */}
        <div className="flex items-center gap-1.5 p-1 bg-bkpk-surface-tint-1 rounded-2xl border border-bkpk-border-strong self-start md:self-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('playbook')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 min-h-[40px] shrink-0",
              activeTab === 'playbook'
                ? "bg-bkpk-primary text-black shadow-bkpk-glow"
                : "text-bkpk-text-muted hover:text-bkpk-text-primary"
            )}
          >
            <Film className="w-4 h-4" />
            Animowane Zagrywki
          </button>

          <button
            onClick={() => setActiveTab('synergy')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 min-h-[40px] shrink-0",
              activeTab === 'synergy'
                ? "bg-bkpk-primary text-black shadow-bkpk-glow"
                : "text-bkpk-text-muted hover:text-bkpk-text-primary"
            )}
          >
            <Users className="w-4 h-4" />
            Synergia Duetów
          </button>

          <button
            onClick={() => setActiveTab('pregame')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 min-h-[40px] shrink-0",
              activeTab === 'pregame'
                ? "bg-bkpk-primary text-black shadow-bkpk-glow"
                : "text-bkpk-text-muted hover:text-bkpk-text-primary"
            )}
          >
            <Shield className="w-4 h-4" />
            Odprawa Przedmeczowa
          </button>
        </div>
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
                  <Film className="w-12 h-12 text-bkpk-primary/40 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-bkpk-text-primary uppercase tracking-wider mb-2">
                    Wybierz zagrywkę z katalogu poniżej
                  </h3>
                  <p className="text-xs text-bkpk-text-muted max-w-md mx-auto">
                    Kliknij dowolny preset, aby uruchomić interaktywną animację ruchu zawodników na boisku.
                  </p>
                </BkpkCard>
              )}
            </div>

            {/* Sekcja 2: Pasek Akcji i Katalog Gotowych Presetów */}
            <div className="space-y-4 pt-4 border-t border-bkpk-border-strong">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-bkpk-text-primary uppercase tracking-wider">
                    Biblioteka Gotowych Presetów ({plays.length})
                  </h3>
                  <p className="text-xs text-bkpk-text-muted">
                    Wybierz zagrywkę taktyczną lub wygeneruj nowy wariant z pomocą AI
                  </p>
                </div>

                <BkpkButton variant="primary" size="sm" onClick={() => setIsAiModalOpen(true)}>
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Generuj Nowy Preset AI
                </BkpkButton>
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
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Generatora AI */}
      <AiPlayGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onPlayGenerated={(generatedPlay) => {
          setPlays((prev) => [generatedPlay, ...prev]);
          handleSelectPlay(generatedPlay);
        }}
      />
    </div>
  );
}
