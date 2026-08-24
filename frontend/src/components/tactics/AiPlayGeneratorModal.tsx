import React, { useState } from 'react';
import { Bot, Sparkles, X, Target, Shield, Zap } from 'lucide-react';
import Modal from '../Modal';
import BkpkButton from '../../shared/ui/BkpkButton';
import { postJSON } from '../../lib/api';
import { cn } from '../../shared/lib/utils';
import { useSeasonPreferenceContext } from '../../context/SeasonPreferenceContext';

interface AiPlayGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayGenerated: (play: any) => void;
}

const CATEGORIES = [
  { id: 'half_court', label: 'Atak pozycyjny', icon: Target },
  { id: 'blob', label: 'BLOB (Aut końcowy)', icon: Zap },
  { id: 'slob', label: 'SLOB (Aut boczny)', icon: Zap },
  { id: 'ato', label: 'ATO (Po przerwie)', icon: Sparkles },
  { id: 'fastbreak', label: 'Szybki atak', icon: Zap },
  { id: 'defense', label: 'Wariant obrony', icon: Shield }
];

const DEFENSES = [
  'Strefa 2-3',
  'Obrona każdy swego (Man-to-Man)',
  'Drop Coverage (PnR)',
  'Pułapka strefowa 1-3-1',
  'Agresywny Switch (Wszystko)',
  'Presing na całym boisku'
];

const GOALS = [
  'Czysty rzut za 3 punkty w rogu (Corner 3)',
  'Pick & Roll / Pick & Pop ze szczytu',
  'Ścięcie za plecy obrońcy (Backdoor cut)',
  'Gra tyłem do kosza (Post-up pod koszem)',
  'Izolacja i wejście na kosz dla rozgrywającego',
  'Szybkie podanie i łatwe punkty z pomalowanego'
];

export default function AiPlayGeneratorModal({
  isOpen,
  onClose,
  onPlayGenerated
}: AiPlayGeneratorModalProps) {
  const [category, setCategory] = useState('half_court');
  const [targetDefense, setTargetDefense] = useState('Strefa 2-3');
  const [goal, setGoal] = useState('Czysty rzut za 3 punkty w rogu (Corner 3)');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { seasonId } = useSeasonPreferenceContext();

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await postJSON<{ play: any; model: string }>('/api/tactics/plays/generate', {
        category,
        targetDefense,
        goal,
        additionalNotes: additionalNotes.trim() || undefined,
        seasonId
      });

      if (res.play) {
        onPlayGenerated(res.play);
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Błąd generowania zagrywki przez AI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generator Zagrywek AI (Gemini)">
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-3 bg-bkpk-primary/10 border border-bkpk-primary/20 rounded-2xl">
          <Bot className="w-5 h-5 text-bkpk-primary shrink-0" />
          <p className="text-xs text-bkpk-text-secondary">
            AI przeanalizuje kadrę BeKaPaKa i wygeneruje kompletną zagrywkę ze współrzędnymi tokenów, krokami akcji i wskazówkami trenerskimi.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-bkpk-danger/10 border border-bkpk-danger/30 rounded-xl text-xs text-bkpk-text-danger">
            {error}
          </div>
        )}

        {/* Wybór kategorii */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-bkpk-text-muted">
            1. Kategoria Zagrywki
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const isSelected = category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    "p-3 rounded-xl border text-left flex items-center gap-2 transition-all text-xs font-bold",
                    isSelected
                      ? "bg-bkpk-primary text-black border-bkpk-primary shadow-bkpk-glow"
                      : "bg-bkpk-surface-tint-1 border-bkpk-border-strong text-bkpk-text-muted hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-2"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Wybór obrony rywala */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-bkpk-text-muted">
            2. Obrona Przeciwnika
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DEFENSES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setTargetDefense(d)}
                className={cn(
                  "p-2.5 rounded-xl border text-left text-xs font-bold transition-all",
                  targetDefense === d
                    ? "bg-bkpk-warning text-black border-bkpk-warning shadow-bkpk-glow"
                    : "bg-bkpk-surface-tint-1 border-bkpk-border-strong text-bkpk-text-muted hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-2"
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Wybór celu akcji */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-bkpk-text-muted">
            3. Główny Cel Akcji
          </label>
          <div className="space-y-1.5">
            {GOALS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGoal(g)}
                className={cn(
                  "w-full p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between",
                  goal === g
                    ? "bg-bkpk-primary/10 text-bkpk-primary border-bkpk-primary/40"
                    : "bg-bkpk-surface-tint-1 border-bkpk-border-strong text-bkpk-text-muted hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-2"
                )}
              >
                <span>{g}</span>
                {goal === g && <span className="text-bkpk-primary font-black">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Dodatkowe wytyczne trenera */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-bkpk-text-muted">
            Dodatkowe wytyczne dla AI (opcjonalnie)
          </label>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="np. Wykorzystaj ścięcie skrzydłowego i dodatkową zasłonę bez piłki..."
            rows={2}
            className="w-full bg-bkpk-bg border border-bkpk-border-strong rounded-xl p-3 text-xs text-bkpk-text-primary placeholder:text-bkpk-text-muted/50 focus:outline-none focus:border-bkpk-primary resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-bkpk-border-strong">
          <BkpkButton variant="ghost" onClick={onClose} disabled={loading}>
            Anuluj
          </BkpkButton>
          <BkpkButton variant="primary" onClick={handleGenerate} loading={loading}>
            <Sparkles className="w-4 h-4 mr-2" />
            Generuj Zagrywkę
          </BkpkButton>
        </div>
      </div>
    </Modal>
  );
}
