import React from 'react';
import { AbsoluteFill, random, useCurrentFrame } from 'remotion';
import { Big, C, Label, lerp, p, Plate, Push, shakeAt, wear } from '../kit';
import { EndCard, Matchup, Template, useMatch, When } from './shared';

const SIZE = 270;
const H = SIZE * 0.95;

/** Kolumna tablicy wyników: przewija losowe wyniki (stałe ziarno) i staje na „?”. */
const Reel: React.FC<{ f: number; stopAt: number; seed: string }> = ({ f, stopAt, seed }) => {
  const steps = 14;
  const values = Array.from({ length: steps }, (_, i) => String(40 + Math.floor(random(`${seed}-${i}`) * 50)));
  const t = p(f, 0, stopAt);
  return (
    <div style={{ height: H, overflow: 'hidden', display: 'inline-block', position: 'relative', width: SIZE * 0.95 }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, textAlign: 'center', transform: `translateY(${-(1 - t) * steps * H}px)` }}>
        <div style={{ height: H, lineHeight: `${H}px`, color: 'transparent', WebkitTextStroke: `8px ${C.gold}` }}>?</div>
        {values.map((v, i) => <div key={i} style={{ height: H, lineHeight: `${H}px`, color: C.white }}>{v}</div>)}
      </div>
    </div>
  );
};

/** Hak: tablica wyników kręci się i staje na złotym „?:?”, pod nią odpowiedź w dwóch wierszach. */
const Scoreboard: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const { m, w } = useMatch();
  const [a, b] = m.rematch!;
  const panel = p(f, 0, 10);
  const land = p(f, 26, 6);
  return (
    <AbsoluteFill style={{ transform: `translateX(${shakeAt(f, 28)}px)` }}>
      <Push f={f} len={len}>
        <Plate dim={0.45} drift={p(f, 0, len)} />
        <Label text={`${w.day} · ${w.dm}`} f={f} at={0} y={380} size={52} color={C.gold} />
        <svg viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
          <defs><clipPath id="boardPanel"><rect x={0} y={0} width={1080 * panel} height={1920} /></clipPath></defs>
          <g clipPath="url(#boardPanel)">
            <polygon points="230,470 1000,470 850,830 80,830" fill={C.black} />
            <polygon points="230,470 1000,470 850,830 80,830" fill="none" stroke={C.gold} strokeWidth={8} />
          </g>
        </svg>
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 520, display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'BC', fontWeight: 800,
          fontSize: SIZE, transform: `skewX(-9deg) scale(${lerp(1.08, 1, land)})`, filter: 'drop-shadow(0 10px 14px rgba(0,0,0,.7))',
        }}>
          <div style={{ ...wear, display: 'flex', alignItems: 'center', padding: '0 40px' }}>
            <Reel f={f} stopAt={24} seed="us" />
          <span style={{ lineHeight: `${H}px`, color: f >= 26 ? C.gold : C.white }}>:</span>
          <Reel f={f} stopAt={28} seed="them" />
          </div>
        </div>
        <Big text={a} f={f} at={34} y={900} size={170} />
        <Big text={b} f={f} at={38} y={1060} size={170} color={C.red} stagger={1} />
      </Push>
    </AbsoluteFill>
  );
};

export const rewanz: Template = {
  id: 'B-Rewanz',
  title: 'B · Rewanż - tablica wyników staje na „?:?”, odpowiedź, starcie, godzina',
  requires: (m) => (!m.rematch ? 'brak „rematch” (dwa wiersze odpowiedzi)' : null),
  shots: () => [
    { len: 72, el: <Scoreboard len={72} /> },
    { len: 54, el: <Matchup len={54} />, wipe: true },
    { len: 44, el: <When len={44} /> },
    { len: 72, el: <EndCard />, wipe: true },
  ],
};
