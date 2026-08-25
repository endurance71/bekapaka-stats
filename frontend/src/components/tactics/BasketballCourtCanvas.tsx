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
  BookOpen
} from 'lucide-react';
import { cn } from '../../shared/lib/utils';
import BkpkButton from '../../shared/ui/BkpkButton';
import BkpkCard from '../../shared/ui/BkpkCard';
import ZoneDefenseGuideModal from './ZoneDefenseGuideModal';
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
    number: 1,
    name: 'PG',
    role: 'PG',
    isOffense: true,
    keyframes: [
      { time: 0.0, x: 50, y: 80, heading: 180, action: 'idle' },
      { time: 1.5, x: 50, y: 80, heading: 180, action: 'idle' },
      { time: 3.5, x: 68, y: 72, heading: 140, action: 'dribble' },
      { time: 5.5, x: 68, y: 72, heading: 110, action: 'idle' },
      { time: 8.5, x: 64, y: 76, heading: 0, action: 'idle' }
    ]
  },
  {
    id: 'O2',
    number: 2,
    name: 'SG',
    role: 'SG',
    isOffense: true,
    keyframes: [
      { time: 0.0, x: 16, y: 60, heading: 180, action: 'idle' },
      { time: 1.5, x: 16, y: 60, heading: 180, action: 'idle' },
      { time: 4.5, x: 20, y: 72, heading: 90, action: 'idle' },
      { time: 8.5, x: 22, y: 76, heading: 0, action: 'idle' }
    ]
  },
  {
    id: 'O3',
    number: 3,
    name: 'SF',
    role: 'SF',
    isOffense: true,
    keyframes: [
      { time: 0.0, x: 84, y: 60, heading: 180, action: 'idle' },
      { time: 1.5, x: 84, y: 60, heading: 180, action: 'idle' },
      { time: 3.5, x: 78, y: 55, heading: 220, action: 'cut' },
      { time: 5.5, x: 90, y: 16, heading: 270, action: 'catch' },
      { time: 6.8, x: 90, y: 16, heading: 270, action: 'shoot' },
      { time: 8.5, x: 90, y: 16, heading: 270, action: 'idle' }
    ]
  },
  {
    id: 'O4',
    number: 4,
    name: 'PF',
    role: 'PF',
    isOffense: true,
    keyframes: [
      { time: 0.0, x: 36, y: 42, heading: 180, action: 'idle' },
      { time: 1.5, x: 36, y: 42, heading: 180, action: 'idle' },
      { time: 4.5, x: 40, y: 35, heading: 90, action: 'idle' },
      { time: 8.5, x: 45, y: 25, heading: 0, action: 'roll' }
    ]
  },
  {
    id: 'O5',
    number: 5,
    name: 'C',
    role: 'C',
    isOffense: true,
    keyframes: [
      { time: 0.0, x: 64, y: 42, heading: 180, action: 'idle' },
      { time: 1.5, x: 64, y: 42, heading: 180, action: 'idle' },
      { time: 3.5, x: 75, y: 56, heading: 180, action: 'set_screen' },
      { time: 5.5, x: 75, y: 56, heading: 180, action: 'set_screen' },
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
      { time: 0.0, x: 50, y: 70, heading: 0, action: 'defend' },
      { time: 1.5, x: 50, y: 70, heading: 0, action: 'defend' },
      { time: 4.0, x: 54, y: 66, heading: 90, action: 'defend' },
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
      { time: 0.0, x: 28, y: 54, heading: 0, action: 'defend' },
      { time: 1.5, x: 28, y: 54, heading: 0, action: 'defend' },
      { time: 3.5, x: 66, y: 62, heading: 90, action: 'defend' },
      { time: 5.5, x: 72, y: 52, heading: 90, action: 'defend' },
      { time: 8.5, x: 74, y: 48, heading: 0, action: 'defend' }
    ]
  },
  {
    id: 'D3',
    number: 3,
    name: 'D3',
    role: 'SF',
    isOffense: false,
    keyframes: [
      { time: 0.0, x: 72, y: 54, heading: 0, action: 'defend' },
      { time: 1.5, x: 72, y: 54, heading: 0, action: 'defend' },
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
      { time: 0.0, x: 38, y: 28, heading: 0, action: 'defend' },
      { time: 1.5, x: 38, y: 28, heading: 0, action: 'defend' },
      { time: 5.0, x: 52, y: 24, heading: 90, action: 'defend' },
      { time: 8.5, x: 50, y: 18, heading: 0, action: 'defend' }
    ]
  },
  {
    id: 'D5',
    number: 5,
    name: 'D5',
    role: 'C',
    isOffense: false,
    keyframes: [
      { time: 0.0, x: 62, y: 28, heading: 0, action: 'defend' },
      { time: 1.5, x: 62, y: 28, heading: 0, action: 'defend' },
      { time: 5.5, x: 74, y: 28, heading: 0, action: 'defend' },
      { time: 8.5, x: 84, y: 20, heading: 90, action: 'defend' }
    ]
  }
];

const FALLBACK_BALL: BallTrack = {
  keyframes: [
    { time: 0.0, x: 50, y: 80, holderId: 'O1' },
    { time: 1.5, x: 50, y: 80, holderId: 'O1' },
    { time: 3.5, x: 68, y: 72, holderId: 'O1' },
    { time: 5.0, x: 68, y: 72, holderId: 'O1' },
    { time: 5.8, x: 90, y: 16, holderId: 'O3', isPass: true, arcHeight: 0.2 },
    { time: 6.8, x: 90, y: 16, holderId: 'O3' },
    { time: 7.8, x: 50, y: 12.5, holderId: null, isShot: true, arcHeight: 1.3 },
    { time: 8.5, x: 50, y: 12.5, holderId: null }
  ]
};

export default function BasketballCourtCanvas({
  initialData,
  playName,
  category,
  targetDefense
}: BasketballCourtCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const timelineData: PlayTimelineData = useMemo(() => {
    const raw = initialData || {};
    const duration = raw.duration || 8.5;
    const players: PlayerTrack[] = Array.isArray(raw.players) && raw.players.length > 0 ? raw.players : FALLBACK_PLAYERS;
    const ball: BallTrack = raw.ball && Array.isArray(raw.ball.keyframes) ? raw.ball : FALLBACK_BALL;
    const strokes: TacticalStroke[] = Array.isArray(raw.strokes) ? raw.strokes : [];
    const phaseDirectives = Array.isArray(raw.phaseDirectives) ? raw.phaseDirectives : [];
    const coachingKeys = Array.isArray(raw.coachingKeys) ? raw.coachingKeys : [];
    const outcomeText = raw.outcomeText || undefined;
    const zoneAreas = Array.isArray(raw.zoneAreas) ? raw.zoneAreas : [];

    return {
      duration,
      players,
      ball,
      strokes,
      phaseDirectives,
      coachingKeys,
      outcomeText,
      zoneAreas
    };
  }, [initialData]);

  const duration = timelineData.duration;

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1.0);
  const [isLoop, setIsLoop] = useState<boolean>(true);
  const [showZones, setShowZones] = useState<boolean>(true);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [activeUiTime, setActiveUiTime] = useState<number>(0);

  const timeRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(true);
  const speedRef = useRef<number>(1.0);
  const isLoopRef = useRef<boolean>(true);
  const showZonesRef = useRef<boolean>(true);
  const durationRef = useRef<number>(duration);
  const lastTimeUpdateUiRef = useRef<number>(0);
  const prevPlayNameRef = useRef<string | null>(null);

  speedRef.current = speed;
  isLoopRef.current = isLoop;
  showZonesRef.current = showZones;
  durationRef.current = duration;

  // Reset odtwarzacza tylko gdy użytkownik wybierze inny schemat taktyczny
  useEffect(() => {
    if (prevPlayNameRef.current !== playName) {
      prevPlayNameRef.current = playName;
      timeRef.current = 0;
      setActiveUiTime(0);
      isPlayingRef.current = true;
      setIsPlaying(true);
    }
  }, [playName]);

  // Bezpieczny przełącznik Play/Pause
  const togglePlay = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      isPlayingRef.current = next;
      // Jeśli jesteśmy na końcu akcji i włączamy Play, zrestartuj od początku
      if (next && timeRef.current >= durationRef.current) {
        timeRef.current = 0;
        setActiveUiTime(0);
      }
      return next;
    });
  };

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

  const handleReset = () => {
    timeRef.current = 0;
    setActiveUiTime(0);
    isPlayingRef.current = true;
    setIsPlaying(true);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    speedRef.current = newSpeed;
  };

  const handleLoopToggle = () => {
    setIsLoop((prev) => {
      const next = !prev;
      isLoopRef.current = next;
      return next;
    });
  };

  // Główna pętla renderowania HTML5 Canvas 2D (60 FPS z ochroną delta i płynnym odświeżaniem)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let lastFrameTime = performance.now();

    const render = (now: number) => {
      // Ochrona przed dużymi skokami delta (np. po powrocie z innej karty lub po pauzie)
      const rawDelta = (now - lastFrameTime) / 1000;
      const safeDelta = Math.min(0.08, Math.max(0, rawDelta)) * speedRef.current;
      lastFrameTime = now;

      if (isPlayingRef.current) {
        timeRef.current += safeDelta;
        const totalDurationWithHold = durationRef.current + 2.0;
        if (timeRef.current >= totalDurationWithHold) {
          if (isLoopRef.current) {
            timeRef.current = 0;
          } else {
            timeRef.current = durationRef.current;
            if (isPlayingRef.current) {
              isPlayingRef.current = false;
              setIsPlaying(false);
            }
          }
        }
      }

      // Renderowanie klatki
      const effectiveRenderTime = Math.min(timeRef.current, durationRef.current);
      const t = effectiveRenderTime;

      // Płynne aktualizowanie paska postępu React (15 FPS, by nie obciążać procesora)
      if (now - lastTimeUpdateUiRef.current > 66) {
        setActiveUiTime(effectiveRenderTime);
        lastTimeUpdateUiRef.current = now;
      }

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

      const px = (xPct: number) => (xPct / 100) * width;
      const py = (yPct: number) => (yPct / 100) * height;

      // 1. TŁO PARKIETU (Obsidian Black Dark Hardwood)
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#15151a');
      grad.addColorStop(0.5, '#101014');
      grad.addColorStop(1, '#09090b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Subtelny wzór desek
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      const plankStep = width / 18;
      for (let i = 1; i < 18; i++) {
        ctx.beginPath();
        ctx.moveTo(i * plankStep, 0);
        ctx.lineTo(i * plankStep, height);
        ctx.stroke();
      }

      // 2. WEKTOROWE LINIE BOISKA FIBA (Złoto i Biel)
      const gold = '#ECA72C';
      const lineWhite = 'rgba(255, 255, 255, 0.28)';

      // Obramowanie boiska (Baseline top y=4, Sidelines x=4..96, Midcourt y=96)
      ctx.strokeStyle = lineWhite;
      ctx.lineWidth = 2;
      ctx.strokeRect(px(4), py(4), px(92), py(92));

      // Trumna (Key / Paint) od y=4% do y=42%, x=33% do x=67%
      ctx.fillStyle = 'rgba(236, 167, 44, 0.04)';
      ctx.fillRect(px(33), py(4), px(34), py(38));
      ctx.strokeStyle = 'rgba(236, 167, 44, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px(33), py(4), px(34), py(38));

      // Linia rzutów wolnych (y=42%)
      ctx.beginPath();
      ctx.moveTo(px(33), py(42));
      ctx.lineTo(px(67), py(42));
      ctx.strokeStyle = 'rgba(236, 167, 44, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Koło rzutów wolnych (promień 12%, środek 50, 42)
      // Dolne półkole (w stronę połowy) - linia ciągła
      ctx.beginPath();
      ctx.arc(px(50), py(42), px(12), 0, Math.PI, false);
      ctx.strokeStyle = 'rgba(236, 167, 44, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Górne półkole (wewnątrz trumny) - linia przerywana
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(px(50), py(42), px(12), Math.PI, 0, false);
      ctx.stroke();
      ctx.restore();

      // Tablica (y=8%, x: 44% do 56%)
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px(44), py(8));
      ctx.lineTo(px(56), py(8));
      ctx.stroke();

      // Mocowanie kosza (od tablicy y=8% do obręczy y=10.5%)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px(50), py(8));
      ctx.lineTo(px(50), py(10.5));
      ctx.stroke();

      // Łuk bez szarży (Restricted area - półkole ze środkiem w koszu 50, 12.5)
      ctx.beginPath();
      ctx.arc(px(50), py(12.5), px(5.5), 0, Math.PI, false);
      ctx.strokeStyle = lineWhite;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Siatka kosza
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.moveTo(px(48), py(12.5));
      ctx.lineTo(px(52), py(12.5));
      ctx.lineTo(px(51), py(16));
      ctx.lineTo(px(49), py(16));
      ctx.closePath();
      ctx.fill();

      // Pomarańczowa stalowa obręcz kosza (środek 50, 12.5)
      ctx.strokeStyle = '#FF5722';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(px(50), py(12.5), px(2.2), 0, Math.PI * 2);
      ctx.stroke();

      // LINIA ZA 3 PUNKTY FIBA (Perfekcyjna geometria z prostymi narożnikami)
      const basketX = px(50);
      const basketY = py(12.5);
      const cornerLeftX = px(8);
      const cornerRightX = px(92);
      const cornerY = py(22);
      const baselineY = py(4);

      // Obliczenie kątów łuku 3PT od punktów połączenia
      const dX = px(42);
      const dY = cornerY - basketY;
      const arcRadius = Math.hypot(dX, dY);
      const startAngle = Math.atan2(dY, dX); // prawy róg ~ 0.22 rad
      const endAngle = Math.PI - startAngle;  // lewy róg ~ 2.92 rad

      ctx.beginPath();
      // 1. Lewy róg od linii końcowej w dół
      ctx.moveTo(cornerLeftX, baselineY);
      ctx.lineTo(cornerLeftX, cornerY);
      // 2. Łuk 3PT wokół kosza
      ctx.arc(basketX, basketY, arcRadius, endAngle, startAngle, true);
      // 3. Prawy róg pionowo w górę do linii końcowej
      ctx.lineTo(cornerRightX, baselineY);

      ctx.strokeStyle = 'rgba(236, 167, 44, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Linia środkowa i koło środkowe na dole (y=96%)
      ctx.beginPath();
      ctx.arc(px(50), py(96), px(12), Math.PI, 0, false);
      ctx.strokeStyle = lineWhite;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 3. OBLICZENIE POZYCJI ZAWODNIKÓW I PIŁKI W CHWILI t
      const renderedPlayers = timelineData.players.map((p) => interpolatePlayer(p, t));
      const playersMap = new Map<string, RenderedPlayerState>();
      for (const rp of renderedPlayers) {
        playersMap.set(rp.id, rp);
      }
      const renderedBall = interpolateBall(timelineData.ball, playersMap, t);

      // 2.5 WYRAZISTA WIZUALIZACJA STREF DEFENSYWNYCH (ZONE OVERLAYS)
      if (showZonesRef.current && timelineData.zoneAreas && timelineData.zoneAreas.length > 0) {
        for (const zone of timelineData.zoneAreas) {
          if (!zone.polygon || zone.polygon.length < 3) continue;

          // Wyliczenie środka ciężkości (centroid)
          let sumX = 0;
          let sumY = 0;
          for (const pt of zone.polygon) {
            sumX += pt.x;
            sumY += pt.y;
          }
          const centX = px(sumX / zone.polygon.length);
          const centY = py(sumY / zone.polygon.length);

          const assignedPlayer = playersMap.get(zone.playerId);
          const distToBall = Math.hypot(renderedBall.x - (sumX / zone.polygon.length), renderedBall.y - (sumY / zone.polygon.length));
          const isBallInZone = distToBall < 26;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(px(zone.polygon[0].x), py(zone.polygon[0].y));
          for (let i = 1; i < zone.polygon.length; i++) {
            ctx.lineTo(px(zone.polygon[i].x), py(zone.polygon[i].y));
          }
          ctx.closePath();

          // Wyraziste wypełnienie strefy
          const baseColor = zone.color || 'rgba(244, 63, 94, 0.16)';
          ctx.fillStyle = isBallInZone ? 'rgba(244, 63, 94, 0.28)' : baseColor;
          ctx.fill();

          // Wyrazista granica strefy
          ctx.strokeStyle = isBallInZone ? '#F43F5E' : 'rgba(244, 63, 94, 0.7)';
          ctx.lineWidth = isBallInZone ? 2.5 : 1.8;
          ctx.setLineDash(isBallInZone ? [] : [6, 4]);
          if (isBallInZone) {
            ctx.shadowColor = 'rgba(244, 63, 94, 0.7)';
            ctx.shadowBlur = 10;
          }
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;

          // Subtelna linia kotwicy łącząca obrońcę z centrum jego strefy
          if (assignedPlayer) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(px(assignedPlayer.x), py(assignedPlayer.y));
            ctx.lineTo(centX, centY);
            ctx.stroke();
            ctx.restore();
          }

          // Wyrazisty Badge Strefy
          ctx.font = '900 10.5px Outfit, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const textMetrics = ctx.measureText(zone.label);
          const badgeW = textMetrics.width + 18;
          const badgeH = 20;

          ctx.fillStyle = 'rgba(10, 14, 23, 0.94)';
          ctx.beginPath();
          ctx.roundRect(centX - badgeW / 2, centY - badgeH / 2, badgeW, badgeH, 6);
          ctx.fill();

          ctx.strokeStyle = isBallInZone ? '#F43F5E' : 'rgba(244, 63, 94, 0.85)';
          ctx.lineWidth = isBallInZone ? 1.8 : 1.2;
          ctx.stroke();

          ctx.fillStyle = isBallInZone ? '#FECDD3' : '#FDA4AF';
          ctx.fillText(zone.label, centX, centY);
          ctx.restore();
        }
      }

      // 4. SYMBOLE ZASŁON (T-Bar)
      for (const player of renderedPlayers) {
        if (player.isScreening) {
          const sx = px(player.x);
          const sy = py(player.y);
          const barLength = px(4.5);

          ctx.save();
          ctx.translate(sx, sy);
          const barAngleRad = (player.heading * Math.PI) / 180;
          ctx.rotate(barAngleRad);

          // Belka blokująca T-Bar
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 3.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(-barLength, -px(2.2));
          ctx.lineTo(barLength, -px(2.2));
          ctx.stroke();

          // Trzonek T-Bar
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, -px(2.2));
          ctx.lineTo(0, px(0.8));
          ctx.stroke();

          // Pulsujący ring zasłony
          const pulse = (Math.sin(now * 0.008) + 1) * 0.5;
          ctx.strokeStyle = `rgba(245, 158, 11, ${0.3 + pulse * 0.4})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, px(2.8 + pulse * 0.6), 0, Math.PI * 2);
          ctx.stroke();

          ctx.restore();
        }
      }

      // 5. RYSOWANIE TOKENÓW Z NUMERAMI POZYCJI (1-5 / D1-D5 - ZERO IMION I NAZWISK)
      const tokenRadius = Math.max(13, px(2.2));

      for (const player of renderedPlayers) {
        const cx = px(player.x);
        const cy = py(player.y);
        const isOffense = player.isOffense;
        const hasBall = renderedBall.holderId === player.id;

        // Cień pod tokenem
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + tokenRadius * 0.5, tokenRadius * 0.8, tokenRadius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wskaźnik zwrotu ciała (Subtelny biały punkt)
        const headingRad = (player.heading * Math.PI) / 180;
        const hx = cx + Math.sin(headingRad) * (tokenRadius + 2.5);
        const hy = cy - Math.cos(headingRad) * (tokenRadius + 2.5);

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(hx, hy, 2, 0, Math.PI * 2);
        ctx.fill();

        // Kółko Tokena
        ctx.beginPath();
        ctx.arc(cx, cy, tokenRadius, 0, Math.PI * 2);

        if (isOffense) {
          // Złoty gradient dla ataku
          const tGrad = ctx.createLinearGradient(cx, cy - tokenRadius, cx, cy + tokenRadius);
          tGrad.addColorStop(0, '#FDE047');
          tGrad.addColorStop(0.5, '#ECA72C');
          tGrad.addColorStop(1, '#B45309');
          ctx.fillStyle = tGrad;
          ctx.fill();

          ctx.strokeStyle = hasBall ? '#FFFFFF' : '#000000';
          ctx.lineWidth = hasBall ? 2.5 : 1.8;
          ctx.stroke();

          if (hasBall) {
            ctx.strokeStyle = 'rgba(253, 224, 71, 0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, tokenRadius + 3.5, 0, Math.PI * 2);
            ctx.stroke();
          }
        } else {
          // Karmazynowy gradient dla obrony
          const dGrad = ctx.createLinearGradient(cx, cy - tokenRadius, cx, cy + tokenRadius);
          dGrad.addColorStop(0, '#F43F5E');
          dGrad.addColorStop(1, '#9F1239');
          ctx.fillStyle = dGrad;
          ctx.fill();

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // TYLKO NUMER POZYCJI (1, 2, 3, 4, 5 dla ataku / D1, D2, D3, D4, D5 dla obrony)
        ctx.fillStyle = isOffense ? '#000000' : '#FFFFFF';
        ctx.font = `900 ${Math.round(tokenRadius * (isOffense ? 1.15 : 0.9))}px Outfit, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const positionNumber = isOffense
          ? String(player.number || 1)
          : `D${player.number || 1}`;

        ctx.fillText(positionNumber, cx, cy + 0.5);

        // 5.1 DYNAMICZNE ETYKIETY RÓL I STRZAŁKI PRZESUNIĘCIA DLA OBROŃCÓW (DLA NOWICJUSZY)
        if (!isOffense) {
          let roleTag = '';
          const distToBall = Math.hypot(player.x - renderedBall.x, player.y - renderedBall.y);

          if (player.action === 'dribble' || renderedBall.holderId === player.id) {
            roleTag = 'PRZECHWYT';
          } else if (distToBall < 15) {
            if (renderedBall.y > 64) roleTag = 'ON-BALL PRESJA';
            else if (renderedBall.y < 30) roleTag = 'ZAMKNIĘCIE ROGU';
            else roleTag = 'CLOSEOUT';
          } else if (player.id === 'D1') {
            if (renderedBall.x > 62 || renderedBall.x < 38) roleTag = 'NAIL HELP';
            else roleTag = 'SZCZYT 3PT';
          } else if (player.id === 'D2') {
            if (renderedBall.x < 38) roleTag = 'NAIL HELP';
            else if (renderedBall.x > 65 && renderedBall.y > 45) roleTag = 'CLOSEOUT';
            else roleTag = 'PRAWE SKRZYDŁO';
          } else if (player.id === 'D3') {
            if (renderedBall.x > 62) roleTag = 'WEAK-SIDE DROP';
            else roleTag = 'LEWE SKRZYDŁO';
          } else if (player.id === 'D4') {
            if (renderedBall.x > 75 && renderedBall.y < 35) roleTag = 'ZAMKNIĘCIE ROGU';
            else if (renderedBall.x < 38) roleTag = 'WEAK-SIDE DROP';
            else roleTag = 'PRAWE SKRZYDŁO / DÓŁ';
          } else if (player.id === 'D5') {
            if (renderedBall.x > 75 && renderedBall.y < 35) roleTag = 'ODCIĘCIE LINII';
            else if (renderedBall.x < 25 && renderedBall.y < 35) roleTag = 'ODCIĘCIE LINII';
            else roleTag = 'OBRĘCZ & DESKA';
          }

          if (roleTag) {
            ctx.save();
            ctx.font = '800 8.5px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const tagMetrics = ctx.measureText(roleTag);
            const tagW = tagMetrics.width + 10;
            const tagH = 14;
            const tagY = cy - tokenRadius - 9;

            ctx.fillStyle = 'rgba(10, 14, 23, 0.92)';
            ctx.beginPath();
            ctx.roundRect(cx - tagW / 2, tagY - tagH / 2, tagW, tagH, 4);
            ctx.fill();

            ctx.strokeStyle = distToBall < 15 ? '#F43F5E' : 'rgba(244, 63, 94, 0.6)';
            ctx.lineWidth = distToBall < 15 ? 1.2 : 0.8;
            ctx.stroke();

            ctx.fillStyle = distToBall < 15 ? '#FDA4AF' : '#FECDD3';
            ctx.fillText(roleTag, cx, tagY);
            ctx.restore();
          }
        }
      }

      // 6. RYSOWANIE PIŁKI (2.5D z wysokością łuku)
      const bx = px(renderedBall.x);
      const groundBy = py(renderedBall.y);
      const airBy = py(renderedBall.y - renderedBall.z * 16);
      const ballRadius = Math.max(7.5, px(1.2)) * (1.0 + renderedBall.z * 0.4);

      // Cień piłki
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

      // Efekt trafienia do kosza (Dopasowany do faktycznego rzutu +2 / +3 PKT)
      if (t >= 7.2) {
        // Określ czy rzut był za 2 czy za 3 punkty na podstawie pozycji wyjściowej strzelca
        const shotKeyframe = timelineData.ball?.keyframes?.find((k) => k.isShot);
        const prevKeyframe = timelineData.ball?.keyframes?.[timelineData.ball.keyframes.length - 2];
        const shotX = shotKeyframe?.x ?? prevKeyframe?.x ?? 50;
        const shotY = shotKeyframe?.y ?? prevKeyframe?.y ?? 50;
        const isThreePointer = Math.hypot(shotX - 50, shotY - 12.5) > 28 || shotY > 60;

        const outcomeLabel = timelineData.outcomeText || (isThreePointer
          ? '✨ TRAFIENIE ZA 3 PUNKTY (+3 PKT)'
          : '✨ PUNKTY Z POMALOWANEGO (+2 PKT)');

        // Pasek informacyjny z wynikiem na górze parkietu
        ctx.save();
        ctx.font = '900 12px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const textMetrics = ctx.measureText(outcomeLabel);
        const badgeW = textMetrics.width + 28;
        const badgeH = 26;
        const badgeX = px(50) - badgeW / 2;
        const badgeY = py(6) - badgeH / 2;

        // Tło kapsułki
        ctx.fillStyle = 'rgba(10, 14, 23, 0.92)';
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 13);
        ctx.fill();

        // Obramowanie ze szmaragdowym blaskiem
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
        ctx.shadowBlur = 10;
        ctx.stroke();

        // Tekst
        ctx.fillStyle = '#34D399';
        ctx.shadowColor = 'transparent';
        ctx.fillText(outcomeLabel, px(50), py(6));
        ctx.restore();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [timelineData]);

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

  return (
    <div className="space-y-4">
      {/* Pasek Nagłówkowy */}
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

        <div className="flex items-center gap-2">
          {/* Przycisk Podręcznika Zasad Strefy */}
          <button
            onClick={() => setIsGuideOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[32px] bg-bkpk-surface-tint-2 hover:bg-bkpk-surface-tint-1 text-bkpk-primary border border-bkpk-primary/40 shadow-sm"
            title="Otwórz Podręcznik Taktyczny: Jak poruszać się po strefie"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Poradnik Strefowy</span>
          </button>

          {/* Przełącznik stref (jeśli schemat posiada zdefiniowane strefy) */}
          {timelineData.zoneAreas && timelineData.zoneAreas.length > 0 && (
            <button
              onClick={() => setShowZones(!showZones)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[32px] border",
                showZones
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm"
                  : "bg-bkpk-surface-tint-2 text-bkpk-text-muted hover:text-bkpk-text-primary border-bkpk-border-subtle"
              )}
              title="Przełącz widoczność wyznaczonych stref defensywnych"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Strefy: <strong className={showZones ? "text-rose-400" : "text-bkpk-text-muted"}>{showZones ? 'WŁ' : 'WYŁ'}</strong></span>
            </button>
          )}
        </div>

        {/* Fazy Akcji */}
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
                    isPlayingRef.current = true;
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

      {/* Kontener Canvas 2D (Perfekcyjna Wektorowa Geometria FIBA) */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] max-w-[850px] mx-auto border-2 border-bkpk-primary/40 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.85)]">
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-pointer"
          onClick={togglePlay}
        />
      </div>

      {/* Czysta Legenda Pozycji Koszykarskich */}
      <div className="flex flex-wrap items-center justify-center gap-4 py-2 px-3 bg-bkpk-surface-tint-1 border border-bkpk-border-subtle rounded-xl text-[11px] font-bold text-bkpk-text-secondary">
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-bkpk-primary text-black text-[10px] font-black flex items-center justify-center">
            1-5
          </span>
          <span>Pozycje Ataku (1: PG, 2: SG, 3: SF, 4: PF, 5: C)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center">
            D1-5
          </span>
          <span>Obrońcy</span>
        </div>
        {timelineData.zoneAreas && timelineData.zoneAreas.length > 0 && (
          <div className="flex items-center gap-1.5 text-rose-400">
            <span className="w-3.5 h-3.5 rounded border border-dashed border-rose-400 bg-rose-500/20 flex items-center justify-center text-[9px] font-mono">
              ▨
            </span>
            <span>Strefy Odpowiedzialności</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-amber-400">
          <span className="font-black text-sm">⊥</span>
          <span>Zasłona (T-Bar)</span>
        </div>
        <div className="flex items-center gap-1.5 text-bkpk-primary">
          <span className="font-black text-xs">🏀</span>
          <span>Piłka &amp; Rzut</span>
        </div>
      </div>

      {/* Pasek Sterowania i Suwak Czasu */}
      <div className="p-4 bg-bkpk-surface border border-bkpk-border-strong rounded-2xl shadow-xl space-y-3">
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

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <BkpkButton
              variant={isPlaying ? 'primary' : 'outline'}
              size="sm"
              onClick={togglePlay}
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
              onClick={handleReset}
              className="p-2 rounded-xl text-bkpk-text-muted hover:text-bkpk-primary hover:bg-bkpk-surface-tint-2 transition-colors"
              title="Resetuj do początku"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={handleLoopToggle}
              className={cn(
                "p-2 rounded-xl transition-colors",
                isLoop ? "text-bkpk-primary bg-bkpk-primary/10" : "text-bkpk-text-muted hover:text-bkpk-text-primary"
              )}
              title="Pętla"
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-bkpk-text-muted uppercase tracking-wider hidden sm:inline">
              Tempo:
            </span>
            <div className="flex items-center gap-1 bg-bkpk-surface-tint-1 p-1 rounded-xl border border-bkpk-border-subtle">
              {[0.25, 0.5, 1.0, 1.5].map((spd) => (
                <button
                  key={spd}
                  onClick={() => handleSpeedChange(spd)}
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

      {/* Synchronizowany Panel Trenerski */}
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

      {/* Interaktywny Podręcznik Taktyczny Zasad Poruszania się po Strefie */}
      <ZoneDefenseGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        initialZoneType={playName?.includes('3-2') ? '3-2' : '2-3'}
      />
    </div>
  );
}
