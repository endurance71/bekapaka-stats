import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { accel, Big, C, Crest, Label, lerp, p, Plate, Push, Rival, shakeAt, wear } from '../kit';
import { EndCard, Template, useMatch } from './shared';

// Połowa boiska z góry: 15 m szerokości = 960 px, linia końcowa na y = 420 (wymiary FIBA).
const K = 64, X0 = 60, Y0 = 420, BX = 540, BY = Y0 + 1.575 * K;
const COURT = [
  `M${X0} ${Y0}H${X0 + 960}V${Y0 + 14 * K}H${X0}Z`,
  `M${BX - 2.45 * K} ${Y0}V${Y0 + 5.8 * K}H${BX + 2.45 * K}V${Y0}`,
  `M${BX - 1.8 * K} ${Y0 + 5.8 * K}A${1.8 * K} ${1.8 * K} 0 0 0 ${BX + 1.8 * K} ${Y0 + 5.8 * K}`,
  `M${X0 + 0.9 * K} ${Y0}V${BY + 90.6}A${6.75 * K} ${6.75 * K} 0 0 0 ${X0 + 960 - 0.9 * K} ${BY + 90.6}V${Y0}`,
  `M${BX - 1.8 * K} ${Y0 + 14 * K}A${1.8 * K} ${1.8 * K} 0 0 1 ${BX + 1.8 * K} ${Y0 + 14 * K}`,
  `M${BX - 0.9 * K} ${Y0 + 1.2 * K}H${BX + 0.9 * K}`,
];
const PLAYERS = [[540, 1260], [800, 900], [250, 780], [300, 560], [820, 560]];
const DRIVE = 'M540 1260 C 520 1120, 760 1060, 800 900';
const PASS = [800, 900, 760, 760, 640, 620, BX, BY + 20];
const PASS_D = `M${PASS[0]} ${PASS[1]} C ${PASS[2]} ${PASS[3]}, ${PASS[4]} ${PASS[5]}, ${PASS[6]} ${PASS[7]}`;
const bezier = (t: number) => {
  const u = 1 - t, [x0, y0, x1, y1, x2, y2, x3, y3] = PASS;
  return [u ** 3 * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t ** 3 * x3, u ** 3 * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t ** 3 * y3];
};

/** Tablica trenera: linie boiska rysują się same, pozycje, akcja i podanie pod kosz; kamera wjeżdża w koło środkowe. */
const Board: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const { m, w } = useMatch();
  const zoom = p(f, len - 14, 14, accel);
  const ball = p(f, 48, 14);
  const [bx, by] = bezier(ball);
  const draw = (i: number) => p(f, i * 4, 26);
  return (
    <AbsoluteFill>
      <Plate dim={0.55} drift={p(f, 0, len)} />
      <AbsoluteFill style={{ transform: `scale(${1 + zoom * 2.4})`, transformOrigin: `${BX}px ${Y0 + 14 * K}px` }}>
        <Label text={m.boardLabel ?? `PLAN NA ${w.dayAcc}`} f={f} at={2} y={290} size={46} color={C.gold} />
        <svg viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
          {COURT.map((d, i) => (
            <path key={i} d={d} fill="none" stroke={C.white} strokeWidth={5} opacity={0.85} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw(i)} />
          ))}
          <circle cx={BX} cy={BY} r={0.225 * K} fill="none" stroke={C.red} strokeWidth={5} opacity={p(f, 20, 8)} />
          {PLAYERS.map(([x, y], i) => (
            <g key={i} opacity={p(f, 22 + i * 2, 8)} transform={`translate(${x} ${y}) scale(${lerp(1.6, 1, p(f, 22 + i * 2, 8))})`}>
              <circle r={30} fill="none" stroke={C.white} strokeWidth={6} />
            </g>
          ))}
          <path d={DRIVE} fill="none" stroke={C.red} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p(f, 30, 16)} />
          <path d={PASS_D} fill="none" stroke={C.red} strokeWidth={8} strokeDasharray="22 18" opacity={p(f, 44, 4)} />
          <circle cx={bx} cy={by} r={22} fill={C.gold} opacity={p(f, 44, 4)} stroke={C.black} strokeWidth={3} />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Koło środkowe w zbliżeniu: herb i znak rywala po obu stronach, VS w kole. */
const Circle: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const { m, parts } = useMatch();
  const ring = p(f, 0, 14);
  const crest = p(f, 4, 16);
  const rival = p(f, 8, 16);
  const vs = p(f, 16, 7);
  return (
    <AbsoluteFill style={{ transform: `translateX(${shakeAt(f, 22)}px)` }}>
      <Push f={f} len={len}>
        <Plate dim={0.55} />
        <svg viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
          <line x1={0} y1={960} x2={1080 * ring} y2={960} stroke={C.white} strokeWidth={6} opacity={0.8} />
          <circle cx={540} cy={960} r={300} fill="none" stroke={C.white} strokeWidth={6} opacity={0.8} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ring} transform="rotate(-90 540 960)" />
          <circle cx={540} cy={960} r={300 * ring} fill={C.red} opacity={0.12} />
        </svg>
        <Crest style={{ width: 420, left: 30, top: 750, transform: `translateX(${(1 - crest) * -700}px)` }} />
        <Rival svg={parts.rival} width={340} style={{ left: 700, top: 770, transform: `translateX(${(1 - rival) * 700}px)` }} />
        <Label text="BEKAPAKA" f={f} at={16} y={1240} size={44} align="left" x={110} maxWidth={400} />
        <Label text={m.opponent.toUpperCase()} f={f} at={18} y={1240} size={44} align="left" x={600} maxWidth={420} />
      </Push>
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 860, textAlign: 'center', fontFamily: 'BC', fontWeight: 800, fontSize: 200, lineHeight: 1,
        color: C.white, opacity: Math.min(1, vs * 3), transform: `skewX(-9deg) scale(${lerp(2.4, 1, vs)})`, filter: 'drop-shadow(0 12px 16px rgba(0,0,0,.8))', ...wear,
      }}>VS</div>
    </AbsoluteFill>
  );
};

/** Linia boczna z pachołkami; obok dzień, data, godzina, hala i wstęp. */
const Sideline: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const { m, w } = useMatch();
  const line = p(f, 0, 18);
  return (
    <AbsoluteFill>
      <Push f={f} len={len} amount={0.04}>
        <Plate dim={0.55} />
        <svg viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
          <line x1={130} y1={300} x2={130} y2={300 + 1320 * line} stroke={C.white} strokeWidth={6} opacity={0.85} />
          {[520, 820, 1120].map((y, i) => <line key={i} x1={130} y1={y} x2={130 + 50 * p(f, 8 + i * 3, 10)} y2={y} stroke={C.red} strokeWidth={8} />)}
        </svg>
        <Label text={w.day} f={f} at={4} y={470} size={52} align="left" x={210} color={C.muted} />
        <Big text={w.dm} f={f} at={6} y={540} size={250} align="flex-start" x={200} />
        <Big text={w.time} f={f} at={12} y={810} size={250} align="flex-start" x={200} color={C.red} />
        <Label text={m.venue} f={f} at={20} y={1100} size={50} align="left" x={210} />
        {m.entry ? <Label text={m.entry.toUpperCase()} f={f} at={24} y={1175} size={42} align="left" x={210} color={C.gold} /> : null}
      </Push>
    </AbsoluteFill>
  );
};

export const tablica: Template = {
  id: 'D-Tablica',
  title: 'D · Tablica - akcja na boisku, koło środkowe, linia boczna',
  requires: () => null,
  shots: () => [
    { len: 76, el: <Board len={76} /> },
    { len: 58, el: <Circle len={58} /> },
    { len: 56, el: <Sideline len={56} /> },
    { len: 72, el: <EndCard />, wipe: true },
  ],
};
