import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play as PlayIcon,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Repeat,
  Gauge,
  Sparkles,
  Shield,
  Target,
  ArrowRight,
  Info
} from 'lucide-react';
import { cn } from '../../shared/lib/utils';
import BkpkButton from '../../shared/ui/BkpkButton';
import BkpkCard from '../../shared/ui/BkpkCard';

export interface TokenPosition {
  id: string;
  label: string;
  role?: string;
  x: number; // 0-100%
  y: number; // 0-100%
  isOffense: boolean;
  isBall?: boolean;
}

export type StrokeType = 'pass' | 'cut' | 'screen' | 'dribble';

export interface TacticalStroke {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  type: StrokeType;
}

export interface TacticalStep {
  stepNumber: number;
  title: string;
  description: string;
  tokens?: TokenPosition[];
  strokes?: TacticalStroke[];
}

export interface DiagramData {
  tokens?: TokenPosition[];
  ballHolderId?: string;
  steps?: TacticalStep[];
  coachingKeys?: string[];
}

interface BasketballCourtCanvasProps {
  initialData?: DiagramData | null;
  playName?: string;
  category?: string;
  targetDefense?: string;
}

const DEFAULT_TOKENS: TokenPosition[] = [
  { id: 'O1', label: '1', role: 'PG', x: 50, y: 82, isOffense: true },
  { id: 'O2', label: '2', role: 'SG', x: 18, y: 65, isOffense: true },
  { id: 'O3', label: '3', role: 'SF', x: 82, y: 65, isOffense: true },
  { id: 'O4', label: '4', role: 'PF', x: 35, y: 40, isOffense: true },
  { id: 'O5', label: '5', role: 'C', x: 65, y: 40, isOffense: true },
  { id: 'D1', label: 'D1', x: 42, y: 70, isOffense: false },
  { id: 'D2', label: 'D2', x: 58, y: 70, isOffense: false },
  { id: 'D3', label: 'D3', x: 22, y: 40, isOffense: false },
  { id: 'D4', label: 'D4', x: 50, y: 30, isOffense: false },
  { id: 'D5', label: 'D5', x: 78, y: 40, isOffense: false },
  { id: 'BALL', label: '🏀', x: 52, y: 80, isOffense: true, isBall: true }
];

export default function BasketballCourtCanvas({
  initialData,
  playName,
  category,
  targetDefense
}: BasketballCourtCanvasProps) {
  const steps: TacticalStep[] =
    initialData?.steps && initialData.steps.length > 0
      ? initialData.steps
      : [{ stepNumber: 1, title: 'Ustawienie Wyjściowe', description: 'Rozstawienie wyjściowe graczy na boisku', tokens: initialData?.tokens || DEFAULT_TOKENS }];

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [isLoop, setIsLoop] = useState(true);

  // Pobierz pozycje tokenów dla bieżącego kroku (fallback do tokens z diagramData lub DEFAULT_TOKENS)
  const currentStep = steps[currentStepIndex] || steps[0];
  const activeTokens: TokenPosition[] =
    currentStep?.tokens && currentStep.tokens.length > 0
      ? currentStep.tokens
      : initialData?.tokens && initialData.tokens.length > 0
        ? initialData.tokens
        : DEFAULT_TOKENS;

  const activeStrokes: TacticalStroke[] = currentStep?.strokes || [];

  // Reset kroku przy zmianie zagrywki
  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [initialData]);

  // Pętla odtwarzania animacji
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      const stepDuration = 2400 / speed;
      timer = setTimeout(() => {
        if (currentStepIndex < steps.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          if (isLoop) {
            setCurrentStepIndex(0);
          } else {
            setIsPlaying(false);
          }
        }
      }, stepDuration);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps.length, speed, isLoop]);

  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setCurrentStepIndex(0);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    } else {
      setCurrentStepIndex(steps.length - 1);
    }
  };

  const handleRestart = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const transitionDuration = 0.9 / speed;

  return (
    <div className="space-y-4">
      {/* Pasek Informacyjny Odtwarzanej Zagrywki */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-bkpk-glass border border-bkpk-border-strong rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-bkpk-primary/20 border border-bkpk-primary/30 flex items-center justify-center text-bkpk-primary">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-bkpk-text-primary uppercase tracking-wider">
              {playName || 'Animowany Schemat Taktyczny'}
            </h3>
            <div className="flex items-center gap-2 text-[11px] text-bkpk-text-muted">
              {targetDefense && (
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Shield className="w-3 h-3" />
                  vs {targetDefense}
                </span>
              )}
              <span>•</span>
              <span className="font-medium text-bkpk-text-secondary">
                Faza {currentStepIndex + 1} z {steps.length}
              </span>
            </div>
          </div>
        </div>

        {/* Przyciski Wyboru Fazy (Kroki) */}
        <div className="flex items-center gap-1.5 bg-bkpk-surface-tint-2 p-1 rounded-xl border border-bkpk-border-subtle overflow-x-auto no-scrollbar">
          {steps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentStepIndex(idx);
                setIsPlaying(false);
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 min-h-[32px]",
                currentStepIndex === idx
                  ? "bg-bkpk-primary text-black shadow-bkpk-glow"
                  : "text-bkpk-text-muted hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-1"
              )}
            >
              Faza {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Kontener Wektorowego Boiska z Animowanymi Tokenami */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] max-w-[850px] mx-auto bg-[#101012] border-2 border-bkpk-border-strong rounded-3xl overflow-hidden select-none shadow-2xl">
        {/* Wektorowe Linie Parkietu Koszykarskiego FIBA / KALK */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none stroke-white/15 fill-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Obramowanie boiska */}
          <rect x="2" y="2" width="96" height="96" strokeWidth="0.8" className="stroke-white/20" />

          {/* Kosz i tablica */}
          <line x1="42" y1="6" x2="58" y2="6" strokeWidth="1.2" className="stroke-white/50" />
          <line x1="50" y1="6" x2="50" y2="12" strokeWidth="0.8" className="stroke-white/40" />
          <circle cx="50" cy="14" r="2.8" strokeWidth="1" className="stroke-bkpk-primary fill-bkpk-primary/10" />

          {/* Trumna (Key / Paint) */}
          <rect x="33" y="2" width="34" height="40" strokeWidth="0.8" className="stroke-white/25 fill-white/[0.02]" />

          {/* Koło rzutów wolnych */}
          <circle cx="50" cy="42" r="14" strokeWidth="0.8" className="stroke-white/25" />
          <line x1="33" y1="42" x2="67" y2="42" strokeWidth="0.8" className="stroke-white/30" />

          {/* Łuk bez szarży (Restricted area) */}
          <path d="M 44,14 A 6,6 0 0,0 56,14" strokeWidth="0.7" className="stroke-white/20" />

          {/* Łuk za 3 punkty (6.75m) */}
          <path d="M 8,2 L 8,24 A 42,42 0 0,0 92,24 L 92,2" strokeWidth="0.9" className="stroke-bkpk-primary/40" />

          {/* Szczyt koła środkowego (linia połowy) */}
          <line x1="2" y1="98" x2="98" y2="98" strokeWidth="1" className="stroke-white/30" />
          <path d="M 36,98 A 14,14 0 0,1 64,98" strokeWidth="0.8" className="stroke-white/25" />

          {/* Linie trajektorii ruchu dla aktywnego kroku */}
          <AnimatePresence>
            {activeStrokes.map((stroke) => {
              const isPass = stroke.type === 'pass';
              const isCut = stroke.type === 'cut';
              const isScreen = stroke.type === 'screen';
              const isDribble = stroke.type === 'dribble';

              const strokeColor = isPass ? '#F59E0B' : isCut ? '#10B981' : isScreen ? '#EF4444' : '#ECA72C';

              return (
                <g key={stroke.id}>
                  <defs>
                    <marker
                      id={`play-arrow-${stroke.id}`}
                      viewBox="0 0 10 10"
                      refX="5"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={strokeColor} />
                    </marker>
                  </defs>

                  {isScreen ? (
                    <>
                      <line
                        x1={stroke.from.x}
                        y1={stroke.from.y}
                        x2={stroke.to.x}
                        y2={stroke.to.y}
                        stroke={strokeColor}
                        strokeWidth="1.4"
                      />
                      <circle cx={stroke.to.x} cy={stroke.to.y} r="2" fill={strokeColor} />
                    </>
                  ) : (
                    <line
                      x1={stroke.from.x}
                      y1={stroke.from.y}
                      x2={stroke.to.x}
                      y2={stroke.to.y}
                      stroke={strokeColor}
                      strokeWidth={isPass ? "1.4" : "1.6"}
                      strokeDasharray={isPass ? "2.5,2.5" : isDribble ? "1.5,1.5" : undefined}
                      markerEnd={`url(#play-arrow-${stroke.id})`}
                    />
                  )}
                </g>
              );
            })}
          </AnimatePresence>
        </svg>

        {/* Płynnie Animowane Tokeny Graczy (Atak, Obrona, Piłka) */}
        {activeTokens.map((token) => {
          const isOffense = token.isOffense;
          const isBall = token.isBall;

          return (
            <motion.div
              key={token.id}
              initial={false}
              animate={{
                left: `${token.x}%`,
                top: `${token.y}%`
              }}
              transition={{
                duration: transitionDuration,
                ease: [0.25, 0.1, 0.25, 1.0]
              }}
              style={{
                transform: 'translate(-50%, -50%)'
              }}
              className={cn(
                "absolute flex items-center justify-center font-outfit font-black rounded-full select-none shadow-xl z-20 pointer-events-none",
                isBall
                  ? "w-6 h-6 sm:w-7 sm:h-7 text-xs bg-amber-600/90 ring-2 ring-amber-400/40"
                  : isOffense
                    ? "w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm bg-bkpk-primary text-black shadow-bkpk-primary/30 border-2 border-black/40"
                    : "w-6 h-6 sm:w-7 sm:h-7 text-[11px] sm:text-xs bg-red-600 text-white shadow-red-950/50 border border-red-400/50"
              )}
            >
              {token.label}
            </motion.div>
          );
        })}
      </div>

      {/* Pasek Sterowania Odtwarzaczem (Playback Controls) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-bkpk-surface border border-bkpk-border-strong rounded-2xl shadow-lg">
        <div className="flex items-center gap-2">
          {/* Przycisk Start / Pauza */}
          <BkpkButton
            variant={isPlaying ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 mr-1.5 fill-current" />
                Pauza
              </>
            ) : (
              <>
                <PlayIcon className="w-4 h-4 mr-1.5 fill-current" />
                Odtwarzaj
              </>
            )}
          </BkpkButton>

          {/* Przewijanie Kroków */}
          <button
            onClick={handlePrevStep}
            className="p-2 rounded-xl text-bkpk-text-muted hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-2 transition-colors"
            title="Poprzednia faza"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextStep}
            className="p-2 rounded-xl text-bkpk-text-muted hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-2 transition-colors"
            title="Następna faza"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          <button
            onClick={handleRestart}
            className="p-2 rounded-xl text-bkpk-text-muted hover:text-bkpk-primary hover:bg-bkpk-surface-tint-2 transition-colors"
            title="Zacznij od początku"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Pętla */}
          <button
            onClick={() => setIsLoop(!isLoop)}
            className={cn(
              "p-2 rounded-xl transition-colors",
              isLoop ? "text-bkpk-primary bg-bkpk-primary/10" : "text-bkpk-text-muted hover:text-bkpk-text-primary"
            )}
            title="Pętla animacji"
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Prędkość Odtwarzania */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-bkpk-text-muted uppercase tracking-wider hidden sm:inline">
            Prędkość:
          </span>
          <div className="flex items-center gap-1 bg-bkpk-surface-tint-1 p-1 rounded-xl border border-bkpk-border-subtle">
            {[0.5, 1, 1.5].map((spd) => (
              <button
                key={spd}
                onClick={() => setSpeed(spd)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                  speed === spd
                    ? "bg-bkpk-primary text-black shadow-bkpk-glow"
                    : "text-bkpk-text-muted hover:text-bkpk-text-primary"
                )}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Synchronizowany Panel Trenerski dla Aktywnego Kroku */}
      <BkpkCard variant="glass" className="p-5 border-bkpk-border-strong">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-xl bg-bkpk-primary/10 border border-bkpk-primary/20 flex items-center justify-center text-bkpk-primary shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-black uppercase tracking-wider text-bkpk-primary">
                {currentStep?.title || `Faza ${currentStepIndex + 1}`}
              </span>
              <span className="text-[10px] text-bkpk-text-muted font-bold">
                Krok {currentStepIndex + 1} / {steps.length}
              </span>
            </div>
            <p className="text-xs text-bkpk-text-secondary leading-relaxed mb-3">
              {currentStep?.description || 'Szczegóły wykonania zagrywki.'}
            </p>

            {/* Wskazówki trenerskie zagrywki */}
            {initialData?.coachingKeys && initialData.coachingKeys.length > 0 && (
              <div className="pt-3 border-t border-bkpk-border-subtle">
                <span className="text-[10px] font-black uppercase tracking-widest text-bkpk-text-muted block mb-1.5">
                  Wskazówki Trenerskie (Coaching Cues):
                </span>
                <ul className="space-y-1 text-[11px] text-bkpk-text-muted list-disc list-inside">
                  {initialData.coachingKeys.map((key, kIdx) => (
                    <li key={kIdx} className="text-bkpk-text-secondary">
                      {key}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </BkpkCard>
    </div>
  );
}
