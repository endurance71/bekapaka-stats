import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Play as PlayIcon,
  RotateCcw,
  Plus,
  Trash2,
  Move,
  ArrowUpRight,
  Shield,
  CircleDot,
  Check,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { cn } from '../../shared/lib/utils';
import BkpkButton from '../../shared/ui/BkpkButton';

export type TokenType = 'O1' | 'O2' | 'O3' | 'O4' | 'O5' | 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'BALL';

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
  tokenId?: string;
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
  movements?: Array<{ tokenId: string; from: { x: number; y: number }; to: { x: number; y: number }; type: StrokeType }>;
}

export interface DiagramData {
  tokens: TokenPosition[];
  ballHolderId?: string;
  steps: TacticalStep[];
  coachingKeys?: string[];
}

const DEFAULT_TOKENS: TokenPosition[] = [
  { id: 'O1', label: '1', role: 'PG', x: 50, y: 82, isOffense: true },
  { id: 'O2', label: '2', role: 'SG', x: 18, y: 65, isOffense: true },
  { id: 'O3', label: '3', role: 'SF', x: 82, y: 65, isOffense: true },
  { id: 'O4', label: '4', role: 'PF', x: 32, y: 35, isOffense: true },
  { id: 'O5', label: '5', role: 'C', x: 68, y: 35, isOffense: true },
  { id: 'D1', label: 'D1', x: 50, y: 72, isOffense: false },
  { id: 'D2', label: 'D2', x: 25, y: 55, isOffense: false },
  { id: 'D3', label: 'D3', x: 75, y: 55, isOffense: false },
  { id: 'D4', label: 'D4', x: 35, y: 25, isOffense: false },
  { id: 'D5', label: 'D5', x: 65, y: 25, isOffense: false },
  { id: 'BALL', label: '🏀', x: 52, y: 80, isOffense: true, isBall: true }
];

interface BasketballCourtCanvasProps {
  initialData?: DiagramData | null;
  readOnly?: boolean;
  onChange?: (data: DiagramData) => void;
}

export default function BasketballCourtCanvas({
  initialData,
  readOnly = false,
  onChange
}: BasketballCourtCanvasProps) {
  const [tokens, setTokens] = useState<TokenPosition[]>(() => {
    return initialData?.tokens && initialData.tokens.length > 0 ? initialData.tokens : DEFAULT_TOKENS;
  });

  const [steps, setSteps] = useState<TacticalStep[]>(() => {
    if (initialData?.steps && initialData.steps.length > 0) return initialData.steps;
    return [{ stepNumber: 1, title: 'Krok 1: Ustawienie', description: 'Rozstawienie początkowe graczy i obrony' }];
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeTool, setActiveTool] = useState<'move' | StrokeType>('move');
  const [strokes, setStrokes] = useState<TacticalStroke[]>(() => {
    return initialData?.steps?.[0]?.strokes || [];
  });
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number; tokenId?: string } | null>(null);
  const [isPlayingAnimation, setIsPlayingAnimation] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronizacja przy zmianie danych zewnętrznych
  useEffect(() => {
    if (initialData?.tokens && initialData.tokens.length > 0) {
      setTokens(initialData.tokens);
    }
    if (initialData?.steps && initialData.steps.length > 0) {
      setSteps(initialData.steps);
      if (initialData.steps[currentStepIndex]?.strokes) {
        setStrokes(initialData.steps[currentStepIndex].strokes || []);
      }
    }
  }, [initialData]);

  // Powiadomienie rodzica o zmianach
  const notifyChange = (updatedTokens: TokenPosition[], updatedSteps: TacticalStep[]) => {
    if (onChange) {
      onChange({
        tokens: updatedTokens,
        steps: updatedSteps,
        coachingKeys: initialData?.coachingKeys || []
      });
    }
  };

  const getCoordinatesFromEvent = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const x = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(2, Math.min(98, ((clientY - rect.top) / rect.height) * 100));
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  };

  const handleCourtClick = (e: React.MouseEvent) => {
    if (readOnly) return;
    const coords = getCoordinatesFromEvent(e);
    if (!coords) return;

    if (activeTool !== 'move') {
      if (!drawingStart) {
        // Start rysowania linii
        setDrawingStart(coords);
      } else {
        // Zakończenie linii
        const newStroke: TacticalStroke = {
          id: String(Date.now()),
          from: drawingStart,
          to: coords,
          type: activeTool,
          tokenId: drawingStart.tokenId
        };
        const updatedStrokes = [...strokes, newStroke];
        setStrokes(updatedStrokes);
        setDrawingStart(null);

        const updatedSteps = [...steps];
        updatedSteps[currentStepIndex] = {
          ...updatedSteps[currentStepIndex],
          strokes: updatedStrokes
        };
        setSteps(updatedSteps);
        notifyChange(tokens, updatedSteps);
      }
    } else {
      setSelectedTokenId(null);
    }
  };

  const handleTokenDragEnd = (tokenId: string, e: any, info: any) => {
    if (readOnly || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentToken = tokens.find(t => t.id === tokenId);
    if (!currentToken) return;

    const deltaX = (info.offset.x / rect.width) * 100;
    const deltaY = (info.offset.y / rect.height) * 100;

    const newX = Math.max(4, Math.min(96, currentToken.x + deltaX));
    const newY = Math.max(4, Math.min(96, currentToken.y + deltaY));

    const updatedTokens = tokens.map(t =>
      t.id === tokenId ? { ...t, x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 } : t
    );

    setTokens(updatedTokens);
    notifyChange(updatedTokens, steps);
  };

  const handleResetPositions = () => {
    setTokens(DEFAULT_TOKENS);
    setStrokes([]);
    const updatedSteps = [{ stepNumber: 1, title: 'Krok 1: Ustawienie', description: 'Rozstawienie początkowe' }];
    setSteps(updatedSteps);
    setCurrentStepIndex(0);
    notifyChange(DEFAULT_TOKENS, updatedSteps);
  };

  const handlePlayAnimation = () => {
    if (steps.length <= 1) return;
    setIsPlayingAnimation(true);
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % steps.length;
      setCurrentStepIndex(index);
      if (steps[index]?.strokes) {
        setStrokes(steps[index].strokes || []);
      }
      if (index === steps.length - 1) {
        setTimeout(() => setIsPlayingAnimation(false), 1500);
        clearInterval(interval);
      }
    }, 2000);
  };

  return (
    <div className="space-y-4">
      {/* Pasek narzędzi trenera (Toolbar) */}
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-bkpk-glass border border-bkpk-border-strong rounded-2xl">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => { setActiveTool('move'); setDrawingStart(null); }}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all min-h-[40px]",
                activeTool === 'move'
                  ? "bg-bkpk-primary text-black shadow-bkpk-glow"
                  : "text-bkpk-text-muted hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-2"
              )}
            >
              <Move className="w-4 h-4" />
              Przesuń gracza
            </button>

            <button
              onClick={() => { setActiveTool('pass'); setDrawingStart(null); }}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all min-h-[40px]",
                activeTool === 'pass'
                  ? "bg-bkpk-warning text-black shadow-bkpk-glow"
                  : "text-bkpk-text-muted hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-2"
              )}
            >
              <span className="w-3 h-0.5 border-t border-dashed border-current" />
              Podanie
            </button>

            <button
              onClick={() => { setActiveTool('cut'); setDrawingStart(null); }}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all min-h-[40px]",
                activeTool === 'cut'
                  ? "bg-bkpk-success text-black shadow-bkpk-glow"
                  : "text-bkpk-text-muted hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-2"
              )}
            >
              <ArrowUpRight className="w-4 h-4" />
              Ścięcie / Wjazd
            </button>

            <button
              onClick={() => { setActiveTool('screen'); setDrawingStart(null); }}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all min-h-[40px]",
                activeTool === 'screen'
                  ? "bg-bkpk-danger text-white shadow-bkpk-glow"
                  : "text-bkpk-text-muted hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-2"
              )}
            >
              <span className="font-black text-xs">┳</span>
              Zasłona
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setStrokes([])}
              className="p-2 rounded-xl text-bkpk-text-muted hover:text-bkpk-text-danger hover:bg-bkpk-danger/10 transition-colors"
              title="Wyczyść linie"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetPositions}
              className="p-2 rounded-xl text-bkpk-text-muted hover:text-bkpk-primary hover:bg-bkpk-surface-tint-2 transition-colors"
              title="Resetuj ustawienie początkowe"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Kontener Boiska (Basketball Half-Court) */}
      <div
        ref={containerRef}
        onClick={handleCourtClick}
        className="relative w-full aspect-[4/3] sm:aspect-[16/11] max-w-[850px] mx-auto bg-[#101012] border-2 border-bkpk-border-strong rounded-3xl overflow-hidden select-none shadow-2xl touch-none"
      >
        {/* Wektorowe linie parkietu FIBA / KALK */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-white/15 fill-none" viewBox="0 0 100 100" preserveAspectRatio="none">
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

          {/* Rysowane linie taktyczne (Strokes) */}
          {strokes.map((stroke) => {
            const isPass = stroke.type === 'pass';
            const isCut = stroke.type === 'cut';
            const isScreen = stroke.type === 'screen';
            const isDribble = stroke.type === 'dribble';

            const strokeColor = isPass ? '#F59E0B' : isCut ? '#10B981' : isScreen ? '#EF4444' : '#ECA72C';

            return (
              <g key={stroke.id} className="transition-all duration-300">
                <defs>
                  <marker
                    id={`arrow-${stroke.id}`}
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
                  // Linia zasłony z poprzeczką T
                  <>
                    <line
                      x1={stroke.from.x}
                      y1={stroke.from.y}
                      x2={stroke.to.x}
                      y2={stroke.to.y}
                      stroke={strokeColor}
                      strokeWidth="1.2"
                    />
                    <circle cx={stroke.to.x} cy={stroke.to.y} r="1.8" fill={strokeColor} />
                  </>
                ) : (
                  <line
                    x1={stroke.from.x}
                    y1={stroke.from.y}
                    x2={stroke.to.x}
                    y2={stroke.to.y}
                    stroke={strokeColor}
                    strokeWidth={isPass ? "1.2" : "1.5"}
                    strokeDasharray={isPass ? "2.5,2.5" : isDribble ? "1.5,1.5" : undefined}
                    markerEnd={`url(#arrow-${stroke.id})`}
                  />
                )}
              </g>
            );
          })}

          {/* Podgląd rysowanej linii w trakcie klikania */}
          {drawingStart && (
            <circle cx={drawingStart.x} cy={drawingStart.y} r="2" className="fill-bkpk-primary animate-ping" />
          )}
        </svg>

        {/* Tokeny Zawodników (Atak i Obrona) */}
        {tokens.map((token) => {
          const isSelected = selectedTokenId === token.id;
          const isOffense = token.isOffense;
          const isBall = token.isBall;

          return (
            <motion.div
              key={token.id}
              drag={!readOnly && activeTool === 'move'}
              dragMomentum={false}
              onDragEnd={(e, info) => handleTokenDragEnd(token.id, e, info)}
              onClick={(e) => {
                e.stopPropagation();
                if (activeTool !== 'move') {
                  // Rozpocznij lub zakończ linię od tego gracza
                  if (!drawingStart) {
                    setDrawingStart({ x: token.x, y: token.y, tokenId: token.id });
                  } else {
                    const newStroke: TacticalStroke = {
                      id: String(Date.now()),
                      from: drawingStart,
                      to: { x: token.x, y: token.y },
                      type: activeTool,
                      tokenId: drawingStart.tokenId
                    };
                    const updatedStrokes = [...strokes, newStroke];
                    setStrokes(updatedStrokes);
                    setDrawingStart(null);
                  }
                } else {
                  setSelectedTokenId(token.id);
                }
              }}
              style={{
                left: `${token.x}%`,
                top: `${token.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
              className={cn(
                "absolute flex items-center justify-center font-outfit font-black rounded-full select-none cursor-pointer transition-shadow duration-200 z-20",
                isBall
                  ? "w-6 h-6 sm:w-7 sm:h-7 text-xs bg-amber-600/90 shadow-md"
                  : isOffense
                    ? "w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm bg-bkpk-primary text-black shadow-lg shadow-bkpk-primary/20 border-2 border-black/40"
                    : "w-6 h-6 sm:w-7 sm:h-7 text-[11px] sm:text-xs bg-red-600 text-white shadow-lg border border-red-400/50",
                isSelected && "ring-4 ring-white shadow-bkpk-glow",
                !readOnly && "active:scale-110"
              )}
            >
              {token.label}
            </motion.div>
          );
        })}
      </div>

      {/* Kontrolki Odtwarzania & Kroków (Steps Control) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-bkpk-surface border border-bkpk-border-strong rounded-2xl">
        <div className="flex items-center gap-3">
          <BkpkButton
            variant="outline"
            size="sm"
            onClick={handlePlayAnimation}
            disabled={isPlayingAnimation || steps.length <= 1}
          >
            <PlayIcon className="w-4 h-4 mr-1.5 fill-current" />
            Animacja ({steps.length} {steps.length === 1 ? 'krok' : 'kroki'})
          </BkpkButton>

          <div className="flex items-center gap-1 bg-bkpk-surface-tint-2 p-1 rounded-xl border border-bkpk-border-subtle">
            {steps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentStepIndex(idx);
                  if (step.strokes) setStrokes(step.strokes);
                }}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all min-h-[32px]",
                  currentStepIndex === idx
                    ? "bg-bkpk-primary text-black shadow-bkpk-glow"
                    : "text-bkpk-text-muted hover:text-bkpk-text-primary"
                )}
              >
                Krok {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Informacja o bieżącym kroku */}
        <div className="text-right">
          <span className="text-xs font-bold text-bkpk-text-primary block">
            {steps[currentStepIndex]?.title || `Krok ${currentStepIndex + 1}`}
          </span>
          <span className="text-[11px] text-bkpk-text-muted block max-w-sm truncate">
            {steps[currentStepIndex]?.description || 'Opis manewru taktycznego'}
          </span>
        </div>
      </div>
    </div>
  );
}
