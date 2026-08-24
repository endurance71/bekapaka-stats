import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play as PlayIcon,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Repeat,
  Target,
  Shield,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { cn } from '../../shared/lib/utils';
import BkpkButton from '../../shared/ui/BkpkButton';
import BkpkCard from '../../shared/ui/BkpkCard';
import {
  PlayTimelineData,
  PlayerTrack,
  BallTrack,
  TacticalStroke,
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

const FALLBACK_PLAYERS: PlayerTrack[] = [
  {
    id: 'O1',
    number: 10,
    name: 'Damian',
    role: 'PG',
    isOffense: true,
    keyframes: [
      { time: 0.0, x: 50, y: 82, heading: 180, action: 'idle' },
      { time: 1.5, x: 50, y: 82, heading: 180, action: 'idle' },
      { time: 3.5, x: 68, y: 72, heading: 140, action: 'dribble' },
      { time: 5.5, x: 68, y: 72, heading: 110, action: 'idle' },
      { time: 8.5, x: 64, y: 76, heading: 0, action: 'idle' }
    ]
  },
  {
    id: 'O2',
    number: 7,
    name: 'Kaszub',
    role: 'SG',
    isOffense: true,
    keyframes: [
      { time: 0.0, x: 18, y: 65, heading: 180, action: 'idle' },
      { time: 1.5, x: 18, y: 65, heading: 180, action: 'idle' },
      { time: 4.5, x: 22, y: 75, heading: 90, action: 'idle' },
      { time: 8.5, x: 25, y: 78, heading: 0, action: 'idle' }
    ]
  },
  {
    id: 'O3',
    number: 24,
    name: 'Jędrzej',
    role: 'SF',
    isOffense: true,
    keyframes: [
      { time: 0.0, x: 82, y: 65, heading: 180, action: 'idle' },
      { time: 1.5, x: 82, y: 65, heading: 180, action: 'idle' },
      { time: 3.5, x: 78, y: 60, heading: 220, action: 'cut' },
      { time: 5.5, x: 90, y: 22, heading: 270, action: 'catch' },
      { time: 6.8, x: 90, y: 22, heading: 270, action: 'shoot' },
      { time: 8.5, x: 90, y: 22, heading: 270, action: 'idle' }
    ]
  },
  {
    id: 'O4',
    number: 15,
    name: 'Maciej',
    role: 'PF',
    isOffense: true,
    keyframes: [
      { time: 0.0, x: 35, y: 40, heading: 180, action: 'idle' },
      { time: 1.5, x: 35, y: 40, heading: 180, action: 'idle' },
      { time: 4.5, x: 42, y: 35, heading: 90, action: 'idle' },
      { time: 8.5, x: 45, y: 25, heading: 0, action: 'roll' }
    ]
  },
  {
    id: 'O5',
    number: 33,
    name: 'Filip',
    role: 'C',
    isOffense: true,
    keyframes: [
      { time: 0.0, x: 65, y: 40, heading: 180, action: 'idle' },
      { time: 1.5, x: 65, y: 40, heading: 180, action: 'idle' },
      { time: 3.5, x: 75, y: 58, heading: 180, action: 'set_screen' },
      { time: 5.5, x: 75, y: 58, heading: 180, action: 'set_screen' },
      { time: 7.0, x: 55, y: 22, heading: 0, action: 'roll' },
      { time: 8.5, x: 50, y: 18, heading: 0, action: 'idle' }
    ]
  },
  // Obrońcy
  {
    id: 'D1',
    number: 1,
    name: 'D1',
    role: 'PG',
    isOffense: false,
    keyframes: [
      { time: 0.0, x: 42, y: 70, heading: 0, action: 'defend' },
      { time: 1.5, x: 42, y: 70, heading: 0, action: 'defend' },
      { time: 4.0, x: 52, y: 68, heading: 90, action: 'defend' },
      { time: 8.5, x: 55, y: 65, heading: 90, action: 'defend' }
    ]
  },
  {
    id: 'D2',
    number: 2,
    name: 'D2',
    role: 'SG',
    isOffense: false,
    keyframes: [
      { time: 0.0, x: 58, y: 70, heading: 0, action: 'defend' },
      { time: 1.5, x: 58, y: 70, heading: 0, action: 'defend' },
      { time: 3.5, x: 66, y: 65, heading: 90, action: 'defend' },
      { time: 5.5, x: 72, y: 56, heading: 90, action: 'defend' },
      { time: 8.5, x: 74, y: 50, heading: 0, action: 'defend' }
    ]
  },
  {
    id: 'D3',
    number: 3,
    name: 'D3',
    role: 'SF',
    isOffense: false,
    keyframes: [
      { time: 0.0, x: 22, y: 40, heading: 0, action: 'defend' },
      { time: 1.5, x: 22, y: 40, heading: 0, action: 'defend' },
      { time: 8.5, x: 28, y: 32, heading: 90, action: 'defend' }
    ]
  },
  {
    id: 'D4',
    number: 4,
    name: 'D4',
    role: 'PF',
    isOffense: false,
    keyframes: [
      { time: 0.0, x: 50, y: 30, heading: 0, action: 'defend' },
      { time: 1.5, x: 50, y: 30, heading: 0, action: 'defend' },
      { time: 5.0, x: 52, y: 26, heading: 90, action: 'defend' },
      { time: 8.5, x: 50, y: 20, heading: 0, action: 'defend' }
    ]
  },
  {
    id: 'D5',
    number: 5,
    name: 'D5',
    role: 'C',
    isOffense: false,
    keyframes: [
      { time: 0.0, x: 78, y: 40, heading: 0, action: 'defend' },
      { time: 1.5, x: 78, y: 40, heading: 0, action: 'defend' },
      { time: 5.5, x: 74, y: 32, heading: 0, action: 'defend' },
      { time: 8.5, x: 84, y: 24, heading: 90, action: 'defend' }
    ]
  }
];

const FALLBACK_BALL: BallTrack = {
  keyframes: [
    { time: 0.0, x: 50, y: 82, holderId: 'O1' },
    { time: 1.5, x: 50, y: 82, holderId: 'O1' },
    { time: 3.5, x: 68, y: 72, holderId: 'O1' },
    { time: 5.5, x: 68, y: 72, holderId: 'O1' },
    { time: 6.0, x: 90, y: 22, holderId: 'O3', isPass: true, arcHeight: 0.2 },
    { time: 6.8, x: 90, y: 22, holderId: 'O3' },
    { time: 8.0, x: 50, y: 14, holderId: null, isShot: true, arcHeight: 1.2 },
    { time: 8.5, x: 50, y: 14, holderId: null }
  ]
};

export default function BasketballCourtCanvas({
  initialData,
  playName,
  category,
  targetDefense
}: BasketballCourtCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Normalizacja danych do formatu PlayTimelineData
  const timelineData: PlayTimelineData = useMemo(() => {
    const raw = initialData || {};
    const duration = raw.duration || 8.5;
    const players: PlayerTrack[] = Array.isArray(raw.players) && raw.players.length > 0 ? raw.players : FALLBACK_PLAYERS;
    const ball: BallTrack = raw.ball && Array.isArray(raw.ball.keyframes) ? raw.ball : FALLBACK_BALL;
    const strokes: TacticalStroke[] = Array.isArray(raw.strokes) ? raw.strokes : [];
    const phaseDirectives = Array.isArray(raw.phaseDirectives) ? raw.phaseDirectives : [];
    const coachingKeys = Array.isArray(raw.coachingKeys) ? raw.coachingKeys : [];

    return {
      duration,
      players,
      ball,
      strokes,
      phaseDirectives,
      coachingKeys
    };
  }, [initialData]);

  const duration = timelineData.duration;

  // Stany sterowania
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1.0);
  const [isLoop, setIsLoop] = useState<boolean>(true);
  const [activeUiTime, setActiveUiTime] = useState<number>(0);

  // Refy dla pętli 60 FPS w Canvasie bez zbędnych re-renderów
  const timeRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(true);
  const speedRef = useRef<number>(1.0);
  const isLoopRef = useRef<boolean>(true);
  const durationRef = useRef<number>(duration);
  const lastTimeUpdateUiRef = useRef<number>(0);

  isPlayingRef.current = isPlaying;
  speedRef.current = speed;
  isLoopRef.current = isLoop;
  durationRef.current = duration;

  // Reset przy zmianie presetu
  useEffect(() => {
    timeRef.current = 0;
    setActiveUiTime(0);
    setIsPlaying(true);
  }, [initialData]);

  // Główna pętla renderowania HTML5 Canvas 2D (60-120 FPS)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let lastFrameTime = performance.now();

    const render = (now: number) => {
      const delta = ((now - lastFrameTime) / 1000) * speedRef.current;
      lastFrameTime = now;

      if (isPlayingRef.current) {
        timeRef.current += delta;
        if (timeRef.current >= durationRef.current) {
          if (isLoopRef.current) {
            timeRef.current = 0;
          } else {
            timeRef.current = durationRef.current;
            setIsPlaying(false);
          }
        }
      }

      const t = timeRef.current;

      // Aktualizacja suwaka UI raz na 100ms
      if (now - lastTimeUpdateUiRef.current > 80) {
        setActiveUiTime(t);
        lastTimeUpdateUiRef.current = now;
      }

      // Rozmiar i obsługa Retina Display
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      const height = rect.height;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Konwersja współrzędnych % (0-100) na piksele Canvasa
      const px = (xPct: number) => (xPct / 100) * width;
      const py = (yPct: number) => (yPct / 100) * height;

      // 1. TŁO PARKIETU (Dark Obsidian Basketball Hardwood)
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#15151a');
      grad.addColorStop(0.5, '#101014');
      grad.addColorStop(1, '#09090b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Subtelny wzór desek parkietu
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      const plankStep = width / 18;
      for (let i = 1; i < 18; i++) {
        ctx.beginPath();
        ctx.moveTo(i * plankStep, 0);
        ctx.lineTo(i * plankStep, height);
        ctx.stroke();
      }

      // 2. WEKTOROWE LINIE BOISKA FIBA / KALK (Złoto i Biel)
      const gold = '#ECA72C';
      const lineWhite = 'rgba(255, 255, 255, 0.28)';

      // Obramowanie boiska
      ctx.strokeStyle = lineWhite;
      ctx.lineWidth = 2;
      ctx.strokeRect(px(2), py(2), px(96), py(96));

      // Trumna (Key / Paint) z subtelnym złotym wypełnieniem
      ctx.fillStyle = 'rgba(236, 167, 44, 0.04)';
      ctx.fillRect(px(33), py(2), px(34), py(40));
      ctx.strokeStyle = 'rgba(236, 167, 44, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px(33), py(2), px(34), py(40));

      // Koło rzutów wolnych
      ctx.beginPath();
      ctx.arc(px(50), py(42), px(14), 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(236, 167, 44, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Linia rzutów wolnych
      ctx.beginPath();
      ctx.moveTo(px(33), py(42));
      ctx.lineTo(px(67), py(42));
      ctx.stroke();

      // Łuk bez szarży (Restricted area)
      ctx.beginPath();
      ctx.arc(px(50), py(14), px(6), 0, Math.PI);
      ctx.strokeStyle = lineWhite;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Łuk za 3 punkty FIBA (6.75m)
      ctx.beginPath();
      ctx.moveTo(px(8), py(2));
      ctx.lineTo(px(8), py(24));
      ctx.arc(px(50), py(14), px(42), Math.PI * 0.76, Math.PI * 0.24, true);
      ctx.lineTo(px(92), py(2));
      ctx.strokeStyle = 'rgba(236, 167, 44, 0.75)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Linia połowy i koło środkowe
      ctx.beginPath();
      ctx.moveTo(px(2), py(98));
      ctx.lineTo(px(98), py(98));
      ctx.strokeStyle = lineWhite;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(px(50), py(98), px(14), Math.PI, 0, false);
      ctx.strokeStyle = lineWhite;
      ctx.stroke();

      // Kosz i tablica
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px(42), py(6));
      ctx.lineTo(px(58), py(6));
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px(50), py(6));
      ctx.lineTo(px(50), py(12));
      ctx.stroke();

      // Siatka kosza
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.moveTo(px(47.5), py(14));
      ctx.lineTo(px(52.5), py(14));
      ctx.lineTo(px(51.5), py(18));
      ctx.lineTo(px(48.5), py(18));
      ctx.closePath();
      ctx.fill();

      // Pomarańczowa stalowa obręcz
      ctx.strokeStyle = '#FF5722';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(px(50), py(14), px(2.8), 0, Math.PI * 2);
      ctx.stroke();

      // 3. OBLICZENIE STANU ZAWODNIKÓW I PIŁKI W CHWILI t
      const renderedPlayers = timelineData.players.map((p) => interpolatePlayer(p, t));
      const playersMap = new Map<string, RenderedPlayerState>();
      for (const rp of renderedPlayers) {
        playersMap.set(rp.id, rp);
      }
      const renderedBall = interpolateBall(timelineData.ball, playersMap, t);

      // 4. SYMBOLE TAKTYCZNE NA PARKIECIE (Zasłony T-Bar, Podania, Ścięcia)
      for (const player of renderedPlayers) {
        // A) OFICJALNA BELKA ZASŁONY (T-Bar / Screen Barrier)
        if (player.isScreening) {
          const sx = px(player.x);
          const sy = py(player.y);
          const barLength = px(5.5);

          ctx.save();
          ctx.translate(sx, sy);
          // Obrót prostopadle do kierunku zwrotu
          const barAngleRad = (player.heading * Math.PI) / 180;
          ctx.rotate(barAngleRad);

          // Świetlny efekt strefy blokady
          ctx.strokeStyle = 'rgba(236, 167, 44, 0.9)';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(-barLength, -px(2.5));
          ctx.lineTo(barLength, -px(2.5));
          ctx.stroke();

          // Pionowy łącznik T-Bar
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(0, -px(2.5));
          ctx.lineTo(0, px(1.0));
          ctx.stroke();

          // Pulsujący ring zasłony
          const pulse = (Math.sin(now * 0.008) + 1) * 0.5;
          ctx.strokeStyle = `rgba(245, 158, 11, ${0.3 + pulse * 0.4})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, px(3.2 + pulse * 0.8), 0, Math.PI * 2);
          ctx.stroke();

          ctx.restore();
        }
      }

      // 5. RYSOWANIE TOKENÓW ZAWODNIKÓW Z POZYCJAMI (PG, SG, SF, PF, C / D1-D5)
      const tokenRadius = Math.max(14, px(2.5));

      for (const player of renderedPlayers) {
        const cx = px(player.x);
        const cy = py(player.y);
        const isOffense = player.isOffense;
        const hasBall = renderedBall.holderId === player.id;

        // Cień pod zawodnikiem
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + tokenRadius * 0.6, tokenRadius * 0.8, tokenRadius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wskaźnik zwrotu ciała (Heading Pointer)
        const headingRad = (player.heading * Math.PI) / 180;
        const hx = cx + Math.sin(headingRad) * (tokenRadius + 3);
        const hy = cy - Math.cos(headingRad) * (tokenRadius + 3);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(hx, hy, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Kółko Tokena (Złoty dla Ataku, Karmazynowy dla Obrony)
        ctx.beginPath();
        ctx.arc(cx, cy, tokenRadius, 0, Math.PI * 2);

        if (isOffense) {
          const tGrad = ctx.createLinearGradient(cx, cy - tokenRadius, cx, cy + tokenRadius);
          tGrad.addColorStop(0, '#FDE047');
          tGrad.addColorStop(0.5, '#ECA72C');
          tGrad.addColorStop(1, '#B45309');
          ctx.fillStyle = tGrad;
          ctx.fill();

          ctx.strokeStyle = hasBall ? '#FFFFFF' : '#000000';
          ctx.lineWidth = hasBall ? 3 : 2;
          ctx.stroke();

          // Posiadanie piłki - świecący ring
          if (hasBall) {
            ctx.strokeStyle = 'rgba(253, 224, 71, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, tokenRadius + 4, 0, Math.PI * 2);
            ctx.stroke();
          }
        } else {
          const dGrad = ctx.createLinearGradient(cx, cy - tokenRadius, cx, cy + tokenRadius);
          dGrad.addColorStop(0, '#F43F5E');
          dGrad.addColorStop(1, '#9F1239');
          ctx.fillStyle = dGrad;
          ctx.fill();

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // NAPIS POZYCJI (PG, SG, SF, PF, C / D1-D5)
        ctx.fillStyle = isOffense ? '#000000' : '#FFFFFF';
        ctx.font = `900 ${Math.round(tokenRadius * 0.95)}px Outfit, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const positionLabel = isOffense
          ? player.role || 'PG'
          : `D${player.number}`;

        ctx.fillText(positionLabel, cx, cy + 0.5);

        // PODPIS IMIENIA ZAWODNIKA PONIŻEJ TOKENA
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = `700 ${Math.max(10, Math.round(tokenRadius * 0.7))}px Outfit, sans-serif`;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 4;
        ctx.fillText(player.name.split(' ')[0], cx, cy + tokenRadius + 9);
        ctx.shadowBlur = 0;
      }

      // 6. RYSOWANIE PIŁKI (2.5D z wysokością łuku)
      const bx = px(renderedBall.x);
      const groundBy = py(renderedBall.y);
      const airBy = py(renderedBall.y - renderedBall.z * 18);
      const ballRadius = Math.max(8, px(1.3)) * (1.0 + renderedBall.z * 0.4);

      // Cień piłki na parkiecie
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0.2, 0.7 - renderedBall.z * 0.4)})`;
      ctx.beginPath();
      ctx.ellipse(
        bx,
        groundBy,
        ballRadius * (1.1 - renderedBall.z * 0.3),
        ballRadius * (0.6 - renderedBall.z * 0.2),
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Piłka
      const ballGrad = ctx.createRadialGradient(
        bx - ballRadius * 0.3,
        airBy - ballRadius * 0.3,
        ballRadius * 0.1,
        bx,
        airBy,
        ballRadius
      );
      ballGrad.addColorStop(0, '#FB923C');
      ballGrad.addColorStop(0.6, '#EA580C');
      ballGrad.addColorStop(1, '#7C2D12');

      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(bx, airBy, ballRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx - ballRadius, airBy);
      ctx.lineTo(bx + ballRadius, airBy);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(bx, airBy - ballRadius);
      ctx.lineTo(bx, airBy + ballRadius);
      ctx.stroke();

      // Efekt Swish / Trafienia do kosza pod koniec akcji
      if (t >= 7.2 && t <= 8.5) {
        ctx.fillStyle = '#10B981';
        ctx.font = '900 13px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✨ SWISH! +3 PTS', px(50), py(9));
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [timelineData]);

  // Aktywna faza taktyczna
  const currentPhase = useMemo(() => {
    if (!timelineData.phaseDirectives || timelineData.phaseDirectives.length === 0) {
      return null;
    }
    return (
      timelineData.phaseDirectives.find(
        (ph) => activeUiTime >= ph.startTime && activeUiTime <= ph.endTime
      ) || timelineData.phaseDirectives[timelineData.phaseDirectives.length - 1]
    );
  }, [timelineData.phaseDirectives, activeUiTime]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    timeRef.current = newTime;
    setActiveUiTime(newTime);
  };

  const handleStepDelta = (delta: number) => {
    const next = Math.max(0, Math.min(duration, timeRef.current + delta));
    timeRef.current = next;
    setActiveUiTime(next);
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
              <span className="font-bold text-bkpk-primary font-outfit">
                {activeUiTime.toFixed(1)}s / {duration.toFixed(1)}s
              </span>
            </div>
          </div>
        </div>

        {/* Fazy Akcji jako Pigułki */}
        {timelineData.phaseDirectives && timelineData.phaseDirectives.length > 0 && (
          <div className="flex items-center gap-1.5 bg-bkpk-surface-tint-2 p-1 rounded-xl border border-bkpk-border-subtle overflow-x-auto no-scrollbar">
            {timelineData.phaseDirectives.map((ph, idx) => {
              const isActive = activeUiTime >= ph.startTime && activeUiTime <= ph.endTime;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    timeRef.current = ph.startTime;
                    setActiveUiTime(ph.startTime);
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

      {/* Kontener HTML5 Canvas 2D (Płynność 60-120 FPS bez zacięć) */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] max-w-[850px] mx-auto border-2 border-bkpk-primary/40 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.85)]">
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-pointer"
          onClick={() => setIsPlaying(!isPlaying)}
        />
      </div>

      {/* Legenda Symboli Taktycznych */}
      <div className="flex flex-wrap items-center justify-center gap-4 py-2 px-3 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle rounded-xl text-[11px] font-bold text-bkpk-text-secondary">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-bkpk-primary text-black text-[9px] font-black flex items-center justify-center">
            PG
          </span>
          <span>Pozycje Ataku (PG/SG/SF/PF/C)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center">
            D1
          </span>
          <span>Obrońcy (D1-D5)</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-400">
          <span className="font-black text-sm">⊥</span>
          <span>Zasłona (T-Bar)</span>
        </div>
        <div className="flex items-center gap-1.5 text-bkpk-primary">
          <span className="font-black text-xs">🏀</span>
          <span>Piłka &amp; Rzut</span>
        </div>
      </div>

      {/* Pasek Sterowania i Suwak Czasu (Interactive Timeline Scrubber) */}
      <div className="p-4 bg-bkpk-surface border border-bkpk-border-strong rounded-2xl shadow-xl space-y-3">
        {/* Suwak Czasu (Timeline Slider) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-bkpk-text-muted">
            <span>Ustawienie (0.0s)</span>
            <span className="text-bkpk-primary font-outfit text-xs">{activeUiTime.toFixed(2)}s</span>
            <span>Koniec ({duration.toFixed(1)}s)</span>
          </div>
          <input
            type="range"
            min="0"
            max={duration}
            step="0.05"
            value={activeUiTime}
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
                timeRef.current = 0;
                setActiveUiTime(0);
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
                <span className="text-xs font-black uppercase tracking-wider text-bkpk-primary font-outfit">
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
