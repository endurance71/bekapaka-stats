import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Sparkles,
  Users,
  Shield,
  Plus,
  ArrowLeft,
  Save,
  BookOpen,
  Compass,
  Check
} from 'lucide-react';
import BkpkCard from '../shared/ui/BkpkCard';
import BkpkButton from '../shared/ui/BkpkButton';
import BasketballCourtCanvas, { DiagramData } from '../components/tactics/BasketballCourtCanvas';
import PlaybookList, { PlayItem } from '../components/tactics/PlaybookList';
import AiPlayGeneratorModal from '../components/tactics/AiPlayGeneratorModal';
import SynergyMatrix, { DuoRecord } from '../components/tactics/SynergyMatrix';
import PreGameMatchCard, { PreGameData } from '../components/tactics/PreGameMatchCard';
import { fetchJSON, postJSON, putJSON } from '../lib/api';
import { useSeasonPreferenceContext } from '../context/SeasonPreferenceContext';
import { cn } from '../shared/lib/utils';

export default function TacticsHub() {
  const [activeTab, setActiveTab] = useState<'playbook' | 'synergy' | 'pregame'>('playbook');
  
  // Playbook State
  const [plays, setPlays] = useState<PlayItem[]>([]);
  const [selectedPlay, setSelectedPlay] = useState<PlayItem | null>(null);
  const [isEditingCanvas, setIsEditingCanvas] = useState(false);
  const [canvasData, setCanvasData] = useState<DiagramData | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [savingPlay, setSavingPlay] = useState(false);
  const [playName, setPlayName] = useState('');
  const [playCategory, setPlayCategory] = useState('half_court');
  const [playTargetDefense, setPlayTargetDefense] = useState('Strefa 2-3');
  const [playDescription, setPlayDescription] = useState('');

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

  const loadPlays = useCallback(async () => {
    try {
      const data = await fetchJSON<PlayItem[]>('/api/tactics/plays');
      setPlays(data || []);
    } catch (err) {
      console.error('Error fetching plays:', err);
    }
  }, []);

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
    setCanvasData(play.diagramData || null);
    setPlayName(play.name);
    setPlayCategory(play.category);
    setPlayTargetDefense(play.targetDefense || 'Strefa 2-3');
    setPlayDescription(play.description || '');
    setIsEditingCanvas(true);
  };

  const handleCreateNewPlay = () => {
    setSelectedPlay(null);
    setCanvasData(null);
    setPlayName('Nowa Zagrywka');
    setPlayCategory('half_court');
    setPlayTargetDefense('Strefa 2-3');
    setPlayDescription('');
    setIsEditingCanvas(true);
  };

  const handleSaveCurrentPlay = async () => {
    if (!playName.trim()) return;
    setSavingPlay(true);
    try {
      if (selectedPlay?.id) {
        const updated = await putJSON<PlayItem>(`/api/tactics/plays/${selectedPlay.id}`, {
          name: playName,
          category: playCategory,
          targetDefense: playTargetDefense,
          description: playDescription,
          diagramData: canvasData
        });
        setPlays((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setSelectedPlay(updated);
      } else {
        const created = await postJSON<PlayItem>('/api/tactics/plays', {
          name: playName,
          category: playCategory,
          targetDefense: playTargetDefense,
          description: playDescription,
          diagramData: canvasData
        });
        setPlays((prev) => [created, ...prev]);
        setSelectedPlay(created);
      }
      setIsEditingCanvas(false);
    } catch (err) {
      console.error('Error saving play:', err);
    } finally {
      setSavingPlay(false);
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
            onClick={() => { setActiveTab('playbook'); setIsEditingCanvas(false); }}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 min-h-[40px] shrink-0",
              activeTab === 'playbook'
                ? "bg-bkpk-primary text-black shadow-bkpk-glow"
                : "text-bkpk-text-muted hover:text-bkpk-text-primary"
            )}
          >
            <BookOpen className="w-4 h-4" />
            Tablica &amp; Playbook
          </button>

          <button
            onClick={() => { setActiveTab('synergy'); setIsEditingCanvas(false); }}
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
            onClick={() => { setActiveTab('pregame'); setIsEditingCanvas(false); }}
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
            className="space-y-6"
          >
            {!isEditingCanvas ? (
              <>
                {/* Pasek akcji Playbooka */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-bkpk-glass border border-bkpk-border-strong rounded-2xl">
                  <div>
                    <h3 className="text-sm font-bold text-bkpk-text-primary uppercase tracking-wider">
                      Baza Zagrań Taktycznych ({plays.length})
                    </h3>
                    <p className="text-xs text-bkpk-text-muted">
                      Wybierz zagrywkę do analizy lub stwórz nową z pomocą AI
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <BkpkButton variant="outline" size="sm" onClick={handleCreateNewPlay}>
                      <Plus className="w-4 h-4 mr-1.5" />
                      Rysuj na Tablicy
                    </BkpkButton>
                    <BkpkButton variant="primary" size="sm" onClick={() => setIsAiModalOpen(true)}>
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      Generator Zagrywek AI
                    </BkpkButton>
                  </div>
                </div>

                {/* Lista Zagrań */}
                <PlaybookList
                  plays={plays}
                  onSelectPlay={handleSelectPlay}
                  onPlayDeleted={(id) => setPlays((prev) => prev.filter((p) => p.id !== id))}
                  onPlayUpdated={(updated) =>
                    setPlays((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
                  }
                />
              </>
            ) : (
              /* Widok Edycji i Podglądu na Tablicy */
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-bkpk-border-strong">
                  <BkpkButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingCanvas(false)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Wróć do Katalogu
                  </BkpkButton>

                  <div className="flex items-center gap-2">
                    <BkpkButton
                      variant="primary"
                      size="sm"
                      onClick={handleSaveCurrentPlay}
                      loading={savingPlay}
                    >
                      <Save className="w-4 h-4 mr-1.5" />
                      Zapisz Zagrywkę
                    </BkpkButton>
                  </div>
                </div>

                {/* Pola edycyjne metadanych zagrywki */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle rounded-2xl">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-bkpk-text-muted block mb-1">
                      Nazwa Zagrywki
                    </label>
                    <input
                      type="text"
                      value={playName}
                      onChange={(e) => setPlayName(e.target.value)}
                      placeholder="np. Horns Flare vs Strefa"
                      className="w-full bg-bkpk-bg border border-bkpk-border-strong rounded-xl px-3 py-2 text-xs text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-bkpk-text-muted block mb-1">
                      Kategoria
                    </label>
                    <select
                      value={playCategory}
                      onChange={(e) => setPlayCategory(e.target.value)}
                      className="w-full bg-bkpk-bg border border-bkpk-border-strong rounded-xl px-3 py-2 text-xs text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary"
                    >
                      <option value="half_court">Atak pozycyjny</option>
                      <option value="blob">BLOB (Aut końcowy)</option>
                      <option value="slob">SLOB (Aut boczny)</option>
                      <option value="ato">ATO (Po czasie)</option>
                      <option value="fastbreak">Szybki atak</option>
                      <option value="defense">Wariant obrony</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-bkpk-text-muted block mb-1">
                      Obrona Przeciwnika
                    </label>
                    <input
                      type="text"
                      value={playTargetDefense}
                      onChange={(e) => setPlayTargetDefense(e.target.value)}
                      placeholder="np. Strefa 2-3 / Drop PnR"
                      className="w-full bg-bkpk-bg border border-bkpk-border-strong rounded-xl px-3 py-2 text-xs text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-bkpk-text-muted block mb-1">
                      Opis &amp; Wytyczne Trenerskie
                    </label>
                    <textarea
                      value={playDescription}
                      onChange={(e) => setPlayDescription(e.target.value)}
                      placeholder="Krótki opis akcji..."
                      rows={2}
                      className="w-full bg-bkpk-bg border border-bkpk-border-strong rounded-xl p-3 text-xs text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary resize-none"
                    />
                  </div>
                </div>

                {/* Interaktywna Tablica */}
                <BasketballCourtCanvas
                  initialData={canvasData}
                  onChange={(newData) => setCanvasData(newData)}
                />
              </div>
            )}
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
