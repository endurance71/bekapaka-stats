import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Big, C, Label, lerp, p, Plate, Push, shakeAt } from '../kit';
import { EndCard, Matchup, Template, useMatch, When } from './shared';

/** Dawny wynik z datą; czerwona kreska przekreśla go z wstrząsem. */
const OldScore: React.FC<{ len: number; index: number; strikeAt: number }> = ({ len, index, strikeAt }) => {
  const f = useCurrentFrame();
  const { m } = useMatch();
  const r = m.h2h!.results[index];
  const strike = p(f, strikeAt, 6);
  return (
    <AbsoluteFill style={{ transform: `translateX(${shakeAt(f, strikeAt + 5, 7, 1.1)}px)` }}>
      <Push f={f} len={len} amount={0.05}>
        <Plate dim={0.5} />
        <Label text={r.date} f={f} at={0} y={620} size={52} color={C.muted} />
        <Big text={`${r.us}:${r.them}`} f={f} at={2} y={720} size={330} stagger={1.5} />
        <Label text={`BEKAPAKA – ${m.opponent.toUpperCase()}`} f={f} at={6} y={1080} size={40} />
        <div style={{
          position: 'absolute', left: 120, top: 860, width: 840, height: 30, backgroundColor: C.red,
          transform: `rotate(-11deg) scaleX(${strike})`, transformOrigin: 'left center', boxShadow: '0 8px 16px rgba(0,0,0,.6)',
        }} />
      </Push>
    </AbsoluteFill>
  );
};

/** Data meczu, złote „?:?” w obrysie i dwa wiersze odpowiedzi. */
const Turn: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const { m, w } = useMatch();
  const [a, b] = m.rematch!;
  const q = p(f, 2, 7);
  return (
    <AbsoluteFill style={{ transform: `translateX(${shakeAt(f, 7)}px)` }}>
      <Push f={f} len={len}>
        <Plate dim={0.45} />
        <Label text={w.dmy} f={f} at={0} y={520} size={56} color={C.gold} />
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 600, textAlign: 'center', fontFamily: 'BC', fontWeight: 800, fontSize: 340, lineHeight: 0.95,
          color: 'transparent', WebkitTextStroke: `8px ${C.gold}`, transform: `skewX(-9deg) scale(${lerp(2.2, 1, q)})`, opacity: Math.min(1, q * 3),
        }}>?:?</div>
        <Big text={a} f={f} at={14} y={1000} size={210} />
        <Big text={b} f={f} at={18} y={1190} size={210} color={C.red} stagger={1} />
      </Push>
    </AbsoluteFill>
  );
};

export const rewanz: Template = {
  id: 'B-Rewanz',
  title: 'B · Rewanż - dawne wyniki przekreślone, „?:?”, starcie, godzina',
  requires: (m) => (!m.h2h?.results.length ? 'brak „h2h.results” (dawne mecze z rywalem)' : !m.rematch ? 'brak „rematch” (dwa wiersze)' : null),
  // Najwyżej trzy ostatnie mecze; pierwszy dłużej, bo uczy widza schematu.
  shots: (m) => [
    ...m.h2h!.results.slice(-3).map((_, i, all) => ({
      len: i === 0 ? 45 : 40,
      el: <OldScore len={i === 0 ? 45 : 40} index={m.h2h!.results.length - all.length + i} strikeAt={i === 0 ? 20 : 16} />,
    })),
    { len: 58, el: <Turn len={58} /> },
    { len: 54, el: <Matchup len={54} />, wipe: true },
    { len: 44, el: <When len={44} /> },
    { len: 72, el: <EndCard />, wipe: true },
  ],
};
