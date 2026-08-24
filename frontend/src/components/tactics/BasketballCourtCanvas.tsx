import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  ArrowUpRight,
  Flame,
  Layers,
  CircleDot
} from 'lucide-react';
import { cn } from '../../shared/lib/utils';
import BkpkButton from '../../shared/ui/BkpkButton';
import BkpkCard from '../../shared/ui/BkpkCard';
import {
  PlayTimelineData,
  PlayerTrack,
  BallTrack,
  interpolatePlayer,
  interpolateBall,
  RenderedPlayerState,
  RenderedBallState
} from './TacticalEngine';

interface BasketballCourtCanvasProps {
  initialData?: any;
  playName?: string;
  category?: string;
  targetDefense?: string;
}

// Fallback dane osi czasu gdyby starsza zagrywka nie miała pełnych keyframe'ów
const FALLBACK_PLAYERS: PlayerTrack[] = [
  {
    id: 'O1',
    number: 10,
    name: 'Rozgrywający',
    role: 'PG',
    isOffense: true,
    keyframes: [
      { time: 0.0, x: 50, y: 82, heading: 180, action: 'idle' },
      { time: 2.0, x: 65, y: 72, heading: 140, action: 'dribble' },
      { time: 5.0, x: 65, y: 72, heading: 0, action: 'idle' }
    ]
  },
  {
    id: 'O2',
    number: 7,
    name: 'Rzucający',
    role: 'SG',
    isOffense: true,
    keyframes: [
      { time: 0.0, x: 18, y: 65, heading: 180, action: 'idle' },
      { time: 5.0, x: 22, y: 75, heading: 90, action: 'idle' }
    ]
  },
  {
    id: 'O3',
    number: 24,
    name: 'Skrzydłowy',
    role: 'SF',
    isOffense: true,
    keyframes: [
      { time: 0.0, x: 82, y: 65, heading: 180, action: 'idle' },
      { time: 3.5, x: 90, y: 22, heading: 270, action: 'cut' },
      { time: 5.0, x: 90, y: 22, heading: 270, action: 'shoot' }
    ]
  },
  {
    id: 'O4',
    number: 15,
    name: 'Silny Skrzydłowy',
    role: 'PF',
    isOffense: true,
    keyframes: [
      { time: 0.0, x: 35, y: 40, heading: 180, action: 'idle' },
      { time: 5.0, x: 45, y: 25, heading: 0, action: 'roll' }
    ]
  },
  {
    id: 'O5',
    number: 33,
    name: 'Środkowy',
    role: 'C',
    isOffense: true,
    keyframes: [
      { time: 0.0, x: 65, y: 40, heading: 180, action: 'idle' },
      { time: 2.0, x: 75, y: 58, heading: 180, action: 'set_screen' },
      { time: 5.0, x: 55, y: 22, heading: 0, action: 'roll' }
    ]
  },
  {
    id: 'D1',
    number: 1,
    name: 'Obrońca D1',
    role: 'PG',
    isOffense: false,
    keyframes: [
      { time: 0.0, x: 42, y: 70, heading: 0, action: 'defend' },
      { time: 5.0, x: 55, y: 65, heading: 90, action: 'defend' }
    ]
  },
  {
    id: 'D2',
    number: 2,
    name: 'Obrońca D2',
    role: 'SG',
    isOffense: false,
    keyframes: [
      { time: 0.0, x: 58, y: 70, heading: 0, action: 'defend' },
      { time: 2.0, x: 66, y: 65, heading: 90, action: 'defend' },
      { time: 5.0, x: 74, y: 50, heading: 0, action: 'defend' }
    ]
  },
  {
    id: 'D3',
    number: 3,
    name: 'Obrońca D3',
    role: 'SF',
    isOffense: false,
    keyframes: [
      { time: 0.0, x: 22, y: 40, heading: 0, action: 'defend' },
      { time: 5.0, x: 28, y: 32, heading: 90, action: 'defend' }
    ]
  },
  {
    id: 'D4',
    number: 4,
    name: 'Obrońca D4',
    role: 'PF',
    isOffense: false,
    keyframes: [
      { time: 0.0, x: 50, y: 30, heading: 0, action: 'defend' },
      { time: 5.0, x: 50, y: 20, heading: 0, action: 'defend' }
    ]
  },
  {
    id: 'D5',
    number: 5,
    name: 'Obrońca D5',
    role: 'C',
    isOffense: false,
    keyframes: [
      { time: 0.0, x: 78, y: 40, heading: 0, action: 'defend' },
      { time: 5.0, x: 84, y: 24, heading: 90, action: 'defend' }
    ]
  }
];

const FALLBACK_BALL: BallTrack = {
  keyframes: [
    { time: 0.0, x: 50, y: 82, holderId: 'O1' },
    { time: 2.0, x: 65, y: 72, holderId: 'O1' },
    { time: 3.5, x: 90, y: 22, holderId: 'O3', isPass: true, arcHeight: 0.2 },
    { time: 5.0, x: 50, y: 14, holderId: null, isShot: true, arcHeight: 1.2 }
  ]
};

export default function BasketballCourtCanvas({
  initialData,
  playName,
  category,
  targetDefense
}: BasketballCourtCanvasProps) {
  // Normalizacja danych do formatu PlayTimelineData
  const timelineData: PlayTimelineData = useMemo(() => {
    const raw = initialData || {};
    const duration = raw.duration || (raw.steps && raw.steps.length > 0 ? raw.steps.length * 1.8 : 5.5);
    const players: PlayerTrack[] = Array.isArray(raw.players) && raw.players.length > 0 ? raw.players : FALLBACK_PLAYERS;
    const ball: BallTrack = raw.ball && Array.isArray(raw.ball.keyframes) ? raw.ball : FALLBACK_BALL;
    const phaseDirectives = Array.isArray(raw.phaseDirectives) ? raw.phaseDirectives : [];
    const coachingKeys = Array.isArray(raw.coachingKeys) ? raw.coachingKeys : [];

    return {
      duration,
      players,
      ball,
      phaseDirectives,
      coachingKeys
    };
  }, [initialData]);

  const duration = timelineData.duration;
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1.0);
  const [isLoop, setIsLoop] = useState<boolean>(true);

  const lastFrameTimeRef = useRef<number | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Pętla renderowania 60 FPS (RequestAnimationFrame)
  useEffect(() => {
    const loop = (now: number) => {
      if (lastFrameTimeRef.current !== null && isPlaying) {
        const deltaSeconds = ((now - lastFrameTimeRef.current) / 1000) * speed;
        setCurrentTime((prev) => {
          const next = prev + deltaSeconds;
          if (next >= duration) {
            if (isLoop) {
              return 0;
            } else {
              setIsPlaying(false);
              return duration;
            }
          }
          return next;
        });
      }
      lastFrameTimeRef.current = now;
      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isPlaying, speed, duration, isLoop]);

  // Reset przy zmianie presetu
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(true);
    lastFrameTimeRef.current = null;
  }, [initialData]);

  // Obliczenie aktualnych stanów zawodników i piłki
  const renderedPlayers = useMemo(() => {
    return timelineData.players.map((p) => interpolatePlayer(p, currentTime));
  }, [timelineData.players, currentTime]);

  const playersMap = useMemo(() => {
    const map = new Map<string, RenderedPlayerState>();
    for (const rp of renderedPlayers) {
      map.set(rp.id, rp);
    }
    return map;
  }, [renderedPlayers]);

  const renderedBall: RenderedBallState = useMemo(() => {
    return interpolateBall(timelineData.ball, playersMap, currentTime);
  }, [timelineData.ball, playersMap, currentTime]);

  // Aktywna faza taktyczna
  const currentPhase = useMemo(() => {
    if (!timelineData.phaseDirectives || timelineData.phaseDirectives.length === 0) {
      return null;
    }
    return (
      timelineData.phaseDirectives.find(
        (ph) => currentTime >= ph.startTime && currentTime <= ph.endTime
      ) || timelineData.phaseDirectives[timelineData.phaseDirectives.length - 1]
    );
  }, [timelineData.phaseDirectives, currentTime]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
  };

  const handleStepDelta = (delta: number) => {
    setCurrentTime((prev) => Math.max(0, Math.min(duration, prev + delta)));
  };

  return (
    <div className="space-y-4">
      {/* Pasek Nagłówkowy z Nazwą i Fazą */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-bkpk-glass border border-bkpk-border-strong rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-bkpk-primary/20 border border-bkpk-primary/40 flex items-center justify-center text-bkpk-primary shadow-bkpk-glow">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-bkpk-text-primary uppercase tracking-wider font-outfit">
              {playName || 'Profesjonalny Schemat Taktyczny'}
            </h3>
            <div className="flex items-center gap-2 text-xs text-bkpk-text-muted">
              {targetDefense && (
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Shield className="w-3.5 h-3.5" />
                  vs {targetDefense}
                </span>
              )}
              <span>•</span>
              <span className="font-bold text-bkpk-primary">
                {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
              </span>
            </div>
          </div>
        </div>

        {/* Fazy Akcji jako Pigułki */}
        {timelineData.phaseDirectives && timelineData.phaseDirectives.length > 0 && (
          <div className="flex items-center gap-1.5 bg-bkpk-surface-tint-2 p-1 rounded-xl border border-bkpk-border-subtle overflow-x-auto no-scrollbar">
            {timelineData.phaseDirectives.map((ph, idx) => {
              const isActive = currentTime >= ph.startTime && currentTime <= ph.endTime;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentTime(ph.startTime);
                    setIsPlaying(true);
                  }}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 min-h-[30px]",
                    isActive
                      ? "bg-bkpk-primary text-black shadow-bkpk-glow"
                      : "text-bkpk-text-muted hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-1"
                  )}
                >
                  Faza {idx + 1}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Kontener Profesjonalnego Parkietu (Elite Dark Hardwood FIBA Half-Court) */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] max-w-[850px] mx-auto bg-gradient-to-b from-[#141418] via-[#0e0e12] to-[#09090b] border-2 border-bkpk-primary/30 rounded-3xl overflow-hidden select-none shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        {/* Subtelna Tekstura Drewnianych Desek Parkietu */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Wektorowe Linie Parkietu FIBA / KALK w Złocie i Bieli */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none fill-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Obramowanie boiska */}
          <rect x="2" y="2" width="96" height="96" strokeWidth="0.8" className="stroke-white/20" />

          {/* Kosz, tablica i obręcz */}
          <line x1="42" y1="6" x2="58" y2="6" strokeWidth="1.6" className="stroke-white/60" />
          <line x1="50" y1="6" x2="50" y2="12" strokeWidth="1" className="stroke-white/50" />
          {/* Siatka kosza */}
          <polygon points="47,14 53,14 52,18 48,18" className="fill-white/10 stroke-white/40" strokeWidth="0.4" />
          {/* Obręcz */}
          <circle cx="50" cy="14" r="2.8" strokeWidth="1.2" className="stroke-amber-500 fill-amber-500/20" />

          {/* Trumna (Key / Paint) z cieniowaniem */}
          <rect x="33" y="2" width="34" height="40" strokeWidth="1" className="stroke-bkpk-primary/40 fill-bkpk-primary/[0.03]" />

          {/* Koło rzutów wolnych */}
          <circle cx="50" cy="42" r="14" strokeWidth="1" className="stroke-bkpk-primary/30" />
          <line x1="33" y1="42" x2="67" y2="42" strokeWidth="1" className="stroke-bkpk-primary/40" />

          {/* Łuk bez szarży (Restricted area) */}
          <path d="M 44,14 A 6,6 0 0,0 56,14" strokeWidth="0.8" className="stroke-white/30" />

          {/* Łuk za 3 punkty FIBA (6.75m) w złocie */}
          <path d="M 8,2 L 8,24 A 42,42 0 0,0 92,24 L 92,2" strokeWidth="1.2" className="stroke-bkpk-primary/60" />

          {/* Linia środkowa i szczyt koła */}
          <line x1="2" y1="98" x2="98" y2="98" strokeWidth="1.2" className="stroke-white/30" />
          <path d="M 36,98 A 14,14 0 0,1 64,98" strokeWidth="1" className="stroke-white/30 fill-white/[0.02]" />
        </svg>

        {/* Cień pod Piłką na Parkiecie */}
        <div
          style={{
            left: `${renderedBall.x}%`,
            top: `${renderedBall.y}%`,
            transform: 'translate(-50%, -50%)',
            opacity: renderedBall.isAirborne ? Math.max(0.2, 0.7 - renderedBall.z * 0.4) : 0.6,
            width: `${16 - renderedBall.z * 6}px`,
            height: `${10 - renderedBall.z * 4}px`
          }}
          className="absolute bg-black/80 rounded-full blur-[2px] pointer-events-none z-10 transition-all"
        />

        {/* Zawodnicy (Atak, Obrona) */}
        {renderedPlayers.map((player) => {
          const isOffense = player.isOffense;
          const isScreening = player.isScreening;
          const isShooting = player.isShooting;
          const hasBall = renderedBall.holderId === player.id;

          return (
            <div
              key={player.id}
              style={{
                left: `${player.x}%`,
                top: `${player.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
              className="absolute flex flex-col items-center pointer-events-none z-20 transition-all duration-75"
            >
              {/* Efekt Zasłony (Screen Lock Aura) */}
              {isScreening && (
                <div className="absolute -inset-2.5 rounded-full border-2 border-amber-400/80 animate-ping opacity-75 pointer-events-none" />
              )}

              {/* Efekt Rzutu (Shooting Glow) */}
              {isShooting && (
                <div className="absolute -inset-3 rounded-full bg-bkpk-primary/30 blur-sm animate-pulse pointer-events-none" />
              )}

              {/* Główny Token Zawodnika */}
              <div
                className={cn(
                  "relative flex items-center justify-center font-outfit font-black rounded-full select-none shadow-2xl transition-transform",
                  isOffense
                    ? "w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm bg-gradient-to-b from-amber-300 via-bkpk-primary to-amber-600 text-black border-2 border-black/60 shadow-bkpk-glow"
                    : "w-7 h-7 sm:w-8 sm:h-8 text-[11px] sm:text-xs bg-gradient-to-b from-rose-500 to-rose-800 text-white border border-rose-300/40 shadow-[0_0_12px_rgba(244,63,94,0.4)]",
                  hasBall && "ring-4 ring-amber-400 shadow-[0_0_20px_rgba(236,167,44,0.8)]"
                )}
              >
                {/* Wskaźnik Kierunku Zwrotu Ciała (Heading Arrow) */}
                <div
                  style={{
                    transform: `rotate(${player.heading}deg)`
                  }}
                  className="absolute -top-1.5 w-1.5 h-1.5 bg-white rounded-full shadow-sm"
                />

                {player.number}

                {/* Ikona Zasłony na Tokenie */}
                {isScreening && (
                  <span className="absolute -top-2 -right-1 bg-amber-500 text-black font-black text-[9px] px-1 rounded-full border border-black shadow">
                    T
                  </span>
                )}
              </div>

              {/* Podpis Zawodnika pod Tokenem */}
              <span className="text-[10px] sm:text-[11px] font-black tracking-tight text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] whitespace-nowrap mt-0.5 font-outfit">
                {player.name.split(' ')[0]}
              </span>
            </div>
          );
        })}

        {/* Realistyczna Piłka do Koszykówki (2.5D Parabola) */}
        <div
          style={{
            left: `${renderedBall.x}%`,
            top: `${renderedBall.y - renderedBall.z * 16}%`, // Efekt uniesienia w powietrzu
            transform: `translate(-50%, -50%) scale(${1.0 + renderedBall.z * 0.6})`,
            zIndex: renderedBall.isAirborne ? 40 : 25
          }}
          className={cn(
            "absolute flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-orange-600 to-amber-900 border border-amber-300/60 shadow-lg pointer-events-none transition-all duration-75",
            renderedBall.isShot ? "w-6 h-6 shadow-amber-500/50" : "w-5 h-5"
          )}
        >
          {/* Linie na piłce */}
          <div className="w-full h-[1px] bg-black/40" />
          <div className="absolute h-full w-[1px] bg-black/40" />
        </div>
      </div>

      {/* Pasek Sterowania i Suwak Czasu (Interactive Timeline Scrubber) */}
      <div className="p-4 bg-bkpk-surface border border-bkpk-border-strong rounded-2xl shadow-xl space-y-3">
        {/* Suwak Czasu (Timeline Slider) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-bkpk-text-muted">
            <span>Start (0.0s)</span>
            <span className="text-bkpk-primary font-outfit text-xs">{currentTime.toFixed(2)}s</span>
            <span>Koniec ({duration.toFixed(1)}s)</span>
          </div>
          <input
            type="range"
            min="0"
            max={duration}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-bkpk-surface-tint-2 rounded-lg appearance-none cursor-pointer accent-bkpk-primary"
          />
        </div>

        {/* Kontrolki Odtwarzania */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
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

            <button
              onClick={() => handleStepDelta(-0.5)}
              className="p-2 rounded-xl text-bkpk-text-muted hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-2 transition-colors"
              title="Cofnij 0.5s"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleStepDelta(0.5)}
              className="p-2 rounded-xl text-bkpk-text-muted hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-2 transition-colors"
              title="Przewiń 0.5s"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setCurrentTime(0);
                setIsPlaying(true);
              }}
              className="p-2 rounded-xl text-bkpk-text-muted hover:text-bkpk-primary hover:bg-bkpk-surface-tint-2 transition-colors"
              title="Resetuj do początku"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsLoop(!isLoop)}
              className={cn(
                "p-2 rounded-xl transition-colors",
                isLoop ? "text-bkpk-primary bg-bkpk-primary/10" : "text-bkpk-text-muted hover:text-bkpk-text-primary"
              )}
              title="Pętla"
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Wybór Prędkości */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-bkpk-text-muted uppercase tracking-wider hidden sm:inline">
              Tempo:
            </span>
            <div className="flex items-center gap-1 bg-bkpk-surface-tint-1 p-1 rounded-xl border border-bkpk-border-subtle">
              {[0.25, 0.5, 1.0, 1.5].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSpeed(spd)}
                  className={cn(
                    "px-2 py-0.5 rounded-lg text-xs font-bold transition-all",
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
      </div>

      {/* Synchronizowany Panel Trenerski dla Bieżącej Sekundy */}
      {currentPhase && (
        <BkpkCard variant="glass" className="p-5 border-bkpk-primary/30 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-bkpk-primary/10 border border-bkpk-primary/30 flex items-center justify-center text-bkpk-primary shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-black uppercase tracking-wider text-bkpk-primary">
                  {currentPhase.title}
                </span>
                <span className="text-[10px] text-bkpk-text-muted font-bold">
                  {currentPhase.startTime.toFixed(1)}s – {currentPhase.endTime.toFixed(1)}s
                </span>
              </div>
              <p className="text-xs text-bkpk-text-secondary leading-relaxed mb-3">
                {currentPhase.description}
              </p>

              {currentPhase.coachingCues && currentPhase.coachingCues.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-bkpk-border-subtle">
                  {currentPhase.coachingCues.map((cue, cIdx) => (
                    <span
                      key={cIdx}
                      className="text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full"
                    >
                      ⚡ {cue}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </BkpkCard>
      )}
    </div>
  );
}
