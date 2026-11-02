import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Big, C, Label, lerp, p, Plate, Push, shakeAt, wear } from '../kit';
import { fitSize } from '../match';
import { PosterCard, Template, useMatch } from './shared';

/** Obrys daty na papierze wypełnia się czerwienią od lewej. */
const DateCard: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const { w } = useMatch();
  const fill = p(f, 22, 14);
  return (
    <AbsoluteFill>
      <Push f={f} len={len} amount={0.04}>
        <Plate dim={0.1} src="lineup-paper.png" />
        <Big text={w.dm} f={f} at={0} y={640} size={420} color={C.black} outline shadow={false} stagger={2} />
        <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)` }}>
          <Big text={w.dm} f={999} at={0} y={640} size={420} color={C.red} shadow={false} />
        </div>
        <Label text={w.day} f={f} at={10} y={1080} size={64} color={C.black} />
      </Push>
    </AbsoluteFill>
  );
};

const Ticker: React.FC<{ text: string; f: number; y: number; bg: string; dir: 1 | -1 }> = ({ text, f, y, bg, dir }) => {
  const inT = p(f, 0, 12);
  return (
    <div style={{ position: 'absolute', left: -300, width: 1680, top: y, height: 190, backgroundColor: bg, transform: `rotate(-8deg) translateX(${dir * (1 - inT) * 1700}px)`, overflow: 'hidden', boxShadow: '0 16px 30px rgba(0,0,0,.35)' }}>
      <div style={{ position: 'absolute', top: 14, left: dir * f * 14 - 900, whiteSpace: 'nowrap', fontFamily: 'BC', fontWeight: 800, fontSize: 150, lineHeight: 1, color: C.white, transform: 'skewX(-9deg)' }}>
        {text.repeat(8)}
      </div>
    </div>
  );
};

/** Dwa paski z przewijanym „BEKAPAKA — RYWAL” w przeciwnych kierunkach. */
const Teams: React.FC<{ len: number }> = () => {
  const f = useCurrentFrame();
  const { m } = useMatch();
  const text = `BEKAPAKA — ${m.opponent.toUpperCase()} — `;
  return (
    <AbsoluteFill>
      <Plate dim={0.1} src="lineup-paper.png" />
      {m.round ? <Label text={m.round} f={f} at={4} y={560} size={48} color={C.black} /> : null}
      <Ticker text={text} f={f} y={760} bg={C.red} dir={1} />
      <Ticker text={text} f={Math.max(0, f - 4)} y={990} bg={C.black} dir={-1} />
    </AbsoluteFill>
  );
};

/** Godzina, hala i pieczątka z informacją o wstępie. */
const Stamp: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const { m, w } = useMatch();
  const s = p(f, 18, 6);
  const stamp = (m.entry ?? '').toUpperCase();
  return (
    <AbsoluteFill style={{ transform: `translateX(${stamp ? shakeAt(f, 23, 7, 1) : 0}px)` }}>
      <Push f={f} len={len} amount={0.04}>
        <Plate dim={0.1} src="lineup-paper.png" />
        <Big text={w.time} f={f} at={0} y={600} size={330} color={C.black} shadow={false} stagger={1.6} />
        <Label text={m.venue} f={f} at={8} y={940} size={56} color={C.black} />
        {stamp ? (
          <div style={{
            position: 'absolute', left: 140, top: 1110, width: 800, height: 200, border: `12px solid ${C.red}`, borderRadius: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'BC', fontWeight: 800, fontSize: fitSize(stamp, 120, 700, 'display', 0.03),
            color: C.red, letterSpacing: 4, whiteSpace: 'nowrap', transform: `rotate(-9deg) scale(${lerp(2.6, 1, s)})`, opacity: Math.min(1, s * 3), ...wear,
          }}>{stamp}</div>
        ) : null}
      </Push>
    </AbsoluteFill>
  );
};

export const redakcyjnie: Template = {
  id: 'E-Redakcyjnie',
  title: 'E · Redakcyjnie - papier, data w obrysie, paski z nazwami, pieczątka',
  requires: () => null,
  shots: () => [
    { len: 56, el: <DateCard len={56} /> },
    { len: 58, el: <Teams len={58} /> },
    { len: 56, el: <Stamp len={56} /> },
    { len: 76, el: <PosterCard file="poster-editorial.png" />, wipe: true },
  ],
};
