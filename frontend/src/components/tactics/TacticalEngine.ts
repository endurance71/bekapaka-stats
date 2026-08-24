/**
 * Silnik Matematyczny Animacji Taktycznych (TacticalEngine)
 * Odpowiada za ciągłą interpolację klatek kluczowych, krzywe Béziera,
 * trajektorię piłki w 2.5D z wysokością łuku, kąt zwrotu ciała,
 * oficjalne symbole taktyczne koszykówki (zasłony T-Bar, podania, ścięcia, kozioł)
 * oraz obsługę pełnego cyklu akcji (0.0s - 8.5s).
 */

export interface KeyframePosition {
  time: number; // sekundy (np. 0.0, 1.5, 4.5, 6.5, 8.5)
  x: number;    // 0-100%
  y: number;    // 0-100%
  heading?: number; // kąt zwrotu ciała w stopniach (0-360, 0 = w stronę kosza)
  action?: 'idle' | 'dribble' | 'cut' | 'set_screen' | 'roll' | 'pop' | 'catch' | 'shoot' | 'defend';
}

export interface PlayerTrack {
  id: string;
  number: number;
  name: string;
  role: 'PG' | 'SG' | 'SF' | 'PF' | 'C';
  isOffense: boolean;
  keyframes: KeyframePosition[];
}

export interface BallKeyframe {
  time: number;
  x: number;
  y: number;
  holderId?: string | null;
  isPass?: boolean;
  isShot?: boolean;
  arcHeight?: number; // 0-100 (wysokość wzniesienia paraboli)
}

export interface BallTrack {
  keyframes: BallKeyframe[];
}

export interface TacticalStroke {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  type: 'pass' | 'cut' | 'screen' | 'dribble';
  screenAngle?: number; // kąt belki T-Bar (w stopniach)
  startTime?: number;
  endTime?: number;
}

export interface PlayTimelineData {
  duration: number; // domyślnie 8.5s
  players: PlayerTrack[];
  ball: BallTrack;
  strokes?: TacticalStroke[];
  phaseDirectives?: Array<{
    startTime: number;
    endTime: number;
    title: string;
    description: string;
    coachingCues?: string[];
  }>;
  coachingKeys?: string[];
}

export interface RenderedPlayerState {
  id: string;
  number: number;
  name: string;
  role: 'PG' | 'SG' | 'SF' | 'PF' | 'C' | string;
  isOffense: boolean;
  x: number;
  y: number;
  heading: number;
  action: string;
  isScreening: boolean;
  isShooting: boolean;
  speed: number;
}

export interface RenderedBallState {
  x: number;
  y: number;
  z: number; // wysokość łuku (0 = na parkiecie, 1 = najwyższy punkt rzutu)
  holderId: string | null;
  isAirborne: boolean;
  isShot: boolean;
}

/**
 * Oblicza kąt zwrotu między dwoma punktami w stopniach
 */
export function calculateHeading(fromX: number, fromY: number, toX: number, toY: number): number {
  const dx = toX - fromX;
  const dy = toY - fromY;
  if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return 0;
  let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
  if (angle < 0) angle += 360;
  return angle;
}

/**
 * Płynna funkcja wygładzania Ease-In-Out (Smoothstep Cubic)
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Interpolacja stanu zawodnika w czasie t
 */
export function interpolatePlayer(player: PlayerTrack, t: number): RenderedPlayerState {
  const kfs = player.keyframes;
  if (!kfs || kfs.length === 0) {
    return {
      id: player.id,
      number: player.number,
      name: player.name,
      role: player.role,
      isOffense: player.isOffense,
      x: 50,
      y: 50,
      heading: 0,
      action: 'idle',
      isScreening: false,
      isShooting: false,
      speed: 0
    };
  }

  if (t <= kfs[0].time) {
    const first = kfs[0];
    return {
      id: player.id,
      number: player.number,
      name: player.name,
      role: player.role,
      isOffense: player.isOffense,
      x: first.x,
      y: first.y,
      heading: first.heading ?? 0,
      action: first.action ?? 'idle',
      isScreening: first.action === 'set_screen',
      isShooting: first.action === 'shoot',
      speed: 0
    };
  }

  if (t >= kfs[kfs.length - 1].time) {
    const last = kfs[kfs.length - 1];
    return {
      id: player.id,
      number: player.number,
      name: player.name,
      role: player.role,
      isOffense: player.isOffense,
      x: last.x,
      y: last.y,
      heading: last.heading ?? 0,
      action: last.action ?? 'idle',
      isScreening: last.action === 'set_screen',
      isShooting: last.action === 'shoot',
      speed: 0
    };
  }

  let prev = kfs[0];
  let next = kfs[1];
  for (let i = 0; i < kfs.length - 1; i++) {
    if (t >= kfs[i].time && t <= kfs[i + 1].time) {
      prev = kfs[i];
      next = kfs[i + 1];
      break;
    }
  }

  const duration = next.time - prev.time;
  const progress = duration > 0 ? (t - prev.time) / duration : 0;
  const smoothProgress = easeInOutCubic(progress);

  const x = prev.x + (next.x - prev.x) * smoothProgress;
  const y = prev.y + (next.y - prev.y) * smoothProgress;

  const dist = Math.hypot(next.x - prev.x, next.y - prev.y);
  const speed = duration > 0 ? dist / duration : 0;

  const currentAction = progress > 0.5 ? (next.action ?? prev.action ?? 'idle') : (prev.action ?? 'idle');

  // Płynna interpolacja kąta zwrotu (Heading) z zachowaniem postawy obrońców i kąta zasłon
  let heading = prev.heading ?? 0;
  if (prev.heading != null && next.heading != null) {
    let diff = next.heading - prev.heading;
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;
    heading = (prev.heading + diff * smoothProgress + 360) % 360;
  } else if (speed > 1.0 && currentAction !== 'set_screen' && currentAction !== 'defend') {
    heading = calculateHeading(prev.x, prev.y, next.x, next.y);
  } else if (next.heading != null) {
    heading = next.heading;
  }

  return {
    id: player.id,
    number: player.number,
    name: player.name,
    role: player.role,
    isOffense: player.isOffense,
    x: Math.round(x * 100) / 100,
    y: Math.round(y * 100) / 100,
    heading,
    action: currentAction,
    isScreening: currentAction === 'set_screen',
    isShooting: currentAction === 'shoot',
    speed
  };
}

/**
 * Interpolacja trajektorii piłki w czasie t
 */
export function interpolateBall(
  ball: BallTrack,
  playersMap: Map<string, RenderedPlayerState>,
  t: number
): RenderedBallState {
  const kfs = ball?.keyframes;
  if (!kfs || kfs.length === 0) {
    return { x: 50, y: 50, z: 0, holderId: null, isAirborne: false, isShot: false };
  }

  if (t <= kfs[0].time) {
    const first = kfs[0];
    if (first.holderId && playersMap.has(first.holderId)) {
      const p = playersMap.get(first.holderId)!;
      return { x: p.x + 1.2, y: p.y - 0.8, z: 0, holderId: p.id, isAirborne: false, isShot: false };
    }
    return { x: first.x, y: first.y, z: 0, holderId: null, isAirborne: false, isShot: false };
  }

  if (t >= kfs[kfs.length - 1].time) {
    const last = kfs[kfs.length - 1];
    if (last.holderId && playersMap.has(last.holderId)) {
      const p = playersMap.get(last.holderId)!;
      return { x: p.x + 1.2, y: p.y - 0.8, z: 0, holderId: p.id, isAirborne: false, isShot: false };
    }
    return { x: last.x, y: last.y, z: 0, holderId: null, isAirborne: false, isShot: false };
  }

  let prev = kfs[0];
  let next = kfs[1];
  for (let i = 0; i < kfs.length - 1; i++) {
    if (t >= kfs[i].time && t <= kfs[i + 1].time) {
      prev = kfs[i];
      next = kfs[i + 1];
      break;
    }
  }

  const duration = next.time - prev.time;
  const progress = duration > 0 ? (t - prev.time) / duration : 0;

  // Gracz prowadzi piłkę
  if (prev.holderId && prev.holderId === next.holderId && playersMap.has(prev.holderId)) {
    const p = playersMap.get(prev.holderId)!;
    const dribblePhase = Math.sin(t * 7);
    const offsetX = 1.4 + dribblePhase * 0.4;
    const offsetY = -0.8 + Math.abs(dribblePhase) * 0.3;
    return {
      x: p.x + offsetX,
      y: p.y + offsetY,
      z: 0,
      holderId: p.id,
      isAirborne: false,
      isShot: false
    };
  }

  // Piłka leci w powietrzu
  const startX = prev.holderId && playersMap.has(prev.holderId) ? playersMap.get(prev.holderId)!.x : prev.x;
  const startY = prev.holderId && playersMap.has(prev.holderId) ? playersMap.get(prev.holderId)!.y : prev.y;

  const endX = next.holderId && playersMap.has(next.holderId) ? playersMap.get(next.holderId)!.x : next.x;
  const endY = next.holderId && playersMap.has(next.holderId) ? playersMap.get(next.holderId)!.y : next.y;

  const smoothProgress = easeInOutCubic(progress);
  const x = startX + (endX - startX) * smoothProgress;
  const y = startY + (endY - startY) * smoothProgress;

  const isShot = Boolean(next.isShot);
  const isPass = Boolean(next.isPass);
  const isAirborne = Boolean(isShot || isPass || (Math.hypot(endX - startX, endY - startY) > 2));
  const peakHeight = next.arcHeight ?? (isShot ? 1.1 : isPass ? 0.25 : 0.0);
  const z = (isShot || isPass) ? Math.sin(progress * Math.PI) * peakHeight : 0;

  return {
    x: Math.round(x * 100) / 100,
    y: Math.round(y * 100) / 100,
    z: Math.round(z * 100) / 100,
    holderId: progress > 0.95 ? (next.holderId ?? null) : null,
    isAirborne,
    isShot
  };
}
