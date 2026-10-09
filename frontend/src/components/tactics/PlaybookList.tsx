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
import BkpkButton, { bkpkActivePillClass } from '../../shared/ui/BkpkButton';
import { cn } from '../../shared/lib/utils';
import { deleteJSON } from '../../lib/api';
import { pluralPl } from '../../shared/lib/plural';

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
  canManage?: boolean;
}

// Paleta kategoryczna Digital 2.0 — kolor = obrys + tekst flagi; etykieta kategorii zawsze widoczna.
const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  half_court: { label: 'Atak pozycyjny', color: 'text-brand-red-500' },
  blob: { label: 'Aut spod kosza', color: 'text-brand-gold-500' },
  slob: { label: 'Aut z boku', color: 'text-brand-green-400' },
  ato: { label: 'Po czasie (time-out)', color: 'text-brand-stone-200' },
  fastbreak: { label: 'Szybki atak', color: 'text-brand-red-300' },
  defense: { label: 'Obrona', color: 'text-brand-stone-400' }
};

export default function PlaybookList({
  plays,
  selectedPlayId,
  onSelectPlay,
  onPlayDeleted,
  onPlayUpdated,
  canManage = false
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
    if (!window.confirm('Czy na pewno chcesz usunąć tę zagrywkę?')) return;
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
            aria-pressed={selectedCategory === 'all'}
            onClick={() => setSelectedCategory('all')}
            className={cn(
              "px-3.5 py-1.5 label-caps text-[12px] border transition-colors shrink-0 min-h-[44px]",
              selectedCategory === 'all'
                ? bkpkActivePillClass
                : "bg-transparent text-bkpk-text-muted hover:text-bkpk-text-primary border-bkpk-border-strong"
            )}
          >
            Wszystkie ({plays.length})
          </button>
          {Object.entries(CATEGORY_LABELS).map(([key, config]) => (
            <button
              key={key}
              aria-pressed={selectedCategory === key}
              onClick={() => setSelectedCategory(key)}
              className={cn(
                "px-3.5 py-1.5 label-caps text-[12px] border transition-colors shrink-0 min-h-[44px]",
                selectedCategory === key
                  ? bkpkActivePillClass
                  : "bg-transparent text-bkpk-text-muted hover:text-bkpk-text-primary border-bkpk-border-strong"
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
          placeholder="Szukaj zagrywki…"
          className="bg-bkpk-bg border border-bkpk-border-strong px-3 py-1.5 min-h-[44px] text-[14px] text-bkpk-text-primary placeholder:text-bkpk-text-muted/50 focus:border-bkpk-text-primary w-full sm:w-64"
        />
      </div>

      {/* Grid Kart Presetów */}
      {filteredPlays.length === 0 ? (
        <BkpkCard variant="glass" className="text-center py-12">
          <Target className="w-12 h-12 text-bkpk-text-muted mx-auto mb-3" />
          <h3 className="text-[20px] text-bkpk-text-primary mb-1">
            Brak zagrywek w tej kategorii
          </h3>
          <p className="text-[14px] text-bkpk-text-muted max-w-sm mx-auto">
            {canManage ? 'Użyj generatora AI, aby dodać animowaną zagrywkę.' : 'Trener jeszcze nie dodał zagrywek w tej kategorii.'}
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
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={`Pokaż zagrywkę: ${play.name}`}
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectPlay(play);
                    }
                  }}
                  className="group relative cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-bkpk-primary"
                >
                  <BkpkCard
                    variant="glass"
                    className={cn(
                      "h-full flex flex-col justify-between p-5 border transition-colors",
                      isSelected
                        ? "border-bkpk-primary bg-bkpk-primary/5 shadow-[inset_4px_0_0_var(--c-red-500)]"
                        : "border-bkpk-border-subtle group-hover:border-bkpk-border-strong group-hover:bg-bkpk-surface-elevated"
                    )}
                  >
                    <div>
                      {/* Nagłówek Karty */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span
                          className={cn(
                            "status-flag",
                            catConfig.color
                          )}
                        >
                          {catConfig.label}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <span className="status-flag gap-1 text-bkpk-text-muted whitespace-nowrap">
                            <Layers className="w-3 h-3" />
                            {stepsCount} {pluralPl(stepsCount, 'faza', 'fazy', 'faz')}
                          </span>

                          {play.isAiGenerated && (
                            <span className="status-flag gap-1 text-bkpk-text-primary">
                              <Sparkles className="w-3 h-3" />
                              AI
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tytuł i Obrona */}
                      <h4 className="font-display uppercase text-[19px] leading-tight text-bkpk-text-primary group-hover:text-bkpk-primary transition-colors mb-1.5">
                        {play.name}
                      </h4>

                      {play.targetDefense && (
                        <div className="flex items-center gap-1.5 text-[13px] text-bkpk-text-muted mb-2.5">
                          <Shield className="w-3.5 h-3.5 text-brand-stone-200 shrink-0" />
                          <span className="font-medium truncate">vs {play.targetDefense}</span>
                        </div>
                      )}

                      {play.description && (
                        <p className="text-[13px] text-bkpk-text-secondary line-clamp-2 mb-4 leading-relaxed">
                          {play.description}
                        </p>
                      )}
                    </div>

                    {/* Stopka Karty */}
                    <div className="pt-3 border-t border-bkpk-border-subtle flex items-center justify-between gap-2">
                      <span className="label-caps text-[11px] text-bkpk-primary flex items-center gap-1">
                        <PlayIcon className="w-3.5 h-3.5 fill-current" />
                        {isSelected ? 'Odtwarzana teraz' : 'Wybierz, aby odtworzyć'}
                      </span>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {canManage && <button
                          onClick={(e) => handleDelete(play.id, e)}
                          disabled={deletingId === play.id}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center border border-transparent text-bkpk-text-muted hover:text-bkpk-danger hover:border-bkpk-danger transition-colors"
                          title="Usuń zagrywkę"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>}
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
