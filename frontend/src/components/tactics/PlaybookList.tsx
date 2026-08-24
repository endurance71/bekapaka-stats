import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Target,
  Shield,
  Zap,
  Play as PlayIcon,
  Trash2,
  Tag,
  CheckCircle2,
  XCircle,
  Eye,
  Layers
} from 'lucide-react';
import BkpkCard from '../../shared/ui/BkpkCard';
import BkpkButton from '../../shared/ui/BkpkButton';
import { cn } from '../../shared/lib/utils';
import { deleteJSON, putJSON } from '../../lib/api';

export interface PlayItem {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  targetDefense?: string | null;
  diagramData?: any;
  videoUrl?: string | null;
  tags?: string[];
  isAiGenerated?: boolean;
  attempts?: number;
  successes?: number;
  createdAt: string;
}

interface PlaybookListProps {
  plays: PlayItem[];
  selectedPlayId?: string | null;
  onSelectPlay: (play: PlayItem) => void;
  onPlayDeleted: (id: string) => void;
  onPlayUpdated: (play: PlayItem) => void;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  half_court: { label: 'Atak pozycyjny', color: 'bg-bkpk-primary/20 text-bkpk-primary border-bkpk-primary/30' },
  blob: { label: 'BLOB (Aut końcowy)', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  slob: { label: 'SLOB (Aut boczny)', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  ato: { label: 'ATO (Po czasie)', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  fastbreak: { label: 'Szybki atak', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  defense: { label: 'Obrona', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' }
};

export default function PlaybookList({
  plays,
  selectedPlayId,
  onSelectPlay,
  onPlayDeleted,
  onPlayUpdated
}: PlaybookListProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredPlays = plays.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.targetDefense?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Czy na pewno chcesz usunąć ten preset zagrywki?')) return;
    setDeletingId(id);
    try {
      await deleteJSON(`/api/tactics/plays/${id}`);
      onPlayDeleted(id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtry i Wyszukiwarka */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 min-h-[36px]",
              selectedCategory === 'all'
                ? "bg-bkpk-primary text-black shadow-bkpk-glow"
                : "bg-bkpk-surface-tint-1 text-bkpk-text-muted hover:text-bkpk-text-primary border border-bkpk-border-subtle"
            )}
          >
            Wszystkie ({plays.length})
          </button>
          {Object.entries(CATEGORY_LABELS).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 min-h-[36px]",
                selectedCategory === key
                  ? "bg-bkpk-primary text-black shadow-bkpk-glow"
                  : "bg-bkpk-surface-tint-1 text-bkpk-text-muted hover:text-bkpk-text-primary border border-bkpk-border-subtle"
              )}
            >
              {config.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Szukaj presetu zagrywki..."
          className="bg-bkpk-bg border border-bkpk-border-strong rounded-xl px-3 py-1.5 text-xs text-bkpk-text-primary placeholder:text-bkpk-text-muted/50 focus:outline-none focus:border-bkpk-primary w-full sm:w-64"
        />
      </div>

      {/* Grid Kart Presetów */}
      {filteredPlays.length === 0 ? (
        <BkpkCard variant="glass" className="text-center py-12">
          <Target className="w-12 h-12 text-bkpk-primary/40 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-bkpk-text-primary uppercase tracking-wider mb-1">
            Brak zagrywek w tej kategorii
          </h3>
          <p className="text-xs text-bkpk-text-muted max-w-sm mx-auto">
            Użyj 1-click Generatora AI, aby wygenerować animowaną zagrywkę pod dowolny scenariusz.
          </p>
        </BkpkCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredPlays.map((play) => {
              const catConfig = CATEGORY_LABELS[play.category] || CATEGORY_LABELS.half_court;
              const stepsCount = play.diagramData?.steps?.length || 1;
              const isSelected = selectedPlayId === play.id;

              return (
                <motion.div
                  key={play.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => onSelectPlay(play)}
                  className="group relative cursor-pointer"
                >
                  <BkpkCard
                    variant="glass"
                    className={cn(
                      "h-full flex flex-col justify-between p-5 border transition-all group-hover:shadow-bkpk-card-hover group-hover:-translate-y-0.5",
                      isSelected
                        ? "border-bkpk-primary bg-bkpk-primary/5 shadow-bkpk-glow"
                        : "border-bkpk-border-strong hover:border-bkpk-primary/40"
                    )}
                  >
                    <div>
                      {/* Nagłówek Karty */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                            catConfig.color
                          )}
                        >
                          {catConfig.label}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-bkpk-text-muted bg-bkpk-surface-tint-2 px-2 py-0.5 rounded-full border border-bkpk-border-subtle">
                            <Layers className="w-3 h-3" />
                            {stepsCount} {stepsCount === 1 ? 'faza' : 'fazy'}
                          </span>

                          {play.isAiGenerated && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-bkpk-primary bg-bkpk-primary/10 px-2 py-0.5 rounded-full border border-bkpk-primary/20">
                              <Sparkles className="w-3 h-3" />
                              AI
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tytuł i Obrona */}
                      <h4 className="text-sm font-bold text-bkpk-text-primary group-hover:text-bkpk-primary transition-colors mb-1.5">
                        {play.name}
                      </h4>

                      {play.targetDefense && (
                        <div className="flex items-center gap-1.5 text-xs text-bkpk-text-muted mb-2.5">
                          <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="font-medium truncate">vs {play.targetDefense}</span>
                        </div>
                      )}

                      {play.description && (
                        <p className="text-xs text-bkpk-text-secondary line-clamp-2 mb-4 leading-relaxed">
                          {play.description}
                        </p>
                      )}
                    </div>

                    {/* Stopka Karty */}
                    <div className="pt-3 border-t border-bkpk-border-subtle flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-bkpk-primary flex items-center gap-1">
                        <PlayIcon className="w-3.5 h-3.5 fill-current" />
                        {isSelected ? 'Odtwarzana teraz' : 'Kliknij, aby odtworzyć'}
                      </span>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleDelete(play.id, e)}
                          disabled={deletingId === play.id}
                          className="p-1.5 rounded-lg text-bkpk-text-muted hover:text-bkpk-danger hover:bg-bkpk-danger/10 transition-colors"
                          title="Usuń preset"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </BkpkCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
